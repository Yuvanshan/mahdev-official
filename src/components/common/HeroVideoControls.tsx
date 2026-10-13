import React, { RefObject, useEffect, useRef } from 'react';

interface HeroVideoControlsProps {
  heroRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
}

const HERO_VIDEO_VOLUME = 0.15;
const HERO_VISIBLE_THRESHOLD = 0.65;

export const HeroVideoControls: React.FC<HeroVideoControlsProps> = ({
  heroRef,
  videoRef,
}) => {
  const isVisibleRef = useRef(false);
  const soundAllowedRef = useRef(false);

  useEffect(() => {
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!hero || !video) return;

    const playWithSoundFallback = () => {
      video.volume = HERO_VIDEO_VOLUME;
      video.muted = false;
      video.play().then(
        () => {
          soundAllowedRef.current = true;
        },
        () => {
          video.muted = true;
          video.play().catch((error: unknown) => {
            console.debug('[HeroVideoControls] Muted autoplay deferred:', error);
          });
        }
      );
    };

    const updateVisibility = (isVisible: boolean) => {
      isVisibleRef.current = isVisible;
      if (isVisible) {
        if (soundAllowedRef.current) {
          video.volume = HERO_VIDEO_VOLUME;
          video.muted = false;
          video.play().catch((error: unknown) => {
            console.debug('[HeroVideoControls] Video playback deferred:', error);
            video.muted = true;
          });
        } else {
          playWithSoundFallback();
        }
      } else {
        video.pause();
        video.muted = true;
      }
    };

    const handleUserInteraction = () => {
      if (!isVisibleRef.current || soundAllowedRef.current) return;

      video.volume = HERO_VIDEO_VOLUME;
      video.muted = false;
      video.play().then(
        () => {
          soundAllowedRef.current = true;
        },
        () => {
          video.muted = true;
        }
      );
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'touchstart',
      'keydown',
    ];
    interactionEvents.forEach((eventName) =>
      window.addEventListener(eventName, handleUserInteraction, { passive: true })
    );

    if (typeof IntersectionObserver === 'undefined') {
      updateVisibility(true);
      return () => {
        interactionEvents.forEach((eventName) =>
          window.removeEventListener(eventName, handleUserInteraction)
        );
        video.pause();
        video.muted = true;
      };
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
      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, handleUserInteraction)
      );
      video.pause();
      video.muted = true;
    };
  }, [heroRef, videoRef]);

  return null;
};
