import React from 'react';

interface CartelLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const CartelLogo: React.FC<CartelLogoProps> = ({ size = 'md', showText = true }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const badgeSize = isSm ? 'w-8 h-8 text-xs' : isLg ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-sm';

  return (
    <div className="flex items-center gap-3">
      {/* 187 Badge Logo */}
      <div
        className={`relative ${badgeSize} rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border-2 border-cyan-500/70 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-black tracking-tighter text-white shrink-0 group overflow-hidden`}
      >
        {/* Glow backdrop effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-600/30 opacity-80 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Sleek scanline accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        
        {/* 187 Text */}
        <span className="relative z-10 font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.6)]">
          187
        </span>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5 font-sans">
              <span>CARTEL</span>
              <span className="text-cyan-400 font-mono font-black">187</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase tracking-widest hidden sm:inline-block">
              STUDIO
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">
            IPTV Multi-Relay &amp; AniNexus Engine
          </span>
        </div>
      )}
    </div>
  );
};
