import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'cloudstream-repos.json');

export interface CloudStreamItem {
  id: string;
  name: string;
  internalName?: string;
  url: string;
  category: string;
  logo: string;
  description: string;
  author?: string;
  version?: string;
  language?: string;
  tvTypes?: string[];
  fileSize?: number;
  fileHash?: string;
  status?: number;
  enabled: boolean;
  isCustom?: boolean;
  isLiveEvent?: boolean;
  repoUrl: string;
  repoName?: string;
  updatedAt?: string;
}

export interface CloudStreamRepo {
  id: string;
  name: string;
  url: string;
  lastSync: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  itemCount: number;
  description?: string;
  iconUrl?: string;
  httpCode?: number;
  latencyMs?: number;
  payloadSize?: string;
  rawPayload?: any;
}

// Built-in live streams for Cricfy, SKTech & Live Events discovered from CNCVerse & CloudStream providers
const BUILTIN_LIVE_EVENTS: Array<Omit<CloudStreamItem, 'id' | 'repoUrl'> & { idSuffix: string }> = [
  {
    idSuffix: 'cricfy_live_s1',
    name: 'Cricfy Live Sports - Match Stream Server 1',
    internalName: 'CricifyLiveS1',
    url: 'https://cfyhljddgbkkufh82.top',
    category: 'Cricfy Live Sports',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ08h1gOe7MPxwehZBrbYKAUtjv22B6rAJ1kMkN-cea64Ka49KUyGU2lpTz&s=10',
    description: 'Cricfy Official Live Cricket, Football & Events Feed 1',
    author: 'CNCVerse / Cricfy',
    version: '7.6.0',
    language: 'hi/en',
    tvTypes: ['Live', 'Sports'],
    enabled: true,
    isLiveEvent: true,
  },
  {
    idSuffix: 'cricfy_live_jiostar',
    name: 'Cricfy Live Server 2 - JioStar & Cricket HD',
    internalName: 'CricifyLiveJioStar',
    url: 'https://cfymarkscanjiostar80.top',
    category: 'Cricfy Live Sports',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7zqXTonSH_Xo--YxMlOacinf7mhLwuwSFFF1KJa8lGw&s=10',
    description: 'High-speed JioStar & Cricket Live Sports stream mirror',
    author: 'CNCVerse / Cricfy',
    version: '7.6.0',
    language: 'hi/en/ta',
    tvTypes: ['Live', 'Sports'],
    enabled: true,
    isLiveEvent: true,
  },
  {
    idSuffix: 'cricfy_tsports',
    name: 'Cricfy T-Sports HD Live Events',
    internalName: 'CricifyTSports',
    url: 'https://fifabangladesh2-xyz-ekkj.spidy.online/AYN/tsports.m3u',
    category: 'Cricfy Live Sports',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI9T5vcm8wU-dLuaK5vBfoHpz8KL9Ru0aU1eoVaKNcqauxGtRTfvI1rGTA&s=10',
    description: 'T-Sports & Bangladesh Live Cricket Events M3U Feed',
    author: 'CNCVerse / Cricfy',
    version: '1.0',
    language: 'bn/en',
    tvTypes: ['Live', 'Sports'],
    enabled: true,
    isLiveEvent: true,
  },
  {
    idSuffix: 'cricfy_epl',
    name: 'Cricfy EPL & Football Live Hub',
    internalName: 'CricifyEPL',
    url: 'https://bdix.short.gy/EPLxBDIX/playlist.php',
    category: 'Cricfy Live Sports',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS0OT2NFe9Jb4ofg_DrXx42EKLgyGnSGwoLg&usqp=CAU',
    description: 'English Premier League & International Football Live playlist',
    author: 'CNCVerse / Cricfy',
    version: '1.0',
    language: 'en',
    tvTypes: ['Live', 'Sports'],
    enabled: true,
    isLiveEvent: true,
  },
  {
    idSuffix: 'sktech_live2',
    name: 'SKTech Live Events & Sports M3U',
    internalName: 'SKTechLive2',
    url: 'https://fifabd.site/OPLLX7/LIVE2.m3u',
    category: 'SKTech Live Events',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf7pkggfHJKj2R8O6ttuHxgv-vQVL03xUeAg&usqp=CAU',
    description: 'SKTech Provider Live Tournament & Match Streams Playlist',
    author: 'SKTech / NivinCNC',
    version: '3.4.0',
    language: 'all',
    tvTypes: ['Live', 'Sports', 'Events'],
    enabled: true,
    isLiveEvent: true,
  },
  {
    idSuffix: 'sktech_store',
    name: 'SKTech Global Event Relay',
    internalName: 'SKTechStore',
    url: 'https://raw.githubusercontent.com/NivinCNC/CNCVerse-Cloud-Stream-Extension/refs/heads/builds/CNC.json',
    category: 'SKTech Live Events',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf7pkggfHJKj2R8O6ttuHxgv-vQVL03xUeAg&usqp=CAU',
    description: 'SKTech Global Event Relay parsed from CNCVerse Extension',
    author: 'SKTech',
    version: '3.4.0',
    language: 'all',
    tvTypes: ['Live', 'Sports'],
    enabled: true,
    isLiveEvent: true,
  },
  {
    idSuffix: 'star_sports_hindi',
    name: 'Star Sports 1 Hindi HD - CloudStream Bridge',
    internalName: 'StarSportsHindi',
    url: 'https://cfymarkscanjiostar80.top/live/starhindi.m3u8',
    category: 'Cricfy Live Sports',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Star_Sports_1_Hindi_logo.svg/320px-Star_Sports_1_Hindi_logo.svg.png',
    description: 'Star Sports 1 Hindi direct match relay',
    author: 'CloudStream Sports',
    version: '1.0',
    language: 'hi',
    tvTypes: ['Live', 'Sports'],
    enabled: true,
    isLiveEvent: true,
  },
  {
    idSuffix: 'sony_ten1_hd',
    name: 'Sony Sports Ten 1 HD - CloudStream Bridge',
    internalName: 'SonyTen1HD',
    url: 'https://cfyhljddgbkkufh82.top/live/sonyten1.m3u8',
    category: 'Cricfy Live Sports',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Sony_Sports_Ten_1.png/320px-Sony_Sports_Ten_1.png',
    description: 'Sony Sports Ten 1 HD live event stream',
    author: 'CloudStream Sports',
    version: '1.0',
    language: 'en',
    tvTypes: ['Live', 'Sports'],
    enabled: true,
    isLiveEvent: true,
  },
  {
    idSuffix: 'willow_cricket_hd',
    name: 'Willow Cricket HD - CloudStream Bridge',
    internalName: 'WillowCricketHD',
    url: 'https://fifabangladesh2-xyz-ekkj.spidy.online/AYN/willow.m3u8',
    category: 'Cricfy Live Sports',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/94/Willow_TV_logo.svg/320px-Willow_TV_logo.svg.png',
    description: 'Willow Cricket 24/7 International Cricket stream',
    author: 'CloudStream Sports',
    version: '1.0',
    language: 'en',
    tvTypes: ['Live', 'Sports'],
    enabled: true,
    isLiveEvent: true,
  },
];

