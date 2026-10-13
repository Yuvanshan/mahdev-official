import React, { RefObject, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface HeroVideoControlsProps {
  heroRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  label: string;
}

const HERO_VIDEO_VOLUME = 0.15;
const HERO_VISIBLE_THRESHOLD = 0.65;

export const HeroVideoControls: React.FC<HeroVideoControlsProps> = ({
  heroRef,
  videoRef,
  label,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const isVisibleRef = useRef(false);
  const soundEnabledRef = useRef(false);

  useEffect(() => {
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!hero || !video) return;

    const updateVisibility = (isVisible: boolean) => {
      isVisibleRef.current = isVisible;
      if (isVisible) {
        video.volume = HERO_VIDEO_VOLUME;
        video.muted = !soundEnabledRef.current;
        video.play().catch((error: unknown) => {
          console.debug('[HeroVideoControls] Video playback deferred:', error);
          video.muted = true;
        });
      } else {
        video.pause();
        video.muted = true;
      }
    };

    if (typeof IntersectionObserver === 'undefined') {
      updateVisibility(true);
      return () => video.pause();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        updateVisibility(
          entry.isIntersecting && entry.intersectionRatio >= HERO_VISIBLE_THRESHOLD
        );
      },
      { threshold: [0, HERO_VISIBLE_THRESHOLD] }
    );
    observer.observe(hero);

    return () => {
      observer.disconnect();
      video.pause();
      video.muted = true;
    };
  }, [heroRef, videoRef]);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video || !isVisibleRef.current) return;

    const nextEnabled = !soundEnabledRef.current;
    soundEnabledRef.current = nextEnabled;
    setSoundEnabled(nextEnabled);
    video.volume = HERO_VIDEO_VOLUME;
    video.muted = !nextEnabled;

    if (nextEnabled) {
      video.play().catch((error: unknown) => {
        console.warn('[HeroVideoControls] Unable to play hero audio:', error);
        soundEnabledRef.current = false;
        setSoundEnabled(false);
        video.muted = true;
      });
    }
  };

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-label={soundEnabled ? `Mute ${label} video` : `Enable ${label} video sound`}
      aria-pressed={soundEnabled}
      className="pointer-events-auto absolute bottom-5 right-5 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-slate-950/60 px-4 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-950/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      <span>{soundEnabled ? 'Sound on' : 'Enable sound'}</span>
    </button>
  );
};
