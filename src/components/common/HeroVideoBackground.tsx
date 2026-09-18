import React, { useEffect, useRef, useState, useCallback } from 'react';
import { resolveMediaUrl } from '../../services/firestoreMediaService';
import { getYouTubeEmbedUrl, extractYouTubeId } from '../../utils/youtube';

interface HeroVideoBackgroundProps {
  videoUrl?: string;
  imageUrl?: string;
  posterImageUrl?: string;
  title?: string;
  overlayGradient?: 'default' | 'electric' | 'subtle';
  className?: string;
  onVideoReady?: () => void;
}

// Global safety guard ensuring onVideoReady identifier is never undefined across browser contexts or iframe messages
declare global {
  interface Window {
    onVideoReady?: () => void;
  }
}

if (typeof window !== 'undefined') {
  (window as any).onVideoReady = (window as any).onVideoReady || (() => {});
}

/**
 * Extracts clean Vimeo video ID from various Vimeo URLs
 */
function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|))(\d+)/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

const DEFAULT_CORPORATE_VIDEO = '/assets/hero_video.mp4';

export const HeroVideoBackground: React.FC<HeroVideoBackgroundProps> = ({
  videoUrl,
  imageUrl,
  posterImageUrl,
  title = 'Mahdev Enterprise Showcase',
  overlayGradient = 'default',
  className = '',
  onVideoReady,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  // The caller decides when the corporate movie is an appropriate fallback.  In
  // particular, a division's Firestore video must always win when one exists.
  const [currentVideoCandidate, setCurrentVideoCandidate] = useState<string>(videoUrl?.trim() || '');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Synchronize incoming videoUrl changes
  useEffect(() => {
    const raw = videoUrl?.trim() || '';
    setCurrentVideoCandidate(raw);
    setVideoFailed(false);
    setIsVideoReady(false);
  }, [videoUrl]);

  const handleVideoReady = useCallback(() => {
    setIsVideoReady(true);
    if (typeof onVideoReady === 'function') {
      try {
        onVideoReady();
      } catch (err) {
        console.debug('[HeroVideoBackground] onVideoReady callback error:', err);
      }
    }
  }, [onVideoReady]);

  const trimmedVideo = currentVideoCandidate.trim();

  useEffect(() => {
    let isMounted = true;
    if (!trimmedVideo) {
      setResolvedSrc('');
      return;
    }
    if (trimmedVideo.startsWith('firestore://')) {
      resolveMediaUrl(trimmedVideo)
        .then((url) => {
          if (isMounted && url) {
            setResolvedSrc(url);
          }
        })
        .catch((err) => {
          console.warn('[HeroVideoBackground] Firestore blob resolution notice:', err);
          if (isMounted) setVideoFailed(true);
        });
    } else {
      setResolvedSrc(trimmedVideo);
    }
    return () => {
      isMounted = false;
    };
  }, [trimmedVideo]);

  const isYouTube = trimmedVideo.includes('youtube.com') || trimmedVideo.includes('youtu.be');
  const ytVideoId = isYouTube ? extractYouTubeId(trimmedVideo) : null;

  const isVimeo = trimmedVideo.includes('vimeo.com');
  const vimeoId = isVimeo ? extractVimeoId(trimmedVideo) : null;

  const isEmbedVideo = Boolean((isYouTube && ytVideoId) || (isVimeo && vimeoId));
  const isHtmlVideo = Boolean(
    (trimmedVideo || resolvedSrc) &&
      !isEmbedVideo &&
      (trimmedVideo.startsWith('firestore://') ||
        trimmedVideo.includes('.mp4') ||
        trimmedVideo.includes('.webm') ||
        trimmedVideo.includes('.ogg') ||
        trimmedVideo.includes('.mov') ||
        trimmedVideo.includes('.m4v') ||
        trimmedVideo.startsWith('data:video') ||
        trimmedVideo.startsWith('blob:') ||
        trimmedVideo.startsWith('/uploads/') ||
        trimmedVideo.includes('firebasestorage.googleapis.com') ||
        trimmedVideo.includes('cloudinary.com') ||
        trimmedVideo.includes('/videos/') ||
        trimmedVideo.startsWith('http') ||
        resolvedSrc.startsWith('blob:'))
  );

  const hasVideo = Boolean(!videoFailed && (trimmedVideo || resolvedSrc) && (isEmbedVideo || isHtmlVideo));

  const handleVideoError = useCallback(() => {
    console.warn('[HeroVideoBackground] Video stream unavailable');
    setVideoFailed(true);
  }, [trimmedVideo]);

  // Force HTML5 video autoplay reliably across all browser policies
  useEffect(() => {
    if (!hasVideo || isEmbedVideo) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.defaultMuted = true;
    videoEl.muted = true;
    videoEl.playsInline = true;

    const attemptPlay = () => {
      if (!videoEl) return;
      videoEl.muted = true;
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            handleVideoReady();
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
  }, [hasVideo, isEmbedVideo, resolvedSrc, handleVideoReady]);

  // YouTube embed URL with required parameters for autoplay & loop
  const youTubeEmbedSrc = getYouTubeEmbedUrl(trimmedVideo, {
    autoplay: true,
    mute: true,
    loop: true,
    controls: false,
    rel: false,
  });

  // Vimeo embed URL with required parameters for background autoplay & loop
  const vimeoEmbedSrc = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`
    : null;

  const effectiveVideoSrc = resolvedSrc || (!trimmedVideo.startsWith('firestore://') ? trimmedVideo : '');
  const fallbackImage = imageUrl?.trim() || posterImageUrl?.trim() || '';

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden select-none pointer-events-none bg-[#061033] ${className}`}>
      {/* A poster is present from first paint, so a slow or unavailable video
          never exposes a black box, loader, or recovery panel on the landing page. */}
      {fallbackImage && (
        <img
          src={fallbackImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Video Layer (HTML5, YouTube or Vimeo) */}
      {hasVideo && youTubeEmbedSrc ? (
        <iframe
          src={youTubeEmbedSrc}
          title={title}
          onLoad={() => {
            setTimeout(() => {
              handleVideoReady();
            }, 300);
          }}
          className={`absolute inset-0 w-full h-full object-cover scale-135 border-0 z-1 transition-opacity duration-700 ease-out ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      ) : hasVideo && vimeoEmbedSrc ? (
        <iframe
          src={vimeoEmbedSrc}
          title={title}
          onLoad={() => {
            setTimeout(() => {
              handleVideoReady();
            }, 300);
          }}
          className={`absolute inset-0 w-full h-full object-cover scale-135 border-0 z-1 transition-opacity duration-700 ease-out ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          allow="autoplay; fullscreen; picture-in-picture"
        />
      ) : hasVideo && effectiveVideoSrc ? (
        <video
          ref={videoRef}
          src={effectiveVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => {
            const v = videoRef.current;
            if (v) {
              v.muted = true;
              v.play().catch(() => {});
            }
            handleVideoReady();
          }}
          onCanPlayThrough={() => {
            handleVideoReady();
          }}
          onPlaying={() => {
            handleVideoReady();
          }}
          onLoadedData={() => {
            const v = videoRef.current;
            if (v) {
              v.muted = true;
              v.play().catch(() => {});
            }
            handleVideoReady();
          }}
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime > 0) {
              handleVideoReady();
            }
          }}
          onError={(e) => {
            const err = e.currentTarget.error;
            console.warn('[HeroVideoBackground] Video playback note:', err?.message || err);
            handleVideoError();
          }}
          className={`absolute inset-0 w-full h-full object-cover z-1 transition-opacity duration-700 ease-out ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          title={title}
        />
      ) : null}

      {/* 4. Electric Blue & High Contrast Shading Overlay (Always on top of media, under content) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#061033] via-[#061033]/85 sm:via-[#061033]/70 md:via-[#061033]/45 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#061033] via-transparent to-[#0052FF]/10 pointer-events-none z-10" />
    </div>
  );
};

