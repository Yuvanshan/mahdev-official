import React, { useEffect, useRef, useState } from 'react';
import { resolveMediaUrl } from '../../services/firestoreMediaService';

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
}) => {
  const [videoFailed, setVideoFailed] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const trimmedVideo = videoUrl?.trim() || '';

  useEffect(() => {
    let isMounted = true;
    if (!trimmedVideo) {
      setResolvedSrc('');
      return;
    }
    if (trimmedVideo.startsWith('firestore://media_blobs/')) {
      resolveMediaUrl(trimmedVideo).then((url) => {
        if (isMounted) setResolvedSrc(url);
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
  const effectiveImageUrl =
    posterImageUrl?.trim() ||
    imageUrl?.trim() ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85';

  // Force HTML5 video autoplay reliably across all browser policies
  useEffect(() => {
    if (!hasVideo || isEmbedVideo) return;

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

  // Vimeo embed URL with required parameters for background autoplay & loop
  const vimeoEmbedSrc = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`
    : null;

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden select-none pointer-events-none bg-[#061033] ${className}`}>
      {/* Video Only Layer (HTML5, YouTube or Vimeo) - No default fallback image rendered */}
      {hasVideo && youTubeEmbedSrc ? (
        <iframe
          src={youTubeEmbedSrc}
          title={title}
          className="absolute inset-0 w-full h-full object-cover scale-135 border-0 z-1"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      ) : hasVideo && vimeoEmbedSrc ? (
        <iframe
          src={vimeoEmbedSrc}
          title={title}
          className="absolute inset-0 w-full h-full object-cover scale-135 border-0 z-1"
          allow="autoplay; fullscreen; picture-in-picture"
        />
      ) : hasVideo && (resolvedSrc || !trimmedVideo.startsWith('firestore://')) ? (
        <video
          ref={videoRef}
          src={resolvedSrc || trimmedVideo}
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
            // If custom video fails, gracefully transition to background gradient without delay
            setVideoFailed(true);
          }}
          className="absolute inset-0 w-full h-full object-cover z-1"
          title={title}
        />
      ) : null}

      {/* Electric Blue & High Contrast Shading Overlay (Always on top of media, under content) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#061033] via-[#061033]/85 sm:via-[#061033]/70 md:via-[#061033]/45 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#061033] via-transparent to-[#0052FF]/10 pointer-events-none z-10" />
    </div>
  );
};
