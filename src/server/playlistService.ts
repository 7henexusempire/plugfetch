import fs from 'fs';
import path from 'path';
import {
  PlaylistSource,
  NexusEmpireItem,
  AniNexusItem,
  ChannelItem,
  PlaylistSettings,
} from '../types';
import {
  deduplicateChannelList,
  normalizeStreamUrl,
  DeduplicationResult,
} from './deduplicator';

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
  groupLogos: Record<string, string>;
  groupVisibility: Record<string, boolean>;
  customChannels: ChannelItem[];
  settings: PlaylistSettings;
  nexusempireItems?: NexusEmpireItem[];
  nexusempireCategories?: string[];
  nexusempireChannelAssignments?: Record<string, string[]>;
  aninexusOverrides?: Record<string, { enabled?: boolean; customName?: string }>;
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
  nexusempire: NexusEmpireItem[];
  aninexus: NexusEmpireItem[];
  dedupMode: 'smart' | 'strict' | 'url_only' | 'off';
  dedupStats?: {
    totalRaw: number;
    exactDuplicatesRemoved: number;
    distinctVariantsPreserved: number;
    finalCleanChannels: number;
  };
}

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const CACHE_FILE = path.join(DATA_DIR, 'playlist-multi-cache.json');
const CUSTOMIZATIONS_FILE = path.join(DATA_DIR, 'customizations.json');

