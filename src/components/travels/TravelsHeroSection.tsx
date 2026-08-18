import React from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  Car,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Star,
  Award,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';

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
  return (
    <div className="relative overflow-hidden bg-slate-950 text-white min-h-[640px] flex items-center justify-center border-b border-slate-800">
      {/* Cinematic Hero Background Image with Subtle Dark Overlay */}
      <div className="absolute inset-0 bg-slate-950">
        <img
          src="https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=2000&q=85"
          alt="Sigiriya Rock Fortress Sri Lanka"
          className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 z-10 w-full">
        <div className="max-w-3xl space-y-6">
          <ScrollReveal direction="up">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge
                variant="electric"
                size="sm"
                className="bg-[#0052FF]/30 text-blue-300 border border-[#0052FF]/40 font-mono text-[11px]"
              >
                <Compass className="w-3.5 h-3.5 mr-1" />
                MAHDEV TRAVELS & TOURS
              </Badge>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                Sri Lanka Tourism Development Authority (SLTDA) Certified
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Bespoke Expeditions Across the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-400">Wonder of Asia</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-200 max-w-2xl leading-relaxed mt-4">
              Private luxury journeys, tea country rail journeys, leopard wildlife safaris, and coastal sanctuaries. Crafted with dedicated private chauffeurs and hand-selected heritage boutique stays.
            </p>
          </ScrollReveal>

          {/* Primary Action Buttons */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="electric"
                size="lg"
                onClick={onPlanTrip}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-xl shadow-blue-600/30 text-xs sm:text-sm font-semibold"
              >
                Plan a Custom Journey
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onExplorePackages}
                className="border-slate-600 bg-slate-900/80 text-white hover:bg-slate-800 text-xs sm:text-sm font-semibold"
              >
                View Curated Packages
              </Button>

              <button
                onClick={onExploreDestinations}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Explore 6 Iconic Regions</span>
              </button>
            </div>
          </ScrollReveal>

          {/* Trust Metrics Bar */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-white">100%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Private Tailor-Made Tours</div>
              </div>
              <div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-amber-400">24/7</div>
                <div className="text-[11px] text-slate-400 mt-0.5">On-Ground Concierge Care</div>
              </div>
              <div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-blue-400">5.0 ★</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Verified Traveler Reviews</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};
