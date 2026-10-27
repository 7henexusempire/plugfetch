import React, { useState, useEffect } from 'react';
import {
  RadioTower,
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
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Tv,
} from 'lucide-react';
import { ChannelItem } from '../types';

export interface StremioAddon {
  id: string;
  name: string;
  version: string;
  description: string;
  manifestUrl: string;
  logo: string;
  types: string[];
  catalogs?: any[];
  resources?: string[];
  enabled: boolean;
  isNuvioCompatible?: boolean;
  status: 'idle' | 'fetching' | 'success' | 'error';
  errorMessage?: string | null;
  lastSync?: string | null;
}

export interface CNCVerseStream {
  id: string;
  name: string;
  url: string;
  category: string;
  logo: string;
  description?: string;
  source: 'cncverse_bridge' | 'stremio_addon' | 'nuvio_module' | 'custom';
  bridgeEndpoint?: string;
  isLive: boolean;
  enabled: boolean;
  quality?: string;
  updatedAt?: string;
}

interface StremioNuvioViewProps {
  onNotify: (type: 'success' | 'error' | 'info' | 'loading', title: string, message?: string) => void;
  publicBaseUrl?: string;
  onPreviewChannel: (ch: ChannelItem) => void;
}

export const StremioNuvioView: React.FC<StremioNuvioViewProps> = ({
  onNotify,
  publicBaseUrl = '',
  onPreviewChannel,
}) => {
  const [addons, setAddons] = useState<StremioAddon[]>([]);
  const [streams, setStreams] = useState<CNCVerseStream[]>([]);
  const [bridgeStatus, setBridgeStatus] = useState<{ url: string; status: string; lastCheck: string | null }>({
    url: 'https://cncverse.dpdns.org',
    status: 'checking',
    lastCheck: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncingBridge, setIsSyncingBridge] = useState<boolean>(false);
  const [isSyncingAddon, setIsSyncingAddon] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'cncverse' | 'stremio_nuvio'>('cncverse');

  // Input states
  const [manifestInput, setManifestInput] = useState<string>('');
  const [bridgeUrlInput, setBridgeUrlInput] = useState<string>('https://cncverse.dpdns.org');

  // Stream Edit / Add modals
  const [editingStream, setEditingStream] = useState<CNCVerseStream | null>(null);
  const [isAddStreamOpen, setIsAddStreamOpen] = useState<boolean>(false);
  const [newStreamForm, setNewStreamForm] = useState({
    name: '',
    url: '',
    category: 'CNCVerse Live Sports',
    logo: '',
    quality: '1080p HD',
  });

  // Copied keys
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Clean domain URLs without port :8443
  const cleanBase = (publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://thenexusempire.com')).replace(/:8443$/, '');
  const cncM3uUrl = `${cleanBase}/cncverse.m3u`;
  const cncJsonUrl = `${cleanBase}/cncverse.json`;
  const stremioM3uUrl = `${cleanBase}/stremio.m3u`;
  const stremioJsonUrl = `${cleanBase}/stremio.json`;

  const fetchData = async () => {
    try {
      const [addonsRes, streamsRes] = await Promise.all([
        fetch('/api/stremio/addons'),
        fetch('/api/cncverse/streams'),
      ]);

      if (addonsRes.ok) {
        const data = await addonsRes.json();
        setAddons(data);
      }

      if (streamsRes.ok) {
        const data = await streamsRes.json();
        setStreams(data.streams || []);
        if (data.bridge) setBridgeStatus(data.bridge);
      }
    } catch (err) {
      console.error('Failed to load Stremio/CNCVerse data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  const handleSyncBridge = async () => {
    setIsSyncingBridge(true);
    onNotify('loading', 'Probing CNCVerse Bridge', 'Contacting https://cncverse.dpdns.org/...');
    try {
      const res = await fetch('/api/cncverse/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        onNotify('success', 'CNCVerse Bridge Synced', `${data.count} live streams validated.`);
        await fetchData();
      } else {
        throw new Error(data.error || 'Failed to sync bridge');
      }
    } catch (err: any) {
      onNotify('error', 'Bridge Sync Failed', err.message);
    } finally {
      setIsSyncingBridge(false);
    }
  };

  const handleAddAddon = async (manifestUrl: string) => {
    if (!manifestUrl.trim()) return;
    setIsSyncingAddon(true);
    onNotify('loading', 'Installing Stremio Addon', manifestUrl);
    try {
      const res = await fetch('/api/stremio/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifestUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        onNotify('success', 'Addon Installed', data.addon.name);
        setManifestInput('');
        await fetchData();
      } else {
        throw new Error(data.error || 'Addon install failed');
      }
    } catch (err: any) {
      onNotify('error', 'Addon Install Failed', err.message);
    } finally {
      setIsSyncingAddon(false);
    }
  };

  const handleToggleStream = async (id: string) => {
    try {
      const res = await fetch(`/api/cncverse/streams/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        setStreams((prev) =>
          prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
        );
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleSaveStreamEdit = async () => {
    if (!editingStream) return;
    try {
      const res = await fetch(`/api/cncverse/streams/${editingStream.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStream),
      });
      if (res.ok) {
        setStreams((prev) =>
          prev.map((s) => (s.id === editingStream.id ? editingStream : s))
        );
        setEditingStream(null);
        onNotify('success', 'Stream Updated', editingStream.name);
      }
    } catch (err: any) {
      onNotify('error', 'Update Failed', err.message);
    }
  };

  const handleAddCustomStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamForm.name || !newStreamForm.url) return;
    try {
      const res = await fetch('/api/cncverse/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStreamForm,
          source: 'custom',
          isLive: true,
          enabled: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStreams((prev) => [data.item, ...prev]);
        setIsAddStreamOpen(false);
        setNewStreamForm({ name: '', url: '', category: 'CNCVerse Live Sports', logo: '', quality: '1080p HD' });
        onNotify('success', 'Channel Added', data.item.name);
      }
    } catch (err: any) {
      onNotify('error', 'Failed to Add Channel', err.message);
    }
  };

  const handleDeleteStream = async (id: string) => {
    if (!confirm('Are you sure you want to remove this channel?')) return;
    try {
      const res = await fetch(`/api/cncverse/streams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStreams((prev) => prev.filter((s) => s.id !== id));
        onNotify('info', 'Channel Removed');
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
  const categories = Array.from(new Set(streams.map((s) => s.category).filter(Boolean)));

  const filteredStreams = streams.filter((s) => {
    const matchesSearch =
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Section: Tab Switcher & Clean Domain URLs */}
      <div className="p-5 sm:p-6 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 via-indigo-500/20 to-pink-600/30 border border-purple-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10">
              <RadioTower className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Nuvio & Stremio Ecosystem</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-400/40 text-purple-300 uppercase tracking-wider">
                  Bridge Active
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  {streams.filter((s) => s.enabled).length} Live Channels
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Aggregates addons from{' '}
                <a href="https://www.stremio.com" target="_blank" rel="noreferrer" className="text-purple-400 font-semibold hover:underline">
                  Stremio
                </a>
                ,{' '}
                <a href="https://github.com/NuvioMedia/NuvioMobile" target="_blank" rel="noreferrer" className="text-pink-400 font-semibold hover:underline">
                  Nuvio Mobile
                </a>
                , and a dedicated bridge space for{' '}
                <a href="https://cncverse.dpdns.org" target="_blank" rel="noreferrer" className="text-amber-400 font-semibold hover:underline">
                  CNCVerse-Bridge
                </a>
                .
              </p>
            </div>
          </div>

          {/* Sub-Space Switcher Pills */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              onClick={() => setActiveSubTab('cncverse')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'cncverse'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>CNCVerse-Bridge Space</span>
            </button>
            <button
              onClick={() => setActiveSubTab('stremio_nuvio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'stremio_nuvio'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RadioTower className="w-3.5 h-3.5 text-purple-300" />
              <span>Stremio & Nuvio Addons</span>
            </button>
          </div>
        </div>

        {/* Clean URL Links */}
        <div className="pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* CNCVerse M3U */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">CNCVerse-Bridge M3U</div>
              <div className="text-xs font-mono text-slate-200 truncate">{cncM3uUrl}</div>
            </div>
            <button
              onClick={() => copyToClipboard(cncM3uUrl, 'cnc_m3u')}
              className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white transition-all shrink-0"
              title="Copy M3U"
            >
              {copiedKey === 'cnc_m3u' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Stremio / Nuvio M3U */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Stremio & Nuvio Ecosystem M3U</div>
              <div className="text-xs font-mono text-slate-200 truncate">{stremioM3uUrl}</div>
            </div>
            <button
              onClick={() => copyToClipboard(stremioM3uUrl, 'stremio_m3u')}
              className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 hover:text-white transition-all shrink-0"
              title="Copy M3U"
            >
              {copiedKey === 'stremio_m3u' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. DISTINCT SPACE: CNCVERSE-BRIDGE                      */}
      {/* ======================================================== */}
      {activeSubTab === 'cncverse' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Bridge Live Monitor Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/35 via-black/40 to-black/50 backdrop-blur-md border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">CNCVerse-Bridge Server Hub</h3>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LIVE PROBE: {bridgeStatus.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Official Host: <span className="font-mono text-amber-300">{bridgeStatus.url}</span> &{' '}
                    <a href="https://github.com/NivinCNC/CNCVerse-Bridge" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">
                      NivinCNC/CNCVerse-Bridge
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddStreamOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add CNC Channel</span>
                </button>

                <button
                  onClick={handleSyncBridge}
                  disabled={isSyncingBridge}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBridge ? 'animate-spin' : ''}`} />
                  <span>{isSyncingBridge ? 'Probing Bridge...' : 'Probe & Sync'}</span>
                </button>
              </div>
            </div>

            {/* Quick Filter & Search Bar */}
            <div className="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search CNCVerse live cricket, football, sports..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-200 outline-none focus:border-amber-400"
                >
                  <option value="all">All CNC Categories ({streams.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c} ({streams.filter((s) => s.category === c).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Streams Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStreams.map((item) => (
              <div
                key={item.id}
                className={`group p-4 rounded-2xl border transition-all duration-200 backdrop-blur-md flex flex-col justify-between ${
                  item.enabled
                    ? 'bg-black/35 hover:bg-black/45 border-white/10 hover:border-amber-400/40 shadow-lg'
                    : 'bg-black/20 border-white/5 opacity-55'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {item.logo ? (
                        <img
                          src={item.logo}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ08h1gOe7MPxwehZBrbYKAUtjv22B6rAJ1kMkN-cea64Ka49KUyGU2lpTz&s=10';
                          }}
                        />
                      ) : (
                        <Radio className="w-6 h-6 text-amber-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-white/[0.06] border border-white/10 text-slate-300 truncate max-w-[120px]">
                          {item.category}
                        </span>
                        {item.quality && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                            {item.quality}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description || `High-speed live streaming feed bridged via CNCVerse.`}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Play Preview */}
                    <button
                      onClick={() =>
                        onPreviewChannel({
                          id: item.id,
                          name: item.name,
                          url: item.url,
                          logo: item.logo,
                          groupTitle: item.category,
                          sourceId: 'cncverse',
                          sourceName: 'CNCVerse Bridge',
                          enabled: item.enabled,
                        })
                      }
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-white/10 transition-all"
                      title="Play Live Stream"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Copy URL */}
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

                    {/* Edit */}
                    <button
                      onClick={() => setEditingStream(item)}
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition-all"
                      title="Edit Stream"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteStream(item.id)}
                      className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 transition-all"
                      title="Delete Stream"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleStream(item.id)}
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
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STREMIO & NUVIO ADDONS SPACE                         */}
      {/* ======================================================== */}
      {activeSubTab === 'stremio_nuvio' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Manifest Installer */}
          <div className="p-5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <RadioTower className="w-4 h-4 text-purple-400" />
                  <span>Install Stremio / Nuvio Addon Manifest</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Enter any manifest URL (e.g. <span className="text-purple-300 font-mono">https://.../manifest.json</span> or <span className="text-purple-300 font-mono">stremio://...</span>)
                </p>
              </div>

              {/* Preset Addons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { name: '+ Cinemeta', url: 'https://v3-cinemeta.strem.io/manifest.json' },
                  { name: '+ CyberFlix', url: 'https://cyberflix.elfhosted.com/manifest.json' },
                  { name: '+ MediaFusion', url: 'https://mediafusion.elfhosted.com/manifest.json' },
                  { name: '+ Torrentio', url: 'https://torrentio.strem.fun/manifest.json' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleAddAddon(preset.url)}
                    disabled={isSyncingAddon}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-purple-400/50 text-[11px] font-semibold text-purple-300 hover:text-white transition-all"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manifestInput}
                onChange={(e) => setManifestInput(e.target.value)}
                placeholder="Enter Stremio manifest URL (https://.../manifest.json)..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-xs sm:text-sm text-white placeholder-slate-400 outline-none backdrop-blur-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddAddon(manifestInput);
                }}
              />
              <button
                onClick={() => handleAddAddon(manifestInput)}
                disabled={!manifestInput.trim() || isSyncingAddon}
                className="px-5 py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-600/20"
              >
                Add Manifest
              </button>
            </div>
          </div>

          {/* Addons List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="p-5 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 hover:border-purple-400/40 transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {addon.logo ? (
                        <img
                          src={addon.logo}
                          alt={addon.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://www.stremio.com/favicon.png';
                          }}
                        />
                      ) : (
                        <RadioTower className="w-6 h-6 text-purple-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white truncate">{addon.name}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
                          v{addon.version}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {addon.types.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-white/[0.06] border border-white/10 text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{addon.description}</p>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-slate-300 break-all select-all">
                    {addon.manifestUrl}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(addon.manifestUrl, addon.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/10"
                    >
                      {copiedKey === addon.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Manifest</span>
                    </button>
                  </div>

                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Nuvio Ready</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Stream Modal */}
      {editingStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-950/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              <span>Edit CNCVerse Channel</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Channel Name</label>
                <input
                  type="text"
                  value={editingStream.name}
                  onChange={(e) => setEditingStream({ ...editingStream, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Category</label>
                <input
                  type="text"
                  value={editingStream.category}
                  onChange={(e) => setEditingStream({ ...editingStream, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Logo URL</label>
                <input
                  type="text"
                  value={editingStream.logo}
                  onChange={(e) => setEditingStream({ ...editingStream, logo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Stream URL</label>
                <input
                  type="text"
                  value={editingStream.url}
                  onChange={(e) => setEditingStream({ ...editingStream, url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingStream(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStreamEdit}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-500/20"
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
              <span>Add CNCVerse Live Channel</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Channel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Star Sports 2 HD"
                  value={newStreamForm.name}
                  onChange={(e) => setNewStreamForm({ ...newStreamForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Stream URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://.../live.m3u8"
                  value={newStreamForm.url}
                  onChange={(e) => setNewStreamForm({ ...newStreamForm, url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Category</label>
                <input
                  type="text"
                  placeholder="CNCVerse Live Sports"
                  value={newStreamForm.category}
                  onChange={(e) => setNewStreamForm({ ...newStreamForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">Logo Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newStreamForm.logo}
                  onChange={(e) => setNewStreamForm({ ...newStreamForm, logo: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:border-amber-400 outline-none"
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
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-500/20"
              >
                Add Channel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
