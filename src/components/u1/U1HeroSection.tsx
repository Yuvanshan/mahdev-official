import React from 'react';
import { Calendar, ArrowRight, Film } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
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
  const { divisions, mediaAssets } = useFirestoreDataContext();

  const u1Div = divisions?.find(
    (d) =>
      d.id === 'u1' ||
      d.id === 'u1-studio' ||
      d.id === 'div-u1' ||
      d.id === 'div-u1-studio' ||
      (d as any).divisionKey === 'u1' ||
      d.slug === 'u1' ||
      d.slug === 'u1-studio'
  );

  const rawHeroImage =
    (u1Div as any)?.defaultImageUrl ||
    (u1Div as any)?.heroImageUrl ||
    (u1Div as any)?.imageUrl ||
    (u1Div?.hero as any)?.defaultImageUrl ||
    (u1Div?.hero as any)?.imageUrl ||
    (u1Div as any)?.hero?.bgImage;

  const fallbackMediaImage = React.useMemo(() => {
    const divMedia = (mediaAssets || []).find(
      (m) =>
        m.division === 'u1' ||
        (m as any).divisionId === 'u1' ||
        m.category === 'divisions' ||
        (m.tags || []).includes('hero') ||
        (m.tags || []).includes('u1')
    );
    return divMedia?.url || '';
  }, [mediaAssets]);

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : fallbackMediaImage;

  const headline =
    (u1Div as any)?.heroHeadline ||
    (u1Div as any)?.hero?.title ||
    u1Div?.name ||
    'Fine Art Photography & Cinema';

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-[#061033] text-white">
      {/* Reliable Full-Width Video Background with guaranteed autoplay */}
      <HeroVideoBackground
        videoUrl="/assets/hero_main.mp4?v=2"
        imageUrl={heroImage}
        posterImageUrl={heroImage}
        title={u1Div?.name || 'U1 Studio Photography & Cinema'}
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

          </motion.div>

        </div>
      </div>
    </section>
  );
};
