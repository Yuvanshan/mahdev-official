import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Film } from 'lucide-react';
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
  imageUrl: _unusedImageUrl,
  posterImageUrl: _unusedPosterImageUrl,
  title = 'Mahdev Enterprise Showcase',
  overlayGradient = 'default',
  className = '',
  onVideoReady,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [currentVideoCandidate, setCurrentVideoCandidate] = useState<string>(
    videoUrl?.trim() || DEFAULT_CORPORATE_VIDEO
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Synchronize incoming videoUrl changes
  useEffect(() => {
    const raw = videoUrl?.trim() || DEFAULT_CORPORATE_VIDEO;
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
          if (isMounted && trimmedVideo !== DEFAULT_CORPORATE_VIDEO) {
            setCurrentVideoCandidate(DEFAULT_CORPORATE_VIDEO);
          }
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
    if (trimmedVideo !== DEFAULT_CORPORATE_VIDEO) {
      console.warn('[HeroVideoBackground] Primary video unavailable, switching to verified video stream');
      setCurrentVideoCandidate(DEFAULT_CORPORATE_VIDEO);
    } else {
      setVideoFailed(true);
    }
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

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden select-none pointer-events-none bg-[#061033] ${className}`}>
      {/* 1. Dedicated Video Loading State: Remains active and visible until the video is loaded and playing */}
      <div
        className={`absolute inset-0 z-5 flex flex-col items-center justify-center bg-[#061033] transition-opacity duration-700 ease-out ${
          isVideoReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-label="Loading video"
      >
        {/* Ambient background pulsing glow */}
        <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-[#0052FF]/20 to-cyan-500/10 blur-3xl animate-pulse pointer-events-none" />

        {/* Animated Center Spinner & Indicator */}
        <div className="relative flex flex-col items-center gap-4 text-center px-4">
          <div className="relative w-14 h-14">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-[#0052FF] border-r-cyan-400 animate-spin" />
            {/* Inner counter-rotating ring */}
            <div className="absolute inset-2 rounded-full border-2 border-indigo-400/20 border-b-cyan-300 animate-spin [animation-direction:reverse] [animation-duration:1.8s]" />
            {/* Center pulsing beacon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0052FF] shadow-[0_0_14px_#0052FF] animate-ping" />
            </div>
          </div>

          {/* Text status */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-xs font-semibold text-blue-200 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Loading Video...</span>
            </div>
            {title && (
              <p className="text-[11px] text-slate-400 max-w-xs truncate font-medium tracking-wide">
                {title}
              </p>
            )}
          </div>

          {/* Micro shimmer progress bar */}
          <div className="w-44 h-1 bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0052FF] to-cyan-400 animate-shimmer" />
          </div>
        </div>
      </div>

      {/* 2. Failure Recovery State (No fallback images, dark recovery interface) */}
      {videoFailed && (
        <div className="absolute inset-0 z-6 flex flex-col items-center justify-center bg-[#061033] text-white p-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-3">
            <Film className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-slate-200 mb-1">Loading Video Stream</p>
          <p className="text-xs text-slate-400 mb-4 text-center max-w-xs">
            Connecting to video stream...
          </p>
          <button
            type="button"
            onClick={() => {
              setVideoFailed(false);
              setIsVideoReady(false);
              if (trimmedVideo !== DEFAULT_CORPORATE_VIDEO) {
                setCurrentVideoCandidate(DEFAULT_CORPORATE_VIDEO);
              } else if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().then(handleVideoReady).catch(() => {});
              }
            }}
            className="pointer-events-auto px-4 py-1.5 rounded-full bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all"
          >
            Retry Video
          </button>
        </div>
      )}

      {/* 3. Video Layer (HTML5, YouTube or Vimeo) - Only the video is shown */}
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

