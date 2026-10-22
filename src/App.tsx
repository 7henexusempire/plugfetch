import React, { useState, useEffect, useCallback } from 'react';
import {
  Tv,
  Layers,
  FileCode,
  Settings,
  HelpCircle,
  Sparkles,
  Radio,
  CheckCircle,
  AlertCircle,
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
import { ChannelItem, GroupInfo, SyncStatus, PlaylistSettings } from './types';

export default function App() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
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
  const [settings, setSettings] = useState<PlaylistSettings>({
    upstreamUrl: 'https://plugxvipplaylist.lovable.app/api/playlist',
    syncIntervalMinutes: 30,
    autoSync: true,
    userAgent: '',
    removeGroupPrefix: '',
    customTvgUrl: '',
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
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data: GroupInfo[] = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  }, []);

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
    async (page = 1, search = searchQuery, group = selectedGroup, stat = statusFilter) => {
      setIsLoadingChannels(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
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
    [searchQuery, selectedGroup, statusFilter, pageSize]
  );

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchGroups();
    fetchSettings();
    fetchChannels(1);

    // Refresh status & countdown every 10 seconds
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchGroups, fetchSettings, fetchChannels]);

  // Handle Search & Filter changes
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    fetchChannels(1, q, selectedGroup, statusFilter);
  };

  const handleGroupChange = (g: string) => {
    setSelectedGroup(g);
    fetchChannels(1, searchQuery, g, statusFilter);
  };

  const handleStatusChange = (s: string) => {
    setStatusFilter(s);
    fetchChannels(1, searchQuery, selectedGroup, s);
  };

  const handlePageChange = (p: number) => {
    fetchChannels(p, searchQuery, selectedGroup, statusFilter);
  };

  // Sync upstream immediately
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Synced successfully!');
      } else {
        showToast(`Sync failed: ${data.message}`);
      }
      await fetchStatus();
      await fetchGroups();
      await fetchChannels(currentPage);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
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
        fetchGroups();
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
        fetchChannels(currentPage);
        fetchGroups();
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
        fetchChannels(currentPage);
        fetchGroups();
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
        showToast('Channel added successfully!');
        fetchChannels(1);
        fetchGroups();
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
        fetchGroups();
        fetchChannels(currentPage);
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
        showToast(`${visible ? 'Enabled' : 'Hidden'} all channels in "${groupName}"`);
        fetchGroups();
        fetchChannels(currentPage);
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
        fetchGroups();
        fetchChannels(currentPage);
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
    fetchGroups();
    fetchChannels(1);
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
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Connect IPTV Banner */}
        <QuickConnect
          totalChannels={status?.totalChannels || 0}
          activeChannels={status?.activeChannels || 0}
          totalGroups={status?.totalGroups || 0}
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
              <span>Channels &amp; Streams ({status?.totalChannels || 0})</span>
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
              <span>Groups &amp; Categories ({groups.length})</span>
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

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings &amp; Schedule</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'channels' && (
          <ChannelList
            channels={channels}
            groups={groups}
            totalChannels={totalChannels}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            searchQuery={searchQuery}
            selectedGroup={selectedGroup}
            statusFilter={statusFilter}
            isLoading={isLoadingChannels}
            onSearchChange={handleSearchChange}
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
            onFilterByGroup={(groupName) => {
              setSelectedGroup(groupName);
              setActiveTab('channels');
              fetchChannels(1, searchQuery, groupName, statusFilter);
            }}
          />
        )}

        {activeTab === 'raw' && <RawInspector />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            IPTV Stream Relay &amp; Playlist Studio · Auto-fetching upstream every {status?.syncIntervalMinutes || 30} minutes
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
    </div>
  );
}
