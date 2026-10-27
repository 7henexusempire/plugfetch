import React, { useState } from 'react';

interface VideoBackgroundProps {
  videoUrl?: string;
  opacity?: number;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoUrl = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260815_075403_bdde66c3-c5ad-41ac-ba8f-6a0bc4545c3f.mp4',
  opacity = 0.92,
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
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity }}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Subtle transparent ambient tone without blurring or blacking out the background */}
      <div className="absolute inset-0 bg-slate-950/15 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45 pointer-events-none"></div>
    </div>
  );
};
