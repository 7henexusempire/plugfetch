import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { playlistService } from './src/server/playlistService';
import { rebuildService } from './src/server/rebuildService';
import { cloudstreamService } from './src/server/cloudstreamService';
import { skystreamService } from './src/server/skystreamService';
import { stremioNuvioService } from './src/server/stremioNuvioService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middlewares
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Cartel 187',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Helper to serve M3U with proper headers
function serveM3U(req: Request, res: Response, sourceIdOrSlug?: string) {
  const group = req.query.group as string | undefined;
  const m3uContent = playlistService.generateM3U(sourceIdOrSlug, group);

  const cleanName = sourceIdOrSlug && sourceIdOrSlug !== 'all' ? sourceIdOrSlug : 'cartel187_all';

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${cleanName}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

  return res.send(m3uContent);
}

// Helper to serve JSON representation
function serveJSON(req: Request, res: Response, sourceIdOrSlug?: string) {
  const group = req.query.group as string | undefined;
  const jsonContent = playlistService.generateJSON(sourceIdOrSlug, group);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');

  return res.json(jsonContent);
}

// ============================================================
// 1. COMBINED & ROOT PLAYLIST ENDPOINTS
// ============================================================
app.get('/playlist.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist.m3u8', (req, res) => serveM3U(req, res, 'all'));
app.get('/all.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/all.m3u8', (req, res) => serveM3U(req, res, 'all'));

