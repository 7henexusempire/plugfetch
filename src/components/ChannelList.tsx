import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit3,
  Play,
  RotateCcw,
  Plus,
  ShieldAlert,
  Tv,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ChannelItem, GroupInfo, PlaylistSource } from '../types';

interface ChannelListProps {
  channels: ChannelItem[];
  groups: GroupInfo[];
  sources: PlaylistSource[];
  selectedSource: string;
  totalChannels: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  searchQuery: string;
  selectedGroup: string;
  statusFilter: string;
  isLoading: boolean;
  onSearchChange: (q: string) => void;
  onSourceChange: (s: string) => void;
  onGroupChange: (g: string) => void;
  onStatusChange: (s: string) => void;
  onPageChange: (p: number) => void;
  onToggleChannel: (id: string, currentEnabled: boolean) => Promise<void>;
  onEditChannel: (channel: ChannelItem) => void;
  onResetChannel: (id: string) => Promise<void>;
  onAddChannel: () => void;
  onPreviewChannel: (channel: ChannelItem) => void;
  onBulkToggleChannels?: (channelIds: string[], enabled: boolean) => Promise<void>;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  groups,
  sources,
  selectedSource,
  totalChannels,
  currentPage,
  totalPages,
  pageSize,
  searchQuery,
  selectedGroup,
  statusFilter,
  isLoading,
  onSearchChange,
  onSourceChange,
  onGroupChange,
  onStatusChange,
  onPageChange,
  onToggleChannel,
  onEditChannel,
  onResetChannel,
  onAddChannel,
  onPreviewChannel,
  onBulkToggleChannels,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const handleSelectAllOnPage = () => {
    if (selectedChannelIds.length === channels.length && channels.length > 0) {
      setSelectedChannelIds([]);
    } else {
      setSelectedChannelIds(channels.map((c) => c.id));
    }
  };

