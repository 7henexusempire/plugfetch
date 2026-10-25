import fs from 'fs';
import path from 'path';

export interface PlaylistSource {
  id: string; // e.g. 'plugx', 'server-lrl45', 'zeotv'
  name: string;
  url: string;
  enabled: boolean;
  lastSyncTime: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  channelCount: number;
}

export interface ChannelItem {
  id: string;
  sourceId: string;
  tvgId: string;
  tvgName: string;
  tvgLogo: string;
  tvgCategory: string;
  groupTitle: string;
  groupLogo?: string;
  type?: string;
  tvgChno?: string;
  name: string;
  url: string;
  preDirectives: string[];
  postDirectives: string[];
  directives: string[];
  hasClearKey?: boolean;
  clearKeySnippet?: string;
  customName?: string;
  customGroup?: string;
  customLogo?: string;
  customGroupLogo?: string;
  customChno?: string;
  customUrl?: string;
  enabled: boolean;
  isCustom?: boolean;
}

export interface PlaylistSettings {
  syncIntervalMinutes: number;
  autoSync: boolean;
  userAgent: string;
  customTvgUrl: string;
  publicBaseUrl: string;
  zeotvStripSuffix: boolean;
  zeotvRemoveGroupLogo: boolean;
}

export interface CustomizationData {
  sources: PlaylistSource[];
  channelOverrides: Record<string, {
    customName?: string;
    customGroup?: string;
    customLogo?: string;
    customGroupLogo?: string;
    customChno?: string;
    customUrl?: string;
    enabled?: boolean;
  }>;
  groupRenames: Record<string, string>;
  groupLogos: Record<string, string>; // Bulk group logos
  groupVisibility: Record<string, boolean>;
  customChannels: ChannelItem[];
  settings: PlaylistSettings;
}

export interface GlobalSyncStatus {
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  totalChannels: number;
  activeChannels: number;
  totalGroups: number;
  syncIntervalMinutes: number;
  autoSync: boolean;
  publicBaseUrl: string;
  sources: PlaylistSource[];
}

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, 'playlist-multi-cache.json');
const CUSTOMIZATIONS_FILE = path.join(DATA_DIR, 'customizations.json');

