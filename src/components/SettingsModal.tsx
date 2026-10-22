import React, { useState } from 'react';
import { X, Save, Clock, Download, Upload, Shield, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { PlaylistSettings } from '../types';

interface SettingsModalProps {
  settings: PlaylistSettings;
  onClose: () => void;
  onSave: (newSettings: Partial<PlaylistSettings>) => Promise<void>;
  onExportBackup: () => void;
  onImportBackup: (data: any) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onSave,
  onExportBackup,
  onImportBackup,
}) => {
  const [upstreamUrl, setUpstreamUrl] = useState(settings.upstreamUrl);
  const [interval, setIntervalVal] = useState(settings.syncIntervalMinutes);
  const [autoSync, setAutoSync] = useState(settings.autoSync);
  const [userAgent, setUserAgent] = useState(settings.userAgent);
  const [customTvgUrl, setCustomTvgUrl] = useState(settings.customTvgUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        upstreamUrl: upstreamUrl.trim(),
        syncIntervalMinutes: Number(interval),
        autoSync,
        userAgent: userAgent.trim(),
        customTvgUrl: customTvgUrl.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await onImportBackup(json);
        setImportMessage('Backup restored successfully!');
        setTimeout(() => setImportMessage(null), 3000);
      } catch (err: any) {
        setImportMessage(`Failed to import backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Sync Settings &amp; Upstream Configuration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Control the 30-minute auto-fetcher and backup channel overrides
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Upstream URL */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Upstream Playlist URL
            </label>
            <input
              type="url"
              value={upstreamUrl}
              onChange={(e) => setUpstreamUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              placeholder="https://plugxvipplaylist.lovable.app/api/playlist"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              The service polls this URL to grab fresh tokens, clearkeys, and live channels.
            </p>
          </div>

          {/* Sync Interval & AutoSync */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Background Fetch Interval
              </label>
              <select
                value={interval}
                onChange={(e) => setIntervalVal(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value={15}>Every 15 minutes (High freshness)</option>
                <option value={30}>Every 30 minutes (Recommended)</option>
                <option value={45}>Every 45 minutes</option>
                <option value={60}>Every 1 hour</option>
                <option value={120}>Every 2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Background Auto-Sync
              </label>
              <button
                type="button"
                onClick={() => setAutoSync(!autoSync)}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl border text-sm font-semibold transition-colors ${
                  autoSync
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${autoSync ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                <span>{autoSync ? 'Auto-Sync Active' : 'Disabled (Manual Only)'}</span>
              </button>
            </div>
          </div>

          {/* Custom EPG / XMLTV URL */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Custom EPG / XMLTV Guide URL (optional)
            </label>
            <input
              type="text"
              value={customTvgUrl}
              onChange={(e) => setCustomTvgUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              placeholder="e.g. https://avkb.short.gy/jioepg.xml.gz"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to keep the original EPG header from the upstream playlist.
            </p>
          </div>

          {/* User Agent */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Fetcher User-Agent Header
            </label>
            <input
              type="text"
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
              placeholder="Mozilla/5.0 ... IPTV"
            />
          </div>

          {/* Backup & Restore Section */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="font-bold text-white text-xs mb-1">Backup &amp; Migration</h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Export your custom channel names, reordered groups, and visibility rules as a JSON file.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExportBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Overrides Backup</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importMessage && (
              <div className="mt-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800 p-2 rounded-lg">
                {importMessage}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1 text-xs">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            ) : (
              <span></span>
            )}

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
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
