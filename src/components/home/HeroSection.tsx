import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ScrollParallax } from '../motion/ParallelScroll';
import { AnimatedHeroTitle } from '../common/AnimatedHeroTitle';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onContactUs?: () => void;
  onExploreServices?: () => void;
}

const HERO_VIDEO = '/assets/hero_landing.mp4';

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onExploreMahdev,
  onExploreServices,
}) => {
  const heroRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reducedMotion = useReducedMotion();

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
      video.volume = 0.2;
      video.muted = !tryAudio;
      try {
        await video.play();
        if (requestId !== playbackRequest || !isHeroVisible) {
          pauseVideo();
          return;
        }
        if (tryAudio) {
          audioEnabled = true;
          removeInteractionListeners();
        }
      } catch (error) {
        if (requestId !== playbackRequest) return;
        video.muted = true;
        if (tryAudio && isHeroVisible) {
          try {
            await video.play();
          } catch (mutedError) {
            console.warn('[HomeHero] Muted autoplay was blocked:', mutedError);
          }
          if (userInteracted) {
            console.warn('[HomeHero] Could not enable video audio after interaction:', error);
          }
          return;
        }
        console.warn('[HomeHero] Could not start the hero video:', error);
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
        }, { threshold: 0.05 });
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
  }, []);

  const explore = () => {
    if (onExploreServices) onExploreServices();
    else if (onExploreMahdev) onExploreMahdev();
    else onNavigate('/divisions');
  };

  return (
    <section
      ref={heroRef}
      className="relative isolate min-h-[680px] overflow-hidden bg-slate-950 sm:min-h-[740px] lg:min-h-[min(820px,calc(100svh-5rem))]"
    >
      <ScrollParallax targetRef={heroRef} distance={34} className="absolute -inset-y-10 inset-x-0 overflow-hidden">
        <video
          ref={videoRef}
          src={HERO_VIDEO}
          autoPlay
          loop
          playsInline
          muted
          preload="auto"
          aria-hidden="true"
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover object-center brightness-[1.05] contrast-[1.08] saturate-[1.08]"
        />
      </ScrollParallax>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/30 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-blue-500/15 blur-[100px]"
      />

      <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-5 py-20 sm:min-h-[740px] sm:px-8 lg:min-h-[min(820px,calc(100svh-5rem))] lg:px-10">
        <motion.div
          className="max-w-3xl"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 aria-label="Creating moments. Capturing memories. Delivering innovation." className="font-editorial text-4xl font-medium leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
            <span className="block"><AnimatedHeroTitle text="Creating moments." /></span>
            <span className="block bg-gradient-to-r from-sky-300 via-blue-200 to-white bg-clip-text text-transparent">
              <AnimatedHeroTitle text="Capturing memories." delay={0.18} />
            </span>
            <span className="block"><AnimatedHeroTitle text="Delivering innovation." delay={0.36} /></span>
          </h1>
          <button
            type="button"
            onClick={explore}
            className="group mt-9 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Explore services
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
