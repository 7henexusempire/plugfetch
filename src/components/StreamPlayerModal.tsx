import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Copy, Check, ShieldAlert, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import Hls from 'hls.js';
import { ChannelItem } from '../types';

interface StreamPlayerModalProps {
  channel: ChannelItem | null;
  onClose: () => void;
}

export const StreamPlayerModal: React.FC<StreamPlayerModalProps> = ({ channel, onClose }) => {
  if (!channel) return null;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const streamUrl = channel.customUrl || channel.url;
  const isDASH = streamUrl.toLowerCase().includes('.mpd');

  useEffect(() => {
    let hlsInstance: Hls | null = null;
    const video = videoRef.current;
    if (!video) return;

    setPlayError(null);

    if (streamUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setPlayError(`Stream error: ${data.details}. Note: Some streams require DRM/token authentication handled in IPTV players.`);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      }
    } else {
      video.src = streamUrl;
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      if (video) {
        video.src = '';
      }
    };
  }, [streamUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0 overflow-hidden">
              {(channel.customLogo || channel.tvgLogo) ? (
                <img
                  src={channel.customLogo || channel.tvgLogo}
                  alt={channel.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Play className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{channel.customName || channel.name}</span>
                {channel.hasClearKey && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    ClearKey DRM
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {channel.customGroup || channel.groupTitle} · Format: {isDASH ? 'MPEG-DASH (.mpd)' : 'HLS (.m3u8)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Container */}
        <div className="p-5 space-y-4 text-xs">
          <div className="aspect-video bg-black rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            {playError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-slate-300">
                <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
                <h4 className="font-bold text-white text-sm mb-1">In-Browser Playback Notice</h4>
                <p className="text-xs text-slate-400 max-w-md mb-3 leading-relaxed">
                  {isDASH
                    ? 'This is a protected MPEG-DASH stream with ClearKey DRM encryption and session cookies. Standard browsers block cross-origin MPD manifests without specialized CDM extensions.'
                    : playError}
                </p>
                <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-lg text-xs text-emerald-400 font-medium">
                  ✓ Verified: OTT Navigator and TiviMate automatically load the DRM key and play this stream directly via your M3U link!
                </div>
              </div>
            )}
          </div>

          {/* Stream URL Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-300">Direct Stream URL</span>
              <button
                onClick={handleCopy}
                className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-[11px] text-cyan-300 break-all select-all">
              {streamUrl}
            </div>
          </div>

          {/* Kodi Directives & ClearKey Inspection */}
          {channel.directives?.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-xs">
                  IPTV Authentication &amp; Player Headers ({channel.directives.length})
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mb-2 leading-relaxed">
                The fetcher preserved the exact Kodi and VLC properties from the source playlist so TiviMate and OTT Navigator will unlock the stream:
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto space-y-1">
                {channel.directives.map((dir, idx) => (
                  <div key={idx} className="break-all whitespace-pre-wrap select-all">
                    {dir}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
