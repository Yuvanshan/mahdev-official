import React, { useEffect, useRef, useState } from 'react';

interface HeroVideoBackgroundProps {
  videoUrl?: string;
  imageUrl?: string;
  posterImageUrl?: string;
  title?: string;
  overlayGradient?: 'default' | 'electric' | 'subtle';
  className?: string;
}

/**
 * Extracts clean YouTube video ID from various URL structures (watch, shorts, embed, youtu.be)
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const HeroVideoBackground: React.FC<HeroVideoBackgroundProps> = ({
  videoUrl,
  imageUrl,
  posterImageUrl,
  title = 'Hero Background Media',
  overlayGradient = 'default',
  className = '',
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const trimmedVideo = videoUrl?.trim() || '';
  const isYouTube = trimmedVideo.includes('youtube.com') || trimmedVideo.includes('youtu.be');
  const ytVideoId = isYouTube ? extractYouTubeId(trimmedVideo) : null;

  const hasVideo = Boolean(
    !videoFailed &&
      trimmedVideo &&
      (isYouTube ||
        trimmedVideo.includes('.mp4') ||
        trimmedVideo.includes('.webm') ||
        trimmedVideo.includes('.ogg') ||
        trimmedVideo.startsWith('data:video') ||
        trimmedVideo.startsWith('blob:') ||
        trimmedVideo.startsWith('/uploads/'))
  );

  // Fallback default image URL shown immediately and while video buffers/loads
  const effectiveImageUrl =
    posterImageUrl?.trim() ||
    imageUrl?.trim() ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85';

  // Force HTML5 video autoplay reliably across all browser policies
  useEffect(() => {
    if (!hasVideo || isYouTube) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Reset video ready state when videoUrl changes
    setIsVideoReady(false);

    // Strict browser muted autoplay requirement: both properties must be set on the DOM instance
    videoEl.defaultMuted = true;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.setAttribute('muted', '');
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('autoplay', '');

    const attemptPlay = () => {
      if (!videoEl) return;
      videoEl.muted = true;
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVideoReady(true);
          })
          .catch((error) => {
            console.debug('Autoplay deferred pending user interaction:', error);
          });
      }
    };

    attemptPlay();

    // Secondary safety: start playing on first user window touch/scroll/click
    const onUserInteraction = () => {
      attemptPlay();
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
    };

    window.addEventListener('click', onUserInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', onUserInteraction, { once: true, passive: true });
    window.addEventListener('scroll', onUserInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
    };
  }, [hasVideo, isYouTube, trimmedVideo]);

  // YouTube embed URL with required parameters for autoplay & loop
  const youTubeEmbedSrc = ytVideoId
    ? `https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=1&mute=1&loop=1&playlist=${ytVideoId}&controls=0&showinfo=0&rel=0&playsinline=1&modestbranding=1&enablejsapi=1`
    : null;

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden select-none pointer-events-none ${className}`}>
      {/* 
        Default HD Poster / Fallback Image (always present underneath).
        Provides instant visual clarity while the video buffers/loads, eliminating any black flash.
      */}
      <img
        src={effectiveImageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover z-0"
        referrerPolicy="no-referrer"
        loading="eager"
      />

      {/* Video Layer (HTML5 or YouTube) with smooth fade-in once playback begins */}
      {hasVideo && youTubeEmbedSrc ? (
        <iframe
          src={youTubeEmbedSrc}
          title={title}
          className="absolute inset-0 w-full h-full object-cover scale-135 border-0 z-1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      ) : hasVideo ? (
        <video
          ref={videoRef}
          src={trimmedVideo}
          poster={effectiveImageUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.play().catch(() => {});
            setIsVideoReady(true);
          }}
          onPlaying={() => {
            setIsVideoReady(true);
          }}
          onLoadedData={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.play().catch(() => {});
            setIsVideoReady(true);
          }}
          onError={() => {
            setVideoFailed(true);
            setIsVideoReady(false);
          }}
          className={`absolute inset-0 w-full h-full object-cover z-1 transition-opacity duration-700 ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          title={title}
        />
      ) : null}

      {/* Electric Blue & High Contrast Shading Overlay (Always on top of media, under content) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#061033] via-[#061033]/85 sm:via-[#061033]/70 md:via-[#061033]/45 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#061033] via-transparent to-[#0052FF]/10 pointer-events-none z-10" />
    </div>
  );
};
