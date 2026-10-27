import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'skystream-extensions.json');

export interface SkyStreamItem {
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
  types?: string[];
  shortcode?: string;
  repoUrl: string;
  repoName?: string;
  enabled: boolean;
  isCustom?: boolean;
  isLive?: boolean;
  updatedAt?: string;
}

export interface SkyStreamRepo {
  id: string;
  name: string;
  shortcode?: string;
  url: string;
  lastSync: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  itemCount: number;
  description?: string;
  httpCode?: number;
  latencyMs?: number;
  payloadSize?: string;
  rawPayload?: any;
}

// Built-in SkyStream Shortcode Mappings
const SHORTCODE_REGISTRY: Record<string, { name: string; url: string; description: string }> = {
  universe: {
    name: 'SkyStream Universe Repository',
    url: 'https://raw.githubusercontent.com/akashdh11/skystream/master/assets/plugins/plugin.json',
    description: 'Official SkyStream Universe plugin bundle with multi-stream extractors, Live TV & Sports',
  },
  skysports: {
    name: 'SkyStream Sports & Cricket Hub',
    url: 'https://raw.githubusercontent.com/stormunblessed/stormunblessed-cs3/builds/repo.json',
    description: 'High-speed sports streaming, cricket, football and live tournament streams',
  },
  cricfy: {
    name: 'Cricfy SkyStream Bridge',
    url: 'https://raw.githubusercontent.com/NivinCNC/CNCVerse-Cloud-Stream-Extension/refs/heads/builds/CNC.json',
    description: 'Cricfy, SKTech and Live Match SkyStream scrapers',
  },
  superstream: {
    name: 'SuperStream & Cloud Provider Hub',
    url: 'https://raw.githubusercontent.com/stormunblessed/skystream-extensions/main/repo.json',
    description: 'Universal streaming providers with multi-language audio and subs',
  },
  sports: {
    name: 'Global Sports & Tournaments',
    url: 'https://fifabangladesh2-xyz-ekkj.spidy.online/AYN/tsports.m3u',
    description: 'Cricket, Football, Tennis and International live sporting feeds',
  },
  cinema: {
    name: 'SkyStream Movies & Series Scraper',
    url: 'https://v3-cinemeta.strem.io/manifest.json',
    description: 'Global films, series and anime catalog resolver',
  },
};

