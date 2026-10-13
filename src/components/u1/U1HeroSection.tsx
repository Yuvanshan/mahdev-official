import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { HeroVideoBackground } from '../common/HeroVideoBackground';
import { ScrollParallax } from '../motion/ParallelScroll';

interface U1HeroSectionProps {
  onExploreServices: () => void;
}

export const U1HeroSection: React.FC<U1HeroSectionProps> = ({
  onExploreServices,
}) => {
  const heroRef = React.useRef<HTMLElement | null>(null);

  return (
    <section ref={heroRef} className="relative flex min-h-[680px] w-full items-center overflow-hidden bg-[#061033] text-white sm:min-h-[740px] lg:min-h-[min(820px,calc(100svh-5rem))]">
      {/* Reliable Full-Width Video Background with guaranteed autoplay */}
      <ScrollParallax targetRef={heroRef} distance={34} className="absolute -inset-y-10 inset-x-0 overflow-hidden">
        <HeroVideoBackground
          videoUrl="/assets/hero_main.mp4?v=2"
          title="U1 Studio Photography & Cinema"
          enableAutomaticAudio
        />
      </ScrollParallax>

      {/* ================= HERO CONTENT OVER VIDEO ON LEFT SIDE ================= */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 z-20 w-full">
        <div className="max-w-3xl space-y-6">
          
          {/* High-Impact Headline */}
          <motion.h1
            initial={{ opacity: 0.85, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="font-editorial text-4xl font-medium leading-[1.04] tracking-[-0.035em] text-white drop-shadow-md sm:text-6xl lg:text-7xl"
          >
            <span className="block">Every Frame</span>
            <span className="block bg-gradient-to-r from-sky-300 via-blue-200 to-white bg-clip-text text-transparent">Tells a Story.</span>
          </motion.h1>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            onClick={onExploreServices}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-slate-950 transition-colors hover:bg-blue-50"
          >
            Explore Our Studio
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </section>
  );
};
