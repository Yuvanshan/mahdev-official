import React from 'react';
import { Compass, ArrowRight, Phone, ChevronLeft, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { getTelLink } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

interface TravelsHeroSectionProps {
  onPlanTrip: () => void;
  onExplorePackages: () => void;
  onExploreDestinations: () => void;
}

export const TravelsHeroSection: React.FC<TravelsHeroSectionProps> = ({
  onPlanTrip,
  onExplorePackages,
}) => {
  const { divisions, companySettings } = useFirestoreDataContext();

  const travelsDiv = divisions?.find(
    (d) =>
      d.id === 'travels' ||
      d.id === 'mahdev-travels' ||
      d.id === 'div-travels' ||
      d.id === 'div-mahdev-travels' ||
      (d as any).divisionKey === 'travels' ||
      d.slug === 'travels' ||
      d.slug === 'mahdev-travels'
  );

  const hotline =
    (travelsDiv as any)?.contactPhone ||
    (travelsDiv as any)?.contactNumber ||
    companySettings?.primaryPhone ||
    '075 092 8078';

  const rawHeroVideo =
    (travelsDiv as any)?.heroVideoUrl ||
    (travelsDiv as any)?.videoUrl ||
    (travelsDiv?.hero as any)?.videoUrl ||
    ((travelsDiv?.hero as any)?.mediaType === 'video' ? (travelsDiv?.hero as any)?.mediaUrl : '') ||
    ((travelsDiv?.hero as any)?.mediaUrl?.startsWith?.('firestore://') ? (travelsDiv?.hero as any)?.mediaUrl : '') ||
    '';

  const rawHeroImage =
    (travelsDiv as any)?.defaultImageUrl ||
    (travelsDiv as any)?.heroImageUrl ||
    (travelsDiv as any)?.imageUrl ||
    (travelsDiv?.hero as any)?.defaultImageUrl ||
    (travelsDiv?.hero as any)?.imageUrl ||
    (travelsDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=2000&q=85';

  const effectiveVideoUrl = (travelsDiv as any)?.heroMediaType === 'image' && !(travelsDiv as any)?.heroVideoUrl && !(travelsDiv as any)?.videoUrl ? '' : rawHeroVideo;

  const badgeText =
    (travelsDiv as any)?.hero?.badge ||
    travelsDiv?.badge ||
    'Mahdev Travels • Curated Ceylon Journeys';

  const headline =
    (travelsDiv as any)?.heroHeadline ||
    (travelsDiv as any)?.hero?.title ||
    travelsDiv?.name ||
    'Bespoke Expeditions Across Sri Lanka';

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-[#061033] text-white">
      {/* Reliable Full-Width Video Background with guaranteed autoplay and poster fallback */}
      <HeroVideoBackground
        videoUrl={effectiveVideoUrl}
        imageUrl={heroImage}
        posterImageUrl={heroImage}
        title={travelsDiv?.name || 'Sigiriya Rock Fortress Sri Lanka'}
      />

      {/* ================= HERO CONTENT OVER VIDEO ON LEFT SIDE ================= */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 z-20 w-full">
        <div className="max-w-3xl space-y-6">
          
          {/* Breadcrumb Back Link */}
          <div>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-all backdrop-blur-md cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-blue-400" />
              <span>Back to Home</span>
            </a>
          </div>

          {/* Division Badge in Electric Blue */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0052FF]/20 border border-[#0052FF]/40 text-xs font-bold text-blue-300 backdrop-blur-md shadow-lg">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span className="tracking-wide">{badgeText}</span>
            </div>
          </motion.div>

          {/* High-Impact Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-md"
          >
            {headline}
          </motion.h1>

          {/* Clean Action CTAs in Electric Blue */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            <Button
              variant="electric"
              size="lg"
              onClick={onPlanTrip}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-bold px-7 py-3.5 text-sm sm:text-base bg-[#0052FF] hover:bg-blue-600 shadow-lg shadow-blue-600/30"
            >
              Plan Custom Journey
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onExplorePackages}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-6 py-3.5 text-sm font-semibold"
            >
              Curated Packages
            </Button>

            <a
              href={getTelLink(hotline)}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-md"
              title={`Call Concierge ${hotline}`}
            >
              <Phone className="w-4 h-4 text-blue-400" />
              <span>{hotline}</span>
            </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