// Seed built-in SkyStream plugins & live streams from Universe ecosystem
const BUILTIN_SKYSTREAM_ITEMS: SkyStreamItem[] = [
  {
    id: 'skystream_universe_live_1',
    name: 'SkyStream Universe - Live Sports 1 HD',
    internalName: 'SkyUniverseLive1',
    url: 'https://cfyhljddgbkkufh82.top',
    category: 'SkyStream Sports',
    logo: 'https://raw.githubusercontent.com/akashdh11/skystream/main/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
    description: 'SkyStream Universe Live Sports Server 1 with HD Cricket & Football',
    author: 'akashdh11 / Universe',
    version: '2.4.0',
    language: 'Hindi/English',
    types: ['Live', 'Sports'],
    shortcode: 'universe',
    repoUrl: 'shortcode:universe',
    repoName: 'SkyStream Universe',
    enabled: true,
    isLive: true,
  },
  {
    id: 'skystream_universe_live_2',
    name: 'SkyStream Universe - Star Sports Select 1 HD',
    internalName: 'SkyUniverseStarSports',
    url: 'https://fifabangladesh2-xyz-ekkj.spidy.online/AYN/tsports.m3u',
    category: 'SkyStream Sports',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQI9T5vcm8wU-dLuaK5vBfoHpz8KL9Ru0aU1eoVaKNcqauxGtRTfvI1rGTA&s=10',
    description: 'Star Sports Select 1 direct cricket & sports broadcast',
    author: 'SkyStream Community',
    version: '2.4.0',
    language: 'English',
    types: ['Live', 'Sports'],
    shortcode: 'universe',
    repoUrl: 'shortcode:universe',
    repoName: 'SkyStream Universe',
    enabled: true,
    isLive: true,
  },
  {
    id: 'skystream_universe_epl',
    name: 'SkyStream Universe - Premier League & UCL Hub',
    internalName: 'SkyUniverseEPL',
    url: 'https://bdix.short.gy/EPLxBDIX/playlist.php',
    category: 'SkyStream Football',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS0OT2NFe9Jb4ofg_DrXx42EKLgyGnSGwoLg&usqp=CAU',
    description: 'Full English Premier League, UEFA Champions League and live soccer matches',
    author: 'SkyStream Sports',
    version: '2.4.0',
    language: 'English',
    types: ['Live', 'Sports'],
    shortcode: 'universe',
    repoUrl: 'shortcode:universe',
    repoName: 'SkyStream Universe',
    enabled: true,
    isLive: true,
  },
  {
    id: 'skystream_universe_jiostar',
    name: 'SkyStream Universe - JioStar Cricket Live Mirror',
    internalName: 'SkyUniverseJioStar',
    url: 'https://cfymarkscanjiostar80.top',
    category: 'SkyStream Cricket',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7zqXTonSH_Xo--YxMlOacinf7mhLwuwSFFF1KJa8lGw&s=10',
    description: 'High quality JioStar match streams with dual audio tracks',
    author: 'CNCVerse / SkyStream',
    version: '2.4.0',
    language: 'Hindi/Tamil/English',
    types: ['Live', 'Sports'],
    shortcode: 'universe',
    repoUrl: 'shortcode:universe',
    repoName: 'SkyStream Universe',
    enabled: true,
    isLive: true,
  },
  {
    id: 'skystream_universe_entertainment',
    name: 'SkyStream Universe - Star Plus & Colors HD',
    internalName: 'SkyUniverseEntertainment',
    url: 'https://fifabd.site/OPLLX7/LIVE2.m3u',
    category: 'SkyStream Entertainment',
    logo: 'https://raw.githubusercontent.com/akashdh11/skystream/main/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
    description: 'Popular Hindi, Tamil, Telugu entertainment series & live channels',
    author: 'akashdh11',
    version: '2.0.0',
    language: 'Hindi',
    types: ['Live', 'TV Series'],
    shortcode: 'universe',
    repoUrl: 'shortcode:universe',
    repoName: 'SkyStream Universe',
    enabled: true,
    isLive: true,
  },
  {
    id: 'skystream_universe_cinema',
    name: 'SkyStream Cinema - Star Gold HD',
    internalName: 'SkyUniverseStarGold',
    url: 'https://cfyhljddgbkkufh82.top/movies/stargold',
    category: 'SkyStream Cinema',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Star_Gold_logo.svg/320px-Star_Gold_logo.svg.png',
    description: 'Bollywood and International Blockbuster movies 24/7',
    author: 'SkyStream Universe',
    version: '1.0',
    language: 'Hindi',
    types: ['Live', 'Movies'],
    shortcode: 'universe',
    repoUrl: 'shortcode:universe',
    repoName: 'SkyStream Universe',
    enabled: true,
    isLive: true,
  },
  {
    id: 'skystream_universe_sony_max',
    name: 'SkyStream Cinema - Sony MAX HD',
    internalName: 'SkyUniverseSonyMax',
    url: 'https://cfymarkscanjiostar80.top/movies/sonymax',
    category: 'SkyStream Cinema',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Sony_Max_logo.svg/320px-Sony_Max_logo.svg.png',
    description: 'Deewana Bana De - Movies & Cricket match replays',
    author: 'SkyStream Universe',
    version: '1.0',
    language: 'Hindi',
    types: ['Live', 'Movies'],
    shortcode: 'universe',
    repoUrl: 'shortcode:universe',
    repoName: 'SkyStream Universe',
    enabled: true,
    isLive: true,
  },
];

