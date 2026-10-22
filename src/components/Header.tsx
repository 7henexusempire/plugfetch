import React, { useState, useEffect } from 'react';
import { RefreshCw, Radio, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  status: SyncStatus | null;
  isSyncing: boolean;
  onSync: () => Promise<void>;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isSyncing,
  onSync,
  onOpenSettings,
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

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                IPTV Relay Studio
              </h1>
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                Live Fetcher
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Upstream: plugxvipplaylist</span>
              <span>·</span>
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Active Sync (Every {status?.syncIntervalMinutes || 30}m)
              </span>
            </p>
          </div>
        </div>

        {/* Sync Status & Action */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Metadata indicators */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Last:</span>
              <span className="text-slate-200 font-mono font-medium">
                {formatLastSync(status?.lastSyncTime || null)}
              </span>
            </div>
            <span>/</span>
            <div className="flex items-center gap-1.5">
              <span>Next Refresh:</span>
              <span className="text-cyan-300 font-mono font-medium">
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Sync status badge */}
          {status?.status === 'error' ? (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/50 border border-rose-800 px-2.5 py-1.5 rounded-lg" title={status.errorMessage || 'Error'}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[140px]">Sync failed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{status?.activeChannels || 0} / {status?.totalChannels || 0} Online</span>
            </div>
          )}

          {/* Sync Now button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              isSyncing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/25 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Fetching...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
