import React, { RefObject, useEffect } from 'react';

interface HeroVideoControlsProps {
  heroRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Current video source; playback is re-initialised when it changes. */
  videoSrc?: string;
}

const HERO_VIDEO_VOLUME = 0.15;
const HERO_VISIBLE_THRESHOLD = 0.05;

/**
 * Division hero playback, matching the landing page hero (HeroSection):
 * when the hero is visible it tries to play with sound and, if the browser
 * refuses, immediately continues muted in the same step, so the video always
 * starts on arrival. The first tap/click/key press turns sound on. Playback
 * pauses when the hero scrolls out of view or the tab is hidden.
 */
export const HeroVideoControls: React.FC<HeroVideoControlsProps> = ({
  heroRef,
  videoRef,
  videoSrc,
}) => {
  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;

    let audioEnabled = false;
    let userInteracted = false;
    let hasAttemptedAudibleAutoplay = false;
    let isHeroVisible = false;
    let playbackRequest = 0;

    const removeInteractionListeners = () => {
      window.removeEventListener('pointerdown', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };

    const pauseVideo = () => {
      playbackRequest += 1;
      video.pause();
      video.muted = true;
    };

    const startVideo = async (tryAudio: boolean) => {
      if (!isHeroVisible || document.visibilityState === 'hidden') return;

      const requestId = ++playbackRequest;
      video.volume = HERO_VIDEO_VOLUME;
      video.muted = !tryAudio;
      try {
        await video.play();
        if (requestId !== playbackRequest || !isHeroVisible) return;
        if (tryAudio) {
          audioEnabled = true;
          removeInteractionListeners();
        }
      } catch (error) {
        if (requestId !== playbackRequest) return;
        // Sound was refused: keep playing muted straight away.
        video.muted = true;
        if (tryAudio && isHeroVisible) {
          try {
            await video.play();
          } catch (mutedError) {
            console.warn('[DivisionHero] Muted autoplay was blocked:', mutedError);
          }
          return;
        }
        console.warn('[DivisionHero] Could not start the hero video:', error);
      }
    };

    const enableAudio = () => {
      userInteracted = true;
      if (audioEnabled || !isHeroVisible) return;
      void startVideo(true);
    };

    window.addEventListener('pointerdown', enableAudio, { passive: true });
    window.addEventListener('touchstart', enableAudio, { passive: true });
    window.addEventListener('keydown', enableAudio);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseVideo();
      } else if (isHeroVisible) {
        void startVideo(audioEnabled || userInteracted || !hasAttemptedAudibleAutoplay);
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
          const tryAudio = audioEnabled || userInteracted || !hasAttemptedAudibleAutoplay;
          if (!userInteracted && !audioEnabled) hasAttemptedAudibleAutoplay = true;
          void startVideo(tryAudio);
        }, { threshold: HERO_VISIBLE_THRESHOLD });
    if (observer) {
      observer.observe(hero);
    } else {
      isHeroVisible = true;
      hasAttemptedAudibleAutoplay = true;
      void startVideo(true);
    }

    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      removeInteractionListeners();
      pauseVideo();
    };
  }, [heroRef, videoRef, videoSrc]);

  return null;
};
