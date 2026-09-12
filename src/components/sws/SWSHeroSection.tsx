import React from 'react';
import { Calendar, ArrowRight, Phone, Layers, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { getTelLink } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getRentalAssetCount } from '../../utils/assetMetrics';

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
      d.slug === 'sws' ||
      d.slug === 'sws-event-management'
  );

  const rentalCount = getRentalAssetCount(
    products,
    (swsDiv as any)?.rentalAssetCount || (companySettings as any)?.rentalAssetCount || (siteSettings as any)?.rentalAssetCount
  );

  const hotline =
    (swsDiv as any)?.contactPhone ||
    (swsDiv as any)?.contactNumber ||
    companySettings?.primaryPhone ||
    '075 092 8078';

  const rawHeroVideo =
    (swsDiv as any)?.heroVideoUrl ||
    (swsDiv as any)?.videoUrl ||
    (swsDiv?.hero as any)?.videoUrl ||
    '';

  const [videoFailed, setVideoFailed] = React.useState(false);

  const rawHeroImage =
    (swsDiv as any)?.imageUrl ||
    (swsDiv as any)?.heroImageUrl ||
    (swsDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85';

  const isExplicitVideo = (swsDiv as any)?.heroMediaType === 'video';
  const isExplicitImage = (swsDiv as any)?.heroMediaType === 'image';
  const isVideoUrl =
    rawHeroVideo.includes('.mp4') ||
    rawHeroVideo.includes('.webm') ||
    rawHeroVideo.includes('.ogg') ||
    rawHeroVideo.includes('youtube.com') ||
    rawHeroVideo.includes('youtu.be');

  const isVideo =
    !videoFailed &&
    (isExplicitVideo
      ? rawHeroVideo.trim() !== ''
      : isExplicitImage
      ? false
      : isVideoUrl && rawHeroVideo.trim() !== '');

  const badgeText =
    (swsDiv as any)?.hero?.badge ||
    swsDiv?.badge ||
    'SWS Event Management • Mahdev Flagship Division';

  const headline =
    (swsDiv as any)?.heroHeadline ||
    (swsDiv as any)?.hero?.title ||
    swsDiv?.name ||
    'Turnkey Luxury Event Production & Decor';

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-slate-950 text-white">
      {/* ================= FULL SCREEN WIDTH BACKGROUND VIDEO / PICTURE COVER ================= */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {isVideo ? (
          rawHeroVideo.includes('youtube.com') || rawHeroVideo.includes('youtu.be') ? (
            <iframe
              src={
                rawHeroVideo.includes('embed')
                  ? rawHeroVideo
                  : `https://www.youtube.com/embed/${rawHeroVideo.split('v=')[1] || rawHeroVideo.split('/').pop()}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0`
              }
              title="SWS Showcase Video"
              className="w-full h-full object-cover pointer-events-none scale-125 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <video
              src={rawHeroVideo}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoFailed(true)}
              className="w-full h-full object-cover"
              title="SWS Showcase Video"
            />
          )
        ) : (
          <img
            src={heroImage}
            alt={swsDiv?.name || 'SWS Luxury Event Decor & Rentals'}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Left-Side Gradient Overlay: high contrast on left side for heading & CTAs */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 sm:via-slate-950/70 md:via-slate-950/50 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 pointer-events-none z-10" />
      </div>

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
              <span className="w-2 h-2 rounded-full bg-[#0052FF] animate-pulse" />
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

            <a
              href={getTelLink(hotline)}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-md"
              title={`Call SWS Desk ${hotline}`}
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
