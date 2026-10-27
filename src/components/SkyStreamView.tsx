import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Play,
  Edit3,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap,
  Flame,
  Info,
} from 'lucide-react';
import { ChannelItem } from '../types';

export interface SkyStreamItem {
  id: string;
  name: string;
  internalName?: string;
  url: string;
  category: string;
  logo: string;
  description: string;
  author?: string;
  version?: string;
  language?: string;
  types?: string[];
  shortcode?: string;
  repoUrl: string;
  repoName?: string;
  enabled: boolean;
  isCustom?: boolean;
  isLive?: boolean;
  updatedAt?: string;
}

export interface SkyStreamRepo {
  id: string;
  name: string;
  shortcode?: string;
  url: string;
  lastSync: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  itemCount: number;
  description?: string;
}

interface SkyStreamViewProps {
  onNotify: (type: 'success' | 'error' | 'info' | 'loading', title: string, message?: string) => void;
  publicBaseUrl?: string;
  onPreviewChannel: (ch: ChannelItem) => void;
}

export const SkyStreamView: React.FC<SkyStreamViewProps> = ({
  onNotify,
  publicBaseUrl = '',
  onPreviewChannel,
}) => {
  const [repos, setRepos] = useState<SkyStreamRepo[]>([]);
  const [items, setItems] = useState<SkyStreamItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedShortcode, setSelectedShortcode] = useState<string>('all');

  // Input states
  const [shortcodeInput, setShortcodeInput] = useState<string>('');
  const [customRepoUrl, setCustomRepoUrl] = useState<string>('');
  const [isAddingRepo, setIsAddingRepo] = useState<boolean>(false);

  // Editing state
  const [editingItem, setEditingItem] = useState<SkyStreamItem | null>(null);
  const [isAddStreamOpen, setIsAddStreamOpen] = useState<boolean>(false);
  const [newStreamForm, setNewStreamForm] = useState({
    name: '',
    url: '',
    category: 'SkyStream Sports',
    logo: '',
    description: '',
  });

  // Copied state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Clean domain base URL without port :8443
  const cleanBase = (publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://thenexusempire.com')).replace(/:8443$/, '');
  const m3uUrl = `${cleanBase}/skystream.m3u`;
  const jsonUrl = `${cleanBase}/skystream.json`;

  const fetchExtensions = async () => {
    try {
      const res = await fetch('/api/skystream/extensions');
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos || []);
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch SkyStream extensions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchExtensions();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleFetchRepo = async (targetInput: string, name?: string) => {
    if (!targetInput.trim()) return;
    setIsSyncing(true);
    onNotify('loading', 'Fetching SkyStream Repository', `Resolving ${targetInput}...`);

    try {
      const res = await fetch('/api/skystream/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetInput.trim(), name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch repository');

      onNotify('success', 'SkyStream Synced', `Added repository ${data.repo.name}`);
      setShortcodeInput('');
      setCustomRepoUrl('');
      setIsAddingRepo(false);
      await fetchExtensions();
    } catch (err: any) {
      onNotify('error', 'Sync Failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    onNotify('loading', 'Refreshing SkyStream Providers', 'Syncing Universe extensions...');
    try {
      const res = await fetch('/api/skystream/sync-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        onNotify('success', 'SkyStream Refreshed', `Synced ${data.totalRepos} repos, ${data.totalItems} streams loaded.`);
        await fetchExtensions();
      } else {
        throw new Error(data.error || 'Failed to refresh');
      }
    } catch (err: any) {
      onNotify('error', 'Refresh Failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/skystream/items/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it))
        );
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/skystream/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) {
        setItems((prev) => prev.map((it) => (it.id === editingItem.id ? editingItem : it)));
        setEditingItem(null);
        onNotify('success', 'Stream Updated', editingItem.name);
      }
    } catch (err: any) {
      onNotify('error', 'Update Failed', err.message);
    }
  };

  const handleAddCustomStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamForm.name || !newStreamForm.url) return;

    try {
      const res = await fetch('/api/skystream/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStreamForm,
          repoUrl: 'custom:skystream',
          repoName: 'Custom Provider',
          enabled: true,
          types: ['Live', 'Sports'],
          isLive: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [data.item, ...prev]);
        setIsAddStreamOpen(false);
        setNewStreamForm({ name: '', url: '', category: 'SkyStream Sports', logo: '', description: '' });
        onNotify('success', 'Custom Stream Added', data.item.name);
      }
    } catch (err: any) {
      onNotify('error', 'Failed to Add Stream', err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this stream?')) return;
    try {
      const res = await fetch(`/api/skystream/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        onNotify('info', 'Stream Removed');
      }
    } catch (err: any) {
      onNotify('error', 'Delete Failed', err.message);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
      onNotify('success', 'Copied to Clipboard', text);
    } catch {
      // Fallback
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

  // Categories
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  // Filtered items
  const filteredItems = items.filter((it) => {
    const matchesSearch =
      searchQuery === '' ||
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || it.category === selectedCategory;
    const matchesShortcode =
      selectedShortcode === 'all' ||
      it.shortcode === selectedShortcode ||
      (selectedShortcode === 'other' && !it.shortcode);
    return matchesSearch && matchesCategory && matchesShortcode;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Clean Domain URLs */}
      <div className="p-5 sm:p-6 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600/30 via-cyan-500/20 to-indigo-600/30 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/10">
              <Globe className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">SkyStream Hub</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 border border-sky-400/40 text-yellow-300 uppercase tracking-wider">
                  v2.4
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  {items.filter((i) => i.enabled).length} Active Streams
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Integrated scraper engine for{' '}
                <a
                  href="https://github.com/akashdh11/skystream"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline font-semibold"
                >
                  SkyStream
                </a>{' '}
                extensions, shortcodes (<span className="text-amber-300 font-mono">universe</span>), Live TV & sports.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddStreamOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-semibold transition-all backdrop-blur-sm"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Custom Stream</span>
            </button>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg backdrop-blur-sm ${
                isSyncing
                  ? 'bg-white/[0.05] text-slate-400 cursor-not-allowed border border-white/10'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white border border-sky-400/40 shadow-sky-500/25 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync SkyStream'}</span>
            </button>
          </div>
        </div>

        {/* Clean URLs Copy Bar */}
        <div className="pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* M3U URL */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-300">SkyStream M3U Playlist</div>
              <div className="text-xs font-mono text-slate-200 truncate">{m3uUrl}</div>
            </div>
            <button
              onClick={() => copyToClipboard(m3uUrl, 'm3u')}
              className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white transition-all shrink-0"
              title="Copy M3U URL"
            >
              {copiedKey === 'm3u' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* JSON URL */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">SkyStream JSON Feed</div>
              <div className="text-xs font-mono text-slate-200 truncate">{jsonUrl}</div>
            </div>
            <button
              onClick={() => copyToClipboard(jsonUrl, 'json')}
              className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white transition-all shrink-0"
              title="Copy JSON URL"
            >
              {copiedKey === 'json' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Shortcode Quick Resolver & Repository Manager */}
      <div className="p-5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>SkyStream Shortcode & Extension Repositories</span>
            </h3>
            <p className="text-xs text-slate-400">
              Enter shortcodes like <span className="text-yellow-300 font-mono">universe</span> or custom raw GitHub manifest URLs.
            </p>
          </div>

          {/* Preset Shortcode Quick Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { code: 'universe', name: 'Universe (Official)' },
              { code: 'skysports', name: 'SkySports' },
              { code: 'cricfy', name: 'Cricfy Bridge' },
              { code: 'superstream', name: 'SuperStream' },
            ].map((preset) => (
              <button
                key={preset.code}
                onClick={() => handleFetchRepo(preset.code)}
                disabled={isSyncing}
                className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-sky-400/50 text-[11px] font-mono text-yellow-300 hover:text-white transition-all"
              >
                +{preset.code}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcode / URL input box */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={shortcodeInput}
            onChange={(e) => setShortcodeInput(e.target.value)}
            placeholder="Type shortcode (e.g. universe) or raw repository JSON URL..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 text-xs sm:text-sm text-white placeholder-slate-400 outline-none backdrop-blur-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFetchRepo(shortcodeInput);
            }}
          />
          <button
            onClick={() => handleFetchRepo(shortcodeInput)}
            disabled={!shortcodeInput.trim() || isSyncing}
            className="px-5 py-2.5 rounded-xl bg-sky-600/80 hover:bg-sky-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-sky-600/20"
          >
            Fetch Extension
          </button>
        </div>

        {/* Installed Repositories Badges */}
        <div className="flex flex-wrap gap-2 pt-2">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 backdrop-blur-sm"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  repo.status === 'fetching'
                    ? 'bg-amber-400 animate-ping'
                    : repo.status === 'error'
                    ? 'bg-rose-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="font-semibold text-white">{repo.name}</span>
              {repo.shortcode && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/70 text-yellow-300 border border-sky-500/30">
                  {repo.shortcode}
                </span>
              )}
              <span className="text-[10px] text-slate-400">({repo.itemCount} items)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels, providers, sports..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-400 outline-none focus:border-sky-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 outline-none focus:border-sky-400"
          >
            <option value="all">All Categories ({items.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({items.filter((i) => i.category === cat).length})
              </option>
            ))}
          </select>

          {/* Shortcode Filter */}
          <select
            value={selectedShortcode}
            onChange={(e) => setSelectedShortcode(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 outline-none focus:border-sky-400"
          >
            <option value="all">All Shortcodes</option>
            <option value="universe">Universe</option>
            <option value="skysports">SkySports</option>
            <option value="cricfy">Cricfy</option>
            <option value="superstream">SuperStream</option>
            <option value="other">Custom Providers</option>
          </select>
        </div>
      </div>

      {/* Streams Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span>Loading SkyStream extensions...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-2xl bg-black/30 border border-white/10 text-center text-slate-400 space-y-2">
          <Globe className="w-10 h-10 text-slate-500 mx-auto" />
          <p className="font-semibold text-slate-300">No SkyStream channels matched your search.</p>
          <p className="text-xs text-slate-400">Try changing your search term or fetch a repository shortcode.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group p-4 rounded-2xl border transition-all duration-200 backdrop-blur-md flex flex-col justify-between ${
                item.enabled
                  ? 'bg-black/35 hover:bg-black/45 border-white/10 hover:border-sky-400/40 shadow-lg'
                  : 'bg-black/20 border-white/5 opacity-55'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Logo, Name, Badge */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {item.logo ? (
                      <img
                        src={item.logo}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://raw.githubusercontent.com/akashdh11/skystream/main/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png';
                        }}
                      />
                    ) : (
                      <Radio className="w-6 h-6 text-amber-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-yellow-300 transition-colors">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-white/[0.06] border border-white/10 text-slate-300 truncate max-w-[130px]">
                        {item.category}
                      </span>
                      {item.isLive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description / Meta */}
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description || `${item.name} feed provided via SkyStream.`}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  {item.shortcode && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-950/60 text-yellow-300 font-mono border border-sky-500/30">
                      #{item.shortcode}
                    </span>
                  )}
                  {item.author && (
                    <span className="text-slate-400 truncate max-w-[120px]">by {item.author}</span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Test Play */}
                  <button
                    onClick={() =>
                      onPreviewChannel({
                        id: item.id,
                        name: item.name,
                        url: item.url,
                        logo: item.logo,
                        groupTitle: item.category,
                        sourceId: 'skystream',
                        sourceName: item.repoName || 'SkyStream',
                        enabled: item.enabled,
                      })
                    }
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-sky-500/20 text-yellow-300 hover:text-sky-200 border border-white/10 transition-all"
                    title="Play Stream Preview"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Copy Stream URL */}
                  <button
                    onClick={() => copyToClipboard(item.url, item.id)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition-all"
                    title="Copy Direct URL"
                  >
                    {copiedKey === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Edit Stream */}
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition-all"
                    title="Edit Name & Logo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Stream */}
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 transition-all"
                    title="Remove Stream"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Enable/Disable Toggle */}
                <button
                  onClick={() => handleToggle(item.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    item.enabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.enabled ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-950/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <span>Edit SkyStream Item</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Stream Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-sky-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Category</label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-sky-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Logo URL</label>
                <input
                  type="text"
                  value={editingItem.logo}
                  onChange={(e) => setEditingItem({ ...editingItem, logo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-sky-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Stream URL</label>
                <input
                  type="text"
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-sky-400 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white shadow-lg shadow-sky-600/30"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Stream Modal */}
      {isAddStreamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleAddCustomStream}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-950/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-4"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Add Custom SkyStream Provider</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Stream / Channel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sky Sports F1 Live HD"
                  value={newStreamForm.name}
                  onChange={(e) => setNewStreamForm({ ...newStreamForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-sky-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Direct Stream / Playlist URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://.../stream.m3u8"
                  value={newStreamForm.url}
                  onChange={(e) => setNewStreamForm({ ...newStreamForm, url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-sky-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Category</label>
                <input
                  type="text"
                  placeholder="SkyStream Sports"
                  value={newStreamForm.category}
                  onChange={(e) => setNewStreamForm({ ...newStreamForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-sky-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Logo Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newStreamForm.logo}
                  onChange={(e) => setNewStreamForm({ ...newStreamForm, logo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-sky-400 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddStreamOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white shadow-lg shadow-sky-600/30"
              >
                Add Stream
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
