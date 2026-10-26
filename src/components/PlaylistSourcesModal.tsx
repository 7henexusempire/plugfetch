import React, { useState } from 'react';
import {
  X,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  ExternalLink,
  Layers,
  Tv,
  Copy,
  Upload,
  Power,
  Globe,
  FileCode,
} from 'lucide-react';
import { PlaylistSource } from '../types';

interface PlaylistSourcesModalProps {
  sources: PlaylistSource[];
  onClose: () => void;
  onAddSource: (source: { name: string; url: string; id?: string; slug?: string }) => Promise<void>;
  onUpdateSource: (id: string, updates: Partial<PlaylistSource>) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
  onSyncSource: (sourceId?: string) => Promise<void>;
  onOpenUploadModal: () => void;
}

export const PlaylistSourcesModal: React.FC<PlaylistSourcesModalProps> = ({
  sources,
  onClose,
  onAddSource,
  onUpdateSource,
  onDeleteSource,
  onSyncSource,
  onOpenUploadModal,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    await onAddSource({
      name: newName.trim(),
      url: newUrl.trim(),
      slug: newSlug.trim() || undefined,
    });
    setNewName('');
    setNewUrl('');
    setNewSlug('');
    setIsAdding(false);
  };

  const handleStartEdit = (s: PlaylistSource) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditSlug(s.slug || s.id);
    setEditUrl(s.url);
  };

  const handleSaveEdit = async (id: string) => {
    await onUpdateSource(id, {
      name: editName.trim(),
      slug: editSlug.trim(),
      url: editUrl.trim(),
    });
    setEditingId(null);
  };

  const handleSingleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await onSyncSource(id);
    } finally {
      setSyncingId(null);
    }
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/api/playlist/${slug}.m3u`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Playlist Sources &amp; Slugs</h3>
              <p className="text-xs text-slate-400">
                Rename playlists, customize URL slugs (e.g. <code>cartelx.m3u</code>), and toggle active sources
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .M3U</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Add New Source Bar */}
          {!isAdding ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Active Sources: <strong className="text-white">{sources.filter((s) => s.enabled).length}</strong> of {sources.length}
              </span>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md shadow-cyan-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Remote URL</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdd} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Add New Playlist Source</h4>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. CartelX Live"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    URL Slug (e.g. <code>cartelx</code> &rarr; <code>/api/playlist/cartelx.m3u</code>)
                  </label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="cartelx"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  M3U Stream URL
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://.../playlist.m3u"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save &amp; Fetch</span>
                </button>
              </div>
            </form>
          )}

          {/* Sources List */}
          <div className="space-y-3">
            {sources.map((s) => {
              const isSyncing = syncingId === s.id || s.status === 'fetching';
              const isEditing = editingId === s.id;
              const slug = s.slug || s.id;
              const dedicatedUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/playlist/${slug}.m3u`;

              return (
                <div
                  key={s.id}
                  className={`bg-slate-950/70 border rounded-2xl p-4 transition-all ${
                    s.enabled
                      ? 'border-slate-800 hover:border-slate-700'
                      : 'border-slate-900 opacity-60'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-900 border border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">
                            URL Slug (file: <code>{editSlug}.m3u</code>)
                          </label>
                          <input
                            type="text"
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            className="w-full bg-slate-900 border border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono"
                          />
                        </div>
                      </div>

                      {s.type !== 'uploaded' && (
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">Source URL</label>
                          <input
                            type="text"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(s.id)}
                          className="px-3.5 py-1 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* 1-Click Enable/Disable Power Switch */}
                          <button
                            onClick={() => onUpdateSource(s.id, { enabled: !s.enabled })}
                            className={`p-2 rounded-xl transition-colors ${
                              s.enabled
                                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-900'
                                : 'bg-slate-900 text-slate-600 border border-slate-800 hover:text-slate-400'
                            }`}
                            title={s.enabled ? 'Click to Disable Playlist' : 'Click to Enable Playlist'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{s.name}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-cyan-400 border border-slate-800">
                                {slug}.m3u
                              </span>
                              {s.type === 'uploaded' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                                  Hosted File
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-slate-400 font-mono block truncate max-w-md mt-0.5">
                              {s.url}
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              !s.enabled
                                ? 'bg-slate-900 text-slate-500 border border-slate-800'
                                : s.status === 'success'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : s.status === 'error'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {!s.enabled ? 'Disabled' : s.status}
                          </span>

                          <span className="text-xs font-mono font-semibold text-slate-300">
                            {s.channelCount} streams
                          </span>
                        </div>
                      </div>

                      {/* Dedicated Endpoint Link */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
                            IPTV Link:
                          </span>
                          <span className="text-xs text-cyan-300 font-mono truncate select-all">
                            {dedicatedUrl}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyUrl(slug)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                            title="Copy M3U URL"
                          >
                            {copiedSlug === slug ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedSlug === slug ? 'Copied' : 'Copy'}</span>
                          </button>

                          <a
                            href={`/api/playlist/${slug}.m3u`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Last sync:{' '}
                          {s.lastSyncTime ? new Date(s.lastSyncTime).toLocaleTimeString() : 'Never'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSingleSync(s.id)}
                            disabled={isSyncing || !s.enabled}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors disabled:opacity-40"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                            <span>Sync Now</span>
                          </button>

                          <button
                            onClick={() => handleStartEdit(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Name & Slug"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteSource(s.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete playlist source"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
