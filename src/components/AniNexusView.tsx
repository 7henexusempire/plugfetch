import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Tv,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Play,
  Layers,
  Radio,
  Share2,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AniNexusItem } from '../types';

interface AniNexusViewProps {
  onNotify: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  publicBaseUrl?: string;
  onPreviewChannel?: (channel: any) => void;
}

export const AniNexusView: React.FC<AniNexusViewProps> = ({
  onNotify,
  publicBaseUrl = '',
  onPreviewChannel,
}) => {
  const [items, setItems] = useState<AniNexusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [categoryChannels, setCategoryChannels] = useState<Record<string, any[]>>({});

  const baseUrl = publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/aninexus');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotify('success', `Copied ${label}`, text);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const toggleExpand = async (id: string, slug: string) => {
    if (expandedItem === id) {
      setExpandedItem(null);
      return;
    }
    setExpandedItem(id);

    if (!categoryChannels[id]) {
      try {
        const res = await fetch(`/api/aninexus/${slug}.json`);
        if (res.ok) {
          const data = await res.json();
          const category = data.categories?.find((c: any) => c.id === id);
          if (category?.channels) {
            setCategoryChannels((prev) => ({ ...prev, [id]: category.channels }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const masterM3uUrl = `${baseUrl}/api/aninexus/all.m3u`;
  const masterJsonUrl = `${baseUrl}/api/aninexus/all.json`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. ANINEXUS MASTER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl shadow-indigo-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span>AniTv &amp; StreamBox Protocol Bridge</span>
              </span>
              <span className="text-xs text-slate-400">· Auto-refresh every 30m</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>AniNexus</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 font-mono text-xl">
                ENGINE
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Native protocol resolver for <strong>AniTv</strong> and <strong>StreamBox</strong> (<code>streambox://open/&lt;hash&gt;</code>).
              Generates individual M3U playlists and one merged master bouquet with real-time stream token auto-refresh.
            </p>
          </div>

          {/* Master Links Box */}
          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 min-w-[300px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AniNexus Merged Master</span>
              </span>
              <span className="text-[10px] font-mono text-indigo-400 font-semibold bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800">
                7 Feeds
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1 font-mono">Master M3U URL:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={masterM3uUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(masterM3uUrl, 'AniNexus Master M3U', 'master-m3u')}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0"
                    title="Copy Master M3U"
                  >
                    {copiedKey === 'master-m3u' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1 font-mono">Master JSON URL:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={masterJsonUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(masterJsonUrl, 'AniNexus Master JSON', 'master-json')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                    title="Copy Master JSON"
                  >
                    {copiedKey === 'master-json' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHANNELS & FEEDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {items.map((item, idx) => {
          const itemM3uUrl = `${baseUrl}/api/aninexus/${item.m3uSlug}.m3u`;
          const itemJsonUrl = `${baseUrl}/api/aninexus/${item.m3uSlug}.json`;
          const isExpanded = expandedItem === item.id;
          const channels = categoryChannels[item.id] || [];

          return (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl transition-all duration-300 group hover:shadow-indigo-950/30"
            >
              <div>
                {/* Header with Logo and Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-indigo-500/60 transition-colors">
                      {item.logo ? (
                        <img
                          src={item.logo}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                        />
                      ) : (
                        <Tv className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-white text-sm tracking-tight">{item.name}</h4>
                      </div>
                      <span className="text-[11px] text-indigo-400 font-medium block">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0">
                    {item.channelCount > 0 ? `${item.channelCount} Streams` : 'Live Feed'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mb-3.5 leading-relaxed">
                  {item.description}
                </p>

                {/* Deep-link Box */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-purple-400" />
                      <span>AniTv / StreamBox URI:</span>
                    </span>
                    <a
                      href={item.uri}
                      className="text-[10px] text-purple-400 hover:text-purple-300 underline flex items-center gap-0.5"
                    >
                      <span>Launch</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <code className="flex-1 bg-slate-900 border border-slate-800/80 rounded px-2 py-1 text-[11px] text-purple-300 font-mono truncate">
                      {item.uri}
                    </code>
                    <button
                      onClick={() => copyToClipboard(item.uri, 'AniTv URI', `uri-${item.id}`)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Copy Deep Link"
                    >
                      {copiedKey === `uri-${item.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Dedicated M3U URL */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[10px] font-mono text-slate-400">Dedicated M3U Endpoint:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={itemM3uUrl}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(itemM3uUrl, `${item.name} M3U`, `m3u-${item.id}`)}
                      className="p-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors"
                      title="Copy M3U"
                    >
                      {copiedKey === `m3u-${item.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Channels accordion toggle */}
                {item.channelCount > 0 && (
                  <button
                    onClick={() => toggleExpand(item.id, item.m3uSlug)}
                    className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 hover:text-white transition-colors mb-2"
                  >
                    <span>{isExpanded ? 'Hide Stream List' : `View ${item.channelCount} Streams in Feed`}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}

                {/* Expanded Channels List */}
                {isExpanded && channels.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-950 border border-slate-800/80 rounded-xl mb-3 text-xs">
                    {channels.map((ch: any) => (
                      <div
                        key={ch.id}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {ch.logo && (
                            <img
                              src={ch.logo}
                              alt=""
                              className="w-4 h-4 object-contain shrink-0 rounded"
                              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                            />
                          )}
                          <span className="text-white truncate text-[11px] font-medium">{ch.name}</span>
                        </div>
                        {onPreviewChannel && (
                          <button
                            onClick={() => onPreviewChannel(ch)}
                            className="p-1 text-slate-400 hover:text-amber-400 shrink-0"
                            title="Play"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                <a
                  href={`/api/aninexus/${item.m3uSlug}.m3u`}
                  download={`${item.m3uSlug}.m3u`}
                  className="text-[11px] text-slate-400 hover:text-white font-medium"
                >
                  Download .m3u
                </a>
                <a
                  href={`/api/aninexus/${item.m3uSlug}.json`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <span>JSON Feed</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
