import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

interface U1HeroSectionProps {
  onBookSession: () => void;
  onExplorePortfolio: () => void;
  onExploreServices: () => void;
}

export const U1HeroSection: React.FC<U1HeroSectionProps> = ({
  onExplorePortfolio,
  onExploreServices,
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
            <span className="block">Every Frame</span>
            <span className="block">Tells a Story.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="max-w-xl text-sm sm:text-base font-medium tracking-wide text-white/85 drop-shadow-md"
          >
            Professional photography and creative experiences that preserve your most precious memories.
          </motion.p>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            onClick={onExplorePortfolio || onExploreServices}
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