const DEFAULT_SOURCES: PlaylistSource[] = [
  {
    id: 'plugx',
    slug: 'nexus-vip',
    name: 'Nexus VIP (Plugx)',
    url: 'https://plugxvipplaylist.lovable.app/api/playlist',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'server-lrl45',
    slug: 'hotstar-live',
    name: 'Hotstar & Regional Live',
    url: 'https://server.lrl45.workers.dev/channel/raw?=m3u',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
  {
    id: 'zeotv',
    slug: 'zeotv',
    name: 'SunNXT & StreamX Live',
    url: 'https://zeotvyash.streamxlivenow.workers.dev/',
    type: 'remote',
    enabled: true,
    lastSyncTime: null,
    status: 'idle',
    errorMessage: null,
    channelCount: 0,
  },
];

export const DEFAULT_NEXUSEMPIRE: NexusEmpireItem[] = [
  {
    id: 'zee',
    name: 'Zee Network Live',
    uri: 'streambox://open/8003bfd97ec3d87c8df2280494c3aa26',
    hash: '8003bfd97ec3d87c8df2280494c3aa26',
    slug: 'zee',
    m3uSlug: 'zee',
    category: 'Entertainment & Movies',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://img.youtube.com/vi/q1jQ5jT8rG8/hqdefault.jpg',
    description: 'Zee Cinema, Zee TV HD, Zee Bangla, Zee Telugu and regional network streams for AniTv & StreamBox.',
    enabled: true,
  },
  {
    id: 'jiiotv',
    name: 'JioTV Live Plus',
    uri: 'streambox://open/67e9bdf279c6a6a31d59927595346d28',
    hash: '67e9bdf279c6a6a31d59927595346d28',
    slug: 'jiiotv',
    m3uSlug: 'jiiotv',
    category: 'JioTV & Multiplex',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://jiotv.catchup.cdn.jio.com/dare_images/images/Jio_Cinema.png',
    description: 'Direct JioTV live multiplex streams with tokenized session parameters.',
    enabled: true,
  },
  {
    id: 'matchevents',
    name: 'Match Events Live',
    uri: 'streambox://open/dbd3d88df5fe1594d5d64afb3b6704be',
    hash: 'dbd3d88df5fe1594d5d64afb3b6704be',
    slug: 'matchevents',
    m3uSlug: 'matchevents',
    category: 'Live Sports',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://i.postimg.cc/bw0XwT8D/Jio-Hotstar-OG.png',
    description: 'Cricket, Football, Tennis, Formula 1, and pop-up tournament event feeds.',
    enabled: true,
  },
  {
    id: 'sony',
    name: 'Sony Network (SonyLIV)',
    uri: 'streambox://open/4397be6aa83e687053eeb1f55b4f9f48',
    hash: '4397be6aa83e687053eeb1f55b4f9f48',
    slug: 'sony',
    m3uSlug: 'sony',
    category: 'Sony Entertainment',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://img.youtube.com/vi/8s6z0Y2uPek/hqdefault.jpg',
    description: 'Sony Ten 1/2/3/4/5 HD, Sony BBC Earth, Sony SAB, Sony MAX HD streams.',
    enabled: true,
  },
  {
    id: 'starsports',
    name: 'Star Sports Hub',
    uri: 'streambox://open/e5431b6490c23efb29dda4133190826c',
    hash: 'e5431b6490c23efb29dda4133190826c',
    slug: 'starsports',
    m3uSlug: 'starsports',
    category: 'Star Sports',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://i.ibb.co/YBMBDWtd/SS2HD-HINDI.jpg',
    description: 'Star Sports 1, Star Sports Select HD, Star Sports Hindi, Tamil, Telugu feeds.',
    enabled: true,
  },
  {
    id: 'willow',
    name: 'Willow TV Cricket',
    uri: 'streambox://open/255cfab9f98da87dab11a6e0a337279e',
    hash: '255cfab9f98da87dab11a6e0a337279e',
    slug: 'willow',
    m3uSlug: 'willow',
    category: 'Cricket Exclusive',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ32BfOcij5y0NkYztgiMZ3AFXmBjXlAIYiuKm2U49BBLqpI4ZWuR92-LA&s=10',
    description: '24/7 dedicated cricket broadcast channel for AniTv & Streambox.',
    enabled: true,
  },
  {
    id: 'alltv',
    name: 'All TV Channels (Master)',
    uri: 'streambox://open/188140cf39bd8728cfa2f19290218e2b',
    hash: '188140cf39bd8728cfa2f19290218e2b',
    slug: 'alltv',
    m3uSlug: 'alltv',
    category: 'All TV Bouquet',
    channelCount: 0,
    status: 'ready',
    lastUpdated: null,
    logo: '/nexus-logo.png',
    description: 'Comprehensive NexusEmpire catalog combining all categories and channels into one master playlist.',
    enabled: true,
  },
];

export const DEFAULT_ANINEXUS = DEFAULT_NEXUSEMPIRE;

export const DEFAULT_NEXUSEMPIRE_CATEGORIES = [
  'Entertainment & Movies',
  'Live Sports',
  'Star Sports',
  'Cricket Exclusive',
  'Sony Entertainment',
  'JioTV & Multiplex',
  'Jio Sports',
  'News & Info',
];

const DEFAULT_SETTINGS: PlaylistSettings = {
  syncIntervalMinutes: 30,
  autoSync: true,
  userAgent: 'TiviMate/5.1.0 (Linux; Android 12) curl/8.0.0',
  customTvgUrl: '',
  publicBaseUrl: '',
  zeotvStripSuffix: true,
  zeotvRemoveGroupLogo: true,
  appTitle: 'Nexus',
  dedupMode: 'smart',
};

class PlaylistService {
  private sources: PlaylistSource[] = [...DEFAULT_SOURCES];
  private nexusempireItems: NexusEmpireItem[] = [...DEFAULT_NEXUSEMPIRE];
  private nexusempireCategories: string[] = [...DEFAULT_NEXUSEMPIRE_CATEGORIES];
  private nexusempireChannelAssignments: Record<string, string[]> = {};
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
    this.ensureDirs();
    this.loadCustomizations();
    this.loadCache();
  }

  private ensureDirs() {
    for (const d of [DATA_DIR, UPLOADS_DIR]) {
      if (!fs.existsSync(d)) {
        try {
          fs.mkdirSync(d, { recursive: true });
        } catch (err) {
          console.error(`Failed to create dir ${d}:`, err);
        }
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
            return saved ? { ...def, ...saved, slug: saved.slug || def.slug } : def;
          });
          for (const s of data.sources) {
            if (!this.sources.some((x) => x.id === s.id)) {
              this.sources.push({ ...s, slug: s.slug || s.id });
            }
          }
        }
        if (Array.isArray(data.nexusempireItems) && data.nexusempireItems.length > 0) {
          const loadedMap = new Map(data.nexusempireItems.map((i) => [i.id, i]));
          this.nexusempireItems = DEFAULT_NEXUSEMPIRE.map((def) => {
            const saved = loadedMap.get(def.id);
            return saved ? { ...def, ...saved } : def;
          });
          for (const item of data.nexusempireItems) {
            if (!this.nexusempireItems.some((x) => x.id === item.id)) {
              this.nexusempireItems.push(item);
            }
          }
        }
        if (Array.isArray(data.nexusempireCategories) && data.nexusempireCategories.length > 0) {
          this.nexusempireCategories = Array.from(new Set([...DEFAULT_NEXUSEMPIRE_CATEGORIES, ...data.nexusempireCategories]));
        }
        if (data.nexusempireChannelAssignments) {
          this.nexusempireChannelAssignments = data.nexusempireChannelAssignments;
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
    this.ensureDirs();
    try {
      const data: CustomizationData = {
        sources: this.sources,
        channelOverrides: this.channelOverrides,
        groupRenames: this.groupRenames,
        groupLogos: this.groupLogos,
        groupVisibility: this.groupVisibility,
        customChannels: this.customChannels,
        settings: this.settings,
        nexusempireItems: this.nexusempireItems,
        nexusempireCategories: this.nexusempireCategories,
        nexusempireChannelAssignments: this.nexusempireChannelAssignments,
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
          this.updateAniNexusCounts();
        }
      }
    } catch (err) {
      console.error('Failed to load multi-source cache:', err);
    }
  }

  private saveCache() {
    this.ensureDirs();
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
      console.log(`[Cartel 187 Sync Worker] Auto-syncing all sources & AniNexus at ${new Date().toISOString()}`);
      await this.fetchAllSources();
      this.nextSyncTime = new Date(Date.now() + intervalMs);
    }, intervalMs);
  }

  public async fetchSingleSource(sourceId: string): Promise<{ success: boolean; message: string; count: number }> {
    const src = this.sources.find((s) => s.id === sourceId);
    if (!src) {
      return { success: false, message: `Source "${sourceId}" not found`, count: 0 };
    }

    // If source is disabled, keep existing channels or mark idle
    if (!src.enabled) {
      return { success: true, message: `Source "${src.name}" is disabled`, count: src.channelCount };
    }

    src.status = 'fetching';
    src.errorMessage = null;

    try {
      let m3uText = '';

      if (src.type === 'uploaded' && src.filePath && fs.existsSync(src.filePath)) {
        console.log(`[Cartel 187] Reading uploaded playlist from ${src.filePath}...`);
        m3uText = fs.readFileSync(src.filePath, 'utf-8');
      } else {
        console.log(`[Cartel 187] Fetching "${src.name}" from ${src.url}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

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

        m3uText = await response.text();
      }

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
      this.updateAniNexusCounts();
      this.saveCache();
      this.saveCustomizations();

      console.log(`[Cartel 187] Source "${src.name}" (${src.slug}) synced: ${channels.length} channels`);
      return { success: true, message: `Synced ${channels.length} channels from ${src.name}`, count: channels.length };
    } catch (err: any) {
      console.error(`[Cartel 187] Error fetching source "${src.name}":`, err);
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
    console.log(`[Cartel 187] Starting sync for ${enabledSources.length} active sources...`);

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
    this.updateAniNexusCounts();

    const total = this.getAllChannels().length;
    if (errors.length === 0) {
      return { success: true, message: `All ${enabledSources.length} playlists synced successfully (${total} channels total)`, totalChannels: total };
    } else {
      return { success: errors.length < enabledSources.length, message: `Synced with alerts: ${errors.join('; ')}`, totalChannels: total };
    }
  }

  /**
   * Lossless M3U Parser
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
        if (currentExtInf) {
          currentPre = [];
        }
        currentExtInf = this.parseExtInfLine(line, sourceId);
        currentPost = [];
      } else if (line.startsWith('#')) {
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
      } else if (/^(https?|rtmp|udp|rtsp|streambox):\/\//i.test(line)) {
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

    // Strip STREAMX suffix and group logos for zeotv if enabled
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

        if (this.groupLogos[finalGroup] !== undefined) {
          channel.customGroupLogo = this.groupLogos[finalGroup];
        }

        if (this.groupVisibility[finalGroup] !== undefined && override?.enabled === undefined) {
          channel.enabled = this.groupVisibility[finalGroup];
        }
      }
    }
  }

  /**
   * Updates channel counts for each NexusEmpire stream category
   */
  private updateNexusEmpireCounts() {
    const all = this.getAllChannels().filter((c) => c.enabled);
    for (const item of this.nexusempireItems) {
      item.lastUpdated = new Date().toISOString();
      if (item.id === 'alltv') {
        const dedupResult = deduplicateChannelList(all, { mode: this.settings.dedupMode || 'smart', disambiguateNames: false });
        item.channelCount = dedupResult.channels.length;
      } else {
        const { channels } = this.getChannelsForNexusEmpireCategory(item.id, true);
        item.channelCount = channels.length;
      }
    }
  }

  private updateAniNexusCounts() {
    this.updateNexusEmpireCounts();
  }

  /**
   * Resolves channels for a NexusEmpire category or custom stream with intelligent deduplication:
   * - Eliminates 100% duplicate stream URLs across sources.
   * - Preserves distinct streams sharing the same channel name (e.g. Sony SAB HD Stream 1 vs Stream 2).
   */
  public getChannelsForNexusEmpireCategory(categoryIdOrSlug: string, applyDedup = true): DeduplicationResult {
    const all = this.getAllChannels().filter((c) => c.enabled);
    const item = this.nexusempireItems.find(
      (i) => i.id === categoryIdOrSlug || i.slug === categoryIdOrSlug || i.m3uSlug === categoryIdOrSlug
    );

    let rawMatched: ChannelItem[] = [];

    // 1. If manual channel assignments exist for this item, use them first
    const assignedIds = this.nexusempireChannelAssignments[categoryIdOrSlug] || (item ? this.nexusempireChannelAssignments[item.id] : undefined);
    if (assignedIds && assignedIds.length > 0) {
      const assignedSet = new Set(assignedIds);
      rawMatched = all.filter((c) => assignedSet.has(c.id));
    } else {
      // 2. Intelligent keyword and category matching
      const targetKey = (item?.id || categoryIdOrSlug).toLowerCase();
      const targetCategory = (item?.category || '').toLowerCase();

      switch (targetKey) {
        case 'zee':
          rawMatched = all.filter((c) => {
            const g = (c.customGroup || c.groupTitle).toLowerCase();
            const n = (c.customName || c.name).toLowerCase();
            return g.includes('zee') || n.startsWith('zee ') || n.includes('zeetv') || n.includes('zee cinema');
          });
          break;
        case 'jiiotv':
          rawMatched = all.filter((c) => {
            const g = (c.customGroup || c.groupTitle).toLowerCase();
            const n = (c.customName || c.name).toLowerCase();
            return c.sourceId === 'plugx' || g.includes('jio') || n.includes('jio');
          });
          break;
        case 'matchevents':
          rawMatched = all.filter((c) => {
            const g = (c.customGroup || c.groupTitle).toLowerCase();
            const n = (c.customName || c.name).toLowerCase();
            return (
              g.includes('event') ||
              g.includes('ipl') ||
              g.includes('match') ||
              g.includes('sports') ||
              n.includes('live event') ||
              n.includes('match') ||
              n.includes('ipl')
            );
          });
          break;
        case 'sony':
          rawMatched = all.filter((c) => {
            const g = (c.customGroup || c.groupTitle).toLowerCase();
            const n = (c.customName || c.name).toLowerCase();
            return g.includes('sony') || n.includes('sony') || n.includes('ten 1') || n.includes('ten 2') || n.includes('ten 3');
          });
          break;
        case 'starsports':
          rawMatched = all.filter((c) => {
            const g = (c.customGroup || c.groupTitle).toLowerCase();
            const n = (c.customName || c.name).toLowerCase();
            return g.includes('star sports') || n.includes('star sports') || n.includes('ss1') || n.includes('ss2');
          });
          break;
        case 'willow':
          rawMatched = all.filter((c) => {
            const g = (c.customGroup || c.groupTitle).toLowerCase();
            const n = (c.customName || c.name).toLowerCase();
            return g.includes('willow') || n.includes('willow') || n.includes('cricket');
          });
          break;
        case 'jiosports':
          rawMatched = all.filter((c) => {
            const g = (c.customGroup || c.groupTitle).toLowerCase();
            const n = (c.customName || c.name).toLowerCase();
            return (g.includes('jio') || n.includes('jio')) && (g.includes('sport') || n.includes('sport') || g.includes('cricket'));
          });
          break;
        case 'entertainment':
          rawMatched = all.filter((c) => {
            const g = (c.customGroup || c.groupTitle).toLowerCase();
            return g.includes('entertainment') || g.includes('general') || g.includes('movies');
          });
          break;
        case 'alltv':
        default:
          if (item && item.category && item.category !== 'All TV Bouquet') {
            rawMatched = all.filter((c) => {
              const g = (c.customGroup || c.groupTitle).toLowerCase();
              return g.includes(targetCategory);
            });
          } else {
            rawMatched = all;
          }
          break;
      }
    }

    if (!applyDedup) {
      return {
        channels: rawMatched,
        stats: {
          totalRaw: rawMatched.length,
          exactDuplicatesRemoved: 0,
          distinctVariantsPreserved: 0,
          finalCleanChannels: rawMatched.length,
        },
      };
    }

    return deduplicateChannelList(rawMatched, {
      mode: this.settings.dedupMode || 'smart',
      disambiguateNames: true,
    });
  }

  public getChannelsForAniNexusCategory(categoryId: string): ChannelItem[] {
    return this.getChannelsForNexusEmpireCategory(categoryId, true).channels;
  }

  public getNexusEmpireItems(): NexusEmpireItem[] {
    this.updateNexusEmpireCounts();
    return this.nexusempireItems;
  }

  public getAniNexusItems(): NexusEmpireItem[] {
    return this.getNexusEmpireItems();
  }

  public getNexusEmpireCategories(): { name: string; count: number }[] {
    const catMap = new Map<string, number>();
    for (const cat of this.nexusempireCategories) {
      catMap.set(cat, 0);
    }
    for (const item of this.nexusempireItems) {
      const cat = item.category || 'General';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    }
    return Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));
  }

  public createNexusEmpireCategory(name: string): boolean {
    const clean = name ? name.trim() : '';
    if (!clean || this.nexusempireCategories.includes(clean)) return false;
    this.nexusempireCategories.push(clean);
    this.saveCustomizations();
    return true;
  }

  public renameNexusEmpireCategory(oldName: string, newName: string): boolean {
    const clean = newName ? newName.trim() : '';
    if (!clean || !oldName) return false;
    const idx = this.nexusempireCategories.indexOf(oldName);
    if (idx !== -1) {
      this.nexusempireCategories[idx] = clean;
    } else {
      this.nexusempireCategories.push(clean);
    }
    for (const item of this.nexusempireItems) {
      if (item.category === oldName) {
        item.category = clean;
      }
    }
    this.saveCustomizations();
    return true;
  }

  public addNexusEmpireItem(item: {
    name: string;
    uri: string;
    slug?: string;
    category: string;
    logo?: string;
    description?: string;
  }): NexusEmpireItem {
    const cleanSlug = (item.slug || item.name).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const id = `nexus_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newItem: NexusEmpireItem = {
      id,
      name: item.name,
      uri: item.uri,
      hash: item.uri.startsWith('streambox://open/') ? item.uri.replace('streambox://open/', '') : id,
      slug: cleanSlug,
      m3uSlug: cleanSlug,
      category: item.category || 'Entertainment & Movies',
      channelCount: 0,
      status: 'ready',
      lastUpdated: new Date().toISOString(),
      logo: item.logo || '/nexus-logo.png',
      description: item.description || `Custom stream channel in NexusEmpire.`,
      enabled: true,
      isCustom: true,
    };

    if (!this.nexusempireCategories.includes(newItem.category)) {
      this.nexusempireCategories.push(newItem.category);
    }

    this.nexusempireItems.push(newItem);
    this.saveCustomizations();
    this.updateNexusEmpireCounts();
    return newItem;
  }

  public updateNexusEmpireItem(id: string, updates: Partial<NexusEmpireItem>): NexusEmpireItem | null {
    const item = this.nexusempireItems.find((i) => i.id === id);
    if (!item) return null;

    if (updates.slug) {
      updates.slug = updates.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      updates.m3uSlug = updates.slug;
    }

    if (updates.category && !this.nexusempireCategories.includes(updates.category)) {
      this.nexusempireCategories.push(updates.category);
    }

    Object.assign(item, updates);
    this.saveCustomizations();
    this.updateNexusEmpireCounts();
    return item;
  }

  public deleteNexusEmpireItem(id: string): boolean {
    const idx = this.nexusempireItems.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.nexusempireItems.splice(idx, 1);
      delete this.nexusempireChannelAssignments[id];
      this.saveCustomizations();
      return true;
    }
    return false;
  }

  public moveNexusEmpireItemsToCategory(itemIds: string[], targetCategory: string): number {
    const cleanCat = targetCategory ? targetCategory.trim() : 'General';
    if (!this.nexusempireCategories.includes(cleanCat)) {
      this.nexusempireCategories.push(cleanCat);
    }
    let count = 0;
    for (const id of itemIds) {
      const item = this.nexusempireItems.find((i) => i.id === id);
      if (item) {
        item.category = cleanCat;
        count++;
      }
    }
    this.saveCustomizations();
    return count;
  }

  public assignChannelsToEmpireItem(itemId: string, channelIds: string[]): boolean {
    this.nexusempireChannelAssignments[itemId] = channelIds;
    this.saveCustomizations();
    this.updateNexusEmpireCounts();
    return true;
  }

  public getSources(): PlaylistSource[] {
    return this.sources;
  }

  public getSourceBySlugOrId(slugOrId: string): PlaylistSource | undefined {
    return this.sources.find((s) => s.slug === slugOrId || s.id === slugOrId);
  }

  public addSource(source: { name: string; url: string; id?: string; slug?: string }) {
    const baseSlug = (source.slug || source.name).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const id = source.id || `source_${Date.now()}`;
    const newSource: PlaylistSource = {
      id: id.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      slug: baseSlug,
      name: source.name,
      url: source.url,
      type: 'remote',
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

  /**
   * Uploads and hosts a custom .m3u / .m3u8 file
   */
  public uploadM3UFile(filename: string, content: string, displayName: string, customSlug?: string): PlaylistSource {
    this.ensureDirs();
    const cleanSlug = (customSlug || path.parse(filename).name || `upload_${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    const id = `upload_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const savedPath = path.join(UPLOADS_DIR, `${cleanSlug}.m3u`);

    fs.writeFileSync(savedPath, content, 'utf-8');

    const newSource: PlaylistSource = {
      id,
      slug: cleanSlug,
      name: displayName || path.parse(filename).name,
      url: `file://${savedPath}`,
      type: 'uploaded',
      filePath: savedPath,
      enabled: true,
      lastSyncTime: null,
      status: 'idle',
      errorMessage: null,
      channelCount: 0,
    };

    this.sources.push(newSource);
    this.saveCustomizations();
    this.fetchSingleSource(id).catch((e) => console.error(e));
    return newSource;
  }

  public updateSource(id: string, updates: Partial<PlaylistSource>) {
    const src = this.sources.find((s) => s.id === id);
    if (!src) return null;

    const oldUrl = src.url;
    const oldEnabled = src.enabled;

    if (updates.slug) {
      updates.slug = updates.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    }

    Object.assign(src, updates);
    this.saveCustomizations();

    if (updates.url && updates.url !== oldUrl && src.type !== 'uploaded') {
      this.fetchSingleSource(id).catch((e) => console.error(e));
    }

    if (updates.enabled !== undefined && updates.enabled !== oldEnabled) {
      // Toggle all channels under this source
      const channels = this.channelsBySource[id] || [];
      for (const ch of channels) {
        ch.enabled = updates.enabled;
        if (!this.channelOverrides[ch.id]) this.channelOverrides[ch.id] = {};
        this.channelOverrides[ch.id].enabled = updates.enabled;
      }
      this.saveCustomizations();
    }

    return src;
  }

  public deleteSource(id: string) {
    const idx = this.sources.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const src = this.sources[idx];
      if (src.type === 'uploaded' && src.filePath && fs.existsSync(src.filePath)) {
        try {
          fs.unlinkSync(src.filePath);
        } catch (e) {}
      }
      this.sources.splice(idx, 1);
      delete this.channelsBySource[id];
      delete this.sourceHeaders[id];
      this.saveCache();
      this.saveCustomizations();
      return true;
    }
    return false;
  }

  public getAllChannels(sourceIdOrSlug?: string): ChannelItem[] {
    const result: ChannelItem[] = [];

    if (sourceIdOrSlug && sourceIdOrSlug !== 'all') {
      const src = this.getSourceBySlugOrId(sourceIdOrSlug);
      const targetId = src ? src.id : sourceIdOrSlug;
      const srcChannels = this.channelsBySource[targetId] || [];
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

  public getGroups(sourceIdOrSlug?: string): { name: string; count: number; enabledCount: number; isVisible: boolean; logo?: string }[] {
    const groupMap: Record<string, { total: number; enabled: number; logo?: string }> = {};
    const all = this.getAllChannels(sourceIdOrSlug);

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

  public bulkToggleChannels(channelIds: string[], enabled: boolean): number {
    let count = 0;
    for (const id of channelIds) {
      const channel = this.getAllChannels().find((c) => c.id === id);
      if (channel) {
        channel.enabled = enabled;
        if (!this.channelOverrides[id]) this.channelOverrides[id] = {};
        this.channelOverrides[id].enabled = enabled;
        count++;
      }
    }
    this.saveCustomizations();
    return count;
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

    const dedupReport = deduplicateChannelList(active, {
      mode: this.settings.dedupMode || 'smart',
      disambiguateNames: false,
    });

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
      nexusempire: this.getNexusEmpireItems(),
      aninexus: this.getNexusEmpireItems(),
      dedupMode: this.settings.dedupMode || 'smart',
      dedupStats: dedupReport.stats,
    };
  }

  /**
   * Generates M3U playlist file for a specific source OR all sources combined
   * with intelligent deduplication to prevent repeated streams.
   */
  public generateM3U(sourceIdOrSlug?: string, filterGroup?: string): string {
    const isAll = !sourceIdOrSlug || sourceIdOrSlug === 'all';
    const src = !isAll ? this.getSourceBySlugOrId(sourceIdOrSlug) : undefined;
    const targetId = src ? src.id : sourceIdOrSlug;

    const rawChannels = this.getAllChannels(isAll ? undefined : targetId).filter((c) => c.enabled);
    const filtered = filterGroup
      ? rawChannels.filter((c) => (c.customGroup || c.groupTitle).toLowerCase() === filterGroup.toLowerCase())
      : rawChannels;

    // Apply intelligent stream deduplication (removes true duplicate streams while preserving distinct streams with the same name)
    const dedupResult = deduplicateChannelList(filtered, {
      mode: this.settings.dedupMode || 'smart',
      disambiguateNames: true,
    });
    const channels = dedupResult.channels;

    let header = '#EXTM3U';
    if (!isAll && targetId && this.sourceHeaders[targetId]?.length > 0) {
      const firstLine = this.sourceHeaders[targetId][0];
      if (firstLine.startsWith('#EXTM3U')) {
        header = firstLine;
      }
    } else {
      header = '#EXTM3U url-tvg="https://avkb.short.gy/jioepg.xml.gz" x-tvg-url="https://avkb.short.gy/jioepg.xml.gz,https://epgshare01.online/epgshare01/epg_ripper_IN4.xml.gz,https://mitthu786.github.io/tvepg/tataplay/epg.xml.gz,https://avkb.short.gy/tsepg.xml.gz" refresh="3600"';
    }

    if (this.settings.customTvgUrl) {
      header = `#EXTM3U url-tvg="${this.settings.customTvgUrl}" tvg-url="${this.settings.customTvgUrl}" refresh="3600"`;
    }

    const lines: string[] = [header];
    const sourceLabel = isAll ? 'ALL SOURCES (NEXUS UNIFIED STREAM ENGINE)' : (src?.name || targetId);
    lines.push(`# Nexus Multi-Playlist Relay Engine | Generated: ${new Date().toISOString()}`);
    lines.push(`# Stream Source: ${sourceLabel}`);
    lines.push(`# Deduplication Mode: ${this.settings.dedupMode || 'smart'} (Removed: ${dedupResult.stats.exactDuplicatesRemoved} duplicates)`);
    lines.push(`# Total Channels: ${channels.length}`);

    for (const ch of channels) {
      const displayName = ch.customName || ch.name;
      const groupTitle = ch.customGroup || ch.groupTitle || 'General';
      const logo = ch.customLogo || ch.tvgLogo || '';
      const tvgId = ch.tvgId || ch.id;
      const tvgName = ch.customName || ch.tvgName || displayName;
      const streamUrl = ch.customUrl || ch.url;
      const chno = ch.customChno || ch.tvgChno;
      
      const groupLogo = ch.customGroupLogo !== undefined
        ? ch.customGroupLogo
        : (this.groupLogos[groupTitle] || ch.groupLogo);

      // 1. Output preDirectives
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

      // 3. Output postDirectives
      if (ch.postDirectives && ch.postDirectives.length > 0) {
        for (const dir of ch.postDirectives) {
          lines.push(dir);
        }
      } else if (ch.directives && ch.directives.length > 0 && ch.preDirectives.length === 0) {
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
   * Generates M3U playlist for NexusEmpire sections with intelligent cross-category deduplication
   * so streams NEVER repeat in all.m3u or category playlists.
   */
  public generateNexusEmpireM3U(categoryIdOrSlug?: string): string {
    const isAll = !categoryIdOrSlug || categoryIdOrSlug === 'all' || categoryIdOrSlug === 'alltv';
    const lines: string[] = [
      '#EXTM3U url-tvg="https://avkb.short.gy/jioepg.xml.gz" x-tvg-url="https://epgshare01.online/epgshare01/epg_ripper_IN4.xml.gz" refresh="1800"',
      `# NexusEmpire Stream Engine by Nexus | For AniTv & StreamBox`,
      `# Generated: ${new Date().toISOString()}`,
      `# Deduplication: Active (Smart disambiguation for multi-stream variants)`,
    ];

    const targetCategories = isAll
      ? this.nexusempireItems.filter((i) => i.id !== 'alltv' && i.enabled)
      : this.nexusempireItems.filter((i) => (i.id === categoryIdOrSlug || i.slug === categoryIdOrSlug || i.m3uSlug === categoryIdOrSlug) && i.enabled);

    // Track streams emitted in all.m3u to avoid cross-category repetition
    const seenGlobalStreams = new Set<string>();

    for (const item of targetCategories) {
      lines.push('');
      lines.push(`# ============================================================`);
      lines.push(`# Category: ${item.name} (${item.category})`);
      lines.push(`# Deep-link: ${item.uri}`);
      lines.push(`# ============================================================`);

      // 1. Primary AniTv StreamBox deep-link channel
      lines.push(
        `#EXTINF:-1 tvg-id="nexusempire_${item.id}" tvg-name="${item.name}" tvg-logo="${item.logo}" group-title="NexusEmpire | ${item.name}" group-logo="${item.logo}",★ ${item.name} (AniTv Direct)`
      );
      lines.push(item.uri);

      // 2. Add matched live channels with deduplication
      const { channels } = this.getChannelsForNexusEmpireCategory(item.id, true);
      for (const ch of channels) {
        if (!ch.enabled) continue;

        const rawUrl = ch.customUrl || ch.url;
        const normUrl = normalizeStreamUrl(rawUrl);
        const streamSig = `${normUrl}::${ch.clearKeySnippet || ''}`;

        // In combined all.m3u, skip stream if already present in an earlier category
        if (isAll && seenGlobalStreams.has(streamSig)) {
          continue;
        }
        seenGlobalStreams.add(streamSig);

        const displayName = ch.customName || ch.name;
        const groupTitle = `NexusEmpire | ${item.name}`;
        const logo = ch.customLogo || ch.tvgLogo || item.logo;
        const tvgId = ch.tvgId || ch.id;

        if (ch.preDirectives?.length > 0) {
          for (const d of ch.preDirectives) lines.push(d);
        }

        let parts = [
          `#EXTINF:-1`,
          `tvg-id="${tvgId}"`,
          `tvg-name="${displayName}"`,
          `tvg-logo="${logo}"`,
          `group-title="${groupTitle}"`,
          `group-logo="${item.logo}"`,
        ];
        lines.push(`${parts.join(' ')},${displayName}`);

        if (ch.postDirectives?.length > 0) {
          for (const d of ch.postDirectives) lines.push(d);
        } else if (ch.directives?.length > 0) {
          for (const d of ch.directives) lines.push(d);
        }

        lines.push(rawUrl);
      }
    }

    return lines.join('\n');
  }

  public generateAniNexusM3U(categoryIdOrSlug?: string): string {
    return this.generateNexusEmpireM3U(categoryIdOrSlug);
  }

  /**
   * Generates structured JSON representation for NexusEmpire
   */
  public generateNexusEmpireJSON(categoryIdOrSlug?: string) {
    const isAll = !categoryIdOrSlug || categoryIdOrSlug === 'all' || categoryIdOrSlug === 'alltv';
    const targetCategories = isAll
      ? this.nexusempireItems
      : this.nexusempireItems.filter((i) => i.id === categoryIdOrSlug || i.slug === categoryIdOrSlug || i.m3uSlug === categoryIdOrSlug);

    return {
      service: 'NexusEmpire Engine by Nexus',
      client: 'AniTv & StreamBox Hub',
      generatedAt: new Date().toISOString(),
      syncIntervalMinutes: 30,
      categories: targetCategories.map((item) => {
        const { channels, stats } = this.getChannelsForNexusEmpireCategory(item.id, true);
        return {
          id: item.id,
          name: item.name,
          slug: item.slug || item.m3uSlug,
          category: item.category,
          deepLink: item.uri,
          hash: item.hash,
          logo: item.logo,
          m3uUrl: `/api/nexusempire/${item.slug || item.m3uSlug}.m3u`,
          jsonUrl: `/api/nexusempire/${item.slug || item.m3uSlug}.json`,
          channelCount: channels.length,
          dedupStats: stats,
          channels: channels.map((c) => ({
            id: c.id,
            name: c.customName || c.name,
            logo: c.customLogo || c.tvgLogo,
            streamUrl: c.customUrl || c.url,
            hasClearKey: !!c.hasClearKey,
            streamVariant: c.streamVariant || 1,
          })),
        };
      }),
    };
  }

  public generateAniNexusJSON(categoryIdOrSlug?: string) {
    return this.generateNexusEmpireJSON(categoryIdOrSlug);
  }

  /**
   * Generates structured JSON representation for a specific source OR all sources combined
   */
  public generateJSON(sourceIdOrSlug?: string, filterGroup?: string) {
    const isAll = !sourceIdOrSlug || sourceIdOrSlug === 'all';
    const src = !isAll ? this.getSourceBySlugOrId(sourceIdOrSlug) : undefined;
    const targetId = src ? src.id : sourceIdOrSlug;

    const all = this.getAllChannels(isAll ? undefined : targetId);
    const channels = filterGroup
      ? all.filter((c) => (c.customGroup || c.groupTitle).toLowerCase() === filterGroup.toLowerCase())
      : all;

    const sourceLabel = isAll ? 'All Combined Playlists' : (src?.name || targetId);

    return {
      service: 'Cartel 187 IPTV Relay Studio',
      playlistSource: sourceLabel,
      sourceId: isAll ? 'all' : targetId,
      slug: src ? src.slug : 'all',
      generatedAt: new Date().toISOString(),
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
      totalChannels: channels.length,
      activeChannels: channels.filter((c) => c.enabled).length,
      sources: isAll ? this.sources : this.sources.filter((s) => s.id === targetId || s.slug === sourceIdOrSlug),
      groups: this.getGroups(isAll ? undefined : targetId),
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
