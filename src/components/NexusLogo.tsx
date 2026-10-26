import React from 'react';

interface NexusLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({ size = 'md', showText = true }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const imgHeight = isSm ? 'h-6' : isLg ? 'h-10' : 'h-8';
  const badgeSize = isSm ? 'h-8 px-2' : isLg ? 'h-12 px-3.5' : 'h-10 px-2.5';

  return (
    <div className="flex items-center gap-3">
      {/* Precision Nexus Logo Brandmark with transparent backing */}
      <div
        className={`relative ${badgeSize} rounded-xl bg-gradient-to-br from-slate-900/90 via-slate-950/90 to-black/90 border border-cyan-500/50 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0 group overflow-hidden backdrop-blur-md`}
      >
        {/* Glow backdrop accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/20 opacity-70 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

        {/* Cleaned High-Res Transparent Nexus Wordmark */}
        <img
          src="/nexus-logo.png"
          alt="NEXUS"
          className={`relative z-10 ${imgHeight} object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.45)] brightness-110 transition-transform group-hover:scale-105`}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black text-base sm:text-lg tracking-wider text-white font-mono flex items-center gap-1.5">
              <span>NEXUS</span>
              <span className="text-cyan-400 text-xs font-sans font-semibold tracking-normal px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40">
                PRO
              </span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">
            IPTV Multi-Relay &amp; NexusEmpire Engine
          </span>
        </div>
      )}
    </div>
  );
};
