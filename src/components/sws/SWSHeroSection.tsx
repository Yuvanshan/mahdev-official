import React from 'react';
import { Calendar, ArrowRight, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getRentalAssetCount } from '../../utils/assetMetrics';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

interface SWSHeroSectionProps {
  onOpenBooking?: () => void;
  onBookNow?: () => void;
  onRequestQuote?: () => void;
  onExploreServices?: () => void;
  onExploreRentals?: () => void;
}

export const SWSHeroSection: React.FC<SWSHeroSectionProps> = ({
  onOpenBooking,
  onBookNow,
  onExploreRentals,
}) => {
  const handleBook = onBookNow || onOpenBooking || (() => {});
  const { divisions, companySettings, siteSettings, products } = useFirestoreDataContext();

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

  const rentalCount = getRentalAssetCount(
    products,
    (swsDiv as any)?.rentalAssetCount || (companySettings as any)?.rentalAssetCount || (siteSettings as any)?.rentalAssetCount
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

  const headline =
    (swsDiv as any)?.heroHeadline ||
    (swsDiv as any)?.hero?.title ||
    swsDiv?.name ||
    'Turnkey Luxury Event Production & Decor';

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
            {headline}
          </motion.h1>

          {/* Clean, Non-Cluttered Action CTAs in Electric Blue */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            <Button
              variant="electric"
              size="lg"
              onClick={handleBook}
              leftIcon={<Calendar className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-bold px-7 py-3.5 text-sm sm:text-base bg-[#0052FF] hover:bg-blue-600 shadow-lg shadow-blue-600/30"
            >
              Book Consultation
            </Button>

            {onExploreRentals && (
              <Button
                variant="outline"
                size="lg"
                onClick={onExploreRentals}
                leftIcon={<Layers className="w-4 h-4" />}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-6 py-3.5 text-sm font-semibold"
              >
                Browse {rentalCount} Rentals
              </Button>
            )}

          </motion.div>

        </div>
      </div>
    </section>
  );
};
