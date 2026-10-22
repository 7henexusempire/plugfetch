import React, { useState } from 'react';
import { Copy, Check, Download, Tv, Smartphone, HelpCircle, Code, ShieldCheck, Flame } from 'lucide-react';

interface QuickConnectProps {
  totalChannels: number;
  activeChannels: number;
  totalGroups: number;
}

export const QuickConnect: React.FC<QuickConnectProps> = ({
  totalChannels,
  activeChannels,
  totalGroups,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeGuide, setActiveGuide] = useState<'ott' | 'tivimate' | 'json' | null>(null);

  const getOrigin = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const m3uUrl = `${getOrigin()}/api/playlist.m3u`;
  const m3u8Url = `${getOrigin()}/api/playlist.m3u8`;
  const jsonUrl = `${getOrigin()}/api/playlist.json`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownload = () => {
    window.location.href = '/api/playlist.m3u';
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 mb-8 shadow-xl shadow-black/40">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              IPTV Ready · ClearKey DRM Preserved
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Your Dedicated IPTV M3U &amp; JSON Endpoints
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Plug these URLs into <span className="text-slate-200 font-medium">OTT Navigator</span>, <span className="text-slate-200 font-medium">TiviMate</span>, or any IPTV player. 
            All stream tokens, cookies, and ClearKeys are auto-refreshed every 30 minutes.
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
            <div className="text-2xl font-bold font-mono text-slate-200">{totalGroups}</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Categories</div>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-400">30m</div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Auto-Sync</div>
          </div>
        </div>
      </div>

      {/* URL Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* M3U Playlist URL */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Primary M3U Playlist URL (TiviMate &amp; OTT)
                </span>
              </div>
              <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded font-mono">
                M3U / M3U8
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 font-mono text-xs text-cyan-300 truncate select-all">
              {m3uUrl}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(m3uUrl, 'm3u')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-all active:scale-95 shadow-sm shadow-cyan-600/30"
              >
                {copiedKey === 'm3u' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'm3u' ? 'Copied URL!' : 'Copy M3U URL'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                title="Download playlist.m3u to your computer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveGuide(activeGuide === 'ott' ? null : 'ott')}
                className={`text-slate-400 hover:text-cyan-300 transition-colors underline-offset-4 ${
                  activeGuide === 'ott' ? 'text-cyan-400 underline font-semibold' : ''
                }`}
              >
                OTT Guide
              </button>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => setActiveGuide(activeGuide === 'tivimate' ? null : 'tivimate')}
                className={`text-slate-400 hover:text-cyan-300 transition-colors underline-offset-4 ${
                  activeGuide === 'tivimate' ? 'text-cyan-400 underline font-semibold' : ''
                }`}
              >
                TiviMate Guide
              </button>
            </div>
          </div>
        </div>

        {/* JSON Playlist URL */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Playlist JSON Endpoint (Data &amp; API)
                </span>
              </div>
              <span className="text-[10px] bg-blue-950 border border-blue-800 text-blue-300 px-2 py-0.5 rounded font-mono">
                JSON API
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 font-mono text-xs text-blue-300 truncate select-all">
              {jsonUrl}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(jsonUrl, 'json')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all active:scale-95 shadow-sm shadow-blue-600/30"
              >
                {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'json' ? 'Copied URL!' : 'Copy JSON URL'}</span>
              </button>

              <a
                href="/api/playlist.json"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <span>View Raw</span>
              </a>
            </div>

            <button
              onClick={() => setActiveGuide(activeGuide === 'json' ? null : 'json')}
              className={`text-xs text-slate-400 hover:text-blue-300 transition-colors underline-offset-4 ${
                activeGuide === 'json' ? 'text-blue-400 underline font-semibold' : ''
              }`}
            >
              API Spec
            </button>
          </div>
        </div>
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
                <li>Paste your M3U URL: <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded font-mono">{m3uUrl}</code></li>
                <li>Set <strong>Playlist title</strong> (e.g. <em>My VIP Playlist</em>).</li>
                <li>Under <strong>Auto-reload playlist</strong>, set to <strong>Every 30 minutes</strong> or <strong>Every hour</strong> so OTT Navigator always has the freshest tokens.</li>
                <li>Save and reload. All 1,600+ channels and ClearKey DASH/HLS streams will load instantly!</li>
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
                <li>Paste your M3U URL: <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded font-mono">{m3uUrl}</code></li>
                <li>Give your playlist a name and click <strong>Next</strong>.</li>
                <li>Under <strong>Playlist Settings</strong>, enable <strong>Auto-update playlist on app start</strong> and <strong>Update playlist on interval (e.g. 1 hour)</strong>.</li>
                <li>Done! TiviMate will display your customized channel groups, names, and stream metadata.</li>
              </ol>
            </div>
          )}

          {activeGuide === 'json' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  Playlist JSON Endpoint Details:
                </h4>
                <button onClick={() => setActiveGuide(null)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <p className="mb-2 text-slate-400">
                You can fetch <code className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded font-mono">{jsonUrl}</code> from your own custom apps, scripts, or Kodi add-ons.
              </p>
              <div className="bg-slate-900 border border-slate-800 p-3 rounded font-mono text-[11px] text-slate-300 overflow-x-auto">
{`{
  "service": "IPTV Stream Relay & Playlist Studio",
  "generatedAt": "2026-10-22T...",
  "totalChannels": ${totalChannels},
  "activeChannels": ${activeChannels},
  "channels": [
    {
      "id": "1132",
      "tvgId": "1132",
      "displayName": "Star Plus HD",
      "group": "Entertainment",
      "logo": "https://...",
      "streamUrl": "https://.../index.mpd",
      "hasClearKey": true,
      "directives": ["#KODIPROP:...", "#EXTVLCOPT:..."]
    }
  ]
}`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
