import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onContactUs?: () => void;
  onExploreServices?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onExploreMahdev,
  onContactUs,
}) => {
  const { homepageConfig } = useFirestoreDataContext();
  const heroConfig = homepageConfig?.hero;
  const videoUrl = heroConfig?.mediaType === 'video'
    ? heroConfig.videoUrl || heroConfig.mediaUrl || heroConfig.videoEmbedUrl || ''
    : '';
  const heroImage = heroConfig?.mediaType === 'image'
    ? heroConfig.imageUrl || heroConfig.defaultImageUrl || heroConfig.mediaUrl || ''
    : heroConfig?.defaultImageUrl || heroConfig?.imageUrl || '';

  const navigateTo = (route: string | undefined, fallback: () => void) => {
    const target = route?.trim();
    if (!target) {
      fallback();
    } else if (target.startsWith('#')) {
      const section = document.getElementById(target.slice(1));
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      } else {
        onExploreMahdev();
      }
    } else {
      onNavigate(target);
    }
  };

  return (
    <section
      id="hero"
      className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-[#061033] text-white"
    >
      {/* Hero media is controlled by the homepage configuration in Firestore. */}
      <HeroVideoBackground
        videoUrl={videoUrl}
        imageUrl={heroImage}
        posterImageUrl={heroImage}
        title={heroConfig?.titleLine1 || 'Homepage hero'}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 z-20 w-full text-left">
        <div className="max-w-2xl space-y-5">
          {heroConfig?.badgeText && (
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-sm">
              {heroConfig.badgeText}
            </span>
          )}
          <h1 className="space-y-1 font-display text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
            {heroConfig?.titleLine1 && <span className="block">{heroConfig.titleLine1}</span>}
            {heroConfig?.titleHighlight && <span className="block text-cyan-300">{heroConfig.titleHighlight}</span>}
            {heroConfig?.titleLine2 && <span className="block text-white/85">{heroConfig.titleLine2}</span>}
          </h1>
          {heroConfig?.description && (
            <p className="max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {heroConfig.description}
            </p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-3 pt-2"
          >
            <button
              id="hero-explore-services-btn"
              onClick={() => navigateTo(heroConfig?.primaryCtaLink, onExploreMahdev)}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#0052FF] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0052FF]/25 transition-all hover:bg-[#0045D8] active:scale-[0.98] sm:px-7 sm:text-base"
            >
              <span>{heroConfig?.primaryCtaLabel || 'Explore'}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
            {heroConfig?.secondaryCtaLabel && heroConfig.secondaryCtaLink && (
              <button
                type="button"
                onClick={() => navigateTo(heroConfig.secondaryCtaLink, onContactUs || onExploreMahdev)}
                className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15 sm:px-7 sm:text-base"
              >
                {heroConfig.secondaryCtaLabel}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
