import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

interface SWSHeroSectionProps {
  onOpenBooking?: () => void;
  onBookNow?: () => void;
  onRequestQuote?: () => void;
  onExploreServices?: () => void;
  onExploreRentals?: () => void;
}

export const SWSHeroSection: React.FC<SWSHeroSectionProps> = ({
  onExploreServices,
  onExploreRentals,
}) => {
  const { divisions } = useFirestoreDataContext();

  const swsDiv = divisions?.find(
    (d) =>
      d.id === 'sws' ||
      d.id === 'sws-event-management' ||
      d.id === 'div-sws' ||
      d.id === 'div-sws-event-management' ||
      (d as any).divisionKey === 'sws' ||
      d.slug === 'sws' ||
      d.slug === 'sws-event-management'
  );

  const rawHeroImage =
    (swsDiv as any)?.defaultImageUrl ||
    (swsDiv as any)?.heroImageUrl ||
    (swsDiv as any)?.imageUrl ||
    (swsDiv?.hero as any)?.defaultImageUrl ||
    (swsDiv?.hero as any)?.imageUrl ||
    (swsDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85';

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-[#061033] text-white">
      {/* Reliable Full-Width Video Background with guaranteed autoplay */}
      <HeroVideoBackground
        videoUrl="/assets/hero_main.mp4?v=2"
        imageUrl={heroImage}
        posterImageUrl={heroImage}
        title={swsDiv?.name || 'SWS Luxury Event Decor & Rentals'}
      />

      {/* ================= HERO CONTENT OVER VIDEO ON LEFT SIDE ================= */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 z-20 w-full">
        <div className="max-w-3xl space-y-6">
          
          {/* High-Impact Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-md"
          >
            <span className="block">We Create Moments.</span>
            <span className="block">You Make Memories.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="max-w-xl text-sm sm:text-base font-medium tracking-wide text-white/85 drop-shadow-md"
          >
            Beautifully designed celebrations, thoughtfully crafted around your special moments.
          </motion.p>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            onClick={onExploreServices || onExploreRentals}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-slate-950 transition-colors hover:bg-blue-50"
          >
            Explore Events
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </section>
  );
};
