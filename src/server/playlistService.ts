import fs from 'fs';
import path from 'path';

export interface ChannelItem {
  id: string; // unique identifier (tvg-id or slug)
  tvgId: string;
  tvgName: string;
  tvgLogo: string;
  tvgCategory: string;
  groupTitle: string;
  groupLogo?: string;
  type?: string;
  tvgChno?: string;
  name: string; // original name
  url: string; // stream url
  directives: string[]; // Kodi/VLC/ClearKey options (#KODIPROP, #EXTVLCOPT, #EXTHTTP, # clearkeys)
  hasClearKey?: boolean;
  clearKeySnippet?: string;
  
  // User overrides
  customName?: string;
  customGroup?: string;
  customLogo?: string;
  customChno?: string;
  customUrl?: string;
  enabled: boolean;
  isCustom?: boolean;
}

export interface PlaylistSettings {
  upstreamUrl: string;
  syncIntervalMinutes: number;
  autoSync: boolean;
  userAgent: string;
  removeGroupPrefix: string;
  customTvgUrl: string;
}

export interface CustomizationData {
  channelOverrides: Record<string, {
    customName?: string;
    customGroup?: string;
    customLogo?: string;
    customChno?: string;
    customUrl?: string;
    enabled?: boolean;
  }>;
  groupRenames: Record<string, string>;
  groupVisibility: Record<string, boolean>;
  customChannels: ChannelItem[];
  settings: PlaylistSettings;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  totalChannels: number;
  activeChannels: number;
  totalGroups: number;
  upstreamUrl: string;
  syncIntervalMinutes: number;
  autoSync: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, 'playlist-cache.json');
const CUSTOMIZATIONS_FILE = path.join(DATA_DIR, 'customizations.json');

const DEFAULT_SETTINGS: PlaylistSettings = {
  upstreamUrl: 'https://plugxvipplaylist.lovable.app/api/playlist',
  syncIntervalMinutes: 30,
  autoSync: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 IPTV/1.0',
  removeGroupPrefix: '',
  customTvgUrl: '',
};

class PlaylistService {
  private channels: ChannelItem[] = [];
  private headerDirectives: string[] = [];
  private settings: PlaylistSettings = { ...DEFAULT_SETTINGS };
  private channelOverrides: CustomizationData['channelOverrides'] = {};
  private groupRenames: Record<string, string> = {};
  private groupVisibility: Record<string, boolean> = {};
  private customChannels: ChannelItem[] = [];

  private lastSyncTime: Date | null = null;
  private nextSyncTime: Date | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private syncStatus: 'idle' | 'fetching' | 'success' | 'error' = 'idle';
  private errorMessage: string | null = null;
  private isInitialized = false;

