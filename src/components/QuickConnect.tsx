import React, { useState } from 'react';
import { Copy, Check, Download, Tv, Smartphone, Code, Layers, Sparkles, ExternalLink } from 'lucide-react';
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
  publicBaseUrl,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeGuide, setActiveGuide] = useState<'ott' | 'tivimate' | null>(null);

  const getOrigin = () => {
    if (publicBaseUrl) return publicBaseUrl.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const origin = getOrigin();
  const combinedM3uUrl = `${origin}/api/playlist/all.m3u`;
  const combinedJsonUrl = `${origin}/api/playlist/all.json`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 mb-8 shadow-xl shadow-black/40">
      {/* Top Banner & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              IPTV Ready · ClearKey DRM Preserved · 30m Auto-Sync
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Your Dedicated IPTV M3U &amp; JSON Endpoints
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Use the <strong className="text-cyan-300 font-semibold">Combined URL</strong> to get all playlists united in one stream list, or use <strong className="text-slate-200">separate URLs</strong> for each provider in OTT Navigator &amp; TiviMate.
          </p>
        </div>

        {/* Quick Stats Counter */}
        <div className="flex items-center gap-6 shrink-0 bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-xl">
          <div>
            <div className="text-2xl font-bold font-mono text-cyan-400">{activeChannels}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Active Channels</div>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-200">{sources.length}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Playlists</div>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-400">30m</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Auto-Sync</div>
          </div>
        </div>
      </div>

      {/* 1. MASTER COMBINED URL HERO CARD */}
      <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-blue-950/40 border-2 border-cyan-500/50 shadow-lg shadow-cyan-950/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                All-in-One Combined M3U URL (All {sources.length} Playlists Combined)
              </span>
              <span className="text-[10px] bg-cyan-900/60 border border-cyan-700 text-cyan-200 px-2 py-0.5 rounded font-mono font-bold">
                RECOMMENDED
              </span>
            </div>
            <div className="bg-slate-900 border border-cyan-800/60 rounded-xl px-3.5 py-2.5 font-mono text-xs text-cyan-300 truncate select-all">
              {combinedM3uUrl}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Contains all channels from Plugx VIP + Vaathala / Hotstar + SunNXT &amp; StreamX, refreshed every 30 mins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopy(combinedM3uUrl, 'combined-m3u')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-cyan-600/30"
            >
              {copiedKey === 'combined-m3u' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'combined-m3u' ? 'Copied M3U!' : 'Copy Combined M3U'}</span>
            </button>

            <button
              onClick={() => handleCopy(combinedJsonUrl, 'combined-json')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all active:scale-95"
            >
              {copiedKey === 'combined-json' ? <Check className="w-4 h-4 text-emerald-300" /> : <Code className="w-4 h-4" />}
              <span>{copiedKey === 'combined-json' ? 'Copied JSON!' : 'Copy JSON'}</span>
            </button>

            <a
              href="/api/playlist/all.m3u"
              download="playlist-all.m3u"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              title="Download Combined .m3u"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. NEXUSEMPIRE MASTER URL CARD */}
      <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-950 to-purple-950/40 border border-indigo-500/40 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                NexusEmpire Master Catalog (For AniTv &amp; StreamBox)
              </span>
              <span className="text-[10px] bg-indigo-900/60 border border-indigo-700 text-indigo-200 px-2 py-0.5 rounded font-mono font-bold">
                ZERO DUPLICATES
              </span>
            </div>
            <div className="bg-slate-900 border border-indigo-800/60 rounded-xl px-3.5 py-2.5 font-mono text-xs text-indigo-300 truncate select-all">
              {`${origin}/api/nexusempire/all.m3u`}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Includes Zee, JioTV, Match Events, Sony, Star Sports, Willow, and custom categories with smart stream variant preservation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopy(`${origin}/api/nexusempire/all.m3u`, 'nexusempire_master')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              {copiedKey === 'nexusempire_master' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'nexusempire_master' ? 'Copied URL!' : 'Copy NexusEmpire M3U'}</span>
            </button>
            <a
              href="/api/nexusempire/all.m3u"
              download="nexusempire_master.m3u"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. INDIVIDUAL SEPARATE PLAYLIST URLS */}
      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span>Separate Individual Playlist URLs ({sources.length} Sources)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sources.map((src) => {
            const slug = src.slug || src.id;
            const m3uUrl = `${origin}/api/playlist/${slug}.m3u`;
            const jsonUrl = `${origin}/api/playlist/${slug}.json`;

            return (
              <div
                key={src.id}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm truncate" title={src.name}>
                        {src.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono text-cyan-400">{src.channelCount} channels</span>
                        <span>·</span>
                        <span className={src.status === 'success' ? 'text-emerald-400' : 'text-slate-500'}>
                          {src.status === 'success' ? 'Active' : src.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                      /{slug}.m3u
                    </span>
                  </div>

                  {/* URL Snippet */}
                  <div className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-300 truncate select-all my-2">
                    {m3uUrl}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80 mt-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(m3uUrl, `m3u-${src.id}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition-colors"
                      title="Copy M3U URL"
                    >
                      {copiedKey === `m3u-${src.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `m3u-${src.id}` ? 'Copied' : 'M3U'}</span>
                    </button>

                    <button
                      onClick={() => handleCopy(jsonUrl, `json-${src.id}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-medium transition-colors"
                      title="Copy JSON URL"
                    >
                      {copiedKey === `json-${src.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Code className="w-3 h-3" />}
                      <span>JSON</span>
                    </button>
                  </div>

                  <a
                    href={`/api/playlist/${slug}.m3u`}
                    download={`${src.id}.m3u`}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Download .m3u"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guide Toggles */}
      <div className="flex items-center justify-end gap-3 mt-4 text-xs">
        <button
          onClick={() => setActiveGuide(activeGuide === 'ott' ? null : 'ott')}
          className={`text-slate-400 hover:text-cyan-300 transition-colors ${
            activeGuide === 'ott' ? 'text-cyan-400 font-semibold underline' : ''
          }`}
        >
          OTT Navigator Setup
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => setActiveGuide(activeGuide === 'tivimate' ? null : 'tivimate')}
          className={`text-slate-400 hover:text-cyan-300 transition-colors ${
            activeGuide === 'tivimate' ? 'text-cyan-400 font-semibold underline' : ''
          }`}
        >
          TiviMate Setup
        </button>
      </div>

      {/* Expandable Setup Guides */}
      {activeGuide && (
        <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 animate-fadeIn">
          {activeGuide === 'ott' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  How to setup in OTT Navigator IPTV:
                </h4>
                <button onClick={() => setActiveGuide(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                <li>Open <strong>OTT Navigator</strong> on your Android TV, Fire TV, or Phone.</li>
                <li>Go to <strong>Settings</strong> &gt; <strong>Provider</strong> &gt; <strong>Add provider</strong>.</li>
                <li>Choose <strong>Playlist</strong> &gt; Select <strong>Enter URL</strong>.</li>
                <li>Paste the <strong>Combined M3U URL</strong>: <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded font-mono">{combinedM3uUrl}</code></li>
                <li>Or add any of the individual separate URLs if you prefer distinct providers!</li>
                <li>Under <strong>Auto-reload playlist</strong>, set to <strong>Every 30 minutes</strong> or <strong>Every hour</strong>.</li>
                <li>Save and reload. All channels with DRM ClearKey &amp; DASH will play smoothly.</li>
              </ol>
            </div>
          )}

          {activeGuide === 'tivimate' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  How to setup in TiviMate IPTV:
                </h4>
                <button onClick={() => setActiveGuide(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                <li>Launch <strong>TiviMate IPTV Player</strong>.</li>
                <li>Go to <strong>Settings</strong> &gt; <strong>Playlists</strong> &gt; <strong>Add Playlist</strong>.</li>
                <li>Select <strong>M3U Playlist</strong> &gt; <strong>Enter URL</strong>.</li>
                <li>Paste your Combined URL: <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded font-mono">{combinedM3uUrl}</code></li>
                <li>Give your playlist a name and click <strong>Next</strong>.</li>
                <li>Enable <strong>Auto-update playlist on app start</strong> and <strong>Update playlist on interval (e.g. 1 hour)</strong>.</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
