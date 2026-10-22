import React, { useState } from 'react';
import { Layers, Edit2, Eye, EyeOff, Scissors, Check, Sparkles, Folder } from 'lucide-react';
import { GroupInfo } from '../types';

interface GroupManagerProps {
  groups: GroupInfo[];
  onRenameGroup: (oldName: string, newName: string) => Promise<void>;
  onToggleGroup: (groupName: string, visible: boolean) => Promise<void>;
  onRemovePrefix: (prefix: string) => Promise<number>;
  onFilterByGroup: (groupName: string) => void;
}

export const GroupManager: React.FC<GroupManagerProps> = ({
  groups,
  onRenameGroup,
  onToggleGroup,
  onRemovePrefix,
  onFilterByGroup,
}) => {
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [prefixToStrip, setPrefixToStrip] = useState('Jio TV+ | ');
  const [stripStatus, setStripStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      {/* Quick Bulk Tools Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Batch Group Cleaner / Prefix Stripper</h3>
            </div>
            <p className="text-xs text-slate-400">
              Clean up bloated group titles in 1 click (e.g. strip <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300">Jio TV+ | </code> so &quot;Jio TV+ | Sports&quot; becomes &quot;Sports&quot;).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={prefixToStrip}
              onChange={(e) => setPrefixToStrip(e.target.value)}
              placeholder="Prefix to remove..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 w-44 font-mono"
            />
            <button
              onClick={handleStripPrefix}
              disabled={isProcessing || !prefixToStrip}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Strip Prefix</span>
            </button>
          </div>
        </div>

        {stripStatus && (
          <div className="mt-3 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/80 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{stripStatus}</span>
          </div>
        )}
      </div>

      {/* Group Cards Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Channel Categories &amp; Groups</h3>
            <span className="text-xs text-slate-400">({groups.length} total)</span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Rename or toggle visibility to customize what your IPTV player displays.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {groups.map((group) => {
            const isEditing = editingGroup === group.name;

            return (
              <div
                key={group.name}
                className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                  group.enabledCount > 0
                    ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/30 border-slate-800/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="w-4 h-4 text-cyan-500 shrink-0" />
                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(group.name)}
                            className="bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white focus:outline-none w-full"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(group.name)}
                            disabled={isProcessing}
                            className="p-1 rounded bg-cyan-600 text-white hover:bg-cyan-500"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h4
                          onClick={() => onFilterByGroup(group.name)}
                          className="font-semibold text-slate-200 text-sm truncate hover:text-cyan-400 cursor-pointer"
                          title="Click to view channels in this group"
                        >
                          {group.name}
                        </h4>
                      )}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartRename(group.name)}
                        className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0"
                        title="Rename Group"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <span className="font-mono text-cyan-400 font-medium">
                      {group.enabledCount} active
                    </span>
                    <span>/</span>
                    <span>{group.count} total channels</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => onFilterByGroup(group.name)}
                    className="text-cyan-400 hover:underline"
                  >
                    View Channels &rarr;
                  </button>

                  <button
                    onClick={() => onToggleGroup(group.name, group.enabledCount === 0)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      group.enabledCount > 0
                        ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40'
                        : 'text-emerald-400 hover:bg-emerald-950/40'
                    }`}
                  >
                    {group.enabledCount > 0 ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>Hide All</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Enable All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
