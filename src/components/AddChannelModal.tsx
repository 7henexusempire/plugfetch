import React, { useState } from 'react';
import { X, Plus, Tv } from 'lucide-react';
import { GroupInfo } from '../types';

interface AddChannelModalProps {
  groups: GroupInfo[];
  onClose: () => void;
  onAdd: (channel: {
    name: string;
    group: string;
    url: string;
    logo?: string;
    tvgId?: string;
    tvgChno?: string;
    directives?: string[];
  }) => Promise<void>;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  groups,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState(groups[0]?.name || 'Custom');
  const [customGroup, setCustomGroup] = useState('');
  const [isTypingNewGroup, setIsTypingNewGroup] = useState(false);
  const [url, setUrl] = useState('');
  const [logo, setLogo] = useState('');
  const [tvgId, setTvgId] = useState('');
  const [tvgChno, setTvgChno] = useState('');
  const [rawDirectives, setRawDirectives] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedGroup = isTypingNewGroup ? customGroup.trim() || 'Custom' : group;
      const directives = rawDirectives
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('#'));

      await onAdd({
        name: name.trim(),
        group: selectedGroup,
        url: url.trim(),
        logo: logo.trim(),
        tvgId: tvgId.trim() || undefined,
        tvgChno: tvgChno.trim() || undefined,
        directives,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>Add Custom Channel to Playlist</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Add your own external HLS (.m3u8) or DASH (.mpd) stream
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Channel Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-medium"
              placeholder="e.g. My Sports VIP"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Stream URL * (HLS .m3u8, DASH .mpd, HTTP)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              placeholder="https://example.com/live/stream.m3u8"
              required
            />
          </div>

          {/* Group selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">Group / Category</label>
              <button
                type="button"
                onClick={() => setIsTypingNewGroup(!isTypingNewGroup)}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                {isTypingNewGroup ? 'Pick existing group' : '+ Create new category'}
              </button>
            </div>

            {isTypingNewGroup ? (
              <input
                type="text"
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. 24/7 Movies"
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
              </select>
            )}
          </div>

          {/* Optional fields in grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Channel Number (optional)
              </label>
              <input
                type="text"
                value={tvgChno}
                onChange={(e) => setTvgChno(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                EPG / TVG-ID (optional)
              </label>
              <input
                type="text"
                value={tvgId}
                onChange={(e) => setTvgId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                placeholder="e.g. custom_101"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Logo URL (optional)</label>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Custom Directives / Headers (optional, 1 per line)
            </label>
            <textarea
              value={rawDirectives}
              onChange={(e) => setRawDirectives(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono h-20"
              placeholder="#EXTVLCOPT:http-user-agent=...&#10;#KODIPROP:..."
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/25 transition-all active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Adding...' : 'Add Channel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
