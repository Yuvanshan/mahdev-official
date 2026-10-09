import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onContactUs?: () => void;
  onExploreServices?: () => void;
}

const HERO_VIDEO = '/assets/hero_main.mp4';

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onExploreMahdev,
  onExploreServices,
}) => {
  const explore = () => {
    if (onExploreServices) onExploreServices();
    else if (onExploreMahdev) onExploreMahdev();
    else onNavigate('/divisions');
  };

  return (
    <section className="relative isolate min-h-[680px] overflow-hidden bg-slate-950 sm:min-h-[740px] lg:min-h-[min(820px,calc(100svh-5rem))]">
      <video
        src={HERO_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/10"
      />

      <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center px-5 py-20 sm:min-h-[740px] sm:px-8 lg:min-h-[min(820px,calc(100svh-5rem))] lg:px-10">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-7xl">
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
