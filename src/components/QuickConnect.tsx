import React, { useState } from 'react';
import {
  Copy,
  Check,
  Radio,
  Tv,
  Layers,
  Sparkles,
  ExternalLink,
  Flame,
  Globe,
  RadioTower,
  Zap,
} from 'lucide-react';
import { PlaylistSource } from '../types';

interface QuickConnectProps {
  totalChannels: number;
  activeChannels: number;
  totalGroups: number;
  sources: PlaylistSource[];
  publicBaseUrl?: string;
}

export const QuickConnect: React.FC<QuickConnectProps> = ({
  totalChannels,
  activeChannels,
  totalGroups,
  sources,
  publicBaseUrl = '',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Clean base URL without port :8443
  const cleanBase = (
    publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://thenexusempire.com')
  ).replace(/:8443$/, '');

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const activeSources = sources.filter((s) => s.enabled);

  const quickLinks = [
    {
      key: 'all_m3u',
      label: 'All Channels M3U',
      badge: 'MAIN',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      url: `${cleanBase}/playlist.m3u`,
      hint: 'Primary IPTV Playlist for OTT Navigator, TiviMate, VLC',
    },
    {
      key: 'cloudstream_m3u',
      label: 'CloudStream M3U',
      badge: 'LIVE',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
      url: `${cleanBase}/cloudstream.m3u`,
      hint: 'Cricfy, SKTech, and 40+ CloudStream extensions',
    },
    {
      key: 'skystream_m3u',
      label: 'SkyStream Universe M3U',
      badge: 'UNIVERSE',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
      url: `${cleanBase}/skystream.m3u`,
      hint: 'SkyStream shortcode & extensions provider feed',
    },
    {
      key: 'cncverse_m3u',
      label: 'CNCVerse-Bridge M3U',
      badge: 'BRIDGE',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      url: `${cleanBase}/cncverse.m3u`,
      hint: 'Direct live sports feed from cncverse.dpdns.org',
    },
  ];

  return (
    <div className="mb-6 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 p-4 sm:p-5 shadow-2xl transition-all">
      {/* Upper Stats Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/25 to-yellow-500/15 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/30">
            <Radio className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Nexus Empire Relay & Gateway
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Production host: <span className="text-amber-300 font-mono font-semibold">{cleanBase}</span> (clean domain, no port)
            </p>
          </div>
        </div>

        {/* Live Channel Stats Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2 text-xs">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Streams:</span>
            <span className="text-white font-bold">{totalChannels.toLocaleString()}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2 text-xs">
            <Layers className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-slate-400">Groups:</span>
            <span className="text-white font-bold">{totalGroups}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Playlists:</span>
            <span className="text-amber-300 font-bold">{activeSources.length}</span>
          </div>
        </div>
      </div>

      {/* Quick Stream Copy Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {quickLinks.map((item) => (
          <div
            key={item.key}
            className="group p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  {item.label}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold uppercase tracking-wider ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">{item.hint}</p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-white/5">
              <span className="font-mono text-[11px] text-slate-300 truncate max-w-[170px] select-all">
                {item.url}
              </span>
              <button
                onClick={() => copyToClipboard(item.url, item.key)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-amber-500/20 text-xs font-medium text-slate-200 hover:text-amber-200 border border-white/10 hover:border-amber-400/40 transition-all shrink-0 active:scale-95"
                title="Copy clean playlist URL"
              >
                {copiedKey === item.key ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span className="text-[11px]">{copiedKey === item.key ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
