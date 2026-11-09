import React, { RefObject, useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

interface HeroVideoControlsProps {
  heroRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Current video source; playback is re-initialised when it changes. */
  videoSrc?: string;
}

const HERO_VISIBLE_THRESHOLD = 0.05;

/**
 * Keeps hero video playback muted, pauses it off-screen, and exposes a
 * native play/pause control for people who prefer to stop motion.
 */
export const HeroVideoControls: React.FC<HeroVideoControlsProps> = ({
  heroRef,
  videoRef,
  videoSrc,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;

    let isHeroVisible = false;

    const pauseVideo = () => {
      video.pause();
      video.muted = true;
      setIsPlaying(false);
    };

    const playVideo = () => {
      if (reducedMotion || !isHeroVisible || document.visibilityState === 'hidden') {
        pauseVideo();
        return;
      }
      video.muted = true;
      void video.play().then(
        () => setIsPlaying(true),
        (error: unknown) => {
          setIsPlaying(false);
          console.warn('[DivisionHero] Muted autoplay was blocked:', error);
        }
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseVideo();
      } else if (isHeroVisible) {
        playVideo();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const observer = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => {
          isHeroVisible = entry.isIntersecting;
          if (!isHeroVisible) {
            pauseVideo();
            return;
          }
          playVideo();
        }, { threshold: HERO_VISIBLE_THRESHOLD });
    if (observer) {
      observer.observe(hero);
    } else {
      isHeroVisible = true;
      playVideo();
    }

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      pauseVideo();
    };
  }, [heroRef, videoRef, videoSrc, reducedMotion]);

  if (reducedMotion) return null;

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.muted = true;
      void video.play().then(
        () => setIsPlaying(true),
        (error: unknown) => {
          setIsPlaying(false);
          console.warn('[DivisionHero] Video playback could not be started:', error);
        }
      );
      return;
    }
    video.pause();
    setIsPlaying(false);
  };

  return (
    <button
      type="button"
      onClick={togglePlayback}
      aria-label={isPlaying ? 'Pause header video' : 'Play header video'}
      className="pointer-events-auto absolute right-6 top-6 z-20 grid h-14 w-14 place-items-center rounded-full border border-white/40 bg-white/20 text-white shadow-lg backdrop-blur-xl transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
    >
      {isPlaying ? <Pause aria-hidden="true" className="h-5 w-5" /> : <Play aria-hidden="true" className="h-5 w-5" />}
    </button>
  );
};
