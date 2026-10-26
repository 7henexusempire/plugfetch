import React, { useState, useEffect } from 'react';
import { RefreshCw, Radio, CheckCircle2, AlertCircle, Clock, Layers, Upload, Settings } from 'lucide-react';
import { SyncStatus } from '../types';
import { CartelLogo } from './CartelLogo';

interface HeaderProps {
  status: SyncStatus | null;
  isSyncing: boolean;
  onSync: () => Promise<void>;
  onOpenSettings: () => void;
  onOpenSources: () => void;
  onOpenUpload: () => void;
  activeTab: string;
  onSelectTab: (tab: 'channels' | 'groups' | 'aninexus' | 'raw') => void;
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
      setTimeLeft(status?.autoSync ? 'Calculating...' : 'Manual only');
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const next = new Date(status.nextSyncTime!).getTime();
      const diff = next - now;

      if (diff <= 0) {
        setTimeLeft('Syncing now...');
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

  const formatLastSync = (timeStr: string | null) => {
    if (!timeStr) return 'Never';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const sourcesCount = status?.sources?.length || 0;
  const activeSourcesCount = status?.sources?.filter((s) => s.enabled).length || 0;

  return (
    <header className="border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Brand */}
          <div className="cursor-pointer" onClick={() => onSelectTab('channels')}>
            <CartelLogo size="md" showText={true} />
          </div>

          {/* Sync Status Badge & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Countdown Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next Refresh:</span>
              <span className="font-mono text-cyan-300 font-bold">{timeLeft}</span>
            </div>

            {/* Status indicator */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  status?.status === 'fetching' || isSyncing
                    ? 'bg-amber-400 animate-ping'
                    : status?.status === 'error'
                    ? 'bg-rose-500'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-slate-400 font-medium">
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 text-indigo-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
              title="Upload local .M3U file"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Upload .M3U</span>
            </button>

            {/* Playlists Button */}
            <button
              onClick={onOpenSources}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-200 text-xs font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Playlists</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-300">
                {activeSourcesCount}/{sourcesCount}
              </span>
            </button>

            {/* Sync Now Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isSyncing
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-cyan-600/30 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Studio Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
