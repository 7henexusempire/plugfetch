import React, { useState } from 'react';
import { X, Plus, RefreshCw, Trash2, Edit2, Check, ExternalLink, Layers, Tv } from 'lucide-react';
import { PlaylistSource } from '../types';

interface PlaylistSourcesModalProps {
  sources: PlaylistSource[];
  onClose: () => void;
  onAddSource: (source: { name: string; url: string; id?: string }) => Promise<void>;
  onUpdateSource: (id: string, updates: Partial<PlaylistSource>) => Promise<void>;
  onDeleteSource: (id: string) => Promise<void>;
  onSyncSource: (sourceId?: string) => Promise<void>;
}

export const PlaylistSourcesModal: React.FC<PlaylistSourcesModalProps> = ({
  sources,
  onClose,
  onAddSource,
  onUpdateSource,
  onDeleteSource,
  onSyncSource,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newId, setNewId] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    await onAddSource({
      name: newName.trim(),
      url: newUrl.trim(),
      id: newId.trim() || undefined,
    });
    setNewName('');
    setNewUrl('');
    setNewId('');
    setIsAdding(false);
  };

  const handleStartEdit = (s: PlaylistSource) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditUrl(s.url);
  };

  const handleSaveEdit = async (id: string) => {
    await onUpdateSource(id, { name: editName.trim(), url: editUrl.trim() });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Manage Upstream Playlist Sources</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              All sources are auto-synced every 30 minutes, available individually and combined.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">
              Active Playlists ({sources.length})
            </span>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Playlist Source</span>
            </button>
          </div>

          {/* Add New Playlist Form */}
          {isAdding && (
            <form onSubmit={handleAdd} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-white text-xs">Add Upstream M3U URL</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Playlist Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. My Sports VIP"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">URL Identifier / Slug (optional)</label>
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="e.g. sports-vip"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Upstream Playlist URL *</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save &amp; Fetch Now
                </button>
              </div>
            </form>
          )}

          {/* Sources List */}
          <div className="space-y-3">
            {sources.map((s) => {
              const isEditing = editingId === s.id;
              const isSyncing = syncingId === s.id;

              return (
                <div
                  key={s.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                        <Tv className="w-4 h-4" />
                      </div>
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white"
                          />
                        ) : (
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{s.name}</span>
                            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                              id: {s.id}
                            </span>
                          </h4>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-cyan-400 font-semibold">{s.channelCount} channels</span>
                          <span>·</span>
                          <span className={s.status === 'success' ? 'text-emerald-400' : 'text-amber-400'}>
                            Status: {s.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleSingleSync(s.id)}
                        disabled={isSyncing}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
                        title="Sync this source immediately"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                      </button>

                      {isEditing ? (
                        <button
                          onClick={() => handleSaveEdit(s.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm(`Remove "${s.name}"?`)) onDeleteSource(s.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* URL */}
                  <div>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-cyan-500 rounded px-2.5 py-1 text-xs text-cyan-300 font-mono"
                      />
                    ) : (
                      <div className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-400 truncate select-all">
                        {s.url}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
