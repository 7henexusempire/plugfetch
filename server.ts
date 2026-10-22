import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { playlistService } from './src/server/playlistService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global CORS headers for IPTV apps & external media players
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 1. M3U Playlist Endpoints (Compatible with OTT Navigator, TiviMate, VLC, Perfect Player, etc.)
const handleM3URequest = (req: Request, res: Response) => {
  try {
    const groupFilter = req.query.group as string | undefined;
    const m3uContent = playlistService.generateM3U(groupFilter);

    res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
    res.setHeader('Cache-Control', 'public, max-age=60'); // cache for 60s
    return res.status(200).send(m3uContent);
  } catch (err: any) {
    console.error('Error serving M3U playlist:', err);
    return res.status(500).send('#EXTM3U\n# Error generating playlist: ' + (err.message || 'Unknown error'));
  }
};

app.get('/api/playlist.m3u', handleM3URequest);
app.get('/api/playlist.m3u8', handleM3URequest);
app.get('/playlist.m3u', handleM3URequest); // friendly top-level route
app.get('/playlist.m3u8', handleM3URequest);

// 2. Structured JSON Playlist Endpoint
const handleJSONRequest = (req: Request, res: Response) => {
  try {
    const groupFilter = req.query.group as string | undefined;
    const jsonContent = playlistService.generateJSON(groupFilter);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(jsonContent);
  } catch (err: any) {
    console.error('Error serving JSON playlist:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate playlist JSON' });
  }
};

app.get('/api/playlist.json', handleJSONRequest);
app.get('/playlist.json', handleJSONRequest);

// 3. Status & Sync Controls
app.get('/api/status', (req: Request, res: Response) => {
  const status = playlistService.getStatus();
  return res.json(status);
});

app.post('/api/sync', async (req: Request, res: Response) => {
  try {
    const result = await playlistService.fetchUpstream();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Channel Management APIs
app.get('/api/channels', (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const group = (req.query.group as string) || '';
    const status = (req.query.status as string) || 'all'; // all | enabled | disabled
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    let all = playlistService.getAllChannels();

    if (search) {
      all = all.filter((c) => {
        const name = (c.customName || c.name || '').toLowerCase();
        const orig = (c.name || '').toLowerCase();
        const grp = (c.customGroup || c.groupTitle || '').toLowerCase();
        const id = (c.tvgId || c.id || '').toLowerCase();
        return name.includes(search) || orig.includes(search) || grp.includes(search) || id.includes(search);
      });
    }

    if (group && group !== 'all') {
      all = all.filter((c) => (c.customGroup || c.groupTitle) === group);
    }

    if (status === 'enabled') {
      all = all.filter((c) => c.enabled);
    } else if (status === 'disabled') {
      all = all.filter((c) => !c.enabled);
    }

    const total = all.length;
    const startIndex = (page - 1) * limit;
    const paginated = all.slice(startIndex, startIndex + limit);

    return res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      channels: paginated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/channels/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customName, customGroup, customLogo, customChno, customUrl, enabled } = req.body;
    const ok = playlistService.updateChannel(id, {
      customName,
      customGroup,
      customLogo,
      customChno,
      customUrl,
      enabled,
    });
    if (!ok) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/channels/reset/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ok = playlistService.resetChannel(id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/channels/add', (req: Request, res: Response) => {
  try {
    const { name, group, url, logo, tvgId, tvgChno, directives } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and Stream URL are required' });
    }
    const created = playlistService.addCustomChannel({
      name,
      group: group || 'Custom',
      url,
      logo,
      tvgId,
      tvgChno,
      directives: directives || [],
    });
    return res.json({ success: true, channel: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Group Management APIs
app.get('/api/groups', (req: Request, res: Response) => {
  return res.json(playlistService.getGroups());
});

app.post('/api/groups/rename', (req: Request, res: Response) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ error: 'Old name and new name are required' });
    }
    playlistService.renameGroup(oldName, newName);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups/toggle', (req: Request, res: Response) => {
  try {
    const { groupName, visible } = req.body;
    if (groupName === undefined || visible === undefined) {
      return res.status(400).json({ error: 'groupName and visible are required' });
    }
    playlistService.toggleGroupVisibility(groupName, visible);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups/remove-prefix', (req: Request, res: Response) => {
  try {
    const { prefix } = req.body;
    if (!prefix) return res.status(400).json({ error: 'Prefix is required' });
    const count = playlistService.removeGroupPrefix(prefix);
    return res.json({ success: true, updatedCount: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. Settings & Backups
app.get('/api/settings', (req: Request, res: Response) => {
  return res.json(playlistService.getSettings());
});

app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const updated = playlistService.updateSettings(req.body);
    return res.json({ success: true, settings: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/backup/export', (req: Request, res: Response) => {
  const backup = playlistService.exportBackup();
  res.setHeader('Content-Disposition', 'attachment; filename="iptv-customizations-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  return res.json(backup);
});

app.post('/api/backup/import', (req: Request, res: Response) => {
  try {
    playlistService.importBackup(req.body);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Invalid backup payload' });
  }
});

app.get('/api/preview-m3u', (req: Request, res: Response) => {
  const m3u = playlistService.generateM3U();
  const lines = m3u.split('\n');
  const preview = lines.slice(0, 100).join('\n');
  return res.json({
    totalLines: lines.length,
    preview,
  });
});

// Vite Integration & Static Hosting
async function startServer() {
  // Initialize playlist service (loads cache and kicks off initial sync)
  await playlistService.init();

  if (process.env.NODE_ENV === 'production') {
    // Serve production build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite dev server in middleware mode
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] IPTV Stream Relay running at http://0.0.0.0:${PORT}`);
    console.log(`[Server] M3U Playlist: http://0.0.0.0:${PORT}/api/playlist.m3u`);
    console.log(`[Server] JSON Playlist: http://0.0.0.0:${PORT}/api/playlist.json`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
