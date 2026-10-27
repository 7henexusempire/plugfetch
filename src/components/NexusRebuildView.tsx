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
  Square,
  Play,
  ArrowUpDown,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
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
  onPreviewChannel,
}) => {
  const [playlists, setPlaylists] = useState<RebuiltPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePlaylist, setActivePlaylist] = useState<RebuiltPlaylist | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Available channels pool
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

  // New category name input
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // Copied URL states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Clean domain base without port :8443
  const cleanBase = (publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://thenexusempire.com')).replace(/:8443$/, '');

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/rebuilt');
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
        if (data.length > 0 && !activePlaylist) {
          setActivePlaylist(data[0]);
        }
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
        const url = sourceOrCat && sourceOrCat !== 'all'
          ? `/api/nexusempire/${sourceOrCat}/channels`
          : '/api/channels?sourceId=all&limit=2500';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.channels || data.items || []);
          setChannelPool(items);
        }
      } else {
        const params = new URLSearchParams({ sourceId: sourceOrCat || 'all', limit: '2500' });
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
      name: 'Custom Curated Rebuilt Playlist',
      description: 'Rebuilt using Nexus Studio Rebuilder with custom categorized bouquets',
      targetType: 'normal',
      targetSourceOrCategory: 'all',
      customCategories: {
        'Sports & Live TV': [],
        'Cinema & Entertainment': [],
        'News & Infotainment': [],
        'Regional & Music': [],
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
      const res = await fetch('/api/rebuilt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activePlaylist),
      });
      if (res.ok) {
        onNotify('success', 'Playlist Saved', `Successfully updated ${activePlaylist.name}`);
        setIsEditing(false);
        fetchPlaylists();
      } else {
        throw new Error('Failed to save playlist');
      }
    } catch (err: any) {
      onNotify('error', 'Save Failed', err.message);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rebuilt playlist?')) return;
    try {
      const res = await fetch(`/api/rebuilt/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('info', 'Playlist Deleted');
        if (activePlaylist?.id === id) setActivePlaylist(null);
        fetchPlaylists();
      }
    } catch (err: any) {
      onNotify('error', 'Delete Failed', err.message);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !activePlaylist) return;
    const cat = newCategoryName.trim();
    if (activePlaylist.customCategories[cat]) {
      onNotify('info', 'Category already exists');
      return;
    }
    setActivePlaylist({
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [cat]: [],
      },
    });
    setNewCategoryName('');
  };

  const handleRemoveCategory = (catName: string) => {
    if (!activePlaylist) return;
    const updated = { ...activePlaylist.customCategories };
    delete updated[catName];
    setActivePlaylist({
      ...activePlaylist,
      customCategories: updated,
    });
  };

  const handleMoveBulkToCategory = (targetCat: string) => {
    if (!activePlaylist || selectedPoolChannelIds.length === 0 || !targetCat) return;

    const currentList = activePlaylist.customCategories[targetCat] || [];
    const set = new Set([...currentList, ...selectedPoolChannelIds]);

    setActivePlaylist({
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [targetCat]: Array.from(set),
      },
    });

    onNotify(
      'success',
      'Channels Added',
      `Moved ${selectedPoolChannelIds.length} stream(s) into [${targetCat}]`
    );
    setSelectedPoolChannelIds([]);
  };

  // Smart Auto-Categorize All Channels into bouquets
  const handleAutoCategorizeAll = () => {
    if (!activePlaylist || channelPool.length === 0) return;

    const cats: Record<string, string[]> = {
      'Nexus Sports HD': [],
      'Nexus Movies & Cinema': [],
      'Nexus Entertainment': [],
      'Nexus 24x7 News': [],
      'Nexus Music & Hits': [],
      'Nexus Kids & Animation': [],
      'Nexus Documentaries & Info': [],
    };

    channelPool.forEach((ch) => {
      const text = `${ch.name} ${ch.groupTitle || ''}`.toLowerCase();
      if (
        text.includes('sport') ||
        text.includes('cricket') ||
        text.includes('football') ||
        text.includes('ten') ||
        text.includes('star sports') ||
        text.includes('willow') ||
        text.includes('tsports') ||
        text.includes('epl')
      ) {
        cats['Nexus Sports HD'].push(ch.id);
      } else if (
        text.includes('cinema') ||
        text.includes('movie') ||
        text.includes('gold') ||
        text.includes('max') ||
        text.includes('action') ||
        text.includes('bollywood') ||
        text.includes('hollywood')
      ) {
        cats['Nexus Movies & Cinema'].push(ch.id);
      } else if (
        text.includes('news') ||
        text.includes('aaj tak') ||
        text.includes('ndtv') ||
        text.includes('india') ||
        text.includes('cnn') ||
        text.includes('bbc')
      ) {
        cats['Nexus 24x7 News'].push(ch.id);
      } else if (
        text.includes('music') ||
        text.includes('mtv') ||
        text.includes('9xm') ||
        text.includes('zoom') ||
        text.includes('zing')
      ) {
        cats['Nexus Music & Hits'].push(ch.id);
      } else if (
        text.includes('kids') ||
        text.includes('cartoon') ||
        text.includes('pogo') ||
        text.includes('nick') ||
        text.includes('disney') ||
        text.includes('hungama')
      ) {
        cats['Nexus Kids & Animation'].push(ch.id);
      } else if (
        text.includes('discovery') ||
        text.includes('nat geo') ||
        text.includes('animal') ||
        text.includes('history') ||
        text.includes('science')
      ) {
        cats['Nexus Documentaries & Info'].push(ch.id);
      } else {
        cats['Nexus Entertainment'].push(ch.id);
      }
    });

    // Remove empty categories
    const finalCats: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(cats)) {
      if (v.length > 0) finalCats[k] = v;
    }

    setActivePlaylist({
      ...activePlaylist,
      customCategories: finalCats,
    });

    onNotify('success', 'Auto-Categorization Complete', `Sorted ${channelPool.length} channels into ${Object.keys(finalCats).length} curated bouquets.`);
  };

  const handleShuffleCategory = (catName: string) => {
    if (!activePlaylist) return;
    const current = [...(activePlaylist.customCategories[catName] || [])];
    // Fisher-Yates Shuffle
    for (let i = current.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [current[i], current[j]] = [current[j], current[i]];
    }
    setActivePlaylist({
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [catName]: current,
      },
    });
    onNotify('info', 'Category Shuffled', `Randomized order in ${catName}`);
  };

  const handleRemoveChannelFromCategory = (catName: string, channelId: string) => {
    if (!activePlaylist) return;
    const current = activePlaylist.customCategories[catName] || [];
    setActivePlaylist({
      ...activePlaylist,
      customCategories: {
        ...activePlaylist.customCategories,
        [catName]: current.filter((id) => id !== channelId),
      },
    });
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
      onNotify('success', 'Copied to Clipboard', text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
      onNotify('success', 'Copied to Clipboard', text);
    }
  };

  // Channel lookup helper
  const channelMap = new Map<string, ChannelItem>();
  channelPool.forEach((ch) => channelMap.set(ch.id, ch));

  // Filter pool channels
  const filteredPool = channelPool.filter((ch) => {
    const matchesSearch =
      poolSearch === '' ||
      ch.name.toLowerCase().includes(poolSearch.toLowerCase()) ||
      ch.groupTitle.toLowerCase().includes(poolSearch.toLowerCase());
    const matchesCat =
      selectedPoolCategory === 'all' || ch.groupTitle === selectedPoolCategory;
    return matchesSearch && matchesCat;
  });

  const poolCategories = Array.from(
    new Set(channelPool.map((c) => c.groupTitle).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Rebuild Manager */}
      <div className="p-5 sm:p-6 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600/30 via-orange-500/20 to-cyan-600/30 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Nexus Rebuild Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 uppercase tracking-wider">
                  Playlist Architect
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Reconstruct, filter, and create organized custom playlists from{' '}
                <span className="text-amber-300 font-semibold">Nexus Empire</span> (Zee, JioTV, AniNexus) or{' '}
                <span className="text-indigo-300 font-semibold">Normal Playlists</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-semibold transition-all backdrop-blur-sm"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Create New Rebuilt Playlist</span>
            </button>

            {activePlaylist && (
              <button
                onClick={handleSavePlaylist}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Playlist</span>
              </button>
            )}
          </div>
        </div>

        {/* Existing Playlists Selector Chips */}
        {playlists.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Your Playlists:</span>
            {playlists.map((pl) => {
              const isSelected = activePlaylist?.id === pl.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => setActivePlaylist(pl)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 shadow-md shadow-amber-950/40'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5 text-amber-400" />
                  <span>{pl.name}</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-black/40 text-slate-400">
                    {Object.values(pl.customCategories).reduce((acc, curr) => acc + curr.length, 0)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activePlaylist ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Active Playlist Header & Export Bar */}
          <div className="p-5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activePlaylist.name}
                    onChange={(e) => setActivePlaylist({ ...activePlaylist, name: e.target.value })}
                    className="text-base sm:text-lg font-bold text-white bg-transparent border-b border-white/20 focus:border-amber-400 outline-none pb-0.5"
                  />
                  <span className="text-xs font-mono text-slate-400">/rebuild/{activePlaylist.slug}</span>
                </div>
                <input
                  type="text"
                  value={activePlaylist.description}
                  onChange={(e) => setActivePlaylist({ ...activePlaylist, description: e.target.value })}
                  placeholder="Playlist description..."
                  className="text-xs text-slate-400 bg-transparent border-b border-transparent focus:border-white/20 outline-none w-full max-w-xl"
                />
              </div>

              {/* Source Division: Nexus Empire vs Normal */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
                  <button
                    onClick={() => {
                      setActivePlaylist({
                        ...activePlaylist,
                        targetType: 'nexusempire',
                        targetSourceOrCategory: 'all',
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activePlaylist.targetType === 'nexusempire'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Nexus Empire Feeds
                  </button>
                  <button
                    onClick={() => {
                      setActivePlaylist({
                        ...activePlaylist,
                        targetType: 'normal',
                        targetSourceOrCategory: 'all',
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activePlaylist.targetType === 'normal'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Normal Playlists
                  </button>
                </div>

                <button
                  onClick={handleAutoCategorizeAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-xs font-bold transition-all shadow-sm"
                  title="Auto-organize channels into Sports, Movies, News, etc."
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Smart Auto-Bouquets</span>
                </button>

                <button
                  onClick={() => handleDeletePlaylist(activePlaylist.id)}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10"
                  title="Delete playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clean Export URLs */}
            <div className="pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Rebuilt M3U Playlist</div>
                  <div className="text-xs font-mono text-slate-200 truncate">{`${cleanBase}/rebuild/${activePlaylist.slug}.m3u`}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(`${cleanBase}/rebuild/${activePlaylist.slug}.m3u`, 'm3u')}
                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white shrink-0"
                >
                  {copiedKey === 'm3u' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Rebuilt JSON Feed</div>
                  <div className="text-xs font-mono text-slate-200 truncate">{`${cleanBase}/rebuild/${activePlaylist.slug}.json`}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(`${cleanBase}/rebuild/${activePlaylist.slug}.json`, 'json')}
                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white shrink-0"
                >
                  {copiedKey === 'json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Rebuilder Two-Pane Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Pane: Source Channels Pool (Col 5) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 flex flex-col h-[750px] shadow-xl">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-amber-400" />
                    <span>Source Pool ({filteredPool.length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Source: {activePlaylist.targetType === 'nexusempire' ? 'Nexus Empire Content' : 'Normal Playlists'}
                  </span>
                </div>

                {/* Bulk Select All */}
                <button
                  onClick={() => {
                    if (selectedPoolChannelIds.length === filteredPool.length) {
                      setSelectedPoolChannelIds([]);
                    } else {
                      setSelectedPoolChannelIds(filteredPool.map((c) => c.id));
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-slate-300 flex items-center gap-1.5"
                >
                  {selectedPoolChannelIds.length === filteredPool.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <span>Select All</span>
                </button>
              </div>

              {/* Pool Filters */}
              <div className="py-3 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={poolSearch}
                    onChange={(e) => setPoolSearch(e.target.value)}
                    placeholder="Search source channels..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedPoolCategory}
                    onChange={(e) => setSelectedPoolCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 outline-none focus:border-amber-400"
                  >
                    <option value="all">All Groups ({channelPool.length})</option>
                    {poolCategories.map((c) => (
                      <option key={c} value={c}>
                        {c} ({channelPool.filter((ch) => ch.groupTitle === c).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Move Action Bar */}
              {selectedPoolChannelIds.length > 0 && (
                <div className="p-2.5 mb-2 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-300">
                    {selectedPoolChannelIds.length} selected
                  </span>

                  <div className="flex items-center gap-1.5">
                    <select
                      value={targetCategoryForMove}
                      onChange={(e) => setTargetCategoryForMove(e.target.value)}
                      className="px-2 py-1 rounded-lg bg-black/60 border border-white/20 text-xs text-white"
                    >
                      <option value="">Choose Category...</option>
                      {Object.keys(activePlaylist.customCategories).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleMoveBulkToCategory(targetCategoryForMove)}
                      disabled={!targetCategoryForMove}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-40"
                    >
                      Move
                    </button>
                  </div>
                </div>
              )}

              {/* Channel Pool Items List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {poolLoading ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                    <span className="text-xs">Loading channel pool...</span>
                  </div>
                ) : filteredPool.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No channels match criteria.
                  </div>
                ) : (
                  filteredPool.map((ch) => {
                    const isSelected = selectedPoolChannelIds.includes(ch.id);
                    return (
                      <div
                        key={ch.id}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400/40 text-white'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 text-slate-200'
                        }`}
                      >
                        <div
                          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPoolChannelIds((prev) => prev.filter((id) => id !== ch.id));
                            } else {
                              setSelectedPoolChannelIds((prev) => [...prev, ch.id]);
                            }
                          }}
                        >
                          <div className="shrink-0 text-slate-400">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </div>

                          <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {ch.logo ? (
                              <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain p-0.5" />
                            ) : (
                              <Radio className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{ch.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{ch.groupTitle}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onPreviewChannel(ch)}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
                            title="Preview"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Pane: Custom Structured Categories (Col 7) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 flex flex-col h-[750px] shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Curated Categories & Playlists</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {Object.keys(activePlaylist.customCategories).length} Category Bouquets configured
                  </span>
                </div>

                {/* Add new Category */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New Category Name..."
                    className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400 w-36 sm:w-48"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold disabled:opacity-40"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Categories Accordion / Sections */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {Object.entries(activePlaylist.customCategories).map(([catName, chIds]) => (
                  <div
                    key={catName}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <h4 className="text-xs sm:text-sm font-bold text-white">{catName}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-black/40 text-amber-300 border border-white/10">
                          {chIds.length} channels
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleShuffleCategory(catName)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-[11px] text-slate-300 border border-white/10"
                          title="Randomize channel order"
                        >
                          <Shuffle className="w-3 h-3 text-amber-400" />
                          <span>Shuffle</span>
                        </button>

                        <button
                          onClick={() => handleRemoveCategory(catName)}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Channels in this category */}
                    {chIds.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-500">
                        Drop or select channels from the left pool to populate this bouquet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                        {chIds.map((chId) => {
                          const channel = channelMap.get(chId);
                          return (
                            <div
                              key={chId}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-200"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-6 h-6 rounded bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                  {channel?.logo ? (
                                    <img src={channel.logo} alt="" className="w-full h-full object-contain" />
                                  ) : (
                                    <Radio className="w-3 h-3 text-slate-400" />
                                  )}
                                </div>
                                <span className="truncate font-medium">{channel?.name || chId}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {channel && (
                                  <button
                                    onClick={() => onPreviewChannel(channel)}
                                    className="p-1 hover:text-amber-300"
                                    title="Play"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveChannelFromCategory(catName, chId)}
                                  className="p-1 hover:text-rose-400 text-slate-400"
                                  title="Remove"
                                >
                                  &times;
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-black/30 border border-white/10 text-center text-slate-400 space-y-3">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Rebuilt Playlist Selected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Select an existing rebuilt playlist from above or click "Create New Rebuilt Playlist" to customize streams, reorganize categories, and generate bespoke M3U feeds.
          </p>
          <button
            onClick={handleCreateNew}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20"
          >
            Create Playlist Now
          </button>
        </div>
      )}
    </div>
  );
};
