import React from 'react';
import { Camera, Calendar, ArrowRight, Phone, Film, Sparkles, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { getTelLink } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

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

  const heroImage =
    (u1Div as any)?.imageUrl ||
    (u1Div as any)?.heroImageUrl ||
    (u1Div as any)?.hero?.bgImage ||
    'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=2000&q=85';

  const badgeText =
    (u1Div as any)?.hero?.badge ||
    u1Div?.badge ||
    'U1 Studio • Mahdev Media & Cinema Division';

  const headline =
    (u1Div as any)?.heroHeadline ||
    (u1Div as any)?.hero?.title ||
    u1Div?.name ||
    'Fine Art Photography & Cinema';

  const subheadline =
    (u1Div as any)?.heroSubheadline ||
    (u1Div as any)?.hero?.subtitle ||
    u1Div?.description ||
    'Ultra-HD cinema wedding films, editorial studio portraiture, and commercial brand storytelling captured with medium-format precision.';

  const statsList =
    (u1Div as any)?.stats && (u1Div as any).stats.length > 0
      ? (u1Div as any).stats
      : [
          { value: '8K Cinema', label: 'Camera Rigs' },
          { value: 'Aerial Drones', label: 'Licensed Operators' },
          { value: 'Color Grading', label: 'DaVinci Suite' },
          { value: 'Heirloom', label: 'Flush-Mount Albums' },
        ];

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white pt-20 pb-16 sm:pt-24 sm:pb-20">
      {/* Background Editorial Visuals */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt={u1Div?.name || 'U1 Studio Photography & Cinema'}
          className="w-full h-full object-cover opacity-25"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/90" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        {/* Sleek Division Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-xs font-semibold text-blue-300 backdrop-blur-md mb-6"
        >
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span>{badgeText}</span>
        </motion.div>

        {/* Master Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-[1.12]"
        >
          {headline}
        </motion.h1>

        {/* Concise Value Statement */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mt-4"
        >
          {subheadline}
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-6"
        >
          <Button
            variant="electric"
            size="lg"
            onClick={onBookSession}
            leftIcon={<Calendar className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="font-bold px-7 py-3 text-sm shadow-lg shadow-blue-600/25"
          >
            Book Shoot / Session
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onExplorePortfolio}
            leftIcon={<Film className="w-4 h-4" />}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-6 py-3 text-sm font-semibold"
          >
            View Visual Works
          </Button>

          <a
            href={getTelLink(hotline)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-slate-900/80 text-slate-200 text-sm font-semibold hover:border-blue-400 hover:text-white transition-all backdrop-blur-sm"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>{hotline}</span>
          </a>
        </motion.div>

        {/* Capabilities Matrix */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 sm:mt-16 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {statsList.slice(0, 4).map((st: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="font-display text-2xl font-extrabold text-white">{st.value}</div>
              <div className="text-xs text-slate-400 font-medium">{st.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