// Top repositories to fetch everything
const DEFAULT_REPOSITORIES = [
  {
    id: 'repo_default_cnc',
    name: 'CNCVerse CloudStream Official',
    url: 'https://raw.githubusercontent.com/NivinCNC/CNCVerse-Cloud-Stream-Extension/refs/heads/builds/CNC.json',
    description: 'CNCVerse extensions, Cricfy, SKTech & Live Events',
    iconUrl: 'https://raw.githubusercontent.com/NivinCNC/CNCVerse-Cloud-Stream-Extension/refs/heads/builds/cnc.png',
  },
  {
    id: 'repo_hexated',
    name: 'Hexated Repository (Multi-Provider)',
    url: 'https://raw.githubusercontent.com/Hexated/cloudstream-extensions-hexated/builds/repo.json',
    description: 'High-speed Multi-Language, Live Sports, Anime & Movies extensions',
    iconUrl: 'https://raw.githubusercontent.com/Hexated/cloudstream-extensions-hexated/builds/icon.png',
  },
  {
    id: 'repo_likdev256',
    name: 'LikDev-256 Banana Repository',
    url: 'https://raw.githubusercontent.com/LikDev-256/likdev256-banana-repo/builds/repo.json',
    description: 'English, Asian, Anime, Cartoons and Live TV streams',
    iconUrl: 'https://raw.githubusercontent.com/LikDev-256/likdev256-banana-repo/builds/icon.png',
  },
  {
    id: 'repo_superstream',
    name: 'SuperStream & Cloud Provider Hub',
    url: 'https://raw.githubusercontent.com/stormunblessed/stormunblessed-cs3/builds/repo.json',
    description: 'Global streaming providers with multi-resolution video links',
    iconUrl: 'https://raw.githubusercontent.com/stormunblessed/stormunblessed-cs3/builds/icon.png',
  },
];

