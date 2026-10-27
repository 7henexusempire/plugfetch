import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Code2,
  Download,
  Play,
  Flame,
  X
} from 'lucide-react';

interface CloudStreamRepo {
  id: string;
  name: string;
  url: string;
  lastSync: string | null;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage: string | null;
  itemCount: number;
  description?: string;
  iconUrl?: string;
}

interface CloudStreamItem {
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
  tvTypes?: string[];
  fileSize?: number;
  fileHash?: string;
  status?: number;
  enabled: boolean;
  isCustom?: boolean;
  isLiveEvent?: boolean;
  repoUrl: string;
  repoName?: string;
  updatedAt?: string;
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

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [showAddRepo, setShowAddRepo] = useState<boolean>(false);
  const [newRepoName, setNewRepoName] = useState<string>('');
  const [newRepoUrl, setNewRepoUrl] = useState<string>('');

  const [showAddCustomStream, setShowAddCustomStream] = useState<boolean>(false);
  const [customStreamData, setCustomStreamData] = useState({
    name: '',
    url: '',
    category: 'Cricfy Live Sports',
    logo: '',
    description: '',
  });

  const [editingItem, setEditingItem] = useState<CloudStreamItem | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(false);

  // Copied states
  const [copiedM3u, setCopiedM3u] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const getCleanBaseUrl = () => {
    let base = publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    base = base.replace(/:8443/g, '').replace(/:3000/g, '');
    if (base.includes('thenexusempire.com')) {
      base = 'https://thenexusempire.com';
    }
    return base.replace(/\/$/, '');
  };

