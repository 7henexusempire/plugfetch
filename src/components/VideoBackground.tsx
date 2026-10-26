import React, { useState } from 'react';

interface VideoBackgroundProps {
  videoUrl?: string;
  opacity?: number;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260815_075403_bdde66c3-c5ad-41ac-ba8f-6a0bc4545c3f.mp4',
  opacity = 0.28,
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {!hasError && (
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={() => setHasError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity }}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Cyber gradient & vignette overlays to ensure top-tier legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/95"></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/40 to-slate-950/90"></div>
    </div>
  );
};
