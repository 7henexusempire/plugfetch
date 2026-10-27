import React, { useState, useEffect, useCallback } from 'react';
import {
  Tv,
  Layers,
  FileCode,
  Settings,
  Sparkles,
  Radio,
  Upload,
} from 'lucide-react';
import { Header } from './components/Header';
import { VideoBackground } from './components/VideoBackground';
import { ToastContainer } from './components/ToastContainer';
import { QuickConnect } from './components/QuickConnect';
import { ChannelList } from './components/ChannelList';
import { GroupManager } from './components/GroupManager';
import { NexusEmpireView } from './components/NexusEmpireView';
import { NexusRebuildView } from './components/NexusRebuildView';
import { CloudStreamView } from './components/CloudStreamView';
import { RawInspector } from './components/RawInspector';
import { ChannelModal } from './components/ChannelModal';
import { AddChannelModal } from './components/AddChannelModal';
import { StreamPlayerModal } from './components/StreamPlayerModal';
import { SettingsModal } from './components/SettingsModal';
import { PlaylistSourcesModal } from './components/PlaylistSourcesModal';
import { UploadM3UModal } from './components/UploadM3UModal';
import {
  ChannelItem,
  GroupInfo,
  SyncStatus,
  PlaylistSettings,
  PlaylistSource,
  ToastItem,
} from './types';

