import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'stremio-nuvio-bridge.json');

export interface StremioAddon {
  id: string;
  name: string;
  version: string;
  description: string;
  manifestUrl: string;
  logo: string;
  types: string[]; // movie, series, tv, channel, anime, sports
  catalogs?: any[];
  resources?: string[];
  contactEmail?: string;
  enabled: boolean;
  isNuvioCompatible?: boolean;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage?: string | null;
  lastSync?: string | null;
  httpCode?: number;
  latencyMs?: number;
  payloadSize?: string;
  rawPayload?: any;
}

export interface CNCVerseStream {
  id: string;
  name: string;
  url: string;
  category: string;
  logo: string;
  description?: string;
  source: 'cncverse_bridge' | 'stremio_addon' | 'nuvio_module' | 'custom';
  bridgeEndpoint?: string;
  isLive: boolean;
  enabled: boolean;
  quality?: string;
  updatedAt?: string;
}

// Built-in Stremio & Nuvio Official / Community Addons
const BUILTIN_STREMIO_ADDONS: Omit<StremioAddon, 'status'>[] = [
  {
    id: 'cinemeta',
    name: 'Cinemeta (Official)',
    version: '3.0.12',
    description: 'Official Stremio & Nuvio catalog metadata for Movies, TV Series and Anime',
    manifestUrl: 'https://v3-cinemeta.strem.io/manifest.json',
    logo: 'https://v3-cinemeta.strem.io/logo.png',
    types: ['movie', 'series', 'anime'],
    resources: ['catalog', 'meta'],
    enabled: true,
    isNuvioCompatible: true,
  },
  {
    id: 'cyberflix',
    name: 'CyberFlix Catalog',
    version: '1.4.1',
    description: 'Extensive catalogs from Netflix, Disney+, AppleTV+, Prime Video and HBO Max',
    manifestUrl: 'https://cyberflix.elfhosted.com/manifest.json',
    logo: 'https://cyberflix.elfhosted.com/logo.png',
    types: ['movie', 'series'],
    resources: ['catalog', 'meta'],
    enabled: true,
    isNuvioCompatible: true,
  },
  {
    id: 'mediafusion',
    name: 'MediaFusion Live & Sports',
    version: '4.2.0',
    description: 'Live TV events, Formula 1, MotoGP, Football, Cricket and live channels',
    manifestUrl: 'https://mediafusion.elfhosted.com/manifest.json',
    logo: 'https://mediafusion.elfhosted.com/static/images/mediafusion_logo.png',
    types: ['tv', 'sports', 'channel'],
    resources: ['stream', 'catalog', 'meta'],
    enabled: true,
    isNuvioCompatible: true,
  },
  {
    id: 'torrentio',
    name: 'Torrentio Scraper',
    version: '1.0.13',
    description: 'High-speed stream link aggregator for Stremio & Nuvio',
    manifestUrl: 'https://torrentio.strem.fun/manifest.json',
    logo: 'https://torrentio.strem.fun/logo.png',
    types: ['movie', 'series'],
    resources: ['stream'],
    enabled: true,
    isNuvioCompatible: true,
  },
  {
    id: 'kitsu',
    name: 'Anime Kitsu Catalog',
    version: '2.0.4',
    description: 'Rich Japanese anime catalogs, seasons, episodes and streams',
    manifestUrl: 'https://anime-kitsu.strem.fun/manifest.json',
    logo: 'https://anime-kitsu.strem.fun/logo.png',
    types: ['anime', 'series', 'movie'],
    resources: ['catalog', 'meta'],
    enabled: true,
    isNuvioCompatible: true,
  },
  {
    id: 'opensubtitles',
    name: 'OpenSubtitles v3',
    version: '1.0.0',
    description: 'Official subtitle provider for Stremio & Nuvio player streams',
    manifestUrl: 'https://opensubtitles-v3.strem.io/manifest.json',
    logo: 'https://opensubtitles-v3.strem.io/logo.png',
    types: ['movie', 'series'],
    resources: ['subtitles'],
    enabled: true,
    isNuvioCompatible: true,
  },
  {
    id: 'watchhub',
    name: 'WatchHub Streaming Links',
    version: '1.0.2',
    description: 'Official availability and direct streaming links directory',
    manifestUrl: 'https://watchhub.strem.io/manifest.json',
    logo: 'https://watchhub.strem.io/logo.png',
    types: ['movie', 'series'],
    resources: ['stream'],
    enabled: true,
    isNuvioCompatible: true,
  },
];

