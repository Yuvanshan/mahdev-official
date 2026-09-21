import React from 'react';
import { Cpu, ArrowRight, GitBranch, Phone, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { getTelLink } from '../../config/company';
import { Button } from '../ui/Button';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

interface ITHeroSectionProps {
  onRequestQuote: () => void;
  onStartProject: () => void;
  onContactTeam: () => void;
  onExploreServices: () => void;
}

export const ITHeroSection: React.FC<ITHeroSectionProps> = ({
  onRequestQuote,
  onStartProject,
}) => {
  const { divisions, companySettings } = useFirestoreDataContext();

  const itDiv = divisions?.find(
    (d) =>
      d.id === 'it' ||
      d.id === 'it-solutions' ||
      d.id === 'div-it' ||
      d.id === 'div-it-solutions' ||
      (d as any).divisionKey === 'it' ||
      d.slug === 'it' ||
      d.slug === 'it-solutions'
  );

  const hotline =
    (itDiv as any)?.contactPhone ||
    (itDiv as any)?.contactNumber ||
    companySettings?.primaryPhone ||
    '075 092 8078';

  const rawHeroVideo =
    (itDiv as any)?.heroVideoUrl ||
    (itDiv as any)?.videoUrl ||
    (itDiv?.hero as any)?.videoUrl ||
    ((itDiv?.hero as any)?.mediaType === 'video' ? (itDiv?.hero as any)?.mediaUrl : '') ||
    ((itDiv?.hero as any)?.mediaUrl?.startsWith?.('firestore://') ? (itDiv?.hero as any)?.mediaUrl : '') ||
    '';

  const rawHeroImage =
    (itDiv as any)?.defaultImageUrl ||
    (itDiv as any)?.heroImageUrl ||
    (itDiv as any)?.imageUrl ||
    (itDiv?.hero as any)?.defaultImageUrl ||
    (itDiv?.hero as any)?.imageUrl ||
    (itDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2000&q=85';

  const effectiveVideoUrl = (itDiv as any)?.heroMediaType === 'image' && !(itDiv as any)?.heroVideoUrl && !(itDiv as any)?.videoUrl ? '' : rawHeroVideo;

  const badgeText =
    (itDiv as any)?.hero?.badge ||
    itDiv?.badge ||
    'Mahdev IT & Cloud Solutions';

  const headline =
    (itDiv as any)?.heroHeadline ||
    (itDiv as any)?.hero?.title ||
    itDiv?.name ||
    'Enterprise Software, Cloud & AI Engineered for Uncompromising Scale';

  const subheadline =
    (itDiv as any)?.heroSubheadline ||
    (itDiv as any)?.hero?.subtitle ||
    (itDiv as any)?.heroSubtitle ||
    itDiv?.tagline ||
    itDiv?.description ||
    'Architecting high-concurrency cloud systems, distributed ERPs, and bespoke mission-critical applications across Sri Lanka and international markets.';

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-[#061033] text-white">
      {/* Reliable Full-Width Video Background with guaranteed autoplay and poster fallback */}
      <HeroVideoBackground
        videoUrl={effectiveVideoUrl}
        imageUrl={heroImage}
        posterImageUrl={heroImage}
        title={itDiv?.name || 'Mahdev IT Solutions'}
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
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span className="tracking-wide">{badgeText}</span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-md"
          >
            {headline}
          </motion.h1>

          {/* Subheadline / Description */}
          {subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-base sm:text-lg lg:text-xl text-slate-200 font-normal leading-relaxed max-w-2xl drop-shadow"
            >
              {subheadline}
            </motion.p>
          )}

          {/* Primary Action Buttons in Electric Blue */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            <Button
              variant="electric"
              size="lg"
              onClick={onRequestQuote}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="font-bold px-7 py-3.5 text-sm sm:text-base bg-[#0052FF] hover:bg-blue-600 shadow-lg shadow-blue-600/30"
            >
              Request a Quote
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onStartProject}
              leftIcon={<GitBranch className="w-4 h-4 text-blue-400" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-6 py-3.5 text-sm font-semibold"
            >
              Start a Project
            </Button>

            <a
              href={getTelLink(hotline)}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-md"
              title={`Call IT Engineering ${hotline}`}
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
