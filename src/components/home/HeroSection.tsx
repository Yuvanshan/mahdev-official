import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
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
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover brightness-[1.15] saturate-[1.08]"
        />
      </ScrollParallax>
      <HeroVideoControls
        heroRef={heroRef}
        videoRef={videoRef}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/28 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-slate-950/5"
      />

      <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-5 py-20 sm:min-h-[740px] sm:px-8 lg:min-h-[min(820px,calc(100svh-5rem))] lg:px-10">
        <div className="max-w-3xl">
          <h1 className="font-editorial text-4xl font-medium leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
            <span className="block">Creating Moments...</span>
            <span className="block bg-gradient-to-r from-sky-300 via-blue-200 to-white bg-clip-text text-transparent">
              Capturing Memories...
            </span>
            <span className="block">Delivering Innovations...</span>
          </h1>
          <button
            type="button"
            onClick={explore}
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-slate-950 transition-colors hover:bg-blue-50"
          >
            Explore Now...
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