  const handleToggleSelectChannel = (id: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkToggle = async (enabled: boolean) => {
    if (selectedChannelIds.length === 0 || !onBulkToggleChannels) return;
    setIsBulkProcessing(true);
    try {
      await onBulkToggleChannels(selectedChannelIds, enabled);
      setSelectedChannelIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Control Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 1,600+ channels by name, group, or ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Playlist Source Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-cyan-800/60 rounded-xl px-3 py-1.5 text-xs">
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedSource}
              onChange={(e) => onSourceChange(e.target.value)}
              className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Sources Combined</option>
              {sources.map((src) => (
                <option key={src.id} value={src.id} className="bg-slate-900 text-slate-200">
                  {src.name} ({src.channelCount})
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedGroup}
              onChange={(e) => onGroupChange(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="all">All Groups ({groups.length})</option>
              {groups.map((grp) => (
                <option key={grp.name} value={grp.name} className="bg-slate-900 text-slate-200">
                  {grp.name} ({grp.count})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="enabled">Active in M3U</option>
              <option value="disabled">Excluded / Hidden</option>
            </select>
          </div>

          {/* Add Channel Button */}
          <button
            onClick={onAddChannel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 ml-auto md:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="text-slate-200 font-medium">{channels.length}</span> of{' '}
          <span className="text-slate-200 font-medium">{totalChannels}</span> channels
          {selectedGroup !== 'all' && (
            <span className="ml-1 text-cyan-400 font-medium">in &ldquo;{selectedGroup}&rdquo;</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active in Exported M3U
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span> Excluded
          </span>
        </div>
      </div>

      {/* Channel Table / List */}
      <div className="overflow-x-auto min-h-[420px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Loading channels...</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Tv className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No channels found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or group filter.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400 select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedChannelIds.length === channels.length && channels.length > 0}
                    onChange={handleSelectAllOnPage}
                    className="w-3.5 h-3.5 rounded text-cyan-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 w-14 text-center">Active</th>
                <th className="py-3 px-4 w-16">Logo</th>
                <th className="py-3 px-4">Channel Name &amp; Details</th>
                <th className="py-3 px-4">Group / Category</th>
                <th className="py-3 px-4">Stream &amp; Security</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {channels.map((channel) => {
                const isSelected = selectedChannelIds.includes(channel.id);
                const displayName = channel.customName || channel.name;
                const displayGroup = channel.customGroup || channel.groupTitle;
                const hasOverrides = !!(
                  channel.customName ||
                  channel.customGroup ||
                  channel.customLogo ||
                  channel.customUrl ||
                  channel.customChno
                );
                const logoUrl = channel.customLogo || channel.tvgLogo;
                const isImageBroken = imageErrors[channel.id];

                return (
                  <tr
                    key={channel.id}
                    className={`group transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/30 text-white'
                        : channel.enabled
                        ? 'hover:bg-slate-800/40 text-slate-200'
                        : 'bg-slate-950/40 text-slate-500 hover:bg-slate-900/40 opacity-75'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectChannel(channel.id)}
                        className="w-3.5 h-3.5 rounded text-cyan-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Toggle Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleChannel(channel.id, channel.enabled)}
                        title={channel.enabled ? 'Enabled in M3U (click to disable)' : 'Disabled from M3U (click to enable)'}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                          channel.enabled
                            ? 'text-emerald-400 hover:bg-emerald-950/60'
                            : 'text-slate-600 hover:bg-slate-800'
                        }`}
                      >
                        {channel.enabled ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Logo */}
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        {logoUrl && !isImageBroken ? (
                          <img
                            src={logoUrl}
                            alt={displayName}
                            onError={() => handleImageError(channel.id)}
                            className="w-full h-full object-contain p-1"
                            loading="lazy"
                          />
                        ) : (
                          <Tv className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                    </td>

                    {/* Name & Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                          {displayName}
                        </span>
                        {channel.customChno && (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            CH {channel.customChno}
                          </span>
                        )}
                        {hasOverrides && (
                          <span className="text-[10px] text-amber-400 bg-amber-950/50 border border-amber-800/80 px-1.5 py-0.2 rounded flex items-center gap-1" title="Has custom edits">
                            <Sparkles className="w-2.5 h-2.5" />
                            Customized
                          </span>
                        )}
                        {channel.sourceId && (
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800/70 px-1.5 py-0.5 rounded">
                            {channel.sourceId}
                          </span>
                        )}
                        {channel.isCustom && (
                          <span className="text-[10px] text-purple-400 bg-purple-950/50 border border-purple-800/80 px-1.5 py-0.2 rounded font-medium">
                            Custom Added
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {channel.customName && channel.customName !== channel.name && (
                          <span>Original: {channel.name} ·</span>
                        )}
                        <span className="font-mono text-slate-500">ID: {channel.tvgId || channel.id}</span>
                      </div>
                    </td>

                    {/* Group / Category */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {(channel.customGroupLogo || channel.groupLogo) && (
                          <div className="w-5 h-5 rounded bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={channel.customGroupLogo || channel.groupLogo}
                              alt=""
                              className="w-full h-full object-contain p-0.5"
                              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                            />
                          </div>
                        )}
                        <button
                          onClick={() => onGroupChange(displayGroup)}
                          className="text-left font-medium text-slate-300 hover:text-cyan-400 transition-colors"
                          title="Filter by this group"
                        >
                          {displayGroup}
                        </button>
                      </div>
                      {channel.customGroup && channel.customGroup !== channel.groupTitle && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          Orig: {channel.groupTitle}
                        </div>
                      )}
                    </td>

                    {/* Stream Type & DRM */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {channel.hasClearKey ? (
                          <span className="text-[10px] font-mono bg-amber-950/60 border border-amber-800 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-amber-400" />
                            ClearKey DRM
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            {channel.type || (channel.url.includes('.mpd') ? 'DASH' : 'HLS')}
                          </span>
                        )}

                        {channel.directives?.length > 0 && (
                          <span className="text-[10px] font-mono text-slate-500">
                            {channel.directives.length} props
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview / Player Button */}
                        <button
                          onClick={() => onPreviewChannel(channel)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                          title="Preview stream & inspect DRM/headers"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Channel Button */}
                        <button
                          onClick={() => onEditChannel(channel)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit channel name, group, logo, etc."
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Overrides Button */}
                        {hasOverrides && (
                          <button
                            onClick={() => onResetChannel(channel.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Reset to upstream default name/group"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedChannelIds.length > 0 && (
        <div className="sticky bottom-4 left-4 right-4 z-30 mx-4 my-2 p-3 rounded-2xl bg-slate-900/95 border border-cyan-500/80 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-slideUp">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold text-white font-mono">
              {selectedChannelIds.length} channels selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkToggle(true)}
              disabled={isBulkProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Enable Selected</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkToggle(false)}
              disabled={isBulkProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all disabled:opacity-50"
            >
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Disable Selected</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedChannelIds([])}
              className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Page <span className="font-bold text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-white">{totalPages}</span> ({totalChannels} total channels)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`p-1.5 rounded-lg border border-slate-800 transition-colors ${
                currentPage <= 1
                  ? 'text-slate-600 bg-slate-950 cursor-not-allowed'
                  : 'text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Quick jump to page buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage - 2 + i;
              if (currentPage < 3) pageNum = i + 1;
              if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition-colors ${
                    pageNum === currentPage
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`p-1.5 rounded-lg border border-slate-800 transition-colors ${
                currentPage >= totalPages
                  ? 'text-slate-600 bg-slate-950 cursor-not-allowed'
                  : 'text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