class SkyStreamService {
  private repos: SkyStreamRepo[] = [];
  private items: SkyStreamItem[] = [];
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDir();
    this.loadState();
    this.initDefaultRepos();
  }

  private ensureDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.error('[SkyStream] Error creating data directory:', e);
    }
  }

  private loadState() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.repos)) this.repos = data.repos;
        if (data && Array.isArray(data.items)) this.items = data.items;
      }
    } catch (e) {
      console.error('[SkyStream] Error reading storage file:', e);
    }
  }

  private saveState() {
    try {
      this.ensureDir();
      fs.writeFileSync(
        STORAGE_FILE,
        JSON.stringify({ repos: this.repos, items: this.items }, null, 2),
        'utf-8'
      );
    } catch (e) {
      console.error('[SkyStream] Error saving storage file:', e);
    }
  }

  private initDefaultRepos() {
    for (const [code, info] of Object.entries(SHORTCODE_REGISTRY)) {
      const exists = this.repos.find((r) => r.shortcode === code);
      if (!exists) {
        this.repos.push({
          id: `skystream_repo_${code}`,
          name: info.name,
          shortcode: code,
          url: info.url,
          lastSync: null,
          status: 'idle',
          errorMessage: null,
          itemCount: 0,
          description: info.description,
        });
      }
    }

    // Ensure built-in universe items exist
    for (const item of BUILTIN_SKYSTREAM_ITEMS) {
      if (!this.items.some((i) => i.id === item.id)) {
        this.items.push({ ...item, updatedAt: new Date().toISOString() });
      }
    }

    this.saveState();
    this.startAutoSync();

    // Fetch immediately on startup if items count is low
    if (this.items.length <= BUILTIN_SKYSTREAM_ITEMS.length) {
      this.fetchAll();
    }
  }

  public startAutoSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    // Auto sync every 5 mins
    this.syncTimer = setInterval(() => {
      console.log('[SkyStream] Auto-syncing SkyStream extensions & shortcodes...');
      this.fetchAll();
    }, 5 * 60 * 1000);
  }

  public getRepos(): SkyStreamRepo[] {
    return this.repos;
  }

  public getItems(): SkyStreamItem[] {
    return this.items;
  }

  private async fetchWithStats(url: string, timeoutMs = 15000): Promise<{ data: any; sizeBytes: number; latencyMs: number; status: number }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SkyStream/2.4.0 (Android; ExtensionEngine)',
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
        return { data: { rawContent: text }, sizeBytes, latencyMs, status };
      }
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  public async fetchByShortcodeOrUrl(input: string): Promise<{ success: boolean; repo?: SkyStreamRepo; count: number; error?: string }> {
    const trimmed = input.trim();
    const shortcodeKey = trimmed.toLowerCase();
    const isShortcode = !trimmed.startsWith('http://') && !trimmed.startsWith('https://');

    let targetUrl = trimmed;
    let repoName = `SkyStream Provider (${trimmed})`;
    let description = 'Custom SkyStream extension repository';

    if (isShortcode) {
      const mapped = SHORTCODE_REGISTRY[shortcodeKey];
      if (mapped) {
        targetUrl = mapped.url;
        repoName = mapped.name;
        description = mapped.description;
      } else {
        targetUrl = `https://raw.githubusercontent.com/akashdh11/skystream-plugins/main/${shortcodeKey}.json`;
        repoName = `SkyStream Shortcode: ${shortcodeKey}`;
      }
    }

    let repo = this.repos.find((r) => r.url === targetUrl || (r.shortcode && r.shortcode === shortcodeKey));
    if (!repo) {
      repo = {
        id: `repo_${Date.now()}`,
        name: repoName,
        shortcode: isShortcode ? shortcodeKey : undefined,
        url: targetUrl,
        lastSync: null,
        status: 'idle',
        errorMessage: null,
        itemCount: 0,
        description,
      };
      this.repos.push(repo);
    }

    repo.status = 'fetching';
    this.saveState();

    try {
      const fetchResult = await this.fetchWithStats(targetUrl);
      const json = fetchResult.data;

      repo.httpCode = fetchResult.status;
      repo.latencyMs = fetchResult.latencyMs;
      repo.payloadSize = `${(fetchResult.sizeBytes / 1024).toFixed(1)} KB`;
      repo.rawPayload = json;

      const plugins: any[] = [];
      if (Array.isArray(json)) {
        plugins.push(...json);
      } else if (json && typeof json === 'object') {
        if (Array.isArray(json.plugins)) plugins.push(...json.plugins);
        if (Array.isArray(json.extensions)) plugins.push(...json.extensions);
        if (Array.isArray(json.items)) plugins.push(...json.items);
        if (json.name && repo.name.includes('Provider')) repo.name = json.name;
        if (json.description) repo.description = json.description;
      }

      const parsed: SkyStreamItem[] = [];
      const seen = new Set<string>();

      // Preserve existing user customizations
      const existingMap = new Map<string, SkyStreamItem>();
      for (const it of this.items) {
        if (it.repoUrl === repo.url || (repo.shortcode && it.shortcode === repo.shortcode)) {
          existingMap.set(it.id, it);
        }
      }

      for (let idx = 0; idx < plugins.length; idx++) {
        const p = plugins[idx];
        if (!p || typeof p !== 'object') continue;

        const name = p.name || p.title || p.displayName || `SkyStream Plugin ${idx + 1}`;
        const internalName = p.internalName || p.id || name.replace(/[^a-zA-Z0-9]/g, '');
        const pluginUrl = p.url || p.downloadUrl || p.fileUrl || repo.url;
        const logo = p.iconUrl || p.icon || p.logo || 'https://raw.githubusercontent.com/akashdh11/skystream/main/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png';
        const description = p.description || p.summary || `${name} SkyStream extension provider`;
        const author = p.author || p.developer || 'akashdh11 / Universe';
        const version = p.version ? String(p.version) : '1.0.0';
        const types: string[] = Array.isArray(p.types) ? p.types : ['Live', 'Streams'];

        let category = 'SkyStream Universe';
        const lower = name.toLowerCase();
        if (lower.includes('cric') || lower.includes('sport')) category = 'SkyStream Sports';
        else if (lower.includes('movie') || lower.includes('cinema')) category = 'SkyStream Cinema';
        else if (lower.includes('anime')) category = 'SkyStream Anime';
        else if (lower.includes('tv') || lower.includes('live')) category = 'SkyStream Live TV';

        const id = `sky_${repo.shortcode || 'ext'}_${internalName}`;
        if (seen.has(id)) continue;
        seen.add(id);

        const existing = existingMap.get(id);

        parsed.push({
          id,
          name: existing?.name || name,
          internalName,
          url: existing?.url || pluginUrl,
          category: existing?.category || category,
          logo: existing?.logo || logo,
          description: existing?.description || description,
          author: existing?.author || author,
          version: existing?.version || version,
          language: p.language || 'all',
          types,
          shortcode: repo.shortcode,
          repoUrl: repo.url,
          repoName: repo.name,
          enabled: existing?.enabled !== undefined ? existing.enabled : true,
          updatedAt: new Date().toISOString(),
        });
      }

      // If universe shortcode, preserve built-in live events
      if (repo.shortcode === 'universe') {
        for (const builtin of BUILTIN_SKYSTREAM_ITEMS) {
          if (!seen.has(builtin.id)) {
            const existing = existingMap.get(builtin.id);
            parsed.unshift({
              ...builtin,
              name: existing?.name || builtin.name,
              url: existing?.url || builtin.url,
              logo: existing?.logo || builtin.logo,
              category: existing?.category || builtin.category,
              enabled: existing?.enabled !== undefined ? existing.enabled : true,
              updatedAt: new Date().toISOString(),
            });
            seen.add(builtin.id);
          }
        }
      }

      // Preserve custom manually created items
      const customItems = this.items.filter((i) => i.repoUrl === repo.url && i.isCustom);
      for (const ci of customItems) {
        if (!seen.has(ci.id)) {
          parsed.push(ci);
          seen.add(ci.id);
        }
      }

      this.items = this.items.filter((i) => i.repoUrl !== repo.url && (!repo.shortcode || i.shortcode !== repo.shortcode)).concat(parsed);

      repo.status = 'success';
      repo.lastSync = new Date().toISOString();
      repo.itemCount = parsed.length;
      repo.errorMessage = null;
      this.saveState();

      return { success: true, repo, count: parsed.length };
    } catch (err: any) {
      console.error(`[SkyStream] Failed to fetch ${targetUrl}:`, err.message);
      repo.status = 'error';
      repo.errorMessage = err.message || 'Network fetch failed';
      repo.lastSync = new Date().toISOString();
      repo.httpCode = 500;
      this.saveState();
      return { success: false, repo, count: 0, error: err.message };
    }
  }

  public async fetchAll(): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    for (const r of this.repos) {
      const res = await this.fetchByShortcodeOrUrl(r.shortcode || r.url);
      if (res.success) success++;
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
    this.saveState();
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
    this.saveState();
    return count;
  }

  // --- Stream Management ---
  public toggleItem(id: string, enabled?: boolean): SkyStreamItem | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;
    item.enabled = enabled !== undefined ? enabled : !item.enabled;
    item.updatedAt = new Date().toISOString();
    this.saveState();
    return item;
  }

  public updateItem(id: string, updates: Partial<SkyStreamItem>): SkyStreamItem | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    this.saveState();
    return item;
  }

  public deleteItem(id: string): boolean {
    const prev = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    if (this.items.length !== prev) {
      this.saveState();
      return true;
    }
    return false;
  }

  public addItem(item: Partial<SkyStreamItem>): SkyStreamItem {
    const newItem: SkyStreamItem = {
      id: `sky_custom_${Date.now()}`,
      name: item.name || 'Untitled SkyStream',
      url: item.url || '',
      category: item.category || 'SkyStream Custom',
      logo: item.logo || '',
      description: item.description || '',
      author: item.author || 'User',
      version: '1.0',
      language: item.language || 'all',
      types: item.types || ['Live'],
      shortcode: item.shortcode || 'custom',
      repoUrl: item.repoUrl || 'custom',
      repoName: item.repoName || 'Custom SkyStream',
      enabled: item.enabled !== undefined ? item.enabled : true,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };
    this.items.unshift(newItem);
    this.saveState();
    return newItem;
  }

  public getRawJson(targetId?: string): any {
    if (targetId) {
      const repo = this.repos.find((r) => r.id === targetId || r.shortcode === targetId);
      if (repo && repo.rawPayload) return repo.rawPayload;
    }
    return {
      totalRepos: this.repos.length,
      totalStreams: this.items.length,
      repos: this.repos,
      items: this.items,
    };
  }

  public generateM3U(publicBaseUrl = ''): string {
    const active = this.items.filter((i) => i.enabled);
    const lines: string[] = [
      '#EXTM3U name="Nexus Empire SkyStream Universe" x-tvg-url="https://thenexusempire.com/epg.xml"',
    ];

    for (const item of active) {
      const tvgId = item.internalName || item.id;
      const tvgName = item.name.replace(/"/g, "'");
      const logo = item.logo ? ` tvg-logo="${item.logo}"` : '';
      const group = item.category ? ` group-title="${item.category}"` : ' group-title="SkyStream Universe"';

      lines.push(`#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}"${logo}${group},${item.name}`);
      lines.push(item.url);
    }

    return lines.join('\n');
  }

  public generateJSON(): object {
    const active = this.items.filter((i) => i.enabled);
    return {
      playlist: {
        name: 'Nexus Empire SkyStream Universe Feed',
        generatedAt: new Date().toISOString(),
        totalStreams: active.length,
        streams: active.map((i) => ({
          id: i.id,
          name: i.name,
          url: i.url,
          category: i.category,
          logo: i.logo,
          description: i.description,
          author: i.author,
          version: i.version,
          types: i.types,
          shortcode: i.shortcode,
        })),
      },
    };
  }
}

export const skystreamService = new SkyStreamService();
