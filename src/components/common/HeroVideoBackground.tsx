import React, { useEffect, useRef, useState } from 'react';
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

export const HeroVideoBackground: React.FC<HeroVideoBackgroundProps> = ({
  videoUrl,
  imageUrl,
  posterImageUrl,
  title = 'Hero Background Media',
  overlayGradient = 'default',
  className = '',
  onVideoReady,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleVideoReady = () => {
    setIsVideoReady(true);
    if (typeof onVideoReady === 'function') {
      try {
        onVideoReady();
      } catch (err) {
        console.debug('[HeroVideoBackground] onVideoReady error:', err);
      }
    }
  };

  const trimmedVideo = videoUrl?.trim() || '';

  useEffect(() => {
    let isMounted = true;
    if (!trimmedVideo) {
      setResolvedSrc('');
      return;
    }
    if (trimmedVideo.startsWith('firestore://')) {
      resolveMediaUrl(trimmedVideo).then((url) => {
        if (isMounted && url) {
          setResolvedSrc(url);
        }
      }).catch((err) => {
        console.warn('[HeroVideoBackground] Resolution error:', err);
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

  // Reset failure and readiness state whenever the video URL changes
  useEffect(() => {
    setVideoFailed(false);
    setIsVideoReady(false);
  }, [trimmedVideo]);

  // Fallback default image URL shown immediately and while video buffers/loads
  const rawImageUrl =
    posterImageUrl?.trim() ||
    imageUrl?.trim() ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85';
  const [resolvedImgSrc, setResolvedImgSrc] = useState<string>(rawImageUrl.startsWith('firestore://') ? '' : rawImageUrl);

  useEffect(() => {
    let isMounted = true;
    if (!rawImageUrl) {
      setResolvedImgSrc('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85');
      return;
    }
    if (rawImageUrl.startsWith('firestore://')) {
      resolveMediaUrl(rawImageUrl)
        .then((url) => {
          if (isMounted && url) {
            setResolvedImgSrc(url);
          }
        })
        .catch(() => {
          if (isMounted) setResolvedImgSrc('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85');
        });
    } else {
      setResolvedImgSrc(rawImageUrl);
    }
    return () => {
      isMounted = false;
    };
  }, [rawImageUrl]);

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
  }, [hasVideo, isEmbedVideo, resolvedSrc]);

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
      {/* Fallback Image Layer: renders immediately, acts as fallback and poster buffer */}
      {resolvedImgSrc ? (
        <img
          src={resolvedImgSrc}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 ${
            hasVideo && isVideoReady ? 'opacity-0' : 'opacity-100'
          }`}
          referrerPolicy="no-referrer"
          onError={() => {
            if (resolvedImgSrc !== 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85') {
              setResolvedImgSrc('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85');
            }
          }}
        />
      ) : null}

      {/* Video Layer (HTML5, YouTube or Vimeo) */}
      {hasVideo && youTubeEmbedSrc ? (
        <iframe
          src={youTubeEmbedSrc}
          title={title}
          onLoad={() => handleVideoReady()}
          className={`absolute inset-0 w-full h-full object-cover scale-135 border-0 z-1 transition-opacity duration-700 ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      ) : hasVideo && vimeoEmbedSrc ? (
        <iframe
          src={vimeoEmbedSrc}
          title={title}
          onLoad={() => handleVideoReady()}
          className={`absolute inset-0 w-full h-full object-cover scale-135 border-0 z-1 transition-opacity duration-700 ${
            isVideoReady ? 'opacity-100' : 'opacity-0'
          }`}
          allow="autoplay; fullscreen; picture-in-picture"
        />
      ) : hasVideo && effectiveVideoSrc ? (
        <video
          ref={videoRef}
          src={effectiveVideoSrc}
          poster={resolvedImgSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={(e) => {
            const v = e.currentTarget;
            v.muted = true;
            v.play().catch(() => {});
            handleVideoReady();
          }}
          onPlaying={() => {
            handleVideoReady();
          }}
          onLoadedData={(e) => {
            const v = e.currentTarget;
            v.muted = true;
            v.play().catch(() => {});
            handleVideoReady();
          }}
          onError={(e) => {
            const err = e.currentTarget.error;
            console.warn('[HeroVideoBackground] Video playback note:', err?.message || err);
            setVideoFailed(true);
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
