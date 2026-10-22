import React, { useState } from 'react';
import { X, Check, Save, RotateCcw, ShieldAlert, FileCode, ExternalLink } from 'lucide-react';
import { ChannelItem, GroupInfo } from '../types';

interface ChannelModalProps {
  channel: ChannelItem | null;
  groups: GroupInfo[];
  onClose: () => void;
  onSave: (id: string, updates: {
    customName?: string;
    customGroup?: string;
    customLogo?: string;
    customChno?: string;
    customUrl?: string;
    enabled?: boolean;
  }) => Promise<void>;
  onReset: (id: string) => Promise<void>;
}

export const ChannelModal: React.FC<ChannelModalProps> = ({
  channel,
  groups,
  onClose,
  onSave,
  onReset,
}) => {
  if (!channel) return null;

  const [name, setName] = useState(channel.customName || channel.name);
  const [group, setGroup] = useState(channel.customGroup || channel.groupTitle);
  const [isCustomGroupInput, setIsCustomGroupInput] = useState(false);
  const [logo, setLogo] = useState(channel.customLogo || channel.tvgLogo || '');
  const [chno, setChno] = useState(channel.customChno || channel.tvgChno || '');
  const [url, setUrl] = useState(channel.customUrl || channel.url);
  const [enabled, setEnabled] = useState(channel.enabled);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(channel.id, {
        customName: name.trim() || channel.name,
        customGroup: group.trim() || channel.groupTitle,
        customLogo: logo.trim(),
        customChno: chno.trim(),
        customUrl: url.trim() || channel.url,
        enabled,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm(`Reset "${channel.name}" to upstream original settings?`)) {
      setIsSaving(true);
      await onReset(channel.id);
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Edit Channel</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {channel.tvgId || channel.id}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Original: <span className="text-slate-300 font-medium">{channel.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Channel Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Display Name (in IPTV Players)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
              placeholder="e.g. Star Plus HD 1080p"
              required
            />
          </div>

          {/* Group / Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">Group / Category</label>
              <button
                type="button"
                onClick={() => setIsCustomGroupInput(!isCustomGroupInput)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {isCustomGroupInput ? 'Choose from existing' : '+ Type new group name'}
              </button>
            </div>

            {isCustomGroupInput ? (
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="Type new group title..."
              />
            ) : (
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {groups.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name}
                  </option>
                ))}
                {!groups.some((g) => g.name === group) && (
                  <option value={group}>{group}</option>
                )}
              </select>
            )}
          </div>

          {/* Two Columns: Channel Number & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Channel Number (tvg-chno)
              </label>
              <input
                type="text"
                value={chno}
                onChange={(e) => setChno(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                placeholder="e.g. 101"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Visibility in Generated M3U
              </label>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl border text-sm font-semibold transition-colors ${
                  enabled
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span>{enabled ? 'Active (Included in M3U)' : 'Hidden (Excluded from M3U)'}</span>
              </button>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Logo URL (tvg-logo)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                placeholder="https://example.com/logo.png"
              />
              {logo && (
                <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0">
                  <img src={logo} alt="Logo preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Stream URL */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Stream URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              placeholder="https://.../index.mpd or .m3u8"
              required
            />
          </div>

          {/* Directives & ClearKey DRM Inspector */}
          {channel.directives && channel.directives.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  Kodi / TiviMate Stream Directives &amp; Auth ({channel.directives.length})
                </span>
                {channel.hasClearKey && (
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <ShieldAlert className="w-3 h-3" />
                    ClearKey Active
                  </span>
                )}
              </div>
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-1">
                {channel.directives.map((dir, idx) => (
                  <div key={idx} className="break-all whitespace-pre-wrap select-all hover:text-slate-200">
                    {dir}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                These exact headers, cookies, and DRM keys are automatically forwarded into the generated M3U.
              </p>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Original</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/25 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
