import React, { useState, useEffect, useCallback } from 'react';
import {
  Tv,
  Layers,
  FileCode,
  Settings,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { QuickConnect } from './components/QuickConnect';
import { ChannelList } from './components/ChannelList';
import { GroupManager } from './components/GroupManager';
import { RawInspector } from './components/RawInspector';
import { ChannelModal } from './components/ChannelModal';
import { AddChannelModal } from './components/AddChannelModal';
import { StreamPlayerModal } from './components/StreamPlayerModal';
import { SettingsModal } from './components/SettingsModal';
import { PlaylistSourcesModal } from './components/PlaylistSourcesModal';
import { ChannelItem, GroupInfo, SyncStatus, PlaylistSettings, PlaylistSource } from './types';

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

  const [activeTab, setActiveTab] = useState<'channels' | 'groups' | 'raw'>('channels');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [editingChannel, setEditingChannel] = useState<ChannelItem | null>(null);
  const [isAddChannelOpen, setIsAddChannelOpen] = useState<boolean>(false);
  const [previewingChannel, setPreviewingChannel] = useState<ChannelItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<PlaylistSettings>({
    syncIntervalMinutes: 30,
    autoSync: true,
    userAgent: '',
    customTvgUrl: '',
    publicBaseUrl: '',
    zeotvStripSuffix: true,
    zeotvRemoveGroupLogo: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Synced all sources successfully!');
      } else {
        showToast(`Sync alert: ${data.message}`);
      }
      await fetchStatus();
      await fetchSources();
      await fetchGroups(selectedSource);
      await fetchChannels(currentPage, selectedSource);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSource = async (sourceId?: string) => {
    try {
      const url = sourceId ? `/api/sync?sourceId=${encodeURIComponent(sourceId)}` : '/api/sync';
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Source synced');
      await fetchStatus();
      await fetchSources();
      await fetchChannels(currentPage, selectedSource);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  // Source CRUD
  const handleAddSource = async (source: { name: string; url: string; id?: string }) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source),
      });
      if (res.ok) {
        showToast(`Added playlist "${source.name}"`);
        await fetchSources();
        await fetchStatus();
        await fetchChannels(1, selectedSource);
      }
    } catch (err) {
      console.error(err);
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
        showToast('Playlist source updated');
        await fetchSources();
        await fetchStatus();
        await fetchChannels(currentPage, selectedSource);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Playlist source removed');
        if (selectedSource === id) {
          setSelectedSource('all');
        }
        await fetchSources();
        await fetchStatus();
        await fetchChannels(1, 'all');
      }
    } catch (err) {
      console.error(err);
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

  const handleSaveChannel = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        showToast('Channel updated successfully!');
        fetchChannels(currentPage, selectedSource);
        fetchGroups(selectedSource);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetChannel = async (id: string) => {
    try {
      const res = await fetch(`/api/channels/reset/${id}`, { method: 'POST' });
      if (res.ok) {
        showToast('Reset channel to upstream default!');
        fetchChannels(currentPage, selectedSource);
        fetchGroups(selectedSource);
      }
    } catch (err) {
      console.error(err);
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
        showToast('Custom channel added!');
        fetchChannels(1, selectedSource);
        fetchGroups(selectedSource);
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
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
        showToast(`Renamed group to "${newName}"`);
        fetchGroups(selectedSource);
        fetchChannels(currentPage, selectedSource);
      }
    } catch (err) {
      console.error(err);
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
        showToast(`${visible ? 'Enabled' : 'Hidden'} channels in "${groupName}"`);
        fetchGroups(selectedSource);
        fetchChannels(currentPage, selectedSource);
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
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

  const handleBulkSetGroupLogo = async (groupNames: string[], logoUrl: string) => {
    try {
      const res = await fetch('/api/groups/bulk-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupNames, logoUrl }),
      });
      if (res.ok) {
        showToast(logoUrl ? `Updated logo for ${groupNames.length} categories!` : `Cleared logo for ${groupNames.length} categories!`);
        fetchGroups(selectedSource);
        fetchChannels(currentPage, selectedSource);
      }
    } catch (err) {
      console.error(err);
    }
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
        showToast('Settings saved!');
      }
    } catch (err) {
      console.error(err);
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
    showToast('Backup restored successfully!');
    fetchStatus();
    fetchSources();
    fetchGroups(selectedSource);
    fetchChannels(1, selectedSource);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/80 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-slideUp">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* App Header */}
      <Header
        status={status}
        isSyncing={isSyncing}
        onSync={handleSyncNow}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSources={() => setIsSourcesOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Connect IPTV Banner */}
        <QuickConnect
          totalChannels={status?.totalChannels || 0}
          activeChannels={status?.activeChannels || 0}
          totalGroups={status?.totalGroups || 0}
          sources={sources}
          publicBaseUrl={settings.publicBaseUrl}
        />

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'channels'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Channels ({status?.totalChannels || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'groups'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categories ({groups.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'raw'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Live M3U &amp; JSON Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSourcesOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-cyan-800/60 hover:border-cyan-600 text-cyan-300 text-xs font-medium transition-colors"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Manage Playlists ({sources.length})</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
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

        {activeTab === 'raw' && <RawInspector sources={sources} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            IPTV Multi-Playlist Relay Studio · Auto-refreshing all sources every {status?.syncIntervalMinutes || 30} minutes
          </p>
          <p className="text-slate-400">
            Engineered for <span className="text-slate-300">OTT Navigator</span>, <span className="text-slate-300">TiviMate</span> &amp; <span className="text-slate-300">Kodi</span>
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
        />
      )}
    </div>
  );
}
