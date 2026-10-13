import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { HeroVideoControls } from '../common/HeroVideoControls';
import { ScrollParallax } from '../motion/ParallelScroll';

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
      <HeroVideoControls
        heroRef={heroRef}
        videoRef={videoRef}
      />
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
          <h1 className="font-editorial text-4xl font-medium leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
            <span className="block">Creating moments.</span>
            <span className="block bg-gradient-to-r from-sky-300 via-blue-200 to-white bg-clip-text text-transparent">
              Capturing memories.
            </span>
            <span className="block">Delivering innovation.</span>
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
