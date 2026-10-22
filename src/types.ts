export interface ChannelItem {
  id: string;
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
  directives: string[];
  hasClearKey?: boolean;
  clearKeySnippet?: string;
  customName?: string;
  customGroup?: string;
  customLogo?: string;
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

export interface PlaylistSettings {
  upstreamUrl: string;
  syncIntervalMinutes: number;
  autoSync: boolean;
  userAgent: string;
  removeGroupPrefix: string;
  customTvgUrl: string;
}
