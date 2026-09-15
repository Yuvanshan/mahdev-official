import React from 'react';
import { Camera, Calendar, ArrowRight, Phone, Film, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { getTelLink } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

interface U1HeroSectionProps {
  onBookSession: () => void;
  onExplorePortfolio: () => void;
  onExploreServices: () => void;
}

export const U1HeroSection: React.FC<U1HeroSectionProps> = ({
  onBookSession,
  onExplorePortfolio,
}) => {
  const { divisions, companySettings } = useFirestoreDataContext();

  const u1Div = divisions?.find(
    (d) =>
      d.id === 'u1' ||
      d.id === 'u1-studio' ||
      d.slug === 'u1' ||
      d.slug === 'u1-studio'
  );

  const hotline =
    (u1Div as any)?.contactPhone ||
    (u1Div as any)?.contactNumber ||
    companySettings?.primaryPhone ||
    '075 092 8078';

  const rawHeroVideo =
    (u1Div as any)?.heroVideoUrl ||
    (u1Div as any)?.videoUrl ||
    (u1Div?.hero as any)?.videoUrl ||
    ((u1Div?.hero as any)?.mediaType === 'video' ? (u1Div?.hero as any)?.mediaUrl : '') ||
    ((u1Div?.hero as any)?.mediaUrl?.startsWith?.('firestore://') ? (u1Div?.hero as any)?.mediaUrl : '') ||
    '';

  const rawHeroImage =
    (u1Div as any)?.imageUrl ||
    (u1Div as any)?.heroImageUrl ||
    (u1Div as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=2000&q=85';

  const effectiveVideoUrl = (u1Div as any)?.heroMediaType === 'image' ? '' : rawHeroVideo;

  const badgeText =
    (u1Div as any)?.hero?.badge ||
    u1Div?.badge ||
    'U1 Studio • Mahdev Media & Cinema Division';

  const headline =
    (u1Div as any)?.heroHeadline ||
    (u1Div as any)?.hero?.title ||
    u1Div?.name ||
    'Fine Art Photography & Cinema';

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-[#061033] text-white">
      {/* Reliable Full-Width Video Background with guaranteed autoplay */}
      <HeroVideoBackground
        videoUrl={effectiveVideoUrl}
        imageUrl={heroImage}
        title={u1Div?.name || 'U1 Studio Photography & Cinema'}
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
              <Camera className="w-3.5 h-3.5 text-blue-400" />
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

          {/* Action CTAs in Electric Blue */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            <Button
              variant="electric"
              size="lg"
              onClick={onBookSession}
              leftIcon={<Calendar className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-bold px-7 py-3.5 text-sm sm:text-base bg-[#0052FF] hover:bg-blue-600 shadow-lg shadow-blue-600/30"
            >
              Book Shoot / Session
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onExplorePortfolio}
              leftIcon={<Film className="w-4 h-4" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-6 py-3.5 text-sm font-semibold"
            >
              View Visual Works
            </Button>

            <a
              href={getTelLink(hotline)}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-md"
              title={`Call Production Desk ${hotline}`}
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
