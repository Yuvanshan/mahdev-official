import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { HeroVideoBackground } from './HeroVideoBackground';
import { ScrollParallax } from '../motion/ParallelScroll';
import { AnimatedHeroTitle } from './AnimatedHeroTitle';

interface DivisionHeroProps {
  /** Hero video from the division record (empty for image-only heroes). */
  videoUrl?: string;
  /** Hero image / poster from the division record. */
  imageUrl?: string;
  mediaTitle: string;
  headline: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

/**
 * Clean division hero used by IT, Travels and Mart, matching the SWS and U1
 * heroes: full-bleed media, one headline and one button. Video playback
 * follows the landing page behaviour (enableAutomaticAudio).
 */
export const DivisionHero: React.FC<DivisionHeroProps> = ({
  videoUrl,
  imageUrl,
  mediaTitle,
  headline,
  buttonLabel,
  onButtonClick,
}) => {
  const heroRef = React.useRef<HTMLElement | null>(null);

  return (
    <section ref={heroRef} className="relative flex min-h-[680px] w-full items-center overflow-hidden bg-[#061033] text-white sm:min-h-[740px] lg:min-h-[min(820px,calc(100svh-5rem))]">
      <ScrollParallax targetRef={heroRef} distance={34} className="absolute -inset-y-10 inset-x-0 overflow-hidden">
        <HeroVideoBackground
          videoUrl={videoUrl}
          imageUrl={imageUrl}
          posterImageUrl={imageUrl}
          title={mediaTitle}
          enableAutomaticAudio
        />
      </ScrollParallax>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 z-20 w-full">
        <div className="max-w-3xl space-y-6">
          <motion.h1
            aria-label={headline}
            initial={{ opacity: 0.85, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="font-editorial text-4xl font-medium leading-[1.04] tracking-[-0.035em] text-white drop-shadow-md sm:text-6xl lg:text-7xl"
          >
            <AnimatedHeroTitle text={headline} />
          </motion.h1>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            onClick={onButtonClick}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-slate-950 transition-colors hover:bg-blue-50"
          >
            {buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </section>
  );
};
