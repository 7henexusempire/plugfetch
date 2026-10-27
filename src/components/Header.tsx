import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Clock,
  Layers,
  Upload,
  Settings,
  ShieldCheck,
  Tv,
  Sparkles,
  Radio,
  FileCode,
  Flame,
  Globe,
  RadioTower,
} from 'lucide-react';
import { SyncStatus } from '../types';
import { NexusLogo } from './NexusLogo';

export type AppTab =
  | 'channels'
  | 'nexusempire'
  | 'rebuild'
  | 'cloudstream'
  | 'skystream'
  | 'stremio'
  | 'groups'
  | 'raw';

interface HeaderProps {
  status: SyncStatus | null;
  isSyncing: boolean;
  onSync: () => Promise<void>;
  onOpenSettings: () => void;
  onOpenSources: () => void;
  onOpenUpload: () => void;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isSyncing,
  onSync,
  onOpenSettings,
  onOpenSources,
  onOpenUpload,
  activeTab,
  onSelectTab,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!status?.nextSyncTime || !status.autoSync) {
      setTimeLeft(status?.autoSync ? 'Auto' : 'Manual');
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const next = new Date(status.nextSyncTime!).getTime();
      const diff = next - now;

      if (diff <= 0) {
        setTimeLeft('Syncing...');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status?.nextSyncTime, status?.autoSync]);

  const sourcesCount = status?.sources?.length || 0;
  const activeSourcesCount = status?.sources?.filter((s) => s.enabled).length || 0;
  const dedupStats = status?.dedupStats;

  const tabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'channels', label: 'All Streams', icon: <Tv className="w-3.5 h-3.5" /> },
    { id: 'nexusempire', label: 'Nexus Empire', icon: <Radio className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'rebuild', label: 'Nexus Rebuild', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />, badge: 'PRO' },
    { id: 'cloudstream', label: 'CloudStream', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
    { id: 'skystream', label: 'SkyStream', icon: <Globe className="w-3.5 h-3.5 text-amber-300" />, badge: 'NEW' },
    { id: 'stremio', label: 'Nuvio / Stremio', icon: <RadioTower className="w-3.5 h-3.5 text-yellow-400" />, badge: 'BRIDGE' },
    { id: 'groups', label: 'Categories', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'raw', label: 'Inspect M3U', icon: <FileCode className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-40 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          {/* Logo & Brand */}
          <div
            className="cursor-pointer group flex items-center gap-3 transition-transform active:scale-95"
            onClick={() => onSelectTab('channels')}
          >
            <NexusLogo size="md" showText={true} />
          </div>

          {/* Action Controls & Indicators */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Deduplication Shield */}
            {dedupStats && dedupStats.exactDuplicatesRemoved > 0 && (
              <div
                className="hidden xl:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-400/30 px-2.5 py-1.5 rounded-xl text-[11px] text-emerald-300 backdrop-blur-sm"
                title={`${dedupStats.exactDuplicatesRemoved} duplicates filtered.`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">{dedupStats.exactDuplicatesRemoved} Dups Filtered</span>
              </div>
            )}

            {/* Next Refresh Timer */}
            <div className="hidden lg:flex items-center gap-2 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl text-xs text-slate-300 backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Refresh:</span>
              <span className="font-mono text-amber-300 font-bold">{timeLeft}</span>
            </div>

            {/* Status indicator */}
            <div className="hidden md:flex items-center gap-1.5 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-xl text-xs backdrop-blur-sm">
              <span
                className={`w-2 h-2 rounded-full ${
                  status?.status === 'fetching' || isSyncing
                    ? 'bg-amber-400 animate-ping'
                    : status?.status === 'error'
                    ? 'bg-rose-500'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {status?.status === 'fetching' || isSyncing
                  ? 'Syncing'
                  : status?.status === 'error'
                  ? 'Warning'
                  : 'Live Relay'}
              </span>
            </div>

            {/* Upload .M3U */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-amber-400/50 text-amber-200 hover:text-white text-xs font-semibold transition-all backdrop-blur-sm"
              title="Upload local .M3U file"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Playlists Button */}
            <button
              onClick={onOpenSources}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-amber-400/50 text-slate-200 text-xs font-medium transition-all backdrop-blur-sm"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Playlists</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold">
                {activeSourcesCount}/{sourcesCount}
              </span>
            </button>

            {/* Sync Now Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg backdrop-blur-sm ${
                isSyncing
                  ? 'bg-white/[0.05] text-slate-400 cursor-not-allowed border border-white/10'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold border border-amber-300/40 shadow-amber-500/25 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-amber-400/40 text-slate-300 hover:text-white transition-all backdrop-blur-sm"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sleek Translucent Navigation Bar */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2.5 pt-1 scrollbar-none no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 backdrop-blur-md ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-400/60 shadow-lg shadow-amber-950/40'
                    : 'bg-black/20 hover:bg-white/[0.06] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase tracking-wider ${
                      tab.badge === 'PRO'
                        ? 'bg-amber-500/25 border border-amber-400/50 text-amber-300'
                        : tab.badge === 'NEW'
                        ? 'bg-yellow-500/20 border border-yellow-400/40 text-yellow-300'
                        : 'bg-orange-500/20 border border-orange-400/40 text-orange-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

