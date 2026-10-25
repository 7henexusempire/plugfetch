export interface PlaylistSource {
  id: string;
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
  preDirectives: string[]; // Directives before #EXTINF (e.g. SunNXT ClearKeys #KODIPROP)
  postDirectives: string[]; // Directives between #EXTINF and URL (#EXTVLCOPT, #EXTHTTP, cookies, hmac)
  directives: string[]; // Combined list for backward compatibility
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