export default function App() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [sources, setSources] = useState<PlaylistSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [totalChannels, setTotalChannels] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [activeTab, setActiveTab] = useState<'channels' | 'groups' | 'nexusempire' | 'aninexus' | 'rebuild' | 'cloudstream' | 'raw'>('channels');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState<boolean>(true);

  // Modern Toast System
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Modals state
  const [editingChannel, setEditingChannel] = useState<ChannelItem | null>(null);
  const [isAddChannelOpen, setIsAddChannelOpen] = useState<boolean>(false);
  const [previewingChannel, setPreviewingChannel] = useState<ChannelItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<PlaylistSettings>({
    syncIntervalMinutes: 30,
    autoSync: true,
    userAgent: '',
    customTvgUrl: '',
    publicBaseUrl: '',
    zeotvStripSuffix: true,
    zeotvRemoveGroupLogo: true,
    appTitle: 'Nexus',
    dedupMode: 'smart',
  });

  const notify = (
    type: 'success' | 'error' | 'info' | 'loading',
    title: string,
    message?: string,
    duration = 3500
  ) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastItem = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data: SyncStatus = await res.json();
        setStatus(data);
        if (data.sources) {
          setSources(data.sources);
        }
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data: PlaylistSource[] = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    }
  }, []);

  const fetchGroups = useCallback(async (sourceId = selectedSource) => {
    try {
      const params = new URLSearchParams();
      if (sourceId !== 'all') params.set('sourceId', sourceId);
      const res = await fetch(`/api/groups?${params.toString()}`);
      if (res.ok) {
        const data: GroupInfo[] = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  }, [selectedSource]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data: PlaylistSettings = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  const fetchChannels = useCallback(
    async (
      page = 1,
      sourceId = selectedSource,
      search = searchQuery,
      group = selectedGroup,
      stat = statusFilter
    ) => {
      setIsLoadingChannels(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
          sourceId,
          search,
          group,
          status: stat,
        });
        const res = await fetch(`/api/channels?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setChannels(data.channels || []);
          setTotalChannels(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.page || 1);
        }
      } catch (err) {
        console.error('Failed to load channels:', err);
      } finally {
        setIsLoadingChannels(false);
      }
    },
    [selectedSource, searchQuery, selectedGroup, statusFilter, pageSize]
  );

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchSources();
    fetchGroups('all');
    fetchSettings();
    fetchChannels(1, 'all');

    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchSources, fetchGroups, fetchSettings, fetchChannels]);

  // Handle Search & Filter changes
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    fetchChannels(1, selectedSource, q, selectedGroup, statusFilter);
  };

  const handleSourceChange = (srcId: string) => {
    setSelectedSource(srcId);
    setSelectedGroup('all');
    fetchGroups(srcId);
    fetchChannels(1, srcId, searchQuery, 'all', statusFilter);
  };

  const handleGroupChange = (g: string) => {
    setSelectedGroup(g);
    fetchChannels(1, selectedSource, searchQuery, g, statusFilter);
  };

  const handleStatusChange = (s: string) => {
    setStatusFilter(s);
    fetchChannels(1, selectedSource, searchQuery, selectedGroup, s);
  };

  const handlePageChange = (p: number) => {
    fetchChannels(p, selectedSource, searchQuery, selectedGroup, statusFilter);
  };

  // Sync actions
  const handleSyncNow = async () => {
    setIsSyncing(true);
    notify('loading', 'Syncing Playlists...', 'Refreshing live stream tokens, cookies, and DRM keys');
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        notify('success', 'Sync Complete!', data.message || 'All sources refreshed');
      } else {
        notify('error', 'Sync Warning', data.message);
      }
      await fetchStatus();
      await fetchSources();
      await fetchGroups(selectedSource);
      await fetchChannels(currentPage, selectedSource);
    } catch (err: any) {
      notify('error', 'Sync Failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSource = async (sourceId?: string) => {
    try {
      const url = sourceId ? `/api/sync?sourceId=${encodeURIComponent(sourceId)}` : '/api/sync';
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      notify('success', 'Playlist Synced', data.message || 'Source refreshed');
      await fetchStatus();
      await fetchSources();
      await fetchChannels(currentPage, selectedSource);
    } catch (err: any) {
      notify('error', 'Sync Error', err.message);
    }
  };

  // Source CRUD
  const handleAddSource = async (source: { name: string; url: string; id?: string; slug?: string }) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source),
      });
      if (res.ok) {
        notify('success', 'Source Added', `Registered playlist "${source.name}"`);
        await fetchSources();
        await fetchStatus();
        await fetchChannels(1, selectedSource);
      }
    } catch (err: any) {
      notify('error', 'Add Failed', err.message);
    }
  };

  const handleUpdateSource = async (id: string, updates: Partial<PlaylistSource>) => {
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        notify('success', 'Playlist Updated', `Updated "${data.source?.name}"`);
        await fetchSources();
        await fetchStatus();
        await fetchChannels(currentPage, selectedSource);
      }
    } catch (err: any) {
      notify('error', 'Update Error', err.message);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('success', 'Playlist Removed', 'Source deleted');
        if (selectedSource === id) {
          setSelectedSource('all');
        }
        await fetchSources();
        await fetchStatus();
        await fetchChannels(1, 'all');
      }
    } catch (err: any) {
      notify('error', 'Delete Error', err.message);
    }
  };

  // Channel Actions
  const handleToggleChannel = async (id: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res.ok) {
        setChannels((prev) =>
          prev.map((c) => (c.id === id ? { ...c, enabled: !currentEnabled } : c))
        );
        fetchStatus();
        fetchGroups(selectedSource);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkToggleChannels = async (channelIds: string[], enabled: boolean) => {
    try {
      const res = await fetch('/api/channels/bulk-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelIds, enabled }),
      });
      if (res.ok) {
        notify('success', enabled ? 'Channels Enabled' : 'Channels Disabled', `Updated ${channelIds.length} channels`);
        fetchChannels(currentPage, selectedSource);
        fetchGroups(selectedSource);
        fetchStatus();
      }
    } catch (err: any) {
      notify('error', 'Bulk Update Error', err.message);
    }
  };

  const handleSaveChannel = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        notify('success', 'Channel Updated', 'Channel attributes saved');
        fetchChannels(currentPage, selectedSource);
        fetchGroups(selectedSource);
      }
    } catch (err: any) {
      notify('error', 'Save Error', err.message);
    }
  };

  const handleResetChannel = async (id: string) => {
    try {
      const res = await fetch(`/api/channels/reset/${id}`, { method: 'POST' });
      if (res.ok) {
        notify('success', 'Channel Reset', 'Restored upstream default settings');
        fetchChannels(currentPage, selectedSource);
        fetchGroups(selectedSource);
      }
    } catch (err: any) {
      notify('error', 'Reset Error', err.message);
    }
  };

  const handleAddChannel = async (newChannel: any) => {
    try {
      const res = await fetch('/api/channels/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel),
      });
      if (res.ok) {
        notify('success', 'Channel Created', `Added ${newChannel.name}`);
        fetchChannels(1, selectedSource);
        fetchGroups(selectedSource);
        fetchStatus();
      }
    } catch (err: any) {
      notify('error', 'Add Channel Error', err.message);
    }
  };

  // Group Actions
  const handleRenameGroup = async (oldName: string, newName: string) => {
    try {
      const res = await fetch('/api/groups/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName }),
      });
      if (res.ok) {
        notify('success', 'Category Renamed', `Renamed to "${newName}"`);
        fetchGroups(selectedSource);
        fetchChannels(currentPage, selectedSource);
      }
    } catch (err: any) {
      notify('error', 'Rename Error', err.message);
    }
  };

  const handleToggleGroup = async (groupName: string, visible: boolean) => {
    try {
      const res = await fetch('/api/groups/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, visible }),
      });
      if (res.ok) {
        notify('success', visible ? 'Category Enabled' : 'Category Hidden', `${visible ? 'Active' : 'Muted'} "${groupName}"`);
        fetchGroups(selectedSource);
        fetchChannels(currentPage, selectedSource);
        fetchStatus();
      }
    } catch (err: any) {
      notify('error', 'Toggle Error', err.message);
    }
  };

  const handleBulkSetGroupLogo = async (groupNames: string[], logoUrl: string) => {
    try {
      const res = await fetch('/api/groups/bulk-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupNames, logoUrl }),
      });
      if (res.ok) {
        notify(
          'success',
          logoUrl ? 'Logos Applied' : 'Logos Cleared',
          `Updated logo across ${groupNames.length} categories`
        );
        fetchGroups(selectedSource);
        fetchChannels(currentPage, selectedSource);
      }
    } catch (err: any) {
      notify('error', 'Bulk Logo Error', err.message);
    }
  };

  const handleRemovePrefix = async (prefix: string): Promise<number> => {
    try {
      const res = await fetch('/api/groups/remove-prefix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
      });
      const data = await res.json();
      if (data.success) {
        fetchGroups(selectedSource);
        fetchChannels(currentPage, selectedSource);
        return data.updatedCount || 0;
      }
    } catch (err) {
      console.error(err);
    }
    return 0;
  };

  // Settings & Backup Actions
  const handleSaveSettings = async (newSettings: Partial<PlaylistSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        fetchStatus();
        notify('success', 'Settings Saved', 'Configuration updated');
      }
    } catch (err: any) {
      notify('error', 'Settings Error', err.message);
    }
  };

  const handleExportBackup = () => {
    window.location.href = '/api/backup/export';
  };

  const handleImportBackup = async (data: any) => {
    const res = await fetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to import');
    }
    notify('success', 'Backup Restored', 'All playlists and settings restored');
    fetchStatus();
    fetchSources();
    fetchGroups(selectedSource);
    fetchChannels(1, selectedSource);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Ambient Video Background */}
      <VideoBackground />

      {/* Floating Modern Non-Browser Toast Popups */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* App Header */}
      <Header
        status={status}
        isSyncing={isSyncing}
        onSync={handleSyncNow}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSources={() => setIsSourcesOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Connect IPTV Banner */}
        <QuickConnect
          totalChannels={status?.totalChannels || 0}
          activeChannels={status?.activeChannels || 0}
          totalGroups={status?.totalGroups || 0}
          sources={sources}
          publicBaseUrl={settings.publicBaseUrl}
        />

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl backdrop-blur-xl">
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'channels'
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Channels ({status?.totalChannels || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'groups'
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categories ({groups.length})</span>
            </button>

            {/* NexusEmpire Dedicated Tab */}
            <button
              onClick={() => setActiveTab('nexusempire')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'nexusempire' || activeTab === 'aninexus'
                  ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-indigo-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>NexusEmpire (AniTv &amp; StreamBox)</span>
            </button>

            {/* Nexus Rebuild Dedicated Tab */}
            <button
              onClick={() => setActiveTab('rebuild')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'rebuild'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-purple-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Nexus Rebuild</span>
            </button>

            {/* CloudStream & Live Events Tab */}
            <button
              onClick={() => setActiveTab('cloudstream')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cloudstream'
                  ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-teal-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-4 h-4 text-teal-400" />
              <span>CloudStream &amp; Live</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'raw'
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Live M3U &amp; JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upload .M3U</span>
            </button>

            <button
              onClick={() => setIsSourcesOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-cyan-800/60 hover:border-cyan-600 text-cyan-300 text-xs font-semibold transition-colors"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Playlists &amp; Slugs ({sources.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'channels' && (
          <ChannelList
            channels={channels}
            groups={groups}
            sources={sources}
            selectedSource={selectedSource}
            totalChannels={totalChannels}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            searchQuery={searchQuery}
            selectedGroup={selectedGroup}
            statusFilter={statusFilter}
            isLoading={isLoadingChannels}
            onSearchChange={handleSearchChange}
            onSourceChange={handleSourceChange}
            onGroupChange={handleGroupChange}
            onStatusChange={handleStatusChange}
            onPageChange={handlePageChange}
            onToggleChannel={handleToggleChannel}
            onBulkToggleChannels={handleBulkToggleChannels}
            onEditChannel={(ch) => setEditingChannel(ch)}
            onResetChannel={handleResetChannel}
            onAddChannel={() => setIsAddChannelOpen(true)}
            onPreviewChannel={(ch) => setPreviewingChannel(ch)}
          />
        )}

        {activeTab === 'groups' && (
          <GroupManager
            groups={groups}
            onRenameGroup={handleRenameGroup}
            onToggleGroup={handleToggleGroup}
            onRemovePrefix={handleRemovePrefix}
            onBulkSetGroupLogo={handleBulkSetGroupLogo}
            onFilterByGroup={(groupName) => {
              setSelectedGroup(groupName);
              setActiveTab('channels');
              fetchChannels(1, selectedSource, searchQuery, groupName, statusFilter);
            }}
          />
        )}

        {(activeTab === 'nexusempire' || activeTab === 'aninexus') && (
          <NexusEmpireView
            onNotify={notify}
            publicBaseUrl={settings.publicBaseUrl}
            onPreviewChannel={(ch) => setPreviewingChannel(ch)}
          />
        )}

        {activeTab === 'rebuild' && (
          <NexusRebuildView
            onNotify={notify}
            publicBaseUrl={settings.publicBaseUrl}
            sources={sources}
            onPreviewChannel={(ch) => setPreviewingChannel(ch)}
          />
        )}

        {activeTab === 'cloudstream' && (
          <CloudStreamView
            onNotify={notify}
            publicBaseUrl={settings.publicBaseUrl}
            onPreviewChannel={(ch) => setPreviewingChannel(ch)}
          />
        )}

        {activeTab === 'raw' && <RawInspector sources={sources} />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-400 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide">NEXUS</span>
            <span>· Auto-refreshing all streams &amp; NexusEmpire feeds every {status?.syncIntervalMinutes || 30} minutes</span>
          </p>
          <p className="text-slate-400">
            Engineered for <span className="text-cyan-300 font-semibold">OTT Navigator</span>, <span className="text-cyan-300 font-semibold">TiviMate</span>, <span className="text-indigo-300 font-semibold">AniTv</span> &amp; <span className="text-slate-200">StreamBox</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      {editingChannel && (
        <ChannelModal
          channel={editingChannel}
          groups={groups}
          onClose={() => setEditingChannel(null)}
          onSave={handleSaveChannel}
          onReset={handleResetChannel}
        />
      )}

      {isAddChannelOpen && (
        <AddChannelModal
          groups={groups}
          onClose={() => setIsAddChannelOpen(false)}
          onAdd={handleAddChannel}
        />
      )}

      {previewingChannel && (
        <StreamPlayerModal
          channel={previewingChannel}
          onClose={() => setPreviewingChannel(null)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />
      )}

      {isSourcesOpen && (
        <PlaylistSourcesModal
          sources={sources}
          onClose={() => setIsSourcesOpen(false)}
          onAddSource={handleAddSource}
          onUpdateSource={handleUpdateSource}
          onDeleteSource={handleDeleteSource}
          onSyncSource={handleSyncSource}
          onOpenUploadModal={() => {
            setIsSourcesOpen(false);
            setIsUploadOpen(true);
          }}
        />
      )}

      {isUploadOpen && (
        <UploadM3UModal
          onClose={() => setIsUploadOpen(false)}
          onUploaded={({ name, m3uUrl }) => {
            notify('success', 'Uploaded & Hosted!', `Playlist "${name}" is live at ${m3uUrl}`);
            fetchSources();
            fetchStatus();
            fetchChannels(1, selectedSource);
          }}
        />
      )}
    </div>
  );
}
