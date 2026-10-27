import React, { useState } from 'react';
import {
  Layers,
  Edit2,
  Eye,
  EyeOff,
  Scissors,
  Check,
  Sparkles,
  Folder,
  Image,
  Search,
  CheckSquare,
  Square,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { GroupInfo } from '../types';

interface GroupManagerProps {
  groups: GroupInfo[];
  onRenameGroup: (oldName: string, newName: string) => Promise<void>;
  onToggleGroup: (groupName: string, visible: boolean) => Promise<void>;
  onRemovePrefix: (prefix: string) => Promise<number>;
  onFilterByGroup: (groupName: string) => void;
  onBulkSetGroupLogo: (groupNames: string[], logoUrl: string) => Promise<void>;
}

export const GroupManager: React.FC<GroupManagerProps> = ({
  groups,
  onRenameGroup,
  onToggleGroup,
  onRemovePrefix,
  onFilterByGroup,
  onBulkSetGroupLogo,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [bulkLogoUrl, setBulkLogoUrl] = useState('');
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const [editingLogoGroup, setEditingLogoGroup] = useState<string | null>(null);
  const [singleLogoUrl, setSingleLogoUrl] = useState('');

  const [prefixToStrip, setPrefixToStrip] = useState('Jio TV+ | ');
  const [stripStatus, setStripStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map((g) => g.name));
    }
  };

  const handleToggleSelect = (name: string) => {
    setSelectedGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  };

  const handleApplyBulkLogo = async (clear = false) => {
    if (selectedGroups.length === 0) return;
    const urlToApply = clear ? '' : bulkLogoUrl.trim();
    if (!clear && !urlToApply) return;

    setIsBulkApplying(true);
    try {
      await onBulkSetGroupLogo(selectedGroups, urlToApply);
      setBulkMessage(clear ? `Cleared logo for ${selectedGroups.length} categories` : `Applied logo to ${selectedGroups.length} categories!`);
      if (clear) setBulkLogoUrl('');
      setSelectedGroups([]);
      setTimeout(() => setBulkMessage(null), 3500);
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleStartRename = (name: string) => {
    setEditingGroup(name);
    setNewName(name);
  };

  const handleSaveRename = async (oldName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingGroup(null);
      return;
    }
    setIsProcessing(true);
    try {
      await onRenameGroup(oldName, newName.trim());
      setEditingGroup(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartSingleLogo = (g: GroupInfo) => {
    setEditingLogoGroup(g.name);
    setSingleLogoUrl(g.logo || '');
  };

  const handleSaveSingleLogo = async (groupName: string) => {
    setIsProcessing(true);
    try {
      await onBulkSetGroupLogo([groupName], singleLogoUrl.trim());
      setEditingLogoGroup(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripPrefix = async () => {
    if (!prefixToStrip) return;
    setIsProcessing(true);
    try {
      const count = await onRemovePrefix(prefixToStrip);
      setStripStatus(`Updated ${count} channels!`);
      setTimeout(() => setStripStatus(null), 3500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. BULK GROUP LOGO & TOOLS PANEL */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Bulk Category Logo &amp; Organization Tools
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Select multiple categories below, then paste a logo URL to update all their channels at once.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bulk Logo Form */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bulk Set Group Logo</span>
                </span>
                <span className="text-[11px] font-mono text-amber-400">
                  {selectedGroups.length} categories selected
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <input
                  type="url"
                  value={bulkLogoUrl}
                  onChange={(e) => setBulkLogoUrl(e.target.value)}
                  placeholder="https://.../category-icon.png"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
                {bulkLogoUrl && (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={bulkLogoUrl}
                      alt="preview"
                      className="w-full h-full object-contain p-0.5"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleApplyBulkLogo(true)}
                disabled={selectedGroups.length === 0 || isBulkApplying}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 text-xs font-medium transition-colors disabled:opacity-40"
              >
                Clear Logo
              </button>
              <button
                type="button"
                onClick={() => handleApplyBulkLogo(false)}
                disabled={selectedGroups.length === 0 || !bulkLogoUrl.trim() || isBulkApplying}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-500 text-white text-xs font-semibold transition-all shadow-md shadow-amber-500/20 disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Logo ({selectedGroups.length})</span>
              </button>
            </div>
            {bulkMessage && (
              <div className="text-[11px] text-emerald-400 mt-2 font-medium">
                {bulkMessage}
              </div>
            )}
          </div>

          {/* Quick Prefix Remover */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bulk Strip Group Prefix</span>
                </span>
                <span className="text-[11px] text-slate-500">Cleaner names</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Remove messy prefixes (e.g. <code>Jio TV+ | </code> or <code>⛨ 𝔼𝕩𝕥𝕣𝕒 | </code>).
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={prefixToStrip}
                  onChange={(e) => setPrefixToStrip(e.target.value)}
                  placeholder="e.g. Jio TV+ | "
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 mt-2">
              <span className="text-[11px] text-emerald-400 font-medium">
                {stripStatus || ''}
              </span>
              <button
                onClick={handleStripPrefix}
                disabled={isProcessing || !prefixToStrip}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Stripping...' : 'Strip Prefix'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORIES TABLE WITH BULK CHECKBOXES */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium transition-colors"
            >
              {selectedGroups.length === filteredGroups.length && filteredGroups.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{selectedGroups.length === filteredGroups.length && filteredGroups.length > 0 ? 'Deselect All' : 'Select All'}</span>
            </button>

            <span className="text-xs text-slate-400 font-medium">
              {filteredGroups.length} Categories ({groups.length} total)
            </span>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 uppercase text-[10px] tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 w-10 text-center">Select</th>
                <th className="py-3 px-4 w-14">Logo</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4 text-center">Channels</th>
                <th className="py-3 px-4 text-center">Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGroups.map((g) => {
                const isSelected = selectedGroups.includes(g.name);
                const isRenaming = editingGroup === g.name;
                const isEditingLogo = editingLogoGroup === g.name;

                return (
                  <tr
                    key={g.name}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-amber-950/60' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleSelect(g.name)}
                        className="text-slate-400 hover:text-amber-400"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                    </td>

                    {/* Group Logo */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => handleStartSingleLogo(g)}
                        className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-amber-500 transition-colors"
                        title="Click to edit group logo"
                      >
                        {g.logo ? (
                          <img
                            src={g.logo}
                            alt={g.name}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        ) : (
                          <Folder className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                    </td>

                    {/* Group Name & inline editor */}
                    <td className="py-3 px-4">
                      {isRenaming ? (
                        <div className="flex items-center gap-2 max-w-md">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 bg-slate-950 border border-amber-500 rounded px-2 py-1 text-xs text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(g.name)}
                            className="px-2 py-1 rounded bg-amber-500 text-white font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="px-2 py-1 text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : isEditingLogo ? (
                        <div className="flex items-center gap-2 max-w-md">
                          <input
                            type="url"
                            value={singleLogoUrl}
                            onChange={(e) => setSingleLogoUrl(e.target.value)}
                            placeholder="Logo URL..."
                            className="flex-1 bg-slate-950 border border-amber-500 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveSingleLogo(g.name)}
                            className="px-2 py-1 rounded bg-amber-500 text-white font-semibold"
                          >
                            Save Logo
                          </button>
                          <button
                            onClick={() => setEditingLogoGroup(null)}
                            className="px-2 py-1 text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span
                            onClick={() => onFilterByGroup(g.name)}
                            className="font-semibold text-white hover:text-amber-300 cursor-pointer transition-colors"
                          >
                            {g.name}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Channel Counts */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="text-amber-400 font-semibold">{g.enabledCount}</span>
                      <span className="text-slate-500"> / {g.count}</span>
                    </td>

                    {/* Visibility Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleGroup(g.name, !g.isVisible)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          g.isVisible
                            ? 'text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60'
                            : 'text-slate-500 bg-slate-800/40 hover:bg-slate-700/60'
                        }`}
                        title={g.isVisible ? 'Category Active' : 'Category Hidden'}
                      >
                        {g.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartSingleLogo(g)}
                          className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors"
                          title="Set group logo"
                        >
                          <Image className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartRename(g.name)}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="Rename category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onFilterByGroup(g.name)}
                          className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                        >
                          View Channels
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
