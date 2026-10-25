import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { playlistService } from './src/server/playlistService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Enable trust proxy for Ubuntu/Contabo VPS behind Nginx/Caddy/Cloudflare
app.enable('trust proxy');

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check endpoint for Docker/PM2/uptime monitors
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

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

// Helper for M3U response
const serveM3U = (req: Request, res: Response, sourceId?: string) => {
  try {
    const groupFilter = req.query.group as string | undefined;
    const cleanSourceId = sourceId?.replace(/\.(m3u8?)$/i, '');
    const m3uContent = playlistService.generateM3U(cleanSourceId, groupFilter);

    res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
    const filename = cleanSourceId && cleanSourceId !== 'all' ? `${cleanSourceId}.m3u` : 'playlist-all.m3u';
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(m3uContent);
  } catch (err: any) {
    console.error('Error serving M3U playlist:', err);
    return res.status(500).send('#EXTM3U\n# Error generating playlist: ' + (err.message || 'Unknown error'));
  }
};

// Helper for JSON response
const serveJSON = (req: Request, res: Response, sourceId?: string) => {
  try {
    const groupFilter = req.query.group as string | undefined;
    const cleanSourceId = sourceId?.replace(/\.json$/i, '');
    const jsonContent = playlistService.generateJSON(cleanSourceId, groupFilter);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(jsonContent);
  } catch (err: any) {
    console.error('Error serving JSON playlist:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate playlist JSON' });
  }
};

// 1. COMBINED PLAYLIST ENDPOINTS (All Playlists Combined)
app.get('/api/playlist.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/api/playlist.m3u8', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist.m3u8', (req, res) => serveM3U(req, res, 'all'));

app.get('/api/playlist/all.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/api/playlist/all.m3u8', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist/all.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist/all.m3u8', (req, res) => serveM3U(req, res, 'all'));

app.get('/api/playlist.json', (req, res) => serveJSON(req, res, 'all'));
app.get('/playlist.json', (req, res) => serveJSON(req, res, 'all'));
app.get('/api/playlist/all.json', (req, res) => serveJSON(req, res, 'all'));
app.get('/playlist/all.json', (req, res) => serveJSON(req, res, 'all'));

// 2. INDIVIDUAL SEPARATE PLAYLIST ENDPOINTS (e.g. /api/playlist/plugx.m3u, /playlist/server-lrl45.m3u, /api/playlist/zeotv.m3u)
app.get('/api/playlist/:sourceId.m3u', (req, res) => serveM3U(req, res, req.params.sourceId));
app.get('/api/playlist/:sourceId.m3u8', (req, res) => serveM3U(req, res, req.params.sourceId));
app.get('/playlist/:sourceId.m3u', (req, res) => serveM3U(req, res, req.params.sourceId));
app.get('/playlist/:sourceId.m3u8', (req, res) => serveM3U(req, res, req.params.sourceId));

app.get('/api/playlist/:sourceId.json', (req, res) => serveJSON(req, res, req.params.sourceId));
app.get('/playlist/:sourceId.json', (req, res) => serveJSON(req, res, req.params.sourceId));

// 3. Status & Sync Controls
app.get('/api/status', (req: Request, res: Response) => {
  const status = playlistService.getGlobalStatus();
  return res.json(status);
});

app.post('/api/sync', async (req: Request, res: Response) => {
  try {
    const sourceId = (req.query.sourceId as string) || req.body?.sourceId;
    if (sourceId && sourceId !== 'all') {
      const result = await playlistService.fetchSingleSource(sourceId);
      return res.json(result);
    } else {
      const result = await playlistService.fetchAllSources();
      return res.json(result);
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Sources Management
app.get('/api/sources', (req: Request, res: Response) => {
  return res.json(playlistService.getSources());
});

app.post('/api/sources', (req: Request, res: Response) => {
  try {
    const { name, url, id } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }
    const created = playlistService.addSource({ name, url, id });
    return res.json({ success: true, source: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/sources/:id', (req: Request, res: Response) => {
  try {
    const updated = playlistService.updateSource(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Source not found' });
    }
    return res.json({ success: true, source: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sources/:id', (req: Request, res: Response) => {
  try {
    const ok = playlistService.deleteSource(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Channel Management APIs
app.get('/api/channels', (req: Request, res: Response) => {
  try {
    const sourceId = (req.query.sourceId as string) || 'all';
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const group = (req.query.group as string) || '';
    const status = (req.query.status as string) || 'all';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    let all = playlistService.getAllChannels(sourceId);

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
    const ok = playlistService.updateChannel(id, req.body);
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

// 6. Group Management APIs
app.get('/api/groups', (req: Request, res: Response) => {
  const sourceId = req.query.sourceId as string | undefined;
  return res.json(playlistService.getGroups(sourceId));
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

app.post('/api/groups/bulk-logo', (req: Request, res: Response) => {
  try {
    const { groupNames, logoUrl } = req.body;
    if (!Array.isArray(groupNames) || groupNames.length === 0) {
      return res.status(400).json({ error: 'groupNames array is required' });
    }
    const count = playlistService.setBulkGroupLogo(groupNames, logoUrl || '');
    return res.json({ success: true, updatedChannels: count });
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

// 7. Settings & Backups
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
  const sourceId = req.query.sourceId as string | undefined;
  const m3u = playlistService.generateM3U(sourceId);
  const lines = m3u.split('\n');
  const preview = lines.slice(0, 120).join('\n');
  return res.json({
    totalLines: lines.length,
    preview,
  });
});

// Vite Integration & Static Hosting
async function startServer() {
  await playlistService.init();

  const distCandidate1 = path.resolve(__dirname, 'dist');
  const distCandidate2 = __dirname;
  const distCandidate3 = path.resolve(process.cwd(), 'dist');

  const distPath = [distCandidate1, distCandidate2, distCandidate3].find(
    (dir) => fs.existsSync(path.join(dir, 'index.html'))
  );

  const isProd = process.env.NODE_ENV === 'production' || distPath !== undefined;

  if (isProd && distPath) {
    console.log(`[Server] Serving production static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/playlist')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[Server] Mounting Vite dev server middleware');
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Server] IPTV Stream Relay running at http://${HOST}:${PORT}`);
    console.log(`[Server] All Combined M3U: http://${HOST}:${PORT}/api/playlist/all.m3u`);
    console.log(`[Server] All Combined JSON: http://${HOST}:${PORT}/api/playlist/all.json`);
    console.log(`[Server] Plugx M3U: http://${HOST}:${PORT}/api/playlist/plugx.m3u`);
    console.log(`[Server] Vaathala M3U: http://${HOST}:${PORT}/api/playlist/server-lrl45.m3u`);
    console.log(`[Server] SunNXT M3U: http://${HOST}:${PORT}/api/playlist/zeotv.m3u`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
