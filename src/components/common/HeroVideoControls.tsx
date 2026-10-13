import React, { RefObject, useEffect, useRef } from 'react';

interface HeroVideoControlsProps {
  heroRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
}

const HERO_VIDEO_VOLUME = 0.15;
const HERO_VISIBLE_THRESHOLD = 0.05;
const STALL_RECOVERY_MS = 15000;

export const HeroVideoControls: React.FC<HeroVideoControlsProps> = ({
  heroRef,
  videoRef,
}) => {
  const isVisibleRef = useRef(false);
  const soundAllowedRef = useRef(false);
  const autoSoundAttemptedRef = useRef(false);
  const recoveryCountRef = useRef(0);
  const lastRecoveryAtRef = useRef(0);
  const lastProgressAtRef = useRef(Date.now());
  const lastPlaybackTimeRef = useRef(0);

  useEffect(() => {
    const hero = heroRef.current;
    const currentVideo = videoRef.current;
    if (!hero || !currentVideo) return;
    const video: HTMLVideoElement = currentVideo;

    let recoveryTimer = 0;
    let watchTimer = 0;

    function attemptInitialSound() {
      if (
        autoSoundAttemptedRef.current ||
        soundAllowedRef.current ||
        !isVisibleRef.current ||
        document.visibilityState !== 'visible'
      ) {
        return;
      }
      autoSoundAttemptedRef.current = true;
      playWithSound();
    }

    function playMuted() {
      if (!isVisibleRef.current || document.visibilityState !== 'visible') return;
      video.muted = !soundAllowedRef.current;
      if (soundAllowedRef.current) video.volume = HERO_VIDEO_VOLUME;
      video.playsInline = true;
      video.play().then(
        () => attemptInitialSound(),
        (error: unknown) => {
          console.debug('[HeroVideoControls] Muted playback deferred:', error);
        }
      );
    }

    function playWithSound() {
      if (!isVisibleRef.current || document.visibilityState !== 'visible') return;
      autoSoundAttemptedRef.current = true;
      video.volume = HERO_VIDEO_VOLUME;
      video.muted = false;
      video.play().then(
        () => {
          soundAllowedRef.current = true;
        },
        (error: unknown) => {
          video.muted = true;
          console.debug('[HeroVideoControls] Audible autoplay blocked; continuing muted:', error);
          playMuted();
        }
      );
    }

    const recoverStalledVideo = () => {
      if (!isVisibleRef.current || document.visibilityState !== 'visible') return;
      if (Date.now() - lastProgressAtRef.current < STALL_RECOVERY_MS) return;
      if (Date.now() - lastRecoveryAtRef.current < 5000) return;
      if (recoveryCountRef.current >= 3) {
        console.warn('[HeroVideoControls] Playback recovery limit reached.');
        return;
      }

      recoveryCountRef.current += 1;
      lastRecoveryAtRef.current = Date.now();
      lastProgressAtRef.current = Date.now();
      lastPlaybackTimeRef.current = 0;
      console.warn(`[HeroVideoControls] Recovering stalled hero video (attempt ${recoveryCountRef.current}).`);
      video.load();
      playMuted();
    };

    const updateVisibility = (isVisible: boolean) => {
      isVisibleRef.current = isVisible;
      if (!isVisible || document.visibilityState !== 'visible') {
        video.pause();
        video.muted = true;
        return;
      }

      lastProgressAtRef.current = Date.now();
      if (video.error) lastProgressAtRef.current = 0;
      if (video.error) {
        recoverStalledVideo();
        return;
      }
      if (soundAllowedRef.current) {
        video.volume = HERO_VIDEO_VOLUME;
        video.muted = false;
        playMuted();
      } else {
        playWithSound();
      }
    };

    const handleUserInteraction = () => {
      if (!isVisibleRef.current || soundAllowedRef.current) return;
      playWithSound();
    };

    const handlePlaying = () => {
      lastProgressAtRef.current = Date.now();
      if (!soundAllowedRef.current) attemptInitialSound();
    };

    const handleProgress = () => {
      if (video.currentTime !== lastPlaybackTimeRef.current) {
        lastPlaybackTimeRef.current = video.currentTime;
        lastProgressAtRef.current = Date.now();
      }
    };

    const handleWaiting = () => {
      window.clearTimeout(recoveryTimer);
      recoveryTimer = window.setTimeout(recoverStalledVideo, STALL_RECOVERY_MS);
    };

    const handleCanPlay = () => {
      window.clearTimeout(recoveryTimer);
      lastProgressAtRef.current = Date.now();
      playMuted();
    };

    const handleVideoError = () => {
      lastProgressAtRef.current = 0;
      recoverStalledVideo();
    };

    const handleVisibilityChange = () => {
      updateVisibility(isVisibleRef.current);
    };

    const interactionEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'touchstart',
      'keydown',
    ];
    interactionEvents.forEach((eventName) =>
      window.addEventListener(eventName, handleUserInteraction, { passive: true })
    );
    document.addEventListener('visibilitychange', handleVisibilityChange);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleProgress);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleVideoError);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === 'undefined') {
      updateVisibility(true);
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          updateVisibility(entry.isIntersecting && entry.intersectionRatio >= HERO_VISIBLE_THRESHOLD);
        },
        { threshold: [0, HERO_VISIBLE_THRESHOLD] }
      );
      observer.observe(hero);
    }

    watchTimer = window.setInterval(() => {
      if (!isVisibleRef.current || document.visibilityState !== 'visible') return;
      if (video.paused && video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        playMuted();
      } else if (!video.paused) {
        recoverStalledVideo();
      }
    }, 5000);

    function cleanup() {
      observer?.disconnect();
      window.clearTimeout(recoveryTimer);
      window.clearInterval(watchTimer);
      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, handleUserInteraction)
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleProgress);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleVideoError);
      video.pause();
      video.muted = true;
    }

    return cleanup;
  }, [heroRef, videoRef]);

  return null;
};
