import React from 'react';
import {
  Compass,
  MapPin,
  ArrowRight,
  Star,
  Phone,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getTelLink } from '../../config/company';

interface TravelsHeroSectionProps {
  onPlanTrip: () => void;
  onExplorePackages: () => void;
  onExploreDestinations: () => void;
}

export const TravelsHeroSection: React.FC<TravelsHeroSectionProps> = ({
  onPlanTrip,
  onExplorePackages,
  onExploreDestinations,
}) => {
  const hotline = '075 092 8078';

  return (
    <div className="relative overflow-hidden bg-slate-950 text-white min-h-[75vh] flex items-center justify-center border-b border-slate-800">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950">
        <img
          src="https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=2000&q=85"
          alt="Sigiriya Rock Fortress Sri Lanka"
          className="w-full h-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-slate-950/90" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 z-10 w-full text-center">
        {/* Division Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-xs font-semibold text-amber-300 backdrop-blur-md mb-6"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Mahdev Travels • Curated Ceylon Journeys</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight"
        >
          Bespoke Expeditions Across Sri Lanka
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mt-4"
        >
          Private luxury chauffeur fleet, tea country heritage villas, wildlife safaris, and coastal sanctuaries curated for discerning travelers.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-6"
        >
          <Button
            variant="electric"
            size="lg"
            onClick={onPlanTrip}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="font-bold px-7 py-3 text-sm shadow-lg shadow-blue-600/25"
          >
            Plan Custom Journey
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onExplorePackages}
            className="border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 px-6 py-3 text-sm font-semibold"
          >
            View Curated Packages
          </Button>

          <a
            href={getTelLink(hotline)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-slate-900/80 text-slate-200 text-sm font-semibold hover:border-amber-400 hover:text-white transition-all backdrop-blur-sm"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>{hotline}</span>
          </a>
        </motion.div>

        {/* Metrics Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center"
        >
          <div>
            <div className="font-display text-2xl font-extrabold text-white">100%</div>
            <div className="text-xs text-slate-400 font-medium">Private Chauffeurs</div>
          </div>
          <div>
            <div className="font-display text-2xl font-extrabold text-amber-300">24/7</div>
            <div className="text-xs text-slate-400 font-medium">On-Ground Concierge</div>
          </div>
          <div>
            <div className="font-display text-2xl font-extrabold text-emerald-400">9 Provinces</div>
            <div className="text-xs text-slate-400 font-medium">Islandwide Coverage</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
