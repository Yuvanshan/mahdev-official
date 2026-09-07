import React from 'react';
import { Calendar, ArrowRight, Phone, ShieldCheck, Award, Users, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { getTelLink } from '../../config/company';

interface SWSHeroSectionProps {
  onBookNow: () => void;
  onRequestQuote: () => void;
  onExploreServices: () => void;
  onExploreRentals?: () => void;
}

export const SWSHeroSection: React.FC<SWSHeroSectionProps> = ({
  onBookNow,
  onRequestQuote,
  onExploreRentals,
}) => {
  const hotline = '075 092 8078';

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white pt-20 pb-16 sm:pt-24 sm:pb-20">
      {/* Background Image with Cinematic Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85"
          alt="SWS Luxury Event Decor & Rentals"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/90" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        {/* Sleek Division Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-xs font-semibold text-blue-300 backdrop-blur-md mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>SWS Event Management • Mahdev Flagship Division</span>
        </motion.div>

        {/* High-Impact Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]"
        >
          Turnkey Luxury Event Production & Decor
        </motion.h1>

        {/* 1-Sentence High-Signal Value Statement */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mt-4"
        >
          Full-scale floral mandaps, stage engineering, and 5,000+ rental inventory units delivered nationwide across Sri Lanka.
        </motion.p>

        {/* Clean, Non-Cluttered Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-6"
        >
          <Button
            variant="electric"
            size="lg"
            onClick={onBookNow}
            leftIcon={<Calendar className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="font-bold px-7 py-3 text-sm shadow-lg shadow-blue-600/25"
          >
            Book Consultation
          </Button>

          {onExploreRentals && (
            <Button
              variant="outline"
              size="lg"
              onClick={onExploreRentals}
              leftIcon={<Layers className="w-4 h-4" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md px-6 py-3 text-sm font-semibold"
            >
              Browse 5,000+ Rentals
            </Button>
          )}

          <a
            href={getTelLink(hotline)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-slate-900/80 text-slate-200 text-sm font-semibold hover:border-blue-400 hover:text-white transition-all backdrop-blur-sm"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>{hotline}</span>
          </a>
        </motion.div>

        {/* Crisp Metrics Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 sm:mt-16 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="font-display text-2xl font-extrabold text-white">450+</div>
            <div className="text-xs text-slate-400 font-medium">Events Curated</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="font-display text-2xl font-extrabold text-white">5,000+</div>
            <div className="text-xs text-slate-400 font-medium">Rental Units</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="font-display text-2xl font-extrabold text-white">9 Provinces</div>
            <div className="text-xs text-slate-400 font-medium">Islandwide Delivery</div>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="font-display text-2xl font-extrabold text-white">100%</div>
            <div className="text-xs text-slate-400 font-medium">In-House Staging</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