app.get('/api/playlist/all.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/api/playlist/all.m3u8', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist/all.m3u', (req, res) => serveM3U(req, res, 'all'));
app.get('/playlist/all.m3u8', (req, res) => serveM3U(req, res, 'all'));

app.get('/api/playlist.json', (req, res) => serveJSON(req, res, 'all'));
app.get('/playlist.json', (req, res) => serveJSON(req, res, 'all'));
app.get('/api/playlist/all.json', (req, res) => serveJSON(req, res, 'all'));
app.get('/playlist/all.json', (req, res) => serveJSON(req, res, 'all'));

// ============================================================
// 2. NEXUSEMPIRE & ANINEXUS STREAMBOX ENDPOINTS
// ============================================================
function serveNexusEmpireM3U(req: Request, res: Response, slug: string) {
  const content = playlistService.generateNexusEmpireM3U(slug);
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="nexusempire_${slug}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');
  return res.send(content);
}

function serveNexusEmpireJSON(req: Request, res: Response, slug: string) {
  const data = playlistService.generateNexusEmpireJSON(slug);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(data);
}

// NexusEmpire Primary Routes
app.get('/api/nexusempire', (req: Request, res: Response) => {
  return res.json(playlistService.getNexusEmpireItems());
});

app.get('/nexusempire/all.m3u', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/nexusempire/all.m3u8', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/nexusempire/all.m3u', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/nexusempire/all.m3u8', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/nexusempire/all.json', (req, res) => serveNexusEmpireJSON(req, res, 'all'));
app.get('/nexusempire/all.json', (req, res) => serveNexusEmpireJSON(req, res, 'all'));

app.get('/nexusempire/:slug.m3u', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/nexusempire/:slug.m3u8', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/nexusempire/:slug.m3u', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/nexusempire/:slug.m3u8', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/nexusempire/:slug.json', (req, res) => serveNexusEmpireJSON(req, res, req.params.slug));

// Backward Compatibility for AniNexus clients
app.get('/api/aninexus', (req: Request, res: Response) => {
  return res.json(playlistService.getNexusEmpireItems());
});
app.get('/api/aninexus/all.m3u', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/aninexus/all.m3u8', (req, res) => serveNexusEmpireM3U(req, res, 'all'));
app.get('/api/aninexus/all.json', (req, res) => serveNexusEmpireJSON(req, res, 'all'));
app.get('/api/aninexus/:slug.m3u', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/aninexus/:slug.m3u8', (req, res) => serveNexusEmpireM3U(req, res, req.params.slug));
app.get('/api/aninexus/:slug.json', (req, res) => serveNexusEmpireJSON(req, res, req.params.slug));

// NexusEmpire Category Management APIs
app.get('/api/nexusempire/categories', (req: Request, res: Response) => {
  return res.json(playlistService.getNexusEmpireCategories());
});

app.post('/api/nexusempire/categories', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const ok = playlistService.createNexusEmpireCategory(name);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/nexusempire/categories/rename', (req: Request, res: Response) => {
  try {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) return res.status(400).json({ error: 'oldName and newName are required' });
    const ok = playlistService.renameNexusEmpireCategory(oldName, newName);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// NexusEmpire Items / Streams Management APIs
app.post('/api/nexusempire/items', (req: Request, res: Response) => {
  try {
    const { name, uri, slug, category, logo, description } = req.body;
    if (!name || !uri) return res.status(400).json({ error: 'Name and stream URI are required' });
    const created = playlistService.addNexusEmpireItem({ name, uri, slug, category, logo, description });
    return res.json({ success: true, item: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/nexusempire/items/:id', (req: Request, res: Response) => {
  try {
    const updated = playlistService.updateNexusEmpireItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Stream item not found' });
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/nexusempire/items/:id', (req: Request, res: Response) => {
  try {
    const ok = playlistService.deleteNexusEmpireItem(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusempire/items/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const updated = playlistService.updateNexusEmpireItem(req.params.id, { enabled });
    if (!updated) return res.status(404).json({ error: 'Stream item not found' });
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/nexusempire/move', (req: Request, res: Response) => {
  try {
    const { itemIds, category } = req.body;
    if (!Array.isArray(itemIds) || !category) {
      return res.status(400).json({ error: 'itemIds array and target category are required' });
    }
    const moved = playlistService.moveNexusEmpireItemsToCategory(itemIds, category);
    return res.json({ success: true, movedCount: moved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/nexusempire/items/:id/channels', (req: Request, res: Response) => {
  try {
    const result = playlistService.getChannelsForNexusEmpireCategory(req.params.id, true);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 2B. NEXUS REBUILD STUDIO ENDPOINTS
// ============================================================
app.get('/api/rebuilt', (req: Request, res: Response) => {
  return res.json(rebuildService.getAll());
});

app.post('/api/rebuilt', (req: Request, res: Response) => {
  try {
    const { name, description, slug, targetType, targetSourceOrCategory, customCategories } = req.body;
    if (!name || !targetType) {
      return res.status(400).json({ error: 'Name and targetType are required' });
    }
    const created = rebuildService.create({
      name,
      description,
      slug,
      targetType,
      targetSourceOrCategory: targetSourceOrCategory || 'all',
      customCategories: customCategories || { 'Main Bouquet': [] },
    });
    return res.json({ success: true, playlist: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/rebuilt/:id', (req: Request, res: Response) => {
  try {
    const updated = rebuildService.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Rebuilt playlist not found' });
    return res.json({ success: true, playlist: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rebuilt/:id', (req: Request, res: Response) => {
  try {
    const ok = rebuildService.delete(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/rebuilt/:slug.m3u', (req: Request, res: Response) => {
  const allChannels = playlistService.getAllChannels('all');
  const m3u = rebuildService.generateM3U(req.params.slug, allChannels);
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${req.params.slug}.m3u"`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
});

app.get('/api/rebuilt/:slug.json', (req: Request, res: Response) => {
  const p = rebuildService.getById(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Playlist not found' });
  const allChannels = playlistService.getAllChannels('all');
  const channelMap = new Map(allChannels.map((c) => [c.id, c]));
  const result: any = { ...p, categories: {} };
  for (const [cat, ids] of Object.entries(p.customCategories)) {
    result.categories[cat] = ids.map((id) => channelMap.get(id)).filter(Boolean);
  }
  return res.json(result);
});

// ============================================================
// 3. INDIVIDUAL PLAYLIST ENDPOINTS (by custom slug or ID, e.g. /api/playlist/nexus-vip.m3u)
// ============================================================
app.get('/api/playlist/:slug.m3u', (req, res) => serveM3U(req, res, req.params.slug));
app.get('/api/playlist/:slug.m3u8', (req, res) => serveM3U(req, res, req.params.slug));
app.get('/playlist/:slug.m3u', (req, res) => serveM3U(req, res, req.params.slug));
app.get('/playlist/:slug.m3u8', (req, res) => serveM3U(req, res, req.params.slug));

app.get('/api/playlist/:slug.json', (req, res) => serveJSON(req, res, req.params.slug));
app.get('/playlist/:slug.json', (req, res) => serveJSON(req, res, req.params.slug));

// Direct root playlist alias (e.g. /cartelx.m3u or /zeotv.m3u)
app.get('/:slug.m3u', (req, res, next) => {
  const { slug } = req.params;
  if (slug === 'cloudstream') return serveCloudStreamM3U(req, res);
  if (['api', 'health', 'assets', 'cloudstream'].includes(slug)) return next();
  return serveM3U(req, res, slug);
});

app.get('/:slug.m3u8', (req, res, next) => {
  const { slug } = req.params;
  if (slug === 'cloudstream') return serveCloudStreamM3U(req, res);
  if (['api', 'health', 'assets', 'cloudstream'].includes(slug)) return next();
  return serveM3U(req, res, slug);
});

app.get('/:slug.json', (req, res, next) => {
  const { slug } = req.params;
  if (slug === 'cloudstream') return serveCloudStreamJSON(req, res);
  if (['api', 'health', 'assets', 'cloudstream'].includes(slug)) return next();
  return next();
});

// ============================================================
// 4. STATUS & SYNC CONTROLS
// ============================================================
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

// ============================================================
// 5. PLAYLIST SOURCES & FILE UPLOAD
// ============================================================
app.get('/api/sources', (req: Request, res: Response) => {
  return res.json(playlistService.getSources());
});

app.post('/api/sources', (req: Request, res: Response) => {
  try {
    const { name, url, id, slug } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }
    const created = playlistService.addSource({ name, url, id, slug });
    return res.json({ success: true, source: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Upload and host local .m3u / .m3u8 file
app.post('/api/upload-playlist', (req: Request, res: Response) => {
  try {
    const { filename, content, displayName, slug } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and playlist content are required' });
    }
    const created = playlistService.uploadM3UFile(filename, content, displayName || filename, slug);
    const m3uUrl = `/api/playlist/${created.slug}.m3u`;
    return res.json({
      success: true,
      message: `Uploaded and hosted "${created.name}"`,
      source: created,
      m3uUrl,
    });
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

// Toggle source on/off
app.post('/api/sources/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const updated = playlistService.updateSource(req.params.id, { enabled });
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

// ============================================================
// 6. CHANNEL MANAGEMENT APIS
// ============================================================
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
      all = all.filter((c) => (c.customGroup || c.groupTitle).toLowerCase() === group.toLowerCase());
    }

    if (status === 'active') {
      all = all.filter((c) => c.enabled);
    } else if (status === 'hidden') {
      all = all.filter((c) => !c.enabled);
    } else if (status === 'clearkey') {
      all = all.filter((c) => c.hasClearKey);
    } else if (status === 'custom') {
      all = all.filter((c) => c.isCustom);
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

// Bulk toggle enable/disable channels
app.post('/api/channels/bulk-toggle', (req: Request, res: Response) => {
  try {
    const { channelIds, enabled } = req.body;
    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'channelIds array is required' });
    }
    const count = playlistService.bulkToggleChannels(channelIds, !!enabled);
    return res.json({ success: true, updatedCount: count });
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

// ============================================================
// 7. GROUP MANAGEMENT APIS
// ============================================================
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

// ============================================================
// 8. SETTINGS & BACKUPS
// ============================================================
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
  res.setHeader('Content-Disposition', 'attachment; filename="cartel187-backup.json"');
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

// ============================================================
// 2C. CLOUDSTREAM REPOS & LIVE EVENTS ENDPOINTS
// ============================================================
app.get('/api/cloudstream/repos', (req: Request, res: Response) => {
  return res.json(cloudstreamService.getRepos());
});

app.post('/api/cloudstream/repos', (req: Request, res: Response) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and repository URL are required' });
    const repo = cloudstreamService.addRepo(name, url);
    return res.json({ success: true, repo });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/repos/:id/sync', async (req: Request, res: Response) => {
  try {
    const ok = await cloudstreamService.fetchSingleRepo(req.params.id);
    return res.json({ success: ok, repos: cloudstreamService.getRepos() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/sync-all', async (req: Request, res: Response) => {
  try {
    const result = await cloudstreamService.fetchAllRepos();
    return res.json({ success: true, ...result, repos: cloudstreamService.getRepos() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cloudstream/repos/:id', (req: Request, res: Response) => {
  try {
    const ok = cloudstreamService.deleteRepo(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/cloudstream/items', (req: Request, res: Response) => {
  return res.json(cloudstreamService.getItems());
});

app.post('/api/cloudstream/items', (req: Request, res: Response) => {
  try {
    const { name, url, category, logo, description } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and stream URL are required' });
    const item = cloudstreamService.addItem({ name, url, category, logo, description });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/cloudstream/items/:id', (req: Request, res: Response) => {
  try {
    const updated = cloudstreamService.updateItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cloudstream/items/:id', (req: Request, res: Response) => {
  try {
    const ok = cloudstreamService.deleteItem(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/items/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const updated = cloudstreamService.toggleItem(req.params.id, enabled);
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    return res.json({ success: true, item: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/categories/toggle', (req: Request, res: Response) => {
  try {
    const { category, enabled } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const count = cloudstreamService.toggleCategory(category, enabled);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cloudstream/categories/rename', (req: Request, res: Response) => {
  try {
    const { oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) return res.status(400).json({ error: 'Both old and new category names required' });
    const count = cloudstreamService.renameCategory(oldCategory, newCategory);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/cloudstream/raw-json', (req: Request, res: Response) => {
  const repoId = req.query.repoId as string | undefined;
  return res.json(cloudstreamService.getRawJson(repoId));
});

function serveCloudStreamM3U(req: Request, res: Response) {
  const m3u = cloudstreamService.generateM3U();
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="nexus_cloudstream.m3u"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
}

function serveCloudStreamJSON(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(cloudstreamService.generateJSON());
}

app.get('/cloudstream.m3u', serveCloudStreamM3U);
app.get('/cloudstream.m3u8', serveCloudStreamM3U);
app.get('/api/cloudstream.m3u', serveCloudStreamM3U);
app.get('/api/cloudstream/playlist.m3u', serveCloudStreamM3U);
app.get('/cloudstream.json', serveCloudStreamJSON);
app.get('/api/cloudstream/json', serveCloudStreamJSON);
app.get('/api/cloudstream/all.json', serveCloudStreamJSON);

// ============================================================
// 2D. SKYSTREAM SHORTCODES & EXTENSIONS ENDPOINTS
// ============================================================
app.get('/api/skystream/extensions', (req: Request, res: Response) => {
  return res.json({
    repos: skystreamService.getRepos(),
    items: skystreamService.getItems(),
  });
});

app.post('/api/skystream/fetch', async (req: Request, res: Response) => {
  try {
    const { url, name } = req.body;
    if (!url) return res.status(400).json({ error: 'Shortcode or Repository URL required' });
    const result = await skystreamService.fetchByShortcodeOrUrl(url);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/sync-all', async (req: Request, res: Response) => {
  try {
    const result = await skystreamService.fetchAll();
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/items', (req: Request, res: Response) => {
  try {
    const item = skystreamService.addItem(req.body);
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/skystream/items/:id', (req: Request, res: Response) => {
  try {
    const item = skystreamService.updateItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/items/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const item = skystreamService.toggleItem(req.params.id, enabled);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/skystream/items/:id', (req: Request, res: Response) => {
  try {
    const ok = skystreamService.deleteItem(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/categories/toggle', (req: Request, res: Response) => {
  try {
    const { category, enabled } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const count = skystreamService.toggleCategory(category, enabled);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/skystream/categories/rename', (req: Request, res: Response) => {
  try {
    const { oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) return res.status(400).json({ error: 'Both old and new category names required' });
    const count = skystreamService.renameCategory(oldCategory, newCategory);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/skystream/raw-json', (req: Request, res: Response) => {
  const targetId = (req.query.targetId || req.query.shortcode) as string | undefined;
  return res.json(skystreamService.getRawJson(targetId));
});

function serveSkyStreamM3U(req: Request, res: Response) {
  const m3u = skystreamService.generateM3U();
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="nexus_skystream.m3u"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
}

function serveSkyStreamJSON(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(skystreamService.generateJSON());
}

app.get('/skystream.m3u', serveSkyStreamM3U);
app.get('/skystream.m3u8', serveSkyStreamM3U);
app.get('/api/skystream.m3u', serveSkyStreamM3U);
app.get('/skystream.json', serveSkyStreamJSON);
app.get('/api/skystream.json', serveSkyStreamJSON);

// ============================================================
// 2E. STREMIO / NUVIO & CNCVERSE-BRIDGE ENDPOINTS
// ============================================================
app.get('/api/stremio/addons', (req: Request, res: Response) => {
  return res.json(stremioNuvioService.getAddons());
});

app.post('/api/stremio/addons', async (req: Request, res: Response) => {
  try {
    const { manifestUrl, name } = req.body;
    if (!manifestUrl) return res.status(400).json({ error: 'Manifest URL is required' });
    const addon = await stremioNuvioService.addAddon(manifestUrl, name);
    return res.json({ success: true, addon });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/stremio/addons/:id/sync', async (req: Request, res: Response) => {
  try {
    const ok = await stremioNuvioService.fetchAddonManifest(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/stremio/sync-all', async (req: Request, res: Response) => {
  try {
    const result = await stremioNuvioService.syncAllAddons();
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/stremio/raw-json', (req: Request, res: Response) => {
  const addonId = req.query.addonId as string | undefined;
  return res.json(stremioNuvioService.getRawJson(addonId));
});

app.get('/api/cncverse/streams', (req: Request, res: Response) => {
  return res.json({
    bridge: stremioNuvioService.getBridgeStatus(),
    streams: stremioNuvioService.getStreams(),
  });
});

app.get('/api/cncverse/status', async (req: Request, res: Response) => {
  const status = await stremioNuvioService.checkBridgeStatus();
  return res.json({ ...stremioNuvioService.getBridgeStatus(), status });
});

app.post('/api/cncverse/sync', async (req: Request, res: Response) => {
  try {
    await stremioNuvioService.checkBridgeStatus();
    return res.json({ success: true, bridge: stremioNuvioService.getBridgeStatus() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/url', (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    stremioNuvioService.setBridgeUrl(url);
    return res.json({ success: true, bridge: stremioNuvioService.getBridgeStatus() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/streams', (req: Request, res: Response) => {
  try {
    const item = stremioNuvioService.addStream(req.body);
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/cncverse/streams/:id', (req: Request, res: Response) => {
  try {
    const item = stremioNuvioService.updateStream(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Stream not found' });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/streams/:id/toggle', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const item = stremioNuvioService.toggleStream(req.params.id, enabled);
    if (!item) return res.status(404).json({ error: 'Stream not found' });
    return res.json({ success: true, item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cncverse/streams/:id', (req: Request, res: Response) => {
  try {
    const ok = stremioNuvioService.deleteStream(req.params.id);
    return res.json({ success: ok });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/categories/toggle', (req: Request, res: Response) => {
  try {
    const { category, enabled } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });
    const count = stremioNuvioService.toggleCategory(category, enabled);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/cncverse/categories/rename', (req: Request, res: Response) => {
  try {
    const { oldCategory, newCategory } = req.body;
    if (!oldCategory || !newCategory) return res.status(400).json({ error: 'Both old and new category names required' });
    const count = stremioNuvioService.renameCategory(oldCategory, newCategory);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

function serveCNCVerseM3U(req: Request, res: Response) {
  const m3u = stremioNuvioService.generateCNCVerseM3U();
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="nexus_cncverse.m3u"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
}

function serveCNCVerseJSON(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(stremioNuvioService.generateCNCVerseJSON());
}

function serveStremioM3U(req: Request, res: Response) {
  const m3u = stremioNuvioService.generateStremioM3U();
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="nexus_stremio_addons.m3u"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.send(m3u);
}

function serveStremioJSON(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json(stremioNuvioService.getRawJson());
}

app.get('/cncverse.m3u', serveCNCVerseM3U);
app.get('/cncverse.m3u8', serveCNCVerseM3U);
app.get('/api/cncverse.m3u', serveCNCVerseM3U);
app.get('/cncverse.json', serveCNCVerseJSON);
app.get('/api/cncverse.json', serveCNCVerseJSON);

app.get('/stremio.m3u', serveStremioM3U);
app.get('/stremio.m3u8', serveStremioM3U);
app.get('/nuvio-stremio.m3u', serveStremioM3U);
app.get('/api/stremio.m3u', serveStremioM3U);
app.get('/stremio.json', serveStremioJSON);
app.get('/api/stremio.json', serveStremioJSON);

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
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/playlist') ||
        req.path.startsWith('/nexusempire') ||
        req.path.startsWith('/aninexus') ||
        req.path.endsWith('.m3u') ||
        req.path.endsWith('.m3u8')
      ) {
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
    console.log(`[Nexus] Engine running at http://${HOST}:${PORT}`);
    console.log(`[Nexus] Master M3U: http://${HOST}:${PORT}/api/playlist/all.m3u`);
    console.log(`[Nexus] NexusEmpire Master M3U: http://${HOST}:${PORT}/api/nexusempire/all.m3u`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