// Rich CNCVerse-Bridge live streams from https://cncverse.dpdns.org/ and NivinCNC/CNCVerse-Bridge
const BUILTIN_CNCVERSE_STREAMS: CNCVerseStream[] = [
  {
    id: 'cnc_bridge_cricfy1',
    name: 'CNCVerse - Cricfy Sports Server 1 Live',
    url: 'https://cfyhljddgbkkufh82.top',
    category: 'CNCVerse Live Sports',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ08h1gOe7MPxwehZBrbYKAUtjv22B6rAJ1kMkN-cea64Ka49KUyGU2lpTz&s=10',
    description: 'Direct Cricfy live cricket & sports relay bridged via CNCVerse',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/cricfy/live1',
    isLive: true,
    enabled: true,
    quality: '1080p HD',
  },
  {
    id: 'cnc_bridge_cricfy2',
    name: 'CNCVerse - Cricfy JioStar Live 2',
    url: 'https://cfymarkscanjiostar80.top',
    category: 'CNCVerse Live Sports',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7zqXTonSH_Xo--YxMlOacinf7mhLwuwSFFF1KJa8lGw&s=10',
    description: 'JioStar, Hotstar & Cricket live sports feed via CNCVerse bridge',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/cricfy/jiostar',
    isLive: true,
    enabled: true,
    quality: '1080p 60fps',
  },
  {
    id: 'cnc_bridge_tsports',
    name: 'CNCVerse - T-Sports Cricket & Asia Cup Live',
    url: 'https://fifabangladesh2-xyz-ekkj.spidy.online/AYN/tsports.m3u',
    category: 'CNCVerse Live Sports',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI9T5vcm8wU-dLuaK5vBfoHpz8KL9Ru0aU1eoVaKNcqauxGtRTfvI1rGTA&s=10',
    description: 'T-Sports HD live sports broadcast stream',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/sports/tsports',
    isLive: true,
    enabled: true,
    quality: '1080p HD',
  },
  {
    id: 'cnc_bridge_epl_hub',
    name: 'CNCVerse - Premier League & International Football Live',
    url: 'https://bdix.short.gy/EPLxBDIX/playlist.php',
    category: 'CNCVerse Football Hub',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS0OT2NFe9Jb4ofg_DrXx42EKLgyGnSGwoLg&usqp=CAU',
    description: 'English Premier League, Champions League, La Liga live feed',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/sports/epl',
    isLive: true,
    enabled: true,
    quality: '1080p HD',
  },
  {
    id: 'cnc_bridge_starsports_hd',
    name: 'Star Sports 1 Hindi HD - CNC Bridge',
    url: 'https://cfymarkscanjiostar80.top/starsports1',
    category: 'CNCVerse Live Sports',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Star_Sports_1_Hindi_logo.svg/320px-Star_Sports_1_Hindi_logo.svg.png',
    description: 'Star Sports Hindi 1 HD direct stream',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/live/starhindi',
    isLive: true,
    enabled: true,
    quality: '1080p HD',
  },
  {
    id: 'cnc_bridge_sonyten_hd',
    name: 'Sony Sports Ten 1 HD - CNC Bridge',
    url: 'https://cfyhljddgbkkufh82.top/sonyten1',
    category: 'CNCVerse Live Sports',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Sony_Sports_Ten_1.png/320px-Sony_Sports_Ten_1.png',
    description: 'Sony Sports Ten 1 HD official relay',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/live/sonyten1',
    isLive: true,
    enabled: true,
    quality: '1080p HD',
  },
  {
    id: 'cnc_bridge_skysports_main',
    name: 'Sky Sports Main Event HD - CNC Bridge',
    url: 'https://bdix.short.gy/EPLxBDIX/skymain.m3u8',
    category: 'CNCVerse Live Sports',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Sky_Sports_Main_Event_logo.svg/320px-Sky_Sports_Main_Event_logo.svg.png',
    description: 'Sky Sports UK Main Event Football & Cricket',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/sports/skymain',
    isLive: true,
    enabled: true,
    quality: '1080p 50fps',
  },
  {
    id: 'cnc_bridge_willow',
    name: 'Willow Cricket HD - CNC Bridge',
    url: 'https://fifabangladesh2-xyz-ekkj.spidy.online/AYN/willow.m3u8',
    category: 'CNCVerse Live Sports',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/94/Willow_TV_logo.svg/320px-Willow_TV_logo.svg.png',
    description: 'Willow Cricket USA 24x7 HD Live Cricket',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/sports/willow',
    isLive: true,
    enabled: true,
    quality: '1080p HD',
  },
  {
    id: 'cnc_bridge_colors_hd',
    name: 'Colors HD - CNC Bridge',
    url: 'https://cfymarkscanjiostar80.top/entertainment/colors',
    category: 'CNCVerse Entertainment',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/Colors_TV_logo.png/320px-Colors_TV_logo.png',
    description: 'Colors TV HD Hindi flagship serials and reality shows',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/live/colors',
    isLive: true,
    enabled: true,
    quality: '1080p HD',
  },
  {
    id: 'cnc_bridge_star_plus_hd',
    name: 'Star Plus HD - CNC Bridge',
    url: 'https://cfyhljddgbkkufh82.top/entertainment/starplus',
    category: 'CNCVerse Entertainment',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/86/Star_Plus_logo_2018.png/320px-Star_Plus_logo_2018.png',
    description: 'Star Plus HD Hindi drama serials',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/live/starplus',
    isLive: true,
    enabled: true,
    quality: '1080p HD',
  },
  {
    id: 'cnc_bridge_zee_tv_hd',
    name: 'Zee TV HD - CNC Bridge',
    url: 'https://fifabd.site/OPLLX7/LIVE2.m3u',
    category: 'CNCVerse Entertainment',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Zee_TV_logo_2017.png/320px-Zee_TV_logo_2017.png',
    description: 'Zee TV HD entertainment & reality shows',
    source: 'cncverse_bridge',
    bridgeEndpoint: 'https://cncverse.dpdns.org/live/zeetv',
    isLive: true,
    enabled: true,
    quality: '1080p HD',
  },
];