  constructor() {
    this.ensureDataDir();
    this.loadCustomizations();
    this.loadCachedPlaylist();
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
        if (data.channelOverrides) this.channelOverrides = data.channelOverrides;
        if (data.groupRenames) this.groupRenames = data.groupRenames;
        if (data.groupVisibility) this.groupVisibility = data.groupVisibility;
        if (data.customChannels) this.customChannels = data.customChannels;
        if (data.settings) this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      }
    } catch (err) {
      console.error('Failed to load customizations:', err);
    }
  }

  private saveCustomizations() {
    this.ensureDataDir();
    try {
      const data: CustomizationData = {
        channelOverrides: this.channelOverrides,
        groupRenames: this.groupRenames,
        groupVisibility: this.groupVisibility,
        customChannels: this.customChannels,
        settings: this.settings,
      };
      fs.writeFileSync(CUSTOMIZATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save customizations:', err);
    }
  }

  private loadCachedPlaylist() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cache = JSON.parse(raw);
        if (Array.isArray(cache.channels)) {
          this.channels = cache.channels;
          this.headerDirectives = cache.headerDirectives || [];
          this.lastSyncTime = cache.lastSyncTime ? new Date(cache.lastSyncTime) : null;
          this.applyCustomizations();
        }
      }
    } catch (err) {
      console.error('Failed to load cached playlist:', err);
    }
  }

  private saveCachedPlaylist() {
    this.ensureDataDir();
    try {
      const cache = {
        lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
        headerDirectives: this.headerDirectives,
        channels: this.channels,
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
    } catch (err) {
      console.error('Failed to save cached playlist:', err);
    }
  }

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initial fetch if no cached channels or if cached data is empty
    if (this.channels.length === 0) {
      await this.fetchUpstream();
    } else {
      // Background re-fetch to ensure fresh tokens
      this.fetchUpstream().catch((e) => console.error('Initial background fetch error:', e));
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
      console.log(`[Sync Worker] Auto-sync triggered at ${new Date().toISOString()}`);
      await this.fetchUpstream();
      this.nextSyncTime = new Date(Date.now() + intervalMs);
    }, intervalMs);
  }

  public async fetchUpstream(): Promise<{ success: boolean; message: string; count: number }> {
    this.syncStatus = 'fetching';
    this.errorMessage = null;

    try {
      console.log(`[PlaylistService] Fetching from ${this.settings.upstreamUrl}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout for large playlists

      const response = await fetch(this.settings.upstreamUrl, {
        headers: {
          'User-Agent': this.settings.userAgent || DEFAULT_SETTINGS.userAgent,
          'Accept': '*/*',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upstream returned HTTP ${response.status}: ${response.statusText}`);
      }

      const m3uText = await response.text();
      if (!m3uText.includes('#EXTM3U') && !m3uText.includes('#EXTINF')) {
        throw new Error('Received content is not a valid M3U playlist format');
      }

      this.parseM3U(m3uText);
      this.lastSyncTime = new Date();
      this.syncStatus = 'success';
      this.saveCachedPlaylist();

      const total = this.getAllChannels().length;
      console.log(`[PlaylistService] Successfully fetched & parsed ${total} channels`);
      return { success: true, message: `Successfully synced ${total} channels`, count: total };
    } catch (err: any) {
      console.error('[PlaylistService] Fetch error:', err);
      this.syncStatus = 'error';
      this.errorMessage = err.message || 'Unknown fetch error';
      return { success: false, message: this.errorMessage || 'Fetch failed', count: this.channels.length };
    }
  }

  private parseM3U(content: string) {
    const rawLines = content.split(/\r?\n/);
    const parsedChannels: ChannelItem[] = [];
    const headerDirectives: string[] = [];

    let currentInf: {
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

    let currentDirectives: string[] = [];
    let hasSeenExtInf = false;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      if (!hasSeenExtInf) {
        if (line.startsWith('#EXTM3U')) {
          headerDirectives.push(line);
          continue;
        }
        if (line.startsWith('#') && !line.startsWith('#EXTINF')) {
          headerDirectives.push(line);
          continue;
        }
      }

      if (line.startsWith('#EXTINF:')) {
        hasSeenExtInf = true;
        // If we already had an unclosed INF without a URL, push or reset
        currentInf = this.parseExtInfLine(line);
        currentDirectives = [];
      } else if (line.startsWith('#')) {
        // Kodi/VLC directive or clearkey note
        currentDirectives.push(line);
      } else if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('udp://')) {
        // Stream URL found
        if (currentInf) {
          const channelId = currentInf.tvgId || `${currentInf.name.replace(/[^a-zA-Z0-9]/g, '_')}_${parsedChannels.length + 1}`;
          
          let hasClearKey = false;
          let clearKeySnippet = '';
          const clearkeyDirective = currentDirectives.find((d) => d.includes('license_key') || d.includes('clearkey'));
          if (clearkeyDirective) {
            hasClearKey = true;
            clearKeySnippet = clearkeyDirective;
          }

          parsedChannels.push({
            id: channelId,
            tvgId: currentInf.tvgId,
            tvgName: currentInf.tvgName,
            tvgLogo: currentInf.tvgLogo,
            tvgCategory: currentInf.tvgCategory,
            groupTitle: currentInf.groupTitle || 'General',
            groupLogo: currentInf.groupLogo,
            type: currentInf.type,
            tvgChno: currentInf.tvgChno,
            name: currentInf.name,
            url: line,
            directives: currentDirectives,
            hasClearKey,
            clearKeySnippet,
            enabled: true,
          });

          currentInf = null;
          currentDirectives = [];
        }
      }
    }

    this.channels = parsedChannels;
    if (headerDirectives.length > 0) {
      this.headerDirectives = headerDirectives;
    }
    this.applyCustomizations();
  }

  private parseExtInfLine(line: string) {
    // Extract comma and channel title at end
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

    return {
      tvgId: getAttr('tvg-id'),
      tvgName: getAttr('tvg-name') || name,
      tvgLogo: getAttr('tvg-logo'),
      tvgCategory: getAttr('tvg-category'),
      groupTitle: getAttr('group-title') || 'General',
      groupLogo: getAttr('group-logo'),
      type: getAttr('type'),
      tvgChno: getAttr('tvg-chno'),
      name: name || getAttr('tvg-name') || 'Unnamed Channel',
    };
  }

  private applyCustomizations() {
    for (const channel of this.channels) {
      const override = this.channelOverrides[channel.id] || this.channelOverrides[channel.tvgId];
      if (override) {
        if (override.customName !== undefined) channel.customName = override.customName;
        if (override.customGroup !== undefined) channel.customGroup = override.customGroup;
        if (override.customLogo !== undefined) channel.customLogo = override.customLogo;
        if (override.customChno !== undefined) channel.customChno = override.customChno;
        if (override.customUrl !== undefined) channel.customUrl = override.customUrl;
        if (override.enabled !== undefined) channel.enabled = override.enabled;
      }

      // Check group renames
      const effectiveGroup = channel.customGroup || channel.groupTitle;
      if (this.groupRenames[effectiveGroup]) {
        channel.customGroup = this.groupRenames[effectiveGroup];
      }

      // Check group visibility
      const finalGroup = channel.customGroup || channel.groupTitle;
      if (this.groupVisibility[finalGroup] !== undefined && (override?.enabled === undefined)) {
        channel.enabled = this.groupVisibility[finalGroup];
      }
    }
  }

  public getAllChannels(): ChannelItem[] {
    const combined = [...this.channels];
    for (const custom of this.customChannels) {
      if (!combined.some((c) => c.id === custom.id)) {
        combined.push(custom);
      }
    }
    return combined;
  }

  public getGroups(): { name: string; count: number; enabledCount: number; isVisible: boolean }[] {
    const groupMap: Record<string, { total: number; enabled: number }> = {};
    const all = this.getAllChannels();

    for (const ch of all) {
      const group = ch.customGroup || ch.groupTitle || 'General';
      if (!groupMap[group]) {
        groupMap[group] = { total: 0, enabled: 0 };
      }
      groupMap[group].total++;
      if (ch.enabled) groupMap[group].enabled++;
    }

    return Object.entries(groupMap)
      .map(([name, stats]) => ({
        name,
        count: stats.total,
        enabledCount: stats.enabled,
        isVisible: this.groupVisibility[name] !== false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public updateChannel(id: string, updates: {
    customName?: string;
    customGroup?: string;
    customLogo?: string;
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
    const channel = this.channels.find((c) => c.id === id);
    if (channel) {
      delete this.channelOverrides[id];
      channel.customName = undefined;
      channel.customGroup = undefined;
      channel.customLogo = undefined;
      channel.customChno = undefined;
      channel.customUrl = undefined;
      channel.enabled = true;
      this.saveCustomizations();
      return true;
    }
    // If it was a custom channel, remove it
    const customIdx = this.customChannels.findIndex((c) => c.id === id);
    if (customIdx !== -1) {
      this.customChannels.splice(customIdx, 1);
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
      tvgId: channel.tvgId || id,
      tvgName: channel.name,
      tvgLogo: channel.logo || '',
      tvgCategory: channel.group,
      groupTitle: channel.group,
      name: channel.name,
      url: channel.url,
      tvgChno: channel.tvgChno,
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
    const oldUrl = this.settings.upstreamUrl;

    this.settings = { ...this.settings, ...newSettings };
    this.saveCustomizations();

    if (
      this.settings.syncIntervalMinutes !== oldInterval ||
      this.settings.autoSync !== oldAutoSync
    ) {
      this.scheduleNextSync();
    }

    if (newSettings.upstreamUrl && newSettings.upstreamUrl !== oldUrl) {
      this.fetchUpstream().catch((e) => console.error('Fetch on URL change failed:', e));
    }

    return this.settings;
  }

  public getStatus(): SyncStatus {
    const all = this.getAllChannels();
    const active = all.filter((c) => c.enabled);
    const groups = new Set(all.map((c) => c.customGroup || c.groupTitle));

    return {
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
      nextSyncTime: this.nextSyncTime ? this.nextSyncTime.toISOString() : null,
      status: this.syncStatus,
      errorMessage: this.errorMessage,
      totalChannels: all.length,
      activeChannels: active.length,
      totalGroups: groups.size,
      upstreamUrl: this.settings.upstreamUrl,
      syncIntervalMinutes: this.settings.syncIntervalMinutes,
      autoSync: this.settings.autoSync,
    };
  }

  /**
   * Generates the compliant M3U text for IPTV players (OTT Navigator, TiviMate, etc.)
   */
  public generateM3U(filterGroup?: string): string {
    const channels = this.getAllChannels().filter((c) => c.enabled);
    const filtered = filterGroup
      ? channels.filter((c) => (c.customGroup || c.groupTitle).toLowerCase() === filterGroup.toLowerCase())
      : channels;

    // Header line
    let header = '#EXTM3U';
    if (this.headerDirectives.length > 0) {
      // Use existing header if it has attributes like url-tvg, tvg-url
      const firstLine = this.headerDirectives[0];
      if (firstLine.startsWith('#EXTM3U')) {
        header = firstLine;
      }
    }

    if (this.settings.customTvgUrl) {
      header = `#EXTM3U url-tvg="${this.settings.customTvgUrl}" tvg-url="${this.settings.customTvgUrl}" refresh="3600"`;
    }

    const lines: string[] = [header];
    lines.push(`# Generated by IPTV Stream Relay & Playlist Studio | ${new Date().toISOString()}`);
    lines.push(`# Total Channels: ${filtered.length}`);

    // Add extra comment headers from original if any
    for (let i = 1; i < this.headerDirectives.length; i++) {
      lines.push(this.headerDirectives[i]);
    }

    for (const ch of filtered) {
      const displayName = ch.customName || ch.name;
      const groupTitle = ch.customGroup || ch.groupTitle || 'General';
      const logo = ch.customLogo || ch.tvgLogo || '';
      const tvgId = ch.tvgId || ch.id;
      const tvgName = ch.customName || ch.tvgName || displayName;
      const streamUrl = ch.customUrl || ch.url;
      const chno = ch.customChno || ch.tvgChno;

      let extInfParts = [`#EXTINF:-1`];
      if (tvgId) extInfParts.push(`tvg-id="${tvgId}"`);
      if (tvgName) extInfParts.push(`tvg-name="${tvgName}"`);
      if (logo) extInfParts.push(`tvg-logo="${logo}"`);
      if (ch.tvgCategory) extInfParts.push(`tvg-category="${ch.tvgCategory}"`);
      if (groupTitle) extInfParts.push(`group-title="${groupTitle}"`);
      if (ch.groupLogo) extInfParts.push(`group-logo="${ch.groupLogo}"`);
      if (chno) extInfParts.push(`tvg-chno="${chno}"`);
      if (ch.type) extInfParts.push(`type="${ch.type}"`);

      lines.push(`${extInfParts.join(' ')},${displayName}`);

      // Append all Kodi/TiviMate/OTT props (#KODIPROP, #EXTVLCOPT, #EXTHTTP, # clearkeys)
      if (ch.directives && ch.directives.length > 0) {
        for (const dir of ch.directives) {
          lines.push(dir);
        }
      }

      // Stream URL
      lines.push(streamUrl);
    }

    return lines.join('\n');
  }

  /**
   * Generates structured JSON representation of the playlist
   */
  public generateJSON(filterGroup?: string) {
    const all = this.getAllChannels();
    const channels = filterGroup
      ? all.filter((c) => (c.customGroup || c.groupTitle).toLowerCase() === filterGroup.toLowerCase())
      : all;

    return {
      service: 'IPTV Stream Relay & Playlist Studio',
      generatedAt: new Date().toISOString(),
      lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
      upstreamUrl: this.settings.upstreamUrl,
      totalChannels: channels.length,
      activeChannels: channels.filter((c) => c.enabled).length,
      groups: this.getGroups(),
      channels: channels.map((c) => ({
        id: c.id,
        tvgId: c.tvgId,
        tvgName: c.customName || c.tvgName,
        displayName: c.customName || c.name,
        originalName: c.name,
        group: c.customGroup || c.groupTitle,
        originalGroup: c.groupTitle,
        logo: c.customLogo || c.tvgLogo,
        streamUrl: c.customUrl || c.url,
        channelNumber: c.customChno || c.tvgChno || null,
        type: c.type || 'stream',
        hasClearKey: !!c.hasClearKey,
        enabled: c.enabled,
        isCustom: !!c.isCustom,
        directivesCount: c.directives.length,
        directives: c.directives,
      })),
    };
  }

  public exportBackup(): CustomizationData {
    return {
      channelOverrides: this.channelOverrides,
      groupRenames: this.groupRenames,
      groupVisibility: this.groupVisibility,
      customChannels: this.customChannels,
      settings: this.settings,
    };
  }

  public importBackup(backup: Partial<CustomizationData>): boolean {
    if (backup.channelOverrides) this.channelOverrides = backup.channelOverrides;
    if (backup.groupRenames) this.groupRenames = backup.groupRenames;
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
