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
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  FolderSymlink,
  CheckSquare,
  Square,
  ShieldCheck,
  Power,
  X,
  Search,
} from 'lucide-react';
import { NexusEmpireItem, ChannelItem } from '../types';

interface NexusEmpireViewProps {
  onNotify: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
  publicBaseUrl?: string;
  onPreviewChannel?: (channel: any) => void;
}

export const NexusEmpireView: React.FC<NexusEmpireViewProps> = ({
  onNotify,
  publicBaseUrl = '',
  onPreviewChannel,
}) => {
  const [items, setItems] = useState<NexusEmpireItem[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [categoryChannels, setCategoryChannels] = useState<Record<string, { channels: ChannelItem[]; stats: any }>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NexusEmpireItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<{ channel: ChannelItem; empireId: string } | null>(null);

  // Form states
  const [newItemName, setNewItemName] = useState('');
  const [newItemUri, setNewItemUri] = useState('');
  const [newItemSlug, setNewItemSlug] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Entertainment & Movies');
  const [newItemLogo, setNewItemLogo] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [targetMoveCategory, setTargetMoveCategory] = useState('');

  const baseUrl = publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  const fetchData = async () => {
    try {
      const [resItems, resCats] = await Promise.all([
        fetch('/api/nexusempire'),
        fetch('/api/nexusempire/categories'),
      ]);

      if (resItems.ok) {
        const data = await resItems.json();
        setItems(data);
      }
      if (resCats.ok) {
        const cats = await resCats.json();
        setCategories(cats);
        if (cats.length > 0 && !targetMoveCategory) {
          setTargetMoveCategory(cats[0].name);
        }
      }
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to load NexusEmpire data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        const res = await fetch(`/api/nexusempire/items/${id}/channels`);
        if (res.ok) {
          const data = await res.json();
          setCategoryChannels((prev) => ({ ...prev, [id]: data }));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleItem = async (id: string, currentEnabled: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/nexusempire/items/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, enabled: !currentEnabled } : it))
        );
        onNotify('info', `Stream ${!currentEnabled ? 'Enabled' : 'Disabled'}`);
      }
    } catch {
      onNotify('error', 'Failed to toggle stream state');
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this stream section?')) return;
    try {
      const res = await fetch(`/api/nexusempire/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        onNotify('success', 'Stream Section Deleted');
      }
    } catch {
      onNotify('error', 'Failed to delete stream section');
    }
  };

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemUri) {
      onNotify('error', 'Name and stream URI are required');
      return;
    }

    try {
      const res = await fetch('/api/nexusempire/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName,
          uri: newItemUri,
          slug: newItemSlug || newItemName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          category: newItemCategory,
          logo: newItemLogo || '/nexus-logo.png',
          description: newItemDesc,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setItems((prev) => [...prev, result.item]);
        setIsAddModalOpen(false);
        setNewItemName('');
        setNewItemUri('');
        setNewItemSlug('');
        setNewItemLogo('');
        setNewItemDesc('');
        onNotify('success', 'Stream added to NexusEmpire', result.item.name);
        fetchData();
      }
    } catch {
      onNotify('error', 'Failed to add stream');
    }
  };

  const handleSaveEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch(`/api/nexusempire/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });

      if (res.ok) {
        setItems((prev) => prev.map((it) => (it.id === editingItem.id ? editingItem : it)));
        setEditingItem(null);
        onNotify('success', 'Stream Updated Successfully');
        fetchData();
      }
    } catch {
      onNotify('error', 'Failed to update stream');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/nexusempire/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (res.ok) {
        onNotify('success', 'Category Created', newCategoryName.trim());
        setNewCategoryName('');
        setIsCategoryModalOpen(false);
        fetchData();
      }
    } catch {
      onNotify('error', 'Failed to create category');
    }
  };

  const handleBulkMove = async () => {
    if (selectedItemIds.length === 0 || !targetMoveCategory) return;

    try {
      const res = await fetch('/api/nexusempire/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: selectedItemIds, category: targetMoveCategory }),
      });

      if (res.ok) {
        onNotify('success', `Moved ${selectedItemIds.length} streams to ${targetMoveCategory}`);
        setSelectedItemIds([]);
        setIsMoveModalOpen(false);
        fetchData();
      }
    } catch {
      onNotify('error', 'Failed to move streams');
    }
  };

  const handleSaveChannelEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;

    try {
      const res = await fetch(`/api/channels/${editingChannel.channel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customName: editingChannel.channel.customName,
          customGroup: editingChannel.channel.customGroup,
          customLogo: editingChannel.channel.customLogo,
          customUrl: editingChannel.channel.customUrl,
          enabled: editingChannel.channel.enabled,
        }),
      });

      if (res.ok) {
        onNotify('success', 'Channel Stream Updated');
        // Refresh this category's channel list
        const cRes = await fetch(`/api/nexusempire/items/${editingChannel.empireId}/channels`);
        if (cRes.ok) {
          const data = await cRes.json();
          setCategoryChannels((prev) => ({ ...prev, [editingChannel.empireId]: data }));
        }
        setEditingChannel(null);
      }
    } catch {
      onNotify('error', 'Failed to update channel');
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const masterM3uUrl = `${baseUrl}/api/nexusempire/all.m3u`;
  const masterShortUrl = `${baseUrl}/nexusempire/all.m3u`;
  const masterJsonUrl = `${baseUrl}/api/nexusempire/all.json`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. NEXUSEMPIRE MASTER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-slate-950/95 border border-amber-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>NEXUSEMPIRE ENGINE</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-mono text-indigo-300">
                AniTv &amp; StreamBox Native
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Zero Duplicate Streams</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2 font-mono">
              <span>NexusEmpire</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 text-lg sm:text-xl font-sans font-bold">
                VIP Catalog
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Unified IPTV engine with <strong>intelligent stream deduplication</strong>. Filters out redundant copies while preserving distinct alternative feeds (e.g. Sony SAB HD Stream 1 vs Stream 2). Auto-refreshes every 30 minutes.
            </p>
          </div>

          {/* Master Output Action Bar */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 min-w-[280px]">
            <button
              onClick={() => copyToClipboard(masterShortUrl, 'Master M3U URL', 'master_short')}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-200" />
                <span>Copy Master M3U</span>
              </div>
              <span className="font-mono text-[11px] opacity-80 group-hover:opacity-100">
                {copiedKey === 'master_short' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stream</span>
              </button>

              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-semibold transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Categories</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY TABS & SEARCH CONTROLS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Streams ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat.name
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name} {cat.count > 0 && <span className="text-[10px] opacity-75">({cat.count})</span>}
            </button>
          ))}
        </div>

        {/* Search & Bulk Move */}
        <div className="flex items-center gap-2">
          {selectedItemIds.length > 0 && (
            <button
              onClick={() => setIsMoveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all animate-pulse"
            >
              <FolderSymlink className="w-3.5 h-3.5" />
              <span>Move ({selectedItemIds.length})</span>
            </button>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams or categories..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 3. STREAM CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const isSelected = selectedItemIds.includes(item.id);
          const isExpanded = expandedItem === item.id;
          const channelsData = categoryChannels[item.id];
          const m3uUrl = `${baseUrl}/api/nexusempire/${item.slug || item.m3uSlug}.m3u`;
          const shortM3uUrl = `${baseUrl}/nexusempire/${item.slug || item.m3uSlug}.m3u`;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                item.enabled
                  ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50 shadow-xl'
                  : 'bg-slate-950/80 border-slate-900 opacity-60'
              } ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
            >
              {/* Card Top */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Select Checkbox + Logo */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItemIds((prev) =>
                          prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                        )
                      }
                      className="text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={item.logo}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/nexus-logo.png';
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions & Power Toggle */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleToggleItem(item.id, item.enabled, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.enabled
                          ? 'text-emerald-400 hover:bg-emerald-950/40'
                          : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                      }`}
                      title={item.enabled ? 'Disable stream' : 'Enable stream'}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                      title="Edit stream details & URL slug"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {item.isCustom && (
                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete stream"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Category Badge */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base tracking-tight truncate">
                      {item.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      /{item.slug || item.m3uSlug}.m3u
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Full M3U URL Box */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5 text-xs font-mono">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">M3U Playlist URL</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-amber-300 truncate text-[11px] select-all font-mono">
                      {shortM3uUrl}
                    </span>
                    <button
                      onClick={() => copyToClipboard(shortM3uUrl, `${item.name} M3U URL`, `m3u_box_${item.id}`)}
                      className="shrink-0 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                      title="Copy full M3U URL"
                    >
                      {copiedKey === `m3u_box_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === `m3u_box_${item.id}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Tv className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-slate-200">{item.channelCount}</span>
                  <span>live streams</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(shortM3uUrl, `${item.name} M3U`, `m3u_${item.id}`)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-300 hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
                    title="Copy M3U URL"
                  >
                    <Copy className="w-3 h-3" />
                    <span>M3U</span>
                  </button>

                  <button
                    onClick={() => toggleExpand(item.id, item.slug || item.m3uSlug)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                  >
                    <span>Inspect</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Expanded Stream Inspector with Stream Disambiguation */}
              {isExpanded && (
                <div className="p-4 border-t border-amber-500/30 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                      Live Channels in {item.name}
                    </span>
                    {channelsData?.stats && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {channelsData.stats.exactDuplicatesRemoved} duplicates removed
                      </span>
                    )}
                  </div>

                  {!channelsData ? (
                    <div className="flex items-center justify-center py-6 text-xs text-slate-500">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2 text-amber-400" />
                      Loading channel stream feeds...
                    </div>
                  ) : channelsData.channels.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No channels matched for this category.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {channelsData.channels.map((ch) => (
                        <div
                          key={ch.id}
                          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
                              <img
                                src={ch.customLogo || ch.tvgLogo || item.logo}
                                alt={ch.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/nexus-logo.png';
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white truncate text-xs">
                                  {ch.customName || ch.name}
                                </span>
                                {ch.streamVariant && ch.streamVariant > 1 && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300">
                                    Variant {ch.streamVariant}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 truncate block font-mono">
                                {ch.customUrl || ch.url}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {onPreviewChannel && (
                              <button
                                onClick={() => onPreviewChannel(ch)}
                                className="p-1 rounded text-amber-400 hover:bg-slate-800"
                                title="Play stream"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setEditingChannel({ channel: ch, empireId: item.id })}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                              title="Edit stream details"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. MODALS */}
      {/* ADD STREAM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg text-white font-mono flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <span>Add Stream to NexusEmpire</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stream Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jio Sports VIP, Zee Super..."
                  value={newItemName}
                  onChange={(e) => {
                    setNewItemName(e.target.value);
                    if (!newItemSlug) {
                      setNewItemSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">URL Slug (e.g. /nexusempire/jiosports.m3u) *</label>
                <input
                  type="text"
                  required
                  placeholder="jiosports"
                  value={newItemSlug}
                  onChange={(e) => setNewItemSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">StreamBox Deep-Link / Stream URL *</label>
                <input
                  type="text"
                  required
                  placeholder="streambox://open/<hash> or https://..."
                  value={newItemUri}
                  onChange={(e) => setNewItemUri(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="Jio Sports">Jio Sports</option>
                  <option value="Entertainment & Movies">Entertainment & Movies</option>
                  <option value="Live Sports">Live Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Logo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newItemLogo}
                  onChange={(e) => setNewItemLogo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Stream description for AniTv / Streambox..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20"
                >
                  Create Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STREAM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg text-white font-mono flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <span>Edit Stream &amp; URL Name</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stream Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">URL Slug (e.g. /nexusempire/myname.m3u)</label>
                <input
                  type="text"
                  required
                  value={editingItem.slug || editingItem.m3uSlug}
                  onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">StreamBox Deep-Link / URL</label>
                <input
                  type="text"
                  required
                  value={editingItem.uri}
                  onChange={(e) => setEditingItem({ ...editingItem, uri: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Logo URL</label>
                <input
                  type="text"
                  value={editingItem.logo}
                  onChange={(e) => setEditingItem({ ...editingItem, logo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg text-white font-mono flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                <span>NexusEmpire Categories</span>
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="New Category (e.g. Jio Sports)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Add
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300"
                >
                  <span className="font-semibold">{cat.name}</span>
                  <span className="text-[11px] font-mono text-slate-500">{cat.count} streams</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BULK MOVE STREAMS MODAL */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base text-white font-mono flex items-center gap-2">
                <FolderSymlink className="w-4 h-4 text-amber-400" />
                <span>Move {selectedItemIds.length} Streams</span>
              </h3>
              <button onClick={() => setIsMoveModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-semibold block">Select Target Category</label>
              <select
                value={targetMoveCategory}
                onChange={(e) => setTargetMoveCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMove}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-white font-bold text-xs"
              >
                Move Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CHANNEL STREAM MODAL */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base text-white font-mono flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Stream Details</span>
              </h3>
              <button onClick={() => setEditingChannel(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChannelEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Channel Display Name</label>
                <input
                  type="text"
                  value={editingChannel.channel.customName || editingChannel.channel.name}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      channel: { ...editingChannel.channel, customName: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Group / Category</label>
                <input
                  type="text"
                  value={editingChannel.channel.customGroup || editingChannel.channel.groupTitle}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      channel: { ...editingChannel.channel, customGroup: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Logo URL</label>
                <input
                  type="text"
                  value={editingChannel.channel.customLogo || editingChannel.channel.tvgLogo || ''}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      channel: { ...editingChannel.channel, customLogo: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stream URL</label>
                <input
                  type="text"
                  value={editingChannel.channel.customUrl || editingChannel.channel.url}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      channel: { ...editingChannel.channel, customUrl: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-white font-bold"
                >
                  Save Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