class StremioNuvioService {
  private addons: StremioAddon[] = [];
  private streams: CNCVerseStream[] = [];
  private cncBridgeUrl = 'https://cncverse.dpdns.org';
  private bridgeStatus: 'online' | 'offline' | 'checking' = 'checking';
  private lastBridgeCheck: string | null = null;
  private bridgeStats = {
    httpCode: 200,
    latencyMs: 142,
    payloadSize: '84.2 KB',
    rawPayload: null as any,
  };
  private autoSyncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDir();
    this.loadState();
    this.initDefaults();
    this.checkBridgeStatus();
    // Refresh bridge & addons every 5 mins
    this.startAutoSync(5 * 60 * 1000);
  }

  private ensureDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.error('[StremioNuvio] Error creating directory:', e);
    }
  }

  private loadState() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.addons)) this.addons = data.addons;
        if (data && Array.isArray(data.streams)) this.streams = data.streams;
        if (data && data.cncBridgeUrl) this.cncBridgeUrl = data.cncBridgeUrl;
      }
    } catch (e) {
      console.error('[StremioNuvio] Error reading storage file:', e);
    }
  }

  private saveState() {
    try {
      this.ensureDir();
      fs.writeFileSync(
        STORAGE_FILE,
        JSON.stringify(
          {
            addons: this.addons,
            streams: this.streams,
            cncBridgeUrl: this.cncBridgeUrl,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (e) {
      console.error('[StremioNuvio] Error saving storage file:', e);
    }
  }

  private initDefaults() {
    // Seed addons
    for (const addon of BUILTIN_STREMIO_ADDONS) {
      const exists = this.addons.find((a) => a.id === addon.id || a.manifestUrl === addon.manifestUrl);
      if (!exists) {
        this.addons.push({
          ...addon,
          status: 'idle',
          errorMessage: null,
          lastSync: null,
        });
      }
    }

    // Seed streams
    for (const stream of BUILTIN_CNCVERSE_STREAMS) {
      const exists = this.streams.find((s) => s.id === stream.id);
      if (!exists) {
        this.streams.push({
          ...stream,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    this.saveState();
  }

  public startAutoSync(intervalMs = 300000) {
    if (this.autoSyncTimer) clearInterval(this.autoSyncTimer);
    this.autoSyncTimer = setInterval(async () => {
      console.log('[StremioNuvio] Auto-refreshing bridge status & addon manifests...');
      await this.checkBridgeStatus();
      await this.syncAllAddons();
    }, intervalMs);
  }

  public getAddons(): StremioAddon[] {
    return this.addons;
  }

  public getStreams(): CNCVerseStream[] {
    return this.streams;
  }

  public getBridgeStatus() {
    return {
      status: this.bridgeStatus,
      url: this.cncBridgeUrl,
      lastCheck: this.lastBridgeCheck,
      streamsCount: this.streams.length,
      activeStreamsCount: this.streams.filter((s) => s.enabled).length,
      httpCode: this.bridgeStats.httpCode,
      latencyMs: this.bridgeStats.latencyMs,
      payloadSize: this.bridgeStats.payloadSize,
      rawPayload: this.bridgeStats.rawPayload,
    };
  }

  public setBridgeUrl(url: string) {
    this.cncBridgeUrl = url.trim().replace(/\/+$/, '');
    this.saveState();
    this.checkBridgeStatus();
  }

  public async checkBridgeStatus(): Promise<boolean> {
    this.bridgeStatus = 'checking';
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(this.cncBridgeUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CNCVerse-Bridge-Relay/2.0 (Linux; Android)',
          Accept: 'text/html,application/json,*/*',
        },
      });
      clearTimeout(timer);

      this.bridgeStats.latencyMs = Date.now() - start;
      this.bridgeStats.httpCode = res.status;

      if (res.ok || res.status === 404 || res.status === 403 || res.status === 200) {
        this.bridgeStatus = 'online';
        this.lastBridgeCheck = new Date().toISOString();
        const text = await res.text().catch(() => '');
        this.bridgeStats.payloadSize = `${(Buffer.byteLength(text, 'utf-8') / 1024).toFixed(1)} KB`;
        this.bridgeStats.rawPayload = {
          bridgeUrl: this.cncBridgeUrl,
          statusCode: res.status,
          latencyMs: this.bridgeStats.latencyMs,
          streamsCount: this.streams.length,
          server: res.headers.get('server') || 'CNCVerse-Gateway',
          contentType: res.headers.get('content-type') || 'text/html',
        };
        return true;
      } else {
        this.bridgeStatus = 'offline';
        this.lastBridgeCheck = new Date().toISOString();
        return false;
      }
    } catch {
      this.bridgeStatus = 'offline';
      this.lastBridgeCheck = new Date().toISOString();
      this.bridgeStats.latencyMs = Date.now() - start;
      return false;
    }
  }

  public async fetchAddonManifest(addonId: string): Promise<boolean> {
    const addon = this.addons.find((a) => a.id === addonId);
    if (!addon) return false;

    addon.status = 'fetching';
    addon.errorMessage = null;
    this.saveState();

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(addon.manifestUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Stremio/4.4.168 (Android; Nuvio/1.0)',
          Accept: 'application/json, text/plain, */*',
        },
      });
      clearTimeout(timer);

      addon.latencyMs = Date.now() - start;
      addon.httpCode = res.status;

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const text = await res.text();
      addon.payloadSize = `${(Buffer.byteLength(text, 'utf-8') / 1024).toFixed(1)} KB`;
      const manifest = JSON.parse(text);
      addon.rawPayload = manifest;

      if (manifest.name) addon.name = manifest.name;
      if (manifest.version) addon.version = manifest.version;
      if (manifest.description) addon.description = manifest.description;
      if (manifest.logo) addon.logo = manifest.logo;
      if (Array.isArray(manifest.types)) addon.types = manifest.types;
      if (Array.isArray(manifest.catalogs)) addon.catalogs = manifest.catalogs;
      if (Array.isArray(manifest.resources)) addon.resources = manifest.resources;

      addon.status = 'success';
      addon.lastSync = new Date().toISOString();
      addon.errorMessage = null;
      this.saveState();
      return true;
    } catch (err: any) {
      console.error(`[StremioNuvio] Failed to fetch manifest for ${addon.name}:`, err.message);
      addon.status = 'error';
      addon.errorMessage = err.message || 'Manifest download failed';
      addon.lastSync = new Date().toISOString();
      addon.httpCode = 500;
      this.saveState();
      return false;
    }
  }

  public async syncAllAddons(): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const a of this.addons) {
      const ok = await this.fetchAddonManifest(a.id);
      if (ok) success++;
      else failed++;
    }
    return { success, failed };
  }

  public addAddon(manifestUrl: string, name?: string): StremioAddon {
    const cleanUrl = manifestUrl.trim();
    const id = `addon_${Date.now()}`;
    const newAddon: StremioAddon = {
      id,
      name: name || 'Custom Stremio/Nuvio Addon',
      version: '1.0.0',
      description: 'Custom community addon manifest',
      manifestUrl: cleanUrl,
      logo: 'https://v3-cinemeta.strem.io/logo.png',
      types: ['movie', 'series'],
      enabled: true,
      isNuvioCompatible: true,
      status: 'idle',
      errorMessage: null,
    };
    this.addons.push(newAddon);
    this.saveState();
    this.fetchAddonManifest(newAddon.id);
    return newAddon;
  }

  // --- Category Management ---
  public toggleCategory(categoryName: string, enabled: boolean): number {
    let count = 0;
    for (const s of this.streams) {
      if (s.category === categoryName) {
        s.enabled = enabled;
        count++;
      }
    }
    this.saveState();
    return count;
  }

  public renameCategory(oldCategory: string, newCategory: string): number {
    let count = 0;
    for (const s of this.streams) {
      if (s.category === oldCategory) {
        s.category = newCategory;
        count++;
      }
    }
    this.saveState();
    return count;
  }

  // --- Stream Management ---
  public toggleStream(id: string, enabled?: boolean): CNCVerseStream | null {
    const s = this.streams.find((item) => item.id === id);
    if (!s) return null;
    s.enabled = enabled !== undefined ? enabled : !s.enabled;
    s.updatedAt = new Date().toISOString();
    this.saveState();
    return s;
  }

  public updateStream(id: string, updates: Partial<CNCVerseStream>): CNCVerseStream | null {
    const s = this.streams.find((item) => item.id === id);
    if (!s) return null;
    Object.assign(s, updates, { updatedAt: new Date().toISOString() });
    this.saveState();
    return s;
  }

  public deleteStream(id: string): boolean {
    const prev = this.streams.length;
    this.streams = this.streams.filter((s) => s.id !== id);
    if (this.streams.length !== prev) {
      this.saveState();
      return true;
    }
    return false;
  }

  public addStream(stream: Partial<CNCVerseStream>): CNCVerseStream {
    const newStream: CNCVerseStream = {
      id: `cnc_stream_${Date.now()}`,
      name: stream.name || 'Untitled Stream',
      url: stream.url || '',
      category: stream.category || 'CNCVerse Custom',
      logo: stream.logo || 'https://raw.githubusercontent.com/akashdh11/skystream/main/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
      description: stream.description || 'Custom added stream',
      source: 'custom',
      isLive: stream.isLive !== undefined ? stream.isLive : true,
      enabled: stream.enabled !== undefined ? stream.enabled : true,
      quality: stream.quality || '1080p HD',
      updatedAt: new Date().toISOString(),
    };
    this.streams.unshift(newStream);
    this.saveState();
    return newStream;
  }

  public getRawJson(addonId?: string): any {
    if (addonId) {
      const addon = this.addons.find((a) => a.id === addonId);
      if (addon && addon.rawPayload) return addon.rawPayload;
    }
    return {
      bridgeStatus: this.getBridgeStatus(),
      totalAddons: this.addons.length,
      totalStreams: this.streams.length,
      addons: this.addons,
      streams: this.streams,
    };
  }

  // --- M3U / JSON Generation ---
  public generateCNCVerseM3U(publicBaseUrl = ''): string {
    const active = this.streams.filter((s) => s.enabled);
    const lines: string[] = [
      '#EXTM3U name="Nexus Empire CNCVerse Bridge" x-tvg-url="https://thenexusempire.com/epg.xml"',
    ];

    for (const item of active) {
      const tvgName = item.name.replace(/"/g, "'");
      const logo = item.logo ? ` tvg-logo="${item.logo}"` : '';
      const group = item.category ? ` group-title="${item.category}"` : ' group-title="CNCVerse Live"';

      lines.push(`#EXTINF:-1 tvg-id="${item.id}" tvg-name="${tvgName}"${logo}${group},${item.name}`);
      lines.push(item.url);
    }

    return lines.join('\n');
  }

  public generateCNCVerseJSON(): object {
    const active = this.streams.filter((s) => s.enabled);
    return {
      playlist: {
        name: 'Nexus Empire CNCVerse Bridge Feed',
        generatedAt: new Date().toISOString(),
        totalStreams: active.length,
        streams: active.map((s) => ({
          id: s.id,
          name: s.name,
          url: s.url,
          category: s.category,
          logo: s.logo,
          description: s.description,
          quality: s.quality,
          source: s.source,
        })),
      },
    };
  }

  public generateStremioM3U(): string {
    const activeAddons = this.addons.filter((a) => a.enabled);
    const lines: string[] = [
      '#EXTM3U name="Nexus Empire Stremio Addon Catalog" x-tvg-url="https://thenexusempire.com/epg.xml"',
    ];

    for (const addon of activeAddons) {
      const logo = addon.logo ? ` tvg-logo="${addon.logo}"` : '';
      const group = ` group-title="Stremio Addons"`;
      lines.push(`#EXTINF:-1 tvg-id="${addon.id}" tvg-name="${addon.name}"${logo}${group},${addon.name} (v${addon.version})`);
      lines.push(addon.manifestUrl);
    }

    return lines.join('\n');
  }
}

export const stremioNuvioService = new StremioNuvioService();
