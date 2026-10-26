import React, { useState, useRef } from 'react';
import { Upload, FileCode, Check, X, Copy, ExternalLink, Loader2 } from 'lucide-react';

interface UploadM3UModalProps {
  onClose: () => void;
  onUploaded: (result: { name: string; slug: string; m3uUrl: string }) => void;
}

export const UploadM3UModal: React.FC<UploadM3UModalProps> = ({ onClose, onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (!displayName) {
      const baseName = selectedFile.name.replace(/\.(m3u8?|txt)$/i, '');
      setDisplayName(baseName.replace(/[_-]/g, ' '));
      setCustomSlug(baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an M3U file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const content = await file.text();
      if (!content.includes('#EXTM3U') && !content.includes('#EXTINF')) {
        throw new Error('Selected file does not appear to be a valid M3U playlist');
      }

      const res = await fetch('/api/upload-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          content,
          displayName: displayName.trim() || file.name,
          slug: customSlug.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload playlist');
      }

      const fullUrl = `${window.location.origin}${data.m3uUrl}`;
      setResultUrl(fullUrl);
      onUploaded({
        name: data.source.name,
        slug: data.source.slug,
        m3uUrl: fullUrl,
      });
    } catch (err: any) {
      setError(err.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const copyUrl = () => {
    if (resultUrl) {
      navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Upload &amp; Host .M3U Playlist</h3>
              <p className="text-[11px] text-slate-400">Get an instant permanent hosted IPTV URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {resultUrl ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-sm">Playlist Hosted Successfully!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Your playlist is live and ready for TiviMate, OTT Navigator, or Kodi.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-[11px] text-slate-400 font-mono block mb-1">
                  Hosted M3U URL:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resultUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={copyUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-cyan-500/80 bg-cyan-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".m3u,.m3u8,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <FileCode className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                {file ? (
                  <div>
                    <span className="text-xs font-semibold text-white block">{file.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB · Click or drag to change
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Click to choose an M3U file or drag &amp; drop here
                    </span>
                    <span className="text-[11px] text-slate-400">Supports .m3u and .m3u8</span>
                  </div>
                )}
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Playlist Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. My Premium Playlist"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Custom URL Slug */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom URL Slug (e.g. <code>cartelx</code> &rarr; <code>/api/playlist/cartelx.m3u</code>)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">/api/playlist/</span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="my-playlist"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[11px] text-slate-500 font-mono">.m3u</span>
                </div>
              </div>

              {error && (
                <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-xl p-2.5">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file || isUploading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload &amp; Generate URL</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
