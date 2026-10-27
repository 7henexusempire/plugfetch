import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'cloudstream-repos.json');

export interface CloudStreamItem {
  id: string;
  name: string;
  url: string;
  category: string;
  logo: string;
  description: string;
  author?: string;
  version?: string;
  enabled: boolean;
  isCustom?: boolean;
  repoUrl: string;
}

export interface CloudStreamRepo {
  id: string;
  name: string;
  url: string;
  lastSync: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  itemCount: number;
}

class CloudStreamService {
  private repos: CloudStreamRepo[] = [];
  private items: CloudStreamItem[] = [];
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.load();
    this.initDefaultRepo();
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

  private initDefaultRepo() {
    const defaultUrl = 'https://raw.githubusercontent.com/NivinCNC/CNCVerse-Cloud-Stream-Extension/refs/heads/builds/CNC.json';
    const exists = this.repos.some((r) => r.url === defaultUrl);
    if (!exists) {
      this.repos.push({
        id: 'repo_default_cnc',
        name: 'CNCVerse CloudStream Official',
        url: defaultUrl,
        lastSync: null,
        status: 'idle',
        errorMessage: null,
        itemCount: 0,
      });
      this.save();
    }
    this.startAutoSync();
    if (this.items.length === 0) {
      this.fetchAllRepos();
    }
  }

  public startAutoSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    // Every 5 minutes
    this.syncTimer = setInterval(() => {
      console.log('[CloudStream] Auto-syncing CloudStream repos...');
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

  public async fetchSingleRepo(repoId: string): Promise<boolean> {
    const repo = this.repos.find((r) => r.id === repoId);
    if (!repo) return false;

    repo.status = 'fetching';
    repo.errorMessage = null;
    this.save();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(repo.url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'CloudStream-Nexus-Engine/3.0' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();

      const parsedItems: CloudStreamItem[] = [];

      // Robust CloudStream parser supporting recloudstream format (plugins, extensions, streams, lists, or direct array)
      const rawList = Array.isArray(json)
        ? json
        : json.plugins || json.extensions || json.streams || json.items || json.repositories || [json];

      rawList.forEach((item: any, idx: number) => {
        const name = item.name || item.title || item.displayName || item.pluginName || `CloudStream Stream ${idx + 1}`;
        const url = item.url || item.streamUrl || item.uri || item.downloadUrl || item.fileUrl || '';
        const category = item.category || item.group || item.type || item.language || 'CloudStream Live';
        const logo = item.logo || item.icon || item.iconUrl || item.poster || '';
        const description = item.description || item.summary || item.details || 'CloudStream extension feed';
        const author = item.author || item.developer || '';
        const version = item.version || '1.0.0';

        if (url) {
          parsedItems.push({
            id: `cs_${repo.id}_${idx}_${Date.now()}`,
            name,
            url,
            category,
            logo,
            description,
            author,
            version,
            enabled: true,
            repoUrl: repo.url,
          });
        }

        // If the item itself contains nested streams or sources (common in CloudStream plugin definitions)
        if (Array.isArray(item.sources)) {
          item.sources.forEach((src: any, sIdx: number) => {
            const srcUrl = src.url || src.streamUrl || '';
            if (srcUrl) {
              parsedItems.push({
                id: `cs_${repo.id}_${idx}_src_${sIdx}_${Date.now()}`,
                name: `${name} - ${src.name || 'Source ' + (sIdx + 1)}`,
                url: srcUrl,
                category,
                logo,
                description,
                author,
                version,
                enabled: true,
                repoUrl: repo.url,
              });
            }
          });
        }
      });

      this.items = this.items.filter((i) => i.repoUrl !== repo.url).concat(parsedItems);
      repo.status = 'success';
      repo.lastSync = new Date().toISOString();
      repo.itemCount = parsedItems.length;
      this.save();
      return true;
    } catch (err: any) {
      repo.status = 'error';
      repo.errorMessage = err.message || 'Failed to fetch CloudStream repository';
      this.save();
      return false;
    }
  }

  public async fetchAllRepos(): Promise<void> {
    for (const r of this.repos) {
      await this.fetchSingleRepo(r.id);
    }
  }

  public addItem(data: {
    name: string;
    url: string;
    category?: string;
    logo?: string;
    description?: string;
  }): CloudStreamItem {
    const newItem: CloudStreamItem = {
      id: `cs_custom_${Date.now()}`,
      name: data.name,
      url: data.url,
      category: data.category || 'Custom Live',
      logo: data.logo || '',
      description: data.description || 'Manually added CloudStream item',
      enabled: true,
      isCustom: true,
      repoUrl: 'custom',
    };
    this.items.push(newItem);
    this.save();
    return newItem;
  }

  public updateItem(id: string, updates: Partial<CloudStreamItem>): CloudStreamItem | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;
    Object.assign(item, updates);
    this.save();
    return item;
  }

  public deleteItem(id: string): boolean {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.items.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  public generateM3U(baseUrl?: string): string {
    const lines: string[] = [
      '#EXTM3U url-tvg="https://avkb.short.gy/jioepg.xml.gz" x-tvg-url="https://epgshare01.online/epgshare01/epg_ripper_IN4.xml.gz" refresh="300"',
      '#EXT-X-VERSION:3',
      '# Nexus CloudStream & Live Events Master Playlist (OTT Navigator & TiviMate)',
      `# Generated: ${new Date().toISOString()}`,
    ];

    const activeItems = this.items.filter((i) => i.enabled);

    for (const item of activeItems) {
      const group = item.category || 'CloudStream Live';
      const name = item.name;
      const logo = item.logo || '';
      const tvgId = item.id;

      let ext = [`#EXTINF:-1`, `tvg-id="${tvgId}"`, `tvg-name="${name}"`];
      if (logo) ext.push(`tvg-logo="${logo}"`);
      ext.push(`group-title="${group}"`);

      lines.push(`${ext.join(' ')},${name}`);
      lines.push(item.url);
    }

    return lines.join('\n');
  }
}

export const cloudstreamService = new CloudStreamService();
