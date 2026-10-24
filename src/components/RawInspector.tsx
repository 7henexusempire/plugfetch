import React, { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Download, ExternalLink, RefreshCw, Code2, Layers } from 'lucide-react';
import { PlaylistSource } from '../types';

interface RawInspectorProps {
  sources: PlaylistSource[];
}

export const RawInspector: React.FC<RawInspectorProps> = ({ sources }) => {
  const [activeTab, setActiveTab] = useState<'m3u' | 'json'>('m3u');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const fetchContent = async (tab: 'm3u' | 'json', srcId: string) => {
    setLoading(true);
    try {
      if (tab === 'm3u') {
        const url = `/api/preview-m3u?sourceId=${encodeURIComponent(srcId)}`;
        const res = await fetch(url);
        const data = await res.json();
        setContent(data.preview || '');
      } else {
        const url = srcId === 'all' ? '/api/playlist/all.json' : `/api/playlist/${encodeURIComponent(srcId)}.json`;
        const res = await fetch(url);
        const data = await res.json();
        setContent(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error(err);
      setContent('Error fetching output');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(activeTab, selectedSource);
  }, [activeTab, selectedSource]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredContent = search
    ? content
        .split('\n')
        .filter((line) => line.toLowerCase().includes(search.toLowerCase()))
        .join('\n')
    : content;

  const endpointUrl = activeTab === 'm3u'
    ? (selectedSource === 'all' ? '/api/playlist/all.m3u' : `/api/playlist/${selectedSource}.m3u`)
    : (selectedSource === 'all' ? '/api/playlist/all.json' : `/api/playlist/${selectedSource}.json`);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Format Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('m3u')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'm3u'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Served M3U Playlist</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'json'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>playlist.json</span>
            </button>
          </div>

          {/* Source Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">All Playlists Combined</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter preview lines..."
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 font-mono"
          />

          <button
            onClick={() => fetchContent(activeTab, selectedSource)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <a
            href={endpointUrl}
            target="_blank"
            rel="noreferrer"
            download={activeTab === 'm3u' ? `${selectedSource}.m3u` : undefined}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Open / Download</span>
          </a>
        </div>
      </div>

      {/* Editor / Inspector View */}
      <div className="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-300 max-h-[550px] overflow-auto select-all">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading output preview...</div>
        ) : (
          <pre className="whitespace-pre overflow-x-auto">{filteredContent}</pre>
        )}
      </div>

      <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          Showing {filteredContent.split('\n').length} preview lines
        </span>
        <span className="font-mono text-cyan-400">
          Endpoint: {endpointUrl}
        </span>
      </div>
    </div>
  );
};
