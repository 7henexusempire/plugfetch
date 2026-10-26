export interface PlaylistSource {
  id: string; // Internal ID
  slug: string; // Custom URL slug (e.g. 'cartelx' -> /api/playlist/cartelx.m3u)
  name: string; // Display Name (e.g. 'CartelX VIP')
  url: string; // Remote URL or uploaded file reference
  type?: 'remote' | 'uploaded';
  filePath?: string;
  enabled: boolean; // Enable / disable this particular playlist
  lastSyncTime: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  channelCount: number;
}

export interface AniNexusItem {
  id: string;
  name: string;
  uri: string; // e.g. streambox://open/8003bfd97ec3d87c8df2280494c3aa26
  hash: string;
  m3uSlug: string; // e.g. 'zee' -> /api/aninexus/zee.m3u
  category: string;
  channelCount: number;
  status: 'ready' | 'fetching' | 'error';
  lastUpdated: string | null;
  logo: string;
  description: string;
  enabled: boolean;
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

export interface GroupInfo {
  name: string;
  count: number;
  enabledCount: number;
  isVisible: boolean;
  logo?: string;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  totalChannels: number;
  activeChannels: number;
  totalGroups: number;
  syncIntervalMinutes: number;
  autoSync: boolean;
  publicBaseUrl?: string;
  sources: PlaylistSource[];
  aninexus?: AniNexusItem[];
}

export interface PlaylistSettings {
  syncIntervalMinutes: number;
  autoSync: boolean;
  userAgent: string;
  customTvgUrl: string;
  publicBaseUrl: string;
  zeotvStripSuffix: boolean;
  zeotvRemoveGroupLogo: boolean;
  appTitle?: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  title: string;
  message?: string;
  duration?: number;
}