const DEFAULT_SOURCES: PlaylistSource[] = [
  {
    id: 'plugx',
    name: 'Plugx VIP Playlist',
    url: 'https://plugxvipplaylist.lovable.app/api/playlist',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'server-lrl45',
    name: 'Vaathala & Hotstar Live',
    url: 'https://server.lrl45.workers.dev/channel/raw?=m3u',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'zeotv',
    name: 'SunNXT & StreamX Live',
    url: 'https://zeotvyash.streamxlivenow.workers.dev/',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
];

const DEFAULT_SETTINGS: PlaylistSettings = {
  syncIntervalMinutes: 30,
  autoSync: true,
  userAgent: 'TiviMate/5.1.0 (Linux; Android 12) curl/8.0.0',
  customTvgUrl: '',
  publicBaseUrl: '',
  zeotvStripSuffix: true,
  zeotvRemoveGroupLogo: true,
};

class PlaylistService {
  private sources: PlaylistSource[] = [...DEFAULT_SOURCES];
  private sourceHeaders: Record<string, string[]> = {};
  private channelsBySource: Record<string, ChannelItem[]> = {};
  private settings: PlaylistSettings = { ...DEFAULT_SETTINGS };
  private channelOverrides: CustomizationData['channelOverrides'] = {};
  private groupRenames: Record<string, string> = {};
  private groupLogos: Record<string, string> = {};
  private groupVisibility: Record<string, boolean> = {};
  private customChannels: ChannelItem[] = [];

  private lastSyncTime: Date | null = null;
  private nextSyncTime: Date | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncingAll = false;
  private isInitialized = false;

  constructor() {
    this.ensureDataDir();
    this.loadCustomizations();
    this.loadCache();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }
  }

  private loadCustomizations() {
    try {
      if (fs.existsSync(CUSTOMIZATIONS_FILE)) {
        const raw = fs.readFileSync(CUSTOMIZATIONS_FILE, 'utf-8');
        const data: Partial<CustomizationData> = JSON.parse(raw);
        if (Array.isArray(data.sources) && data.sources.length > 0) {
          const loadedMap = new Map(data.sources.map((s) => [s.id, s]));
          this.sources = DEFAULT_SOURCES.map((def) => {
            const saved = loadedMap.get(def.id);
            return saved ? { ...def, ...saved } : def;
          });
          for (const s of data.sources) {
            if (!this.sources.some((x) => x.id === s.id)) {
              this.sources.push(s);
            }
          }
        }
        if (data.channelOverrides) this.channelOverrides = data.channelOverrides;
        if (data.groupRenames) this.groupRenames = data.groupRenames;
        if (data.groupLogos) this.groupLogos = data.groupLogos;
        if (data.groupVisibility) this.groupVisibility = data.groupVisibility;
        if (data.customChannels) this.customChannels = data.customChannels;
        if (data.settings) {
          this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
          if (!this.settings.userAgent || this.settings.userAgent.includes('Chrome/')) {
            this.settings.userAgent = DEFAULT_SETTINGS.userAgent;
          }
        }
      }
    } catch (err) {
      console.error('Failed to load customizations:', err);
    }
  }

  private saveCustomizations() {
    this.ensureDataDir();
    try {
      const data: CustomizationData = {
        sources: this.sources,
        channelOverrides: this.channelOverrides,
        groupRenames: this.groupRenames,
        groupLogos: this.groupLogos,
        groupVisibility: this.groupVisibility,
        customChannels: this.customChannels,
        settings: this.settings,
      };
      fs.writeFileSync(CUSTOMIZATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save customizations:', err);
    }
  }

  private loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cache = JSON.parse(raw);
        if (cache.channelsBySource) {
          this.channelsBySource = cache.channelsBySource;
          this.sourceHeaders = cache.sourceHeaders || {};
          this.lastSyncTime = cache.lastSyncTime ? new Date(cache.lastSyncTime) : null;
          for (const src of this.sources) {
            const chs = this.channelsBySource[src.id] || [];
            src.channelCount = chs.length;
          }
          this.applyCustomizations();
        }
      }
    } catch (err) {
      console.error('Failed to load multi-source cache:', err);
    }
  }

  private saveCache() {
    this.ensureDataDir();
    try {
      const cache = {
        lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
        sourceHeaders: this.sourceHeaders,
        channelsBySource: this.channelsBySource,
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
    } catch (err) {
      console.error('Failed to save multi-source cache:', err);
    }
  }

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const hasAnyChannels = Object.values(this.channelsBySource).some((arr) => arr.length > 0);
    if (!hasAnyChannels) {
      await this.fetchAllSources();
    } else {
      this.fetchAllSources().catch((e) => console.error('Initial background sync error:', e));
    }

    this.scheduleNextSync();
  }

  public scheduleNextSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (!this.settings.autoSync) {
      this.nextSyncTime = null;
      return;
    }

    const intervalMs = Math.max(5, this.settings.syncIntervalMinutes) * 60 * 1000;
    this.nextSyncTime = new Date(Date.now() + intervalMs);

    this.syncTimer = setInterval(async () => {
      console.log(`[Sync Worker] Auto-syncing all sources at ${new Date().toISOString()}`);
      await this.fetchAllSources();
      this.nextSyncTime = new Date(Date.now() + intervalMs);
    }, intervalMs);
  }

  public async fetchSingleSource(sourceId: string): Promise<{ success: boolean; message: string; count: number }> {
    const src = this.sources.find((s) => s.id === sourceId);
    if (!src) {
      return { success: false, message: `Source with ID "${sourceId}" not found`, count: 0 };
    }

    src.status = 'fetching';
    src.errorMessage = null;

    try {
      console.log(`[PlaylistService] Fetching "${src.name}" from ${src.url}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

      const response = await fetch(src.url, {
        headers: {
          'User-Agent': this.settings.userAgent || DEFAULT_SETTINGS.userAgent,
          'Accept': '*/*',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const m3uText = await response.text();
      if (!m3uText.includes('#EXTM3U') && !m3uText.includes('#EXTINF')) {
        throw new Error('Response is not a valid M3U playlist format');
      }

      const { channels, headers } = this.parseM3UContent(m3uText, src.id);
      this.channelsBySource[src.id] = channels;
      this.sourceHeaders[src.id] = headers;

      src.channelCount = channels.length;
      src.lastSyncTime = new Date().toISOString();
      src.status = 'success';

      this.applyCustomizations();
      this.saveCache();
      this.saveCustomizations();

      console.log(`[PlaylistService] Source "${src.name}" synced: ${channels.length} channels`);
      return { success: true, message: `Synced ${channels.length} channels from ${src.name}`, count: channels.length };
    } catch (err: any) {
      console.error(`[PlaylistService] Error fetching source "${src.name}":`, err);
      src.status = 'error';
      src.errorMessage = err.message || 'Fetch failed';
      this.saveCustomizations();
      return { success: false, message: src.errorMessage || 'Fetch failed', count: src.channelCount };
    }
  }

  public async fetchAllSources(): Promise<{ success: boolean; message: string; totalChannels: number }> {
    if (this.isSyncingAll) {
      return { success: false, message: 'Sync already in progress', totalChannels: this.getAllChannels().length };
    }

    this.isSyncingAll = true;
    const enabledSources = this.sources.filter((s) => s.enabled);
    console.log(`[PlaylistService] Starting sync for ${enabledSources.length} enabled playlist sources...`);

    let totalSynced = 0;
    const errors: string[] = [];

    for (const src of enabledSources) {
      const result = await this.fetchSingleSource(src.id);
      if (result.success) {
        totalSynced += result.count;
      } else {
        errors.push(`${src.name}: ${result.message}`);
      }
    }

    this.lastSyncTime = new Date();
    this.isSyncingAll = false;

    const total = this.getAllChannels().length;
    if (errors.length === 0) {
      return { success: true, message: `All ${enabledSources.length} sources synced successfully (${total} channels total)`, totalChannels: total };
    } else {
      return { success: errors.length < enabledSources.length, message: `Synced with warnings: ${errors.join('; ')}`, totalChannels: total };
    }
  }

  /**
   * Lossless M3U Parser:
   * Captures preDirectives (e.g. SunNXT ClearKey KODIPROP before #EXTINF),
   * exact #EXTINF attributes, postDirectives (#EXTVLCOPT, #EXTHTTP, cookies, exp, hmac),
   * and full stream URL (including ?|cookie=... parameters).
   */
  private parseM3UContent(content: string, sourceId: string): { channels: ChannelItem[]; headers: string[] } {
    const rawLines = content.split(/\r?\n/);
    const parsedChannels: ChannelItem[] = [];
    const headers: string[] = [];

    let currentPre: string[] = [];
    let currentExtInf: {
      rawLine: string;
      tvgId: string;
      tvgName: string;
      tvgLogo: string;
      tvgCategory: string;
      groupTitle: string;
      groupLogo?: string;
      type?: string;
      tvgChno?: string;
      name: string;
    } | null = null;
    let currentPost: string[] = [];
    let hasSeenExtInf = false;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      if (!hasSeenExtInf && line.startsWith('#EXTM3U')) {
        headers.push(line);
        continue;
      }

      if (line.startsWith('#EXTINF:')) {
        hasSeenExtInf = true;
        // If an EXTINF arrived without URL (e.g. section separator title), start fresh
        if (currentExtInf) {
          currentPre = [];
        }
        currentExtInf = this.parseExtInfLine(line, sourceId);
        currentPost = [];
      } else if (line.startsWith('#')) {
        // Repeated #EXTM3U in mid-file: keep as header if it has EPG url, else skip
        if (line.startsWith('#EXTM3U')) {
          if (line.includes('tvg-url') || line.includes('x-tvg-url')) {
            headers.push(line);
          }
          continue;
        }

        if (currentExtInf) {
          currentPost.push(line);
        } else {
          currentPre.push(line);
        }
      } else if (/^(https?|rtmp|udp|rtsp):\/\//i.test(line)) {
        if (currentExtInf) {
          const rawId = currentExtInf.tvgId || `${currentExtInf.name.replace(/[^a-zA-Z0-9]/g, '_')}_${parsedChannels.length + 1}`;
          const channelId = `${sourceId}_${rawId}`;

          const allDirectives = [...currentPre, ...currentPost];
          let hasClearKey = false;
          let clearKeySnippet = '';
          const clearkeyDirective = allDirectives.find((d) => d.includes('license_key') || d.includes('clearkey'));
          if (clearkeyDirective) {
            hasClearKey = true;
            clearKeySnippet = clearkeyDirective;
          }

          parsedChannels.push({
            id: channelId,
            sourceId,
            tvgId: currentExtInf.tvgId || rawId,
            tvgName: currentExtInf.tvgName,
            tvgLogo: currentExtInf.tvgLogo,
            tvgCategory: currentExtInf.tvgCategory,
            groupTitle: currentExtInf.groupTitle || 'General',
            groupLogo: currentExtInf.groupLogo,
            type: currentExtInf.type,
            tvgChno: currentExtInf.tvgChno,
            name: currentExtInf.name,
            url: line,
            preDirectives: currentPre,
            postDirectives: currentPost,
            directives: allDirectives,
            hasClearKey,
            clearKeySnippet,
            enabled: true,
          });

          currentExtInf = null;
          currentPre = [];
          currentPost = [];
        }
      }
    }

    return { channels: parsedChannels, headers };
  }

  private parseExtInfLine(line: string, sourceId: string) {
    const lastCommaIdx = line.lastIndexOf(',');
    let name = '';
    let attrsStr = line;
    if (lastCommaIdx !== -1) {
      name = line.substring(lastCommaIdx + 1).trim();
      attrsStr = line.substring(0, lastCommaIdx);
    }

    const getAttr = (attr: string): string => {
      const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
      const match = attrsStr.match(regex);
      if (match) return match[1];
      const unquoted = new RegExp(`${attr}=([^\\s,]+)`, 'i');
      const match2 = attrsStr.match(unquoted);
      return match2 ? match2[1] : '';
    };

    let groupTitle = getAttr('group-title') || 'General';
    let groupLogo = getAttr('group-logo') || '';

    // USER REQUIREMENT:
    // Remove group logos and streamx suffix from zeotv playlist
    if (sourceId === 'zeotv') {
      if (this.settings.zeotvStripSuffix) {
        groupTitle = groupTitle.replace(/\s*\|\s*STREAMX/gi, '').replace(/\s*STREAMX\s*/gi, '').trim();
      }
      if (this.settings.zeotvRemoveGroupLogo) {
        groupLogo = '';
      }
    }

    return {
      rawLine: line,
      tvgId: getAttr('tvg-id'),
      tvgName: getAttr('tvg-name') || name,
      tvgLogo: getAttr('tvg-logo'),
      tvgCategory: getAttr('tvg-category'),
      groupTitle,
      groupLogo: groupLogo || undefined,
      type: getAttr('type'),
      tvgChno: getAttr('tvg-chno'),
      name: name || getAttr('tvg-name') || 'Unnamed Channel',
    };
  }

  private applyCustomizations() {
    for (const channels of Object.values(this.channelsBySource)) {
      for (const channel of channels) {
        const override = this.channelOverrides[channel.id] || this.channelOverrides[channel.tvgId];
        if (override) {
          if (override.customName !== undefined) channel.customName = override.customName;
          if (override.customGroup !== undefined) channel.customGroup = override.customGroup;
          if (override.customLogo !== undefined) channel.customLogo = override.customLogo;
          if (override.customGroupLogo !== undefined) channel.customGroupLogo = override.customGroupLogo;
          if (override.customChno !== undefined) channel.customChno = override.customChno;
          if (override.customUrl !== undefined) channel.customUrl = override.customUrl;
          if (override.enabled !== undefined) channel.enabled = override.enabled;
        }

        const effectiveGroup = channel.customGroup || channel.groupTitle;
        if (this.groupRenames[effectiveGroup]) {
          channel.customGroup = this.groupRenames[effectiveGroup];
        }

        const finalGroup = channel.customGroup || channel.groupTitle;

        // Apply bulk group logo if set
        if (this.groupLogos[finalGroup] !== undefined) {
          channel.customGroupLogo = this.groupLogos[finalGroup];
        }

        if (this.groupVisibility[finalGroup] !== undefined && override?.enabled === undefined) {
          channel.enabled = this.groupVisibility[finalGroup];
        }
      }
    }
  }

  public getSources(): PlaylistSource[] {
    return this.sources;
  }

  public addSource(source: { name: string; url: string; id?: string }) {
    const id = source.id || `source_${Date.now()}`;
    const newSource: PlaylistSource = {
      id: id.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      name: source.name,
      url: source.url,
      enabled: true,
      lastSyncTime: null,
      status: 'idle',
      errorMessage: null,
      channelCount: 0,
    };
    this.sources.push(newSource);
    this.saveCustomizations();
    this.fetchSingleSource(newSource.id).catch((e) => console.error(e));
    return newSource;
  }

  public updateSource(id: string, updates: Partial<PlaylistSource>) {
    const src = this.sources.find((s) => s.id === id);
    if (!src) return null;

    const oldUrl = src.url;
    Object.assign(src, updates);
    this.saveCustomizations();

    if (updates.url && updates.url !== oldUrl) {
      this.fetchSingleSource(id).catch((e) => console.error(e));
    }
    return src;
  }

  public deleteSource(id: string) {
    const idx = this.sources.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.sources.splice(idx, 1);
      delete this.channelsBySource[id];
      delete this.sourceHeaders[id];
      this.saveCache();
      this.saveCustomizations();
      return true;
    }
    return false;
  }

  public getAllChannels(sourceId?: string): ChannelItem[] {
    const result: ChannelItem[] = [];

    if (sourceId && sourceId !== 'all') {
      const srcChannels = this.channelsBySource[sourceId] || [];
      result.push(...srcChannels);
    } else {
      for (const [sId, chs] of Object.entries(this.channelsBySource)) {
        const src = this.sources.find((s) => s.id === sId);
        if (src && src.enabled) {
          result.push(...chs);
        }
      }
      for (const custom of this.customChannels) {
        if (!result.some((c) => c.id === custom.id)) {
          result.push(custom);
        }
      }
    }

    return result;
  }

  public getGroups(sourceId?: string): { name: string; count: number; enabledCount: number; isVisible: boolean; logo?: string }[] {
    const groupMap: Record<string, { total: number; enabled: number; logo?: string }> = {};
    const all = this.getAllChannels(sourceId);

    for (const ch of all) {
      const group = ch.customGroup || ch.groupTitle || 'General';
      if (!groupMap[group]) {
        groupMap[group] = {
          total: 0,
          enabled: 0,
          logo: this.groupLogos[group] || ch.customGroupLogo || ch.groupLogo,
        };
      }
      groupMap[group].total++;
      if (ch.enabled) groupMap[group].enabled++;

      if (!groupMap[group].logo && (ch.customGroupLogo || ch.groupLogo)) {
        groupMap[group].logo = ch.customGroupLogo || ch.groupLogo;
      }
    }

    return Object.entries(groupMap)
      .map(([name, stats]) => ({
        name,
        count: stats.total,
        enabledCount: stats.enabled,
        isVisible: this.groupVisibility[name] !== false,
        logo: this.groupLogos[name] !== undefined ? this.groupLogos[name] : stats.logo,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public setBulkGroupLogo(groupNames: string[], logoUrl: string): number {
    let affectedCount = 0;
    const cleanLogo = logoUrl ? logoUrl.trim() : '';

    for (const groupName of groupNames) {
      if (cleanLogo) {
        this.groupLogos[groupName] = cleanLogo;
      } else {
        delete this.groupLogos[groupName];
      }

      for (const ch of this.getAllChannels()) {
        const effectiveGroup = ch.customGroup || ch.groupTitle;
        if (effectiveGroup === groupName) {
          ch.customGroupLogo = cleanLogo || undefined;
          if (!this.channelOverrides[ch.id]) this.channelOverrides[ch.id] = {};
          this.channelOverrides[ch.id].customGroupLogo = cleanLogo || undefined;
          affectedCount++;
        }
      }
    }

    this.saveCustomizations();
    return affectedCount;
  }

  public updateChannel(id: string, updates: {
    customName?: string;
    customGroup?: string;
    customLogo?: string;
    customGroupLogo?: string;
    customChno?: string;
    customUrl?: string;
    enabled?: boolean;
  }) {
    const channel = this.getAllChannels().find((c) => c.id === id);
    if (!channel) return false;

    if (!this.channelOverrides[id]) {
      this.channelOverrides[id] = {};
    }

    if (updates.customName !== undefined) {
      this.channelOverrides[id].customName = updates.customName;
      channel.customName = updates.customName;
    }
    if (updates.customGroup !== undefined) {
      this.channelOverrides[id].customGroup = updates.customGroup;
      channel.customGroup = updates.customGroup;
    }
    if (updates.customLogo !== undefined) {
      this.channelOverrides[id].customLogo = updates.customLogo;
      channel.customLogo = updates.customLogo;
    }
    if (updates.customGroupLogo !== undefined) {
      this.channelOverrides[id].customGroupLogo = updates.customGroupLogo;
      channel.customGroupLogo = updates.customGroupLogo;
    }
    if (updates.customChno !== undefined) {
      this.channelOverrides[id].customChno = updates.customChno;
      channel.customChno = updates.customChno;
    }
    if (updates.customUrl !== undefined) {
      this.channelOverrides[id].customUrl = updates.customUrl;
      channel.customUrl = updates.customUrl;
    }
    if (updates.enabled !== undefined) {
      this.channelOverrides[id].enabled = updates.enabled;
      channel.enabled = updates.enabled;
    }

    this.saveCustomizations();
    return true;
  }

  public resetChannel(id: string) {
    const channel = this.getAllChannels().find((c) => c.id === id);
    if (channel) {
      delete this.channelOverrides[id];
      channel.customName = undefined;
      channel.customGroup = undefined;
      channel.customLogo = undefined;
      channel.customGroupLogo = undefined;
      channel.customChno = undefined;
      channel.customUrl = undefined;
      channel.enabled = true;
      this.saveCustomizations();
      return true;
    }
    return false;
  }

  public addCustomChannel(channel: {
    name: string;
    group: string;
    url: string;
    logo?: string;
    tvgId?: string;
    tvgChno?: string;
    directives?: string[];
  }) {
    const id = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newChannel: ChannelItem = {
      id,
      sourceId: 'custom',
      tvgId: channel.tvgId || id,
      tvgName: channel.name,
      tvgLogo: channel.logo || '',
      tvgCategory: channel.group,
      groupTitle: channel.group,
      name: channel.name,
      url: channel.url,
      tvgChno: channel.tvgChno,
      preDirectives: [],
      postDirectives: channel.directives || [],
      directives: channel.directives || [],
      enabled: true,
      isCustom: true,
      customName: channel.name,
      customGroup: channel.group,
      customLogo: channel.logo,
      customUrl: channel.url,
      customChno: channel.tvgChno,
    };
    this.customChannels.push(newChannel);
    this.saveCustomizations();
    return newChannel;
  }

  public renameGroup(oldName: string, newName: string) {
    this.groupRenames[oldName] = newName;
    for (const ch of this.getAllChannels()) {
      if ((ch.customGroup || ch.groupTitle) === oldName) {
        ch.customGroup = newName;
        if (!this.channelOverrides[ch.id]) this.channelOverrides[ch.id] = {};
        this.channelOverrides[ch.id].customGroup = newName;
      }
    }
    this.saveCustomizations();
    return true;
  }

  public toggleGroupVisibility(groupName: string, visible: boolean) {
    this.groupVisibility[groupName] = visible;
    for (const ch of this.getAllChannels()) {
      const grp = ch.customGroup || ch.groupTitle;
      if (grp === groupName) {
        ch.enabled = visible;
        if (!this.channelOverrides[ch.id]) this.channelOverrides[ch.id] = {};
        this.channelOverrides[ch.id].enabled = visible;
      }
    }
    this.saveCustomizations();
    return true;
  }

  public removeGroupPrefix(prefix: string) {
    if (!prefix) return 0;
    let count = 0;
    for (const ch of this.getAllChannels()) {
      const currentGroup = ch.customGroup || ch.groupTitle;
      if (currentGroup.startsWith(prefix)) {
        const updatedGroup = currentGroup.substring(prefix.length).trim();
        ch.customGroup = updatedGroup;
        if (!this.channelOverrides[ch.id]) this.channelOverrides[ch.id] = {};
        this.channelOverrides[ch.id].customGroup = updatedGroup;
        count++;
      }
    }
    this.saveCustomizations();
    return count;
  }

  public getSettings(): PlaylistSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<PlaylistSettings>) {
    const oldInterval = this.settings.syncIntervalMinutes;
    const oldAutoSync = this.settings.autoSync;

    this.settings = { ...this.settings, ...newSettings };
    this.saveCustomizations();

    if (
      this.settings.syncIntervalMinutes !== oldInterval ||
      this.settings.autoSync !== oldAutoSync
    ) {
      this.scheduleNextSync();
    }

    return this.settings;
  }

  public getGlobalStatus(): GlobalSyncStatus {
    const all = this.getAllChannels();
    const active = all.filter((c) => c.enabled);
    const groups = new Set(all.map((c) => c.customGroup || c.groupTitle));

    const isAnyFetching = this.sources.some((s) => s.status === 'fetching') || this.isSyncingAll;
    const hasAnyError = this.sources.some((s) => s.status === 'error');

    return {
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
      nextSyncTime: this.nextSyncTime ? this.nextSyncTime.toISOString() : null,
      status: isAnyFetching ? 'fetching' : hasAnyError ? 'error' : 'success',
      errorMessage: hasAnyError
        ? this.sources.filter((s) => s.errorMessage).map((s) => `${s.name}: ${s.errorMessage}`).join('; ')
        : null,
      totalChannels: all.length,
      activeChannels: active.length,
      totalGroups: groups.size,
      syncIntervalMinutes: this.settings.syncIntervalMinutes,
      autoSync: this.settings.autoSync,
      publicBaseUrl: this.settings.publicBaseUrl || process.env.APP_URL || '',
      sources: this.sources,
    };
  }

  /**
   * Generates M3U playlist file for a specific source OR all sources combined
   * Perfectly preserving preDirectives (#KODIPROP before #EXTINF), postDirectives (#EXTVLCOPT, #EXTHTTP, cookies, hmac),
   * exact stream URLs, and group logos.
   */
  public generateM3U(sourceId?: string, filterGroup?: string): string {
    const isAll = !sourceId || sourceId === 'all';
    const channels = this.getAllChannels(isAll ? undefined : sourceId).filter((c) => c.enabled);
    const filtered = filterGroup
      ? channels.filter((c) => (c.customGroup || c.groupTitle).toLowerCase() === filterGroup.toLowerCase())
      : channels;

    let header = '#EXTM3U';
    if (!isAll && this.sourceHeaders[sourceId]?.length > 0) {
      const firstLine = this.sourceHeaders[sourceId][0];
      if (firstLine.startsWith('#EXTM3U')) {
        header = firstLine;
      }
    } else {
      // Unified header with all primary EPG sources
      header = '#EXTM3U url-tvg="https://avkb.short.gy/jioepg.xml.gz" x-tvg-url="https://avkb.short.gy/jioepg.xml.gz,https://epgshare01.online/epgshare01/epg_ripper_IN4.xml.gz,https://mitthu786.github.io/tvepg/tataplay/epg.xml.gz,https://avkb.short.gy/tsepg.xml.gz" refresh="3600"';
    }

    if (this.settings.customTvgUrl) {
      header = `#EXTM3U url-tvg="${this.settings.customTvgUrl}" tvg-url="${this.settings.customTvgUrl}" refresh="3600"`;
    }

    const lines: string[] = [header];
    const sourceLabel = isAll ? 'ALL COMBINED SOURCES' : (this.sources.find((s) => s.id === sourceId)?.name || sourceId);
    lines.push(`# IPTV Stream Relay & Multi-Playlist Studio | ${new Date().toISOString()}`);
    lines.push(`# Playlist Source: ${sourceLabel}`);
    lines.push(`# Total Channels: ${filtered.length}`);

    for (const ch of filtered) {
      const displayName = ch.customName || ch.name;
      const groupTitle = ch.customGroup || ch.groupTitle || 'General';
      const logo = ch.customLogo || ch.tvgLogo || '';
      const tvgId = ch.tvgId || ch.id;
      const tvgName = ch.customName || ch.tvgName || displayName;
      const streamUrl = ch.customUrl || ch.url;
      const chno = ch.customChno || ch.tvgChno;
      
      // Determine effective group logo (custom group logo, bulk group logo, or original group logo)
      const groupLogo = ch.customGroupLogo !== undefined
        ? ch.customGroupLogo
        : (this.groupLogos[groupTitle] || ch.groupLogo);

      // 1. Output preDirectives (crucial for SunNXT clearkey #KODIPROP which MUST precede #EXTINF)
      if (ch.preDirectives && ch.preDirectives.length > 0) {
        for (const dir of ch.preDirectives) {
          lines.push(dir);
        }
      }

      // 2. Output #EXTINF
      let extInfParts = [`#EXTINF:-1`];
      if (tvgId) extInfParts.push(`tvg-id="${tvgId}"`);
      if (tvgName) extInfParts.push(`tvg-name="${tvgName}"`);
      if (logo) extInfParts.push(`tvg-logo="${logo}"`);
      if (ch.tvgCategory) extInfParts.push(`tvg-category="${ch.tvgCategory}"`);
      if (groupTitle) extInfParts.push(`group-title="${groupTitle}"`);
      if (groupLogo) extInfParts.push(`group-logo="${groupLogo}"`);
      if (chno) extInfParts.push(`tvg-chno="${chno}"`);
      if (ch.type) extInfParts.push(`type="${ch.type}"`);

      lines.push(`${extInfParts.join(' ')},${displayName}`);

      // 3. Output postDirectives (#EXTVLCOPT, #EXTHTTP, cookies, hmac, exp, User-Agent)
      if (ch.postDirectives && ch.postDirectives.length > 0) {
        for (const dir of ch.postDirectives) {
          lines.push(dir);
        }
      } else if (ch.directives && ch.directives.length > 0 && ch.preDirectives.length === 0) {
        // Fallback for custom channels
        for (const dir of ch.directives) {
          lines.push(dir);
        }
      }

      // 4. Output stream URL
      lines.push(streamUrl);
    }

    return lines.join('\n');
  }

  /**
   * Generates structured JSON representation for a specific source OR all sources combined
   */
  public generateJSON(sourceId?: string, filterGroup?: string) {
    const isAll = !sourceId || sourceId === 'all';
    const all = this.getAllChannels(isAll ? undefined : sourceId);
    const channels = filterGroup
      ? all.filter((c) => (c.customGroup || c.groupTitle).toLowerCase() === filterGroup.toLowerCase())
      : all;

    const sourceLabel = isAll ? 'All Combined Playlists' : (this.sources.find((s) => s.id === sourceId)?.name || sourceId);

    return {
      service: 'IPTV Stream Relay & Multi-Playlist Studio',
      playlistSource: sourceLabel,
      sourceId: isAll ? 'all' : sourceId,
      generatedAt: new Date().toISOString(),
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
      totalChannels: channels.length,
      activeChannels: channels.filter((c) => c.enabled).length,
      sources: isAll ? this.sources : this.sources.filter((s) => s.id === sourceId),
      groups: this.getGroups(isAll ? undefined : sourceId),
      channels: channels.map((c) => ({
        id: c.id,
        sourceId: c.sourceId,
        tvgId: c.tvgId,
        tvgName: c.customName || c.tvgName,
        displayName: c.customName || c.name,
        originalName: c.name,
        group: c.customGroup || c.groupTitle,
        originalGroup: c.groupTitle,
        logo: c.customLogo || c.tvgLogo,
        groupLogo: c.customGroupLogo || this.groupLogos[c.customGroup || c.groupTitle] || c.groupLogo || null,
        streamUrl: c.customUrl || c.url,
        channelNumber: c.customChno || c.tvgChno || null,
        type: c.type || 'stream',
        hasClearKey: !!c.hasClearKey,
        clearKeySnippet: c.clearKeySnippet || null,
        enabled: c.enabled,
        isCustom: !!c.isCustom,
        preDirectives: c.preDirectives,
        postDirectives: c.postDirectives,
        directives: c.directives,
      })),
    };
  }

  public exportBackup(): CustomizationData {
    return {
      sources: this.sources,
      channelOverrides: this.channelOverrides,
      groupRenames: this.groupRenames,
      groupLogos: this.groupLogos,
      groupVisibility: this.groupVisibility,
      customChannels: this.customChannels,
      settings: this.settings,
    };
  }

  public importBackup(backup: Partial<CustomizationData>): boolean {
    if (backup.sources) this.sources = backup.sources;
    if (backup.channelOverrides) this.channelOverrides = backup.channelOverrides;
    if (backup.groupRenames) this.groupRenames = backup.groupRenames;
    if (backup.groupLogos) this.groupLogos = backup.groupLogos;
    if (backup.groupVisibility) this.groupVisibility = backup.groupVisibility;
    if (backup.customChannels) this.customChannels = backup.customChannels;
    if (backup.settings) this.settings = { ...DEFAULT_SETTINGS, ...backup.settings };

    this.applyCustomizations();
    this.saveCustomizations();
    this.scheduleNextSync();
    return true;
  }
}

export const playlistService = new PlaylistService();
