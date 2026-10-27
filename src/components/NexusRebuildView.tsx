import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  FolderPlus,
  Shuffle,
  MoveRight,
  Tv,
  Radio,
  ExternalLink,
  Save,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import { ChannelItem, PlaylistSource, NexusEmpireItem } from '../types';

interface RebuiltPlaylist {
  id: string;
  slug: string;
  name: string;
  description: string;
  targetType: 'nexusempire' | 'normal';
  targetSourceOrCategory: string;
  customCategories: Record<string, string[]>; // categoryName -> channelIds
  createdAt: string;
  updatedAt: string;
}

interface NexusRebuildViewProps {
  onNotify: (type: 'success' | 'error' | 'info' | 'loading', title: string, message?: string) => void;
  publicBaseUrl?: string;
  sources: PlaylistSource[];
  onPreviewChannel: (ch: ChannelItem) => void;
}

export const NexusRebuildView: React.FC<NexusRebuildViewProps> = ({
  onNotify,
  publicBaseUrl = '',
  sources,
  onPreviewChannel,
}) => {
  const [playlists, setPlaylists] = useState<RebuiltPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePlaylist, setActivePlaylist] = useState<RebuiltPlaylist | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Available channels pool based on selected source type
  const [channelPool, setChannelPool] = useState<ChannelItem[]>([]);
  const [nexusEmpireItems, setNexusEmpireItems] = useState<NexusEmpireItem[]>([]);
  const [poolLoading, setPoolLoading] = useState<boolean>(false);

  // Pool search & filter
  const [poolSearch, setPoolSearch] = useState<string>('');
  const [selectedPoolCategory, setSelectedPoolCategory] = useState<string>('all');
  const [selectedPoolSource, setSelectedPoolSource] = useState<string>('all');

  // Bulk selection in pool
  const [selectedPoolChannelIds, setSelectedPoolChannelIds] = useState<string[]>([]);
  const [targetCategoryForMove, setTargetCategoryForMove] = useState<string>('');

  // Copied URL states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/rebuilt');
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error('Failed to fetch rebuilt playlists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNexusEmpire = async () => {
    try {
      const res = await fetch('/api/nexusempire');
      if (res.ok) {
        const data = await res.json();
        setNexusEmpireItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch nexusempire items:', err);
    }
  };

  const fetchPoolChannels = async (targetType: 'nexusempire' | 'normal', sourceOrCat: string) => {
    setPoolLoading(true);
    try {
      if (targetType === 'nexusempire') {
        // If target is nexusempire, fetch channels for selected item or all
        const url = sourceOrCat && sourceOrCat !== 'all'
          ? `/api/nexusempire/${sourceOrCat}/channels`
          : '/api/channels?sourceId=all&limit=2000';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // if data is array of channels or object
          const items = Array.isArray(data) ? data : (data.channels || data.items || []);
          setChannelPool(items);
        }
      } else {
        const params = new URLSearchParams({ sourceId: sourceOrCat || 'all', limit: '2000' });
        const res = await fetch(`/api/channels?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setChannelPool(data.channels || []);
        }
      }
    } catch (err) {
      console.error('Failed to load channel pool:', err);
    } finally {
      setPoolLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    fetchNexusEmpire();
  }, []);

  useEffect(() => {
    if (activePlaylist) {
      fetchPoolChannels(activePlaylist.targetType, activePlaylist.targetSourceOrCategory);
    }
  }, [activePlaylist?.targetType, activePlaylist?.targetSourceOrCategory]);

  const handleCreateNew = () => {
    const newP: RebuiltPlaylist = {
      id: `rebuild_${Date.now()}`,
      slug: `nexus-rebuilt-${Date.now().toString().slice(-4)}`,
      name: 'New Custom Rebuilt Playlist',
      description: 'Rebuilt using Nexus Studio Intelligent Rebuilder',
      targetType: 'normal',
      targetSourceOrCategory: 'all',
      customCategories: {
        'Sports & Live': [],
        'Entertainment & Movies': [],
        'General Bouquet': [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActivePlaylist(newP);
    setIsEditing(true);
  };

  const handleSavePlaylist = async () => {
    if (!activePlaylist) return;
    try {
      const isExisting = playlists.some((p) => p.id === activePlaylist.id);
      const url = isExisting ? `/api/rebuilt/${activePlaylist.id}` : '/api/rebuilt';
      const method = isExisting ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activePlaylist),
      });

      if (res.ok) {
        const data = await res.json();
        onNotify('success', 'Playlist Saved', `Successfully saved "${activePlaylist.name}"`);
        await fetchPlaylists();
        setIsEditing(false);
        setActivePlaylist(data.playlist || activePlaylist);
      } else {
        const err = await res.json();
        onNotify('error', 'Save Failed', err.error || 'Could not save playlist');
      }
    } catch (err: any) {
      onNotify('error', 'Save Error', err.message);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rebuilt playlist?')) return;
    try {
      const res = await fetch(`/api/rebuilt/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('success', 'Deleted', 'Rebuilt playlist removed');
        if (activePlaylist?.id === id) {
          setActivePlaylist(null);
          setIsEditing(false);
        }
        fetchPlaylists();
      }
    } catch (err: any) {
      onNotify('error', 'Delete Error', err.message);
    }
  };

  // Auto-Categorization intelligent system
  const handleAutoCategorize = () => {
    if (!activePlaylist) return;
    const cats: Record<string, string[]> = {
      'Sports & Action': [],
      'Entertainment & Shows': [],
      'Movies & Drama': [],
      'News & Infotainment': [],
      'Kids & Animation': [],
      'General & Other': [],
    };

    for (const ch of channelPool) {
      const name = (ch.customName || ch.name || '').toLowerCase();
      const grp = (ch.customGroup || ch.groupTitle || '').toLowerCase();
      const combined = `${name} ${grp}`;

      if (
        combined.includes('sport') ||
        combined.includes('cricket') ||
        combined.includes('sports') ||
        combined.includes('football') ||
        combined.includes('espn') ||
        combined.includes('ten') ||
        combined.includes('stadium')
      ) {
        cats['Sports & Action'].push(ch.id);
      } else if (
        combined.includes('movie') ||
        combined.includes('cinema') ||
        combined.includes('hbo') ||
        combined.includes('pix') ||
        combined.includes('star gold') ||
        combined.includes('set max') ||
        combined.includes('flix')
      ) {
        cats['Movies & Drama'].push(ch.id);
      } else if (
        combined.includes('news') ||
        combined.includes('aaj tak') ||
        combined.includes('republic') ||
        combined.includes('cnn') ||
        combined.includes('bbc') ||
        combined.includes('ndtv')
      ) {
        cats['News & Infotainment'].push(ch.id);
      } else if (
        combined.includes('kids') ||
        combined.includes('cartoon') ||
        combined.includes('disney') ||
        combined.includes('pogo') ||
        combined.includes('nick') ||
        combined.includes('hungama')
      ) {
        cats['Kids & Animation'].push(ch.id);
      } else if (
        combined.includes('sony') ||
        combined.includes('star') ||
        combined.includes('zee') ||
        combined.includes('colors') ||
        combined.includes('sab') ||
        combined.includes('entertainment')
      ) {
        cats['Entertainment & Shows'].push(ch.id);
      } else {
        cats['General & Other'].push(ch.id);
      }
    }

    // Filter out empty categories
    const cleanedCats: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(cats)) {
      if (v.length > 0) cleanedCats[k] = v;
    }
    if (Object.keys(cleanedCats).length === 0) {
      cleanedCats['Main Bouquet'] = channelPool.map((c) => c.id);
    }

    setActivePlaylist({
      ...activePlaylist,
      customCategories: cleanedCats,
      updatedAt: new Date().toISOString(),
    });
    onNotify('success', 'Auto-Categorized', `Organized ${channelPool.length} streams into smart categories!`);
  };

  const handleShuffleCategory = (catName: string) => {
    if (!activePlaylist) return;
    const list = [...(activePlaylist.customCategories[catName] || [])];
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setActivePlaylist({
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [catName]: list,
      },
    });
    onNotify('info', 'Category Shuffled', `Shuffled order for "${catName}"`);
  };

  const handleAddCategory = () => {
    if (!activePlaylist) return;
    const name = prompt('Enter new category name:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (activePlaylist.customCategories[trimmed]) {
      alert('Category already exists!');
      return;
    }
    setActivePlaylist({
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [trimmed]: [],
      },
    });
  };

  const handleDeleteCategory = (catName: string) => {
    if (!activePlaylist) return;
    if (Object.keys(activePlaylist.customCategories).length <= 1) {
      alert('Playlist must have at least one category.');
      return;
    }
    if (!confirm(`Remove category "${catName}"? Channels inside will be unassigned.`)) return;
    const copy = { ...activePlaylist.customCategories };
    delete copy[catName];
    setActivePlaylist({
      ...activePlaylist,
      customCategories: copy,
    });
  };

  const handleRenameCategory = (oldName: string) => {
    if (!activePlaylist) return;
    const newName = prompt(`Rename category "${oldName}" to:`, oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const trimmed = newName.trim();
    if (activePlaylist.customCategories[trimmed]) {
      alert('Category with that name already exists!');
      return;
    }
    const copy: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(activePlaylist.customCategories)) {
      if (k === oldName) {
        copy[trimmed] = v;
      } else {
        copy[k] = v;
      }
    }
    setActivePlaylist({
      ...activePlaylist,
      customCategories: copy,
    });
  };

  const handleAddChannelToCategory = (channelId: string, categoryName: string) => {
    if (!activePlaylist) return;
    const current = activePlaylist.customCategories[categoryName] || [];
    if (current.includes(channelId)) return; // already added

    setActivePlaylist({
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [categoryName]: [...current, channelId],
      },
    });
  };

  const handleRemoveChannelFromCategory = (channelId: string, categoryName: string) => {
    if (!activePlaylist) return;
    const current = activePlaylist.customCategories[categoryName] || [];
    setActivePlaylist({
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [categoryName]: current.filter((id) => id !== channelId),
      },
    });
  };

  const handleBulkMoveToCategory = (targetCat: string) => {
    if (!activePlaylist || selectedPoolChannelIds.length === 0 || !targetCat) return;
    const current = activePlaylist.customCategories[targetCat] || [];
    // Add IDs that aren't already in this category
    const added = [...new Set([...current, ...selectedPoolChannelIds])];

    setActivePlaylist({
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [targetCat]: added,
      },
    });
    setSelectedPoolChannelIds([]);
    onNotify('success', 'Bulk Moved', `Added ${selectedPoolChannelIds.length} streams to "${targetCat}"`);
  };

  const fullM3UUrl = (slug: string) => {
    const base = publicBaseUrl || window.location.origin;
    return `${base.replace(/\/$/, '')}/api/rebuilt/${slug}.m3u`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onNotify('success', 'Copied to Clipboard', text);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter pool channels
  const filteredPool = channelPool.filter((ch) => {
    const name = (ch.customName || ch.name || '').toLowerCase();
    const grp = (ch.customGroup || ch.groupTitle || '').toLowerCase();
    const matchesSearch = !poolSearch || name.includes(poolSearch.toLowerCase()) || grp.includes(poolSearch.toLowerCase());
    const matchesGroup = selectedPoolCategory === 'all' || grp === selectedPoolCategory.toLowerCase();
    return matchesSearch && matchesGroup;
  });

  const uniquePoolGroups = Array.from(new Set(channelPool.map((c) => c.customGroup || c.groupTitle || 'General'))).sort();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/60 to-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">Nexus Rebuild Studio</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Fully rebuild, shuffle, and customize playlists. Fetch from NexusEmpire or Normal sources, auto-categorize into smart groups, bulk move streams, and generate custom M3U playlist URLs instantly.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Rebuilt Playlist</span>
        </button>
      </div>

      {/* Main Grid: Left List of Playlists, Right Editor / Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Playlists Sidebar */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Your Rebuilt Playlists ({playlists.length})</span>
            </h3>
            <button
              onClick={fetchPlaylists}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading playlists...</div>
          ) : playlists.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No rebuilt playlists yet.<br />Click "Create New Rebuilt Playlist" above to start.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {playlists.map((p) => {
                const isActive = activePlaylist?.id === p.id;
                const url = fullM3UUrl(p.slug);
                const isCopied = copiedId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                    onClick={() => {
                      setActivePlaylist(p);
                      setIsEditing(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        {p.targetType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span className="font-mono text-cyan-400">/api/rebuilt/{p.slug}.m3u</span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => copyToClipboard(url, p.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                          title="Copy Full M3U URL"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setActivePlaylist(p);
                            setIsEditing(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 transition-colors"
                          title="Edit Playlist"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlaylist(p.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor & Rebuilder Workspace */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col gap-6">
          {!activePlaylist ? (
            <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-2xl bg-slate-800/80 text-cyan-400 shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">No Playlist Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Select a rebuilt playlist from the left list or create a new one to start rebuilding and organizing categories.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header & Meta */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1 flex-1 w-full">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={activePlaylist.name}
                        onChange={(e) => setActivePlaylist({ ...activePlaylist, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:border-cyan-500 outline-none"
                        placeholder="Playlist Name"
                      />
                      <input
                        type="text"
                        value={activePlaylist.slug}
                        onChange={(e) => setActivePlaylist({ ...activePlaylist, slug: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 outline-none"
                        placeholder="URL slug (e.g. custom-sports)"
                      />
                      <textarea
                        value={activePlaylist.description}
                        onChange={(e) => setActivePlaylist({ ...activePlaylist, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:border-cyan-500 outline-none resize-none h-16"
                        placeholder="Playlist description"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 mb-1 block">Source Target Type</label>
                          <select
                            value={activePlaylist.targetType}
                            onChange={(e) =>
                              setActivePlaylist({
                                ...activePlaylist,
                                targetType: e.target.value as 'nexusempire' | 'normal',
                                targetSourceOrCategory: 'all',
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                          >
                            <option value="normal">Normal Playlists / All Sources</option>
                            <option value="nexusempire">NexusEmpire Streams</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-400 mb-1 block">Source Feed / Category</label>
                          <select
                            value={activePlaylist.targetSourceOrCategory}
                            onChange={(e) =>
                              setActivePlaylist({ ...activePlaylist, targetSourceOrCategory: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                          >
                            <option value="all">All Sources / Feeds</option>
                            {activePlaylist.targetType === 'nexusempire'
                              ? nexusEmpireItems.map((n) => (
                                  <option key={n.id} value={n.slug}>
                                    {n.name} ({n.category})
                                  </option>
                                ))
                              : sources.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{activePlaylist.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {activePlaylist.targetType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{activePlaylist.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-mono text-cyan-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {fullM3UUrl(activePlaylist.slug)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(fullM3UUrl(activePlaylist.slug), 'active_url')}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
                        >
                          {copiedId === 'active_url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy M3U URL</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSavePlaylist}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-colors border border-cyan-500/30"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Details</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Toolbar: Auto-Categorize, Add Category, Bulk Move */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAutoCategorize}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                    title="Automatically sort channels into Sports, Movies, News, Entertainment, etc."
                  >
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Auto-Categorize All ({channelPool.length} streams)</span>
                  </button>

                  <button
                    onClick={handleAddCategory}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                  >
                    <FolderPlus className="w-4 h-4 text-cyan-400" />
                    <span>Add Category</span>
                  </button>
                </div>

                {/* Bulk move dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {selectedPoolChannelIds.length} selected in pool
                  </span>
                  <select
                    value={targetCategoryForMove}
                    onChange={(e) => setTargetCategoryForMove(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Move selected to...</option>
                    {Object.keys(activePlaylist.customCategories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleBulkMoveToCategory(targetCategoryForMove)}
                    disabled={selectedPoolChannelIds.length === 0 || !targetCategoryForMove}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                  >
                    Move
                  </button>
                </div>
              </div>

              {/* Categories & Stream Pool Split */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left: Custom Categories & Assigned Channels */}
                <div className="xl:col-span-7 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Custom Rebuilt Categories ({Object.keys(activePlaylist.customCategories).length})</span>
                    <span className="text-cyan-400">
                      Total assigned:{' '}
                      {Object.values(activePlaylist.customCategories).reduce((acc, arr) => acc + arr.length, 0)}
                    </span>
                  </h4>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {Object.entries(activePlaylist.customCategories).map(([catName, channelIds]) => {
                      const channelMap = new Map(channelPool.map((c) => [c.id, c]));

                      return (
                        <div key={catName} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                              <h5 className="text-sm font-bold text-white">{catName}</h5>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                                {channelIds.length} streams
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleShuffleCategory(catName)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 transition-colors"
                                title="Shuffle Category Order"
                              >
                                <Shuffle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRenameCategory(catName)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
                                title="Rename Category"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(catName)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-rose-300 transition-colors"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {channelIds.length === 0 ? (
                            <div className="py-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                              No channels in this category yet. Select and move streams from the pool on the right.
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {channelIds.map((cId) => {
                                const ch = channelMap.get(cId);
                                if (!ch) return null;
                                const displayName = ch.customName || ch.name;

                                return (
                                  <div
                                    key={cId}
                                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      {ch.customLogo || ch.tvgLogo ? (
                                        <img
                                          src={ch.customLogo || ch.tvgLogo}
                                          alt=""
                                          className="w-6 h-6 rounded object-contain bg-slate-950"
                                          onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                          TV
                                        </div>
                                      )}
                                      <span className="font-semibold text-slate-200 truncate">{displayName}</span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => onPreviewChannel(ch)}
                                        className="p-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                                        title="Preview Stream"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveChannelFromCategory(cId, catName)}
                                        className="p-1 rounded bg-slate-800 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
                                        title="Remove from category"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Available Channels Pool */}
                <div className="xl:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Tv className="w-4 h-4 text-indigo-400" />
                      <span>Available Stream Pool ({filteredPool.length})</span>
                    </h4>
                    <button
                      onClick={() => {
                        if (selectedPoolChannelIds.length === filteredPool.length) {
                          setSelectedPoolChannelIds([]);
                        } else {
                          setSelectedPoolChannelIds(filteredPool.map((c) => c.id));
                        }
                      }}
                      className="text-[11px] text-cyan-400 hover:underline"
                    >
                      {selectedPoolChannelIds.length === filteredPool.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Search & Category Filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={poolSearch}
                        onChange={(e) => setPoolSearch(e.target.value)}
                        placeholder="Search available streams..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none"
                      />
                    </div>

                    <select
                      value={selectedPoolCategory}
                      onChange={(e) => setSelectedPoolCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="all">All Original Groups ({uniquePoolGroups.length})</option>
                      {uniquePoolGroups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {poolLoading ? (
                    <div className="py-20 text-center text-slate-500 text-xs">Loading channel pool...</div>
                  ) : filteredPool.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 text-xs">No streams match your filter.</div>
                  ) : (
                    <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                      {filteredPool.map((ch) => {
                        const isSelected = selectedPoolChannelIds.includes(ch.id);
                        const displayName = ch.customName || ch.name;

                        return (
                          <div
                            key={ch.id}
                            onClick={() => {
                              setSelectedPoolChannelIds((prev) =>
                                isSelected ? prev.filter((id) => id !== ch.id) : [...prev, ch.id]
                              );
                            }}
                            className={`flex items-center justify-between gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                                : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <button type="button" className="text-cyan-400">
                                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                              </button>
                              <span className="font-semibold truncate text-xs">{displayName}</span>
                            </div>

                            {/* Quick Add Buttons to Categories */}
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddChannelToCategory(ch.id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-cyan-300 outline-none"
                                title="Add directly to category"
                              >
                                <option value="" disabled>
                                  + Add to...
                                </option>
                                {Object.keys(activePlaylist.customCategories).map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