class CloudStreamService {
  private repos: CloudStreamRepo[] = [];
  private items: CloudStreamItem[] = [];
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.load();
    this.initDefaultRepos();
  }

  private load() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.repos)) this.repos = data.repos;
        if (data && Array.isArray(data.items)) this.items = data.items;
      }
    } catch (err) {
      console.error('Failed to load CloudStream data:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        STORAGE_FILE,
        JSON.stringify({ repos: this.repos, items: this.items }, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to save CloudStream data:', err);
    }
  }

  private initDefaultRepos() {
    for (const d of DEFAULT_REPOSITORIES) {
      const exists = this.repos.find((r) => r.url === d.url || r.id === d.id);
      if (!exists) {
        this.repos.push({
          id: d.id,
          name: d.name,
          url: d.url,
          lastSync: null,
          status: 'idle',
          errorMessage: null,
          itemCount: 0,
          description: d.description,
          iconUrl: d.iconUrl,
        });
      }
    }
    this.save();
    this.startAutoSync();

    // Fetch immediately on startup if items are sparse
    if (this.items.length < 5) {
      this.fetchAllRepos();
    }
  }

  public startAutoSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    // Auto-sync every 5 minutes
    this.syncTimer = setInterval(() => {
      console.log('[CloudStream] Auto-syncing all CloudStream repositories...');
      this.fetchAllRepos();
    }, 5 * 60 * 1000);
  }

  public getRepos(): CloudStreamRepo[] {
    return this.repos;
  }

  public getItems(): CloudStreamItem[] {
    return this.items;
  }

  public addRepo(name: string, url: string): CloudStreamRepo {
    const newRepo: CloudStreamRepo = {
      id: `repo_${Date.now()}`,
      name,
      url,
      lastSync: null,
      status: 'idle',
      errorMessage: null,
      itemCount: 0,
    };
    this.repos.push(newRepo);
    this.save();
    this.fetchSingleRepo(newRepo.id);
    return newRepo;
  }

  public deleteRepo(id: string): boolean {
    const repo = this.repos.find((r) => r.id === id);
    if (!repo) return false;
    this.repos = this.repos.filter((r) => r.id !== id);
    this.items = this.items.filter((i) => i.repoUrl !== repo.url);
    this.save();
    return true;
  }

  private async fetchJsonWithStats(url: string, timeoutMs = 15000): Promise<{ data: any; sizeBytes: number; latencyMs: number; status: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CloudStream/3.0.0 (Linux; Android) ReCloudStream/1.0',
          Accept: 'application/json, text/plain, */*',
        },
      });
      clearTimeout(timer);
      const latencyMs = Date.now() - start;
      const status = res.status;
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const text = await res.text();
      const sizeBytes = Buffer.byteLength(text, 'utf-8');
      try {
        const data = JSON.parse(text);
        return { data, sizeBytes, latencyMs, status };
      } catch {
        throw new Error('Response is not valid JSON');
      }
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  private resolveUrl(base: string, relative: string): string {
    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }

  private categorizePlugin(name: string, internalName: string, tvTypes: string[]): string {
    const lowerName = `${name} ${internalName}`.toLowerCase();
    if (lowerName.includes('cric') || lowerName.includes('cricket')) return 'Cricfy Live Sports';
    if (lowerName.includes('sktech')) return 'SKTech Live Events';
    if (lowerName.includes('sport') || lowerName.includes('football') || lowerName.includes('epl')) return 'Live Sports';
    if (tvTypes.some((t) => t.toLowerCase() === 'live')) return 'CloudStream Live TV';
    if (tvTypes.some((t) => ['movie', 'movies', 'tvseries', 'series'].includes(t.toLowerCase()))) {
      return 'Movies & Series';
    }
    if (tvTypes.some((t) => ['anime', 'animemovie', 'ova'].includes(t.toLowerCase()))) {
      return 'Anime & Animation';
    }
    return 'CloudStream Extensions';
  }

  public async fetchSingleRepo(repoId: string): Promise<boolean> {
    const repo = this.repos.find((r) => r.id === repoId);
    if (!repo) return false;

    repo.status = 'fetching';
    repo.errorMessage = null;
    this.save();

    try {
      const fetchResult = await this.fetchJsonWithStats(repo.url);
      const rootJson = fetchResult.data;

      repo.httpCode = fetchResult.status;
      repo.latencyMs = fetchResult.latencyMs;
      repo.payloadSize = `${(fetchResult.sizeBytes / 1024).toFixed(1)} KB`;
      repo.rawPayload = rootJson;

      if (rootJson && typeof rootJson === 'object') {
        if (rootJson.name && repo.name.includes('New Repo')) repo.name = rootJson.name;
        if (rootJson.description && !repo.description) repo.description = rootJson.description;
        if (rootJson.iconUrl && !repo.iconUrl) repo.iconUrl = rootJson.iconUrl;
      }

      const pluginListsToFetch: string[] = [];
      let directPlugins: any[] = [];

      if (Array.isArray(rootJson)) {
        directPlugins = rootJson;
      } else if (rootJson && typeof rootJson === 'object') {
        if (Array.isArray(rootJson.pluginLists)) {
          for (const pl of rootJson.pluginLists) {
            if (typeof pl === 'string') pluginListsToFetch.push(this.resolveUrl(repo.url, pl));
          }
        }
        if (typeof rootJson.pluginList === 'string') {
          pluginListsToFetch.push(this.resolveUrl(repo.url, rootJson.pluginList));
        }
        if (Array.isArray(rootJson.plugins)) {
          directPlugins = directPlugins.concat(rootJson.plugins);
        }
        if (Array.isArray(rootJson.extensions)) {
          directPlugins = directPlugins.concat(rootJson.extensions);
        }
        if (Array.isArray(rootJson.items)) {
          directPlugins = directPlugins.concat(rootJson.items);
        }
      }

      if (pluginListsToFetch.length === 0 && directPlugins.length === 0) {
        if (repo.url.includes('CNC.json')) {
          pluginListsToFetch.push('https://raw.githubusercontent.com/NivinCNC/CNCVerse-Cloud-Stream-Extension/builds/plugins.json');
        }
      }

      const allPlugins: any[] = [...directPlugins];
      for (const listUrl of pluginListsToFetch) {
        try {
          const listRes = await this.fetchJsonWithStats(listUrl);
          if (Array.isArray(listRes.data)) {
            allPlugins.push(...listRes.data);
          } else if (listRes.data && Array.isArray(listRes.data.plugins)) {
            allPlugins.push(...listRes.data.plugins);
          }
        } catch (err: any) {
          console.warn(`[CloudStream] Failed to fetch sub-plugin list ${listUrl}:`, err.message);
        }
      }

      const parsedItems: CloudStreamItem[] = [];
      const seenPluginIds = new Set<string>();

      // Preserve existing user customizations
      const existingUserEdits = new Map<string, CloudStreamItem>();
      for (const item of this.items) {
        if (item.repoUrl === repo.url) {
          existingUserEdits.set(item.id, item);
        }
      }

      for (let idx = 0; idx < allPlugins.length; idx++) {
        const p = allPlugins[idx];
        if (!p || typeof p !== 'object') continue;

        const name = p.name || p.title || p.displayName || p.pluginName || `Extension ${idx + 1}`;
        const internalName = p.internalName || p.id || name.replace(/[^a-zA-Z0-9]/g, '');
        const pluginUrl = p.url || p.downloadUrl || p.fileUrl || p.uri || repo.url;
        const tvTypes: string[] = Array.isArray(p.tvTypes)
          ? p.tvTypes
          : p.tvTypes ? [p.tvTypes] : [];
        const category = this.categorizePlugin(name, internalName, tvTypes);
        const logo = p.iconUrl || p.logo || p.icon || p.poster || '';
        const description = p.description || p.summary || `${name} CloudStream Provider extension`;
        const author = Array.isArray(p.authors) ? p.authors.join(', ') : (p.author || 'CloudStream Community');
        const version = p.version != null ? String(p.version) : '1.0.0';
        const language = p.language || 'all';

        const itemId = `cs_${repo.id}_${internalName}`;
        if (seenPluginIds.has(itemId)) continue;
        seenPluginIds.add(itemId);

        const existing = existingUserEdits.get(itemId);

        parsedItems.push({
          id: itemId,
          name: existing?.name || name,
          internalName,
          url: existing?.url || pluginUrl,
          category: existing?.category || category,
          logo: existing?.logo || logo,
          description: existing?.description || description,
          author: existing?.author || author,
          version: existing?.version || version,
          language,
          tvTypes,
          fileSize: p.fileSize || 0,
          fileHash: p.fileHash || '',
          status: p.status || 1,
          enabled: existing?.enabled !== undefined ? existing.enabled : true,
          repoUrl: repo.url,
          repoName: repo.name,
          updatedAt: new Date().toISOString(),
        });
      }

      // If this repo is the CNCVerse repo, ensure all live event feeds are included
      const isCnc = repo.url.includes('CNC') || repo.name.toLowerCase().includes('cnc');
      if (isCnc) {
        for (const event of BUILTIN_LIVE_EVENTS) {
          const liveId = `live_event_${event.idSuffix}`;
          if (!seenPluginIds.has(liveId)) {
            const existing = existingUserEdits.get(liveId);
            parsedItems.unshift({
              id: liveId,
              name: existing?.name || event.name,
              internalName: event.internalName,
              url: existing?.url || event.url,
              category: existing?.category || event.category,
              logo: existing?.logo || event.logo,
              description: existing?.description || event.description,
              author: existing?.author || event.author,
              version: existing?.version || event.version,
              language: event.language,
              tvTypes: event.tvTypes,
              enabled: existing?.enabled !== undefined ? existing.enabled : true,
              isLiveEvent: true,
              repoUrl: repo.url,
              repoName: repo.name,
              updatedAt: new Date().toISOString(),
            });
            seenPluginIds.add(liveId);
          }
        }
      }

      // Preserve custom manually added items for this repo
      const customItems = this.items.filter((i) => i.repoUrl === repo.url && i.isCustom);
      for (const ci of customItems) {
        if (!seenPluginIds.has(ci.id)) {
          parsedItems.push(ci);
          seenPluginIds.add(ci.id);
        }
      }

      // Replace items for this repo
      this.items = this.items.filter((i) => i.repoUrl !== repo.url).concat(parsedItems);

      repo.status = 'success';
      repo.lastSync = new Date().toISOString();
      repo.itemCount = parsedItems.length;
      repo.errorMessage = null;
      this.save();
      return true;
    } catch (err: any) {
      console.error(`[CloudStream] Failed to fetch repo ${repo.name}:`, err.message);
      repo.status = 'error';
      repo.errorMessage = err.message || 'Unknown network error';
      repo.lastSync = new Date().toISOString();
      repo.httpCode = 500;
      this.save();
      return false;
    }
  }

  public async fetchAllRepos(): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const repo of this.repos) {
      const ok = await this.fetchSingleRepo(repo.id);
      if (ok) success++;
      else failed++;
    }
    return { success, failed };
  }

  // --- Category Management ---
  public toggleCategory(categoryName: string, enabled: boolean): number {
    let count = 0;
    for (const item of this.items) {
      if (item.category === categoryName) {
        item.enabled = enabled;
        count++;
      }
    }
    this.save();
    return count;
  }

  public renameCategory(oldCategory: string, newCategory: string): number {
    let count = 0;
    for (const item of this.items) {
      if (item.category === oldCategory) {
        item.category = newCategory;
        count++;
      }
    }
    this.save();
    return count;
  }

  // --- Stream Management ---
  public toggleItem(id: string, enabled?: boolean): CloudStreamItem | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;
    item.enabled = enabled !== undefined ? enabled : !item.enabled;
    item.updatedAt = new Date().toISOString();
    this.save();
    return item;
  }

  public updateItem(id: string, updates: Partial<CloudStreamItem>): CloudStreamItem | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return item;
  }

  public deleteItem(id: string): boolean {
    const prevLen = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    if (this.items.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addItem(item: Partial<CloudStreamItem>): CloudStreamItem {
    const newItem: CloudStreamItem = {
      id: `cs_custom_${Date.now()}`,
      name: item.name || 'Untitled Stream',
      url: item.url || '',
      category: item.category || 'CloudStream Custom',
      logo: item.logo || '',
      description: item.description || '',
      author: item.author || 'User',
      version: '1.0',
      language: item.language || 'all',
      tvTypes: item.tvTypes || ['Live'],
      enabled: item.enabled !== undefined ? item.enabled : true,
      isCustom: true,
      repoUrl: item.repoUrl || 'custom',
      repoName: item.repoName || 'Custom Streams',
      updatedAt: new Date().toISOString(),
    };
    this.items.unshift(newItem);
    this.save();
    return newItem;
  }

  public getRawJson(repoId?: string): any {
    if (repoId) {
      const repo = this.repos.find((r) => r.id === repoId);
      if (repo && repo.rawPayload) return repo.rawPayload;
    }
    return {
      totalRepos: this.repos.length,
      totalItems: this.items.length,
      repos: this.repos,
      items: this.items,
    };
  }

  // --- M3U / JSON Generation ---
  public generateM3U(publicBaseUrl = ''): string {
    const activeItems = this.items.filter((i) => i.enabled);
    const lines: string[] = [
      '#EXTM3U name="Nexus Empire CloudStream Relay" x-tvg-url="https://thenexusempire.com/epg.xml"',
    ];

    for (const item of activeItems) {
      const tvgId = item.internalName || item.id;
      const tvgName = item.name.replace(/"/g, "'");
      const tvgLogo = item.logo ? ` tvg-logo="${item.logo}"` : '';
      const groupTitle = item.category ? ` group-title="${item.category}"` : ' group-title="CloudStream"';

      lines.push(`#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}"${tvgLogo}${groupTitle},${item.name}`);
      lines.push(item.url);
    }

    return lines.join('\n');
  }

  public generateJSON(publicBaseUrl = ''): object {
    const activeItems = this.items.filter((i) => i.enabled);
    return {
      playlist: {
        name: 'Nexus Empire CloudStream Relay',
        generatedAt: new Date().toISOString(),
        totalStreams: activeItems.length,
        streams: activeItems.map((item) => ({
          id: item.id,
          name: item.name,
          url: item.url,
          category: item.category,
          logo: item.logo,
          description: item.description,
          author: item.author,
          version: item.version,
          tvTypes: item.tvTypes,
          isLiveEvent: !!item.isLiveEvent,
        })),
      },
    };
  }
}

export const cloudstreamService = new CloudStreamService();
