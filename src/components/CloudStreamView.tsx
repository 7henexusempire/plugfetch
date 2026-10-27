import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Edit3,
  ExternalLink,
  Tv,
  Globe,
  Save,
  Sparkles,
  Layers
} from 'lucide-react';

interface CloudStreamRepo {
  id: string;
  name: string;
  url: string;
  lastSync: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  itemCount: number;
}

interface CloudStreamItem {
  id: string;
  name: string;
  url: string;
  category: string;
  logo: string;
  description: string;
  author?: string;
  version?: string;
  enabled: boolean;
  isCustom?: boolean;
  repoUrl: string;
}

interface CloudStreamViewProps {
  onNotify: (type: 'success' | 'error' | 'info' | 'loading', title: string, message?: string) => void;
  publicBaseUrl?: string;
  onPreviewChannel: (ch: any) => void;
}

export const CloudStreamView: React.FC<CloudStreamViewProps> = ({
  onNotify,
  publicBaseUrl = '',
  onPreviewChannel,
}) => {
  const [repos, setRepos] = useState<CloudStreamRepo[]>([]);
  const [items, setItems] = useState<CloudStreamItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // New Repo modal / form
  const [newRepoName, setNewRepoName] = useState<string>('');
  const [newRepoUrl, setNewRepoUrl] = useState<string>('');
  const [showAddRepo, setShowAddRepo] = useState<boolean>(false);

  // Editing item modal
  const [editingItem, setEditingItem] = useState<CloudStreamItem | null>(null);

  // Copied URL state
  const [copied, setCopied] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [repoRes, itemRes] = await Promise.all([
        fetch('/api/cloudstream/repos'),
        fetch('/api/cloudstream/items'),
      ]);
      if (repoRes.ok) setRepos(await repoRes.json());
      if (itemRes.ok) setItems(await itemRes.json());
    } catch (err) {
      console.error('Failed to fetch CloudStream data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    onNotify('loading', 'Syncing CloudStream Repos...', 'Fetching latest streams, live events, Cricfy & Sketch feeds');
    try {
      for (const r of repos) {
        await fetch(`/api/cloudstream/repos/${r.id}/sync`, { method: 'POST' });
      }
      await fetchData();
      onNotify('success', 'CloudStream Synced!', 'All CNCVerse and extension feeds refreshed successfully');
    } catch (err: any) {
      onNotify('error', 'Sync Error', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName || !newRepoUrl) return;
    try {
      const res = await fetch('/api/cloudstream/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRepoName, url: newRepoUrl }),
      });
      if (res.ok) {
        onNotify('success', 'Repo Added', `Successfully registered "${newRepoName}"`);
        setNewRepoName('');
        setNewRepoUrl('');
        setShowAddRepo(false);
        fetchData();
      }
    } catch (err: any) {
      onNotify('error', 'Add Repo Failed', err.message);
    }
  };

  const handleDeleteRepo = async (id: string) => {
    if (!confirm('Remove this CloudStream repository?')) return;
    try {
      const res = await fetch(`/api/cloudstream/repos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('success', 'Repo Removed', 'Repository and its streams deleted');
        fetchData();
      }
    } catch (err: any) {
      onNotify('error', 'Delete Error', err.message);
    }
  };

  const handleToggleItem = async (item: CloudStreamItem) => {
    try {
      const res = await fetch(`/api/cloudstream/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !item.enabled }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, enabled: !item.enabled } : i))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/cloudstream/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) {
        onNotify('success', 'Stream Updated', `Saved "${editingItem.name}"`);
        setEditingItem(null);
        fetchData();
      }
    } catch (err: any) {
      onNotify('error', 'Update Error', err.message);
    }
  };

  const m3uUrl = () => {
    const base = publicBaseUrl || window.location.origin;
    return `${base.replace(/\/$/, '')}/cloudstream.m3u`;
  };

  const copyM3UUrl = () => {
    navigator.clipboard.writeText(m3uUrl());
    setCopied(true);
    onNotify('success', 'Copied M3U URL', m3uUrl());
    setTimeout(() => setCopied(false), 2500);
  };

  // Group items by category
  const categories = Array.from(new Set(items.map((i) => i.category || 'Live Events'))).sort();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/40 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30">
              <Radio className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">Nexus CloudStream &amp; Live Feeds</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Automatically fetching CNCVerse extensions, Cricfy, Sketch, and live sports events every 5 minutes. Generate custom M3U playlists for <span className="text-cyan-300 font-semibold">OTT Navigator</span> &amp; <span className="text-indigo-300 font-semibold">TiviMate</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Repos Now</span>
          </button>

          <button
            onClick={() => setShowAddRepo(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Repo URL</span>
          </button>
        </div>
      </div>

      {/* Quick OTT Navigator URL Card */}
      <div className="bg-slate-900/40 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">OTT Navigator / TiviMate Playlist URL</h4>
            <span className="font-mono text-xs text-cyan-300">{m3uUrl()}</span>
          </div>
        </div>

        <button
          onClick={copyM3UUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied URL!' : 'Copy M3U Link'}</span>
        </button>
      </div>

      {/* Add Repo Modal Form */}
      {showAddRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Add CloudStream Repository</span>
            </h3>
            <form onSubmit={handleAddRepo} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Repository Name</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="e.g. CNCVerse Live Hub"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">JSON URL</label>
                <input
                  type="url"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  placeholder="https://.../extensions.json"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRepo(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  Add &amp; Sync Repo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span>Edit CloudStream Stream</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Stream / Event Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Stream URL</label>
                <input
                  type="text"
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category Group</label>
                  <input
                    type="text"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={editingItem.logo}
                    onChange={(e) => setEditingItem({ ...editingItem, logo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                <Save className="w-4 h-4" />
                <span>Save Stream</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repos List & Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Repos Sidebar */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Registered Repositories ({repos.length})</span>
          </h3>

          <div className="space-y-3">
            {repos.map((r) => (
              <div key={r.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white">{r.name}</h4>
                    <span className="text-[10px] font-mono text-cyan-400 line-clamp-1">{r.url}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRepo(r.id)}
                    className="p-1 rounded bg-slate-900 hover:bg-rose-950 text-rose-300"
                    title="Delete Repo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>{r.itemCount} streams</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                    r.status === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fetched Streams List grouped by category */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>CloudStream &amp; Live Feeds ({items.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Auto-refresh every 5 mins</span>
          </div>

          {isLoading ? (
            <div className="py-24 text-center text-slate-400 text-xs">Loading CloudStream feeds...</div>
          ) : items.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-xs">
              No streams found. Click "Sync Repos Now" to fetch CNCVerse feeds.
            </div>
          ) : (
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const catItems = items.filter((i) => (i.category || 'Live Events') === cat);

                return (
                  <div key={cat} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-800/80">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{cat}</h4>
                      <span className="text-[10px] text-slate-400">({catItems.length})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 truncate">
                            {item.logo ? (
                              <img
                                src={item.logo}
                                alt=""
                                className="w-9 h-9 rounded-xl object-contain bg-slate-900 shrink-0 border border-slate-800"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-cyan-400 shrink-0 border border-slate-800">
                                <Radio className="w-4 h-4" />
                              </div>
                            )}

                            <div className="truncate">
                              <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                              <p className="text-[10px] font-mono text-cyan-400/80 truncate">{item.url}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => onPreviewChannel(item)}
                              className="p-1.5 rounded-xl bg-slate-900 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                              title="Preview Stream"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
                              title="Edit Stream"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleItem(item)}
                              className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-colors ${
                                item.enabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {item.enabled ? 'Active' : 'Muted'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