  const cleanBase = getCleanBaseUrl();
  const m3uUrl = `${cleanBase}/cloudstream.m3u`;
  const jsonUrl = `${cleanBase}/cloudstream.json`;

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
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    onNotify('loading', 'Syncing CloudStream Hub...', 'Fetching CNCVerse extensions, Cricfy, SKTech & Live Events...');
    try {
      for (const r of repos) {
        await fetch(`/api/cloudstream/repos/${r.id}/sync`, { method: 'POST' });
      }
      await fetchData();
      onNotify('success', 'CloudStream Synced!', 'All providers and live stream feeds updated successfully');
    } catch (err: any) {
      onNotify('error', 'Sync Failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSingleRepo = async (repoId: string, repoName: string) => {
    setIsSyncing(true);
    onNotify('loading', 'Syncing Repository', `Fetching ${repoName}...`);
    try {
      const res = await fetch(`/api/cloudstream/repos/${repoId}/sync`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
        onNotify('success', 'Repository Synced', `Updated "${repoName}" successfully`);
      } else {
        throw new Error('Sync failed on server');
      }
    } catch (err: any) {
      onNotify('error', 'Sync Error', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim() || !newRepoUrl.trim()) return;
    try {
      const res = await fetch('/api/cloudstream/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRepoName.trim(), url: newRepoUrl.trim() }),
      });
      if (res.ok) {
        onNotify('success', 'Repo Registered', `Added "${newRepoName}". Now syncing plugins...`);
        setNewRepoName('');
        setNewRepoUrl('');
        setShowAddRepo(false);
        fetchData();
      }
    } catch (err: any) {
      onNotify('error', 'Add Failed', err.message);
    }
  };

  const handleDeleteRepo = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove repository "${name}" and all its streams?`)) return;
    try {
      const res = await fetch(`/api/cloudstream/repos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('success', 'Repo Removed', `Deleted ${name}`);
        fetchData();
      }
    } catch (err: any) {
      onNotify('error', 'Delete Error', err.message);
    }
  };

  const handleToggleItem = async (item: CloudStreamItem) => {
    try {
      const res = await fetch(`/api/cloudstream/items/${item.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !item.enabled }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, enabled: !item.enabled } : i))
        );
      }
    } catch (err: any) {
      onNotify('error', 'Toggle Error', err.message);
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
        onNotify('success', 'Stream Updated', `Saved changes for "${editingItem.name}"`);
        setEditingItem(null);
        fetchData();
      }
    } catch (err: any) {
      onNotify('error', 'Save Error', err.message);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Delete stream "${name}"?`)) return;
    try {
      const res = await fetch(`/api/cloudstream/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onNotify('success', 'Stream Deleted', `Removed "${name}"`);
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err: any) {
      onNotify('error', 'Delete Failed', err.message);
    }
  };

  const handleAddCustomStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStreamData.name || !customStreamData.url) return;
    try {
      const res = await fetch('/api/cloudstream/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customStreamData),
      });
      if (res.ok) {
        onNotify('success', 'Stream Added', `Added "${customStreamData.name}"`);
        setCustomStreamData({
          name: '',
          url: '',
          category: 'Cricfy Live Sports',
          logo: '',
          description: '',
        });
        setShowAddCustomStream(false);
        fetchData();
      }
    } catch (err: any) {
      onNotify('error', 'Failed to add stream', err.message);
    }
  };

  const copyToClipboard = (text: string, type: 'm3u' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'm3u') {
      setCopiedM3u(true);
      onNotify('success', 'Copied M3U URL', text);
      setTimeout(() => setCopiedM3u(false), 2500);
    } else {
      setCopiedJson(true);
      onNotify('success', 'Copied JSON URL', text);
      setTimeout(() => setCopiedJson(false), 2500);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.internalName && item.internalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' ||
        (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()) ||
        (selectedCategory === 'live' &&
          (item.category.toLowerCase().includes('live') ||
            (item.tvTypes && item.tvTypes.some((t) => t.toLowerCase() === 'live')))) ||
        (selectedCategory === 'cricfy' && item.category.toLowerCase().includes('cric')) ||
        (selectedCategory === 'sktech' && item.category.toLowerCase().includes('sktech'));

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Glassmorphic styling matching Nexus Empire */}
      <div className="bg-slate-900/40 border border-amber-500/20 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 max-w-3xl relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold text-white shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-wide">Nexus CloudStream &amp; Live Hub</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black uppercase text-amber-300">
                  Auto-Sync 5m
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Full-featured CloudStream repo parser fetching CNCVerse, Cricfy, SKTech &amp; live sports feeds. Real-time M3U &amp; JSON generation for OTT Navigator &amp; TiviMate.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Feeds...' : 'Sync All Repos'}</span>
          </button>

          <button
            onClick={() => setShowAddCustomStream(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stream</span>
          </button>

          <button
            onClick={() => setShowAddRepo(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Globe className="w-4 h-4" />
            <span>Add Repo URL</span>
          </button>
        </div>
      </div>

      {/* URL Showcase & Endpoints Cards (Clean domain, no :8443) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* M3U Link Card */}
        <div className="bg-slate-900/50 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between gap-3 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">OTT Navigator / TiviMate M3U URL</h4>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Clean URL (No Port)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Master playlist for Live Sports, Cricfy, SKTech &amp; Extensions</p>
              </div>
            </div>
            <a
              href="/cloudstream.m3u"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors"
              title="Download M3U Playlist"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5">
            <span className="font-mono text-xs text-amber-300 truncate select-all">{m3uUrl}</span>
            <button
              onClick={() => copyToClipboard(m3uUrl, 'm3u')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-500 text-white text-xs font-bold transition-all shrink-0 shadow-md shadow-amber-500/20"
            >
              {copiedM3u ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedM3u ? 'Copied' : 'Copy M3U'}</span>
            </button>
          </div>
        </div>

        {/* JSON API Endpoint Card */}
        <div className="bg-slate-900/50 border border-indigo-500/30 rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between gap-3 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">CloudStream JSON Raw Feed</h4>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                    Full Details
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Complete JSON payload with plugins, authors, versions &amp; streams</p>
              </div>
            </div>
            <button
              onClick={() => setShowJsonInspector(true)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 transition-colors"
              title="Inspect JSON In Browser"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5">
            <span className="font-mono text-xs text-indigo-300 truncate select-all">{jsonUrl}</span>
            <button
              onClick={() => copyToClipboard(jsonUrl, 'json')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shrink-0 shadow-md shadow-indigo-600/30"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connected Repositories Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active CloudStream Repositories</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
              {repos.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Repos automatically queried &amp; followed recursively every 5 minutes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all group"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {repo.iconUrl ? (
                      <img
                        src={repo.iconUrl}
                        alt={repo.name}
                        className="w-8 h-8 rounded-lg object-contain bg-slate-900 p-1 border border-slate-800"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                        CS
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        {repo.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[180px] font-mono">
                        {repo.url}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      repo.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : repo.status === 'fetching'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {repo.status === 'success' ? `${repo.itemCount} streams` : repo.status}
                  </span>
                </div>

                {repo.description && (
                  <p className="text-[11px] text-slate-300 line-clamp-1">{repo.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 font-mono">
                  {repo.lastSync ? `Synced ${new Date(repo.lastSync).toLocaleTimeString()}` : 'Not synced yet'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSyncSingleRepo(repo.id, repo.name)}
                    disabled={isSyncing}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-amber-900/40 text-slate-400 hover:text-amber-300 transition-colors"
                    title="Refresh this repository"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
                  {repos.length > 1 && (
                    <button
                      onClick={() => handleDeleteRepo(repo.id, repo.name)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove repository"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter, Search & Stream List Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams, Cricfy, SKTech, extensions, authors, TV types..."
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none backdrop-blur-md transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick preset filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setSelectedCategory('cricfy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'cricfy'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-amber-400" />
                Cricfy Live
              </span>
            </button>
            <button
              onClick={() => setSelectedCategory('sktech')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'sktech'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              SKTech &amp; Events
            </button>
            <button
              onClick={() => setSelectedCategory('live')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'live'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Live Sports &amp; TV
            </button>
          </div>
        </div>

        {/* Categories selector badges */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[11px]">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 font-medium ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Streams List Grid */}
        {isLoading ? (
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-semibold">Loading CloudStream extensions &amp; streams...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
            <Radio className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">No streams match your filter</h4>
            <p className="text-xs text-slate-400 mb-4">
              Try adjusting your search query or click &quot;Sync All Repos&quot; to fetch the latest streams.
            </p>
            <button
              onClick={handleSyncAll}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-white text-xs font-bold transition-all"
            >
              Sync Repositories Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredItems.map((item) => {
              const isCricfy = item.name.toLowerCase().includes('cric') || (item.category && item.category.toLowerCase().includes('cric'));
              const isSKTech = item.name.toLowerCase().includes('sktech') || (item.category && item.category.toLowerCase().includes('sktech'));

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900/60 border rounded-2xl p-4 backdrop-blur-xl flex flex-col justify-between gap-3.5 transition-all group ${
                    !item.enabled
                      ? 'border-slate-800/50 opacity-60'
                      : isCricfy
                      ? 'border-amber-500/30 hover:border-amber-400/60'
                      : isSKTech
                      ? 'border-amber-500/30 hover:border-amber-400/60'
                      : 'border-slate-800 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Logo, Name & TV Type Badges */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 p-1.5 overflow-hidden shadow-inner">
                        {item.logo ? (
                          <img
                            src={item.logo}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Tv className="w-5 h-5 text-slate-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                            {item.name}
                          </h4>
                          {item.version && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-mono">
                              v{item.version}
                            </span>
                          )}
                        </div>

                        {/* Category & TV Types */}
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                              isCricfy
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : isSKTech
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {item.category || 'Live Stream'}
                          </span>

                          {item.isLiveEvent && (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[9px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                              Live Feed
                            </span>
                          )}

                          {item.tvTypes &&
                            item.tvTypes.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[9px] font-mono"
                              >
                                {t}
                              </span>
                            ))}
                        </div>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => handleToggleItem(item)}
                        className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${
                          item.enabled ? 'bg-amber-500' : 'bg-slate-700'
                        }`}
                        title={item.enabled ? 'Disable stream' : 'Enable stream'}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                            item.enabled ? 'left-4' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Description & Author info */}
                    {item.description && (
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* URL preview box */}
                    <div className="bg-slate-950/70 border border-slate-900 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-slate-400 truncate select-all">
                        {item.url}
                      </span>
                      <button
                        onClick={() => copyToClipboard(item.url, 'm3u')}
                        className="text-slate-400 hover:text-amber-300 transition-colors shrink-0"
                        title="Copy direct stream / plugin URL"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Footer actions: Edit, Preview & Delete */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {item.author && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          by <span className="text-slate-300">{item.author}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Play Preview */}
                      <button
                        onClick={() =>
                          onPreviewChannel({
                            name: item.name,
                            url: item.url,
                            logo: item.logo,
                            group: item.category,
                          })
                        }
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-white transition-colors"
                        title="Play in Built-in Player"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingItem({ ...item })}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors"
                        title="Edit Name, Category, Logo, URL"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete Stream"
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

      {/* MODAL 1: Edit Stream Details (Logo, Name, Category, URL) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Edit Stream / Feed Details</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Stream / Channel Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-medium focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Category / Group Title</label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  placeholder="e.g. Cricfy Live Sports, SKTech Live Events"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-medium focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Stream / Feed URL</label>
                <input
                  type="text"
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-amber-300 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Logo Image URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingItem.logo}
                    onChange={(e) => setEditingItem({ ...editingItem, logo: e.target.value })}
                    placeholder="https://.../logo.png"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-300 focus:border-amber-500 outline-none"
                  />
                  {editingItem.logo && (
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={editingItem.logo}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Description / Notes</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-300 focus:border-amber-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Custom Stream / Feed */}
      {showAddCustomStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Add Custom Stream / Channel</h3>
              </div>
              <button
                onClick={() => setShowAddCustomStream(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomStream} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Stream Name</label>
                <input
                  type="text"
                  value={customStreamData.name}
                  onChange={(e) => setCustomStreamData({ ...customStreamData, name: e.target.value })}
                  placeholder="e.g. Star Sports 1 HD"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Category / Group Title</label>
                <input
                  type="text"
                  value={customStreamData.category}
                  onChange={(e) => setCustomStreamData({ ...customStreamData, category: e.target.value })}
                  placeholder="e.g. Cricfy Live Sports, SKTech Live Events"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Stream URL (M3U8 / HTTP)</label>
                <input
                  type="url"
                  value={customStreamData.url}
                  onChange={(e) => setCustomStreamData({ ...customStreamData, url: e.target.value })}
                  placeholder="https://.../stream.m3u8"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-amber-300 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Logo URL (Optional)</label>
                <input
                  type="url"
                  value={customStreamData.logo}
                  onChange={(e) => setCustomStreamData({ ...customStreamData, logo: e.target.value })}
                  placeholder="https://.../icon.png"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-300 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomStream(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  Add Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add CloudStream Repo */}
      {showAddRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Add CloudStream Repository</h3>
              </div>
              <button
                onClick={() => setShowAddRepo(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRepo} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Repository Name</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="e.g. CNCVerse CloudStream Hub"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Repository Manifest JSON URL</label>
                <input
                  type="url"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/.../repo.json"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-amber-300 font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Quick Presets:</p>
                <button
                  type="button"
                  onClick={() => {
                    setNewRepoName('CNCVerse Official');
                    setNewRepoUrl('https://raw.githubusercontent.com/NivinCNC/CNCVerse-Cloud-Stream-Extension/refs/heads/builds/CNC.json');
                  }}
                  className="block text-amber-400 hover:underline text-left"
                >
                  CNCVerse Official (Cricfy, SKTech &amp; 38 Providers)
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRepo(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20"
                >
                  Add &amp; Fetch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Full JSON Inspector Modal */}
      {showJsonInspector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">CloudStream JSON Payload Inspector</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono">
                  {items.length} items
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(items, null, 2), 'json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Raw JSON</span>
                </button>
                <button
                  onClick={() => setShowJsonInspector(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs font-mono text-amber-300">
              <pre>{JSON.stringify({ totalItems: items.length, repos, items }, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
