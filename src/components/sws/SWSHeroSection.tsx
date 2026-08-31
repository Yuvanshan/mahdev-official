import React from 'react';
import {
  Sparkles,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Award,
  Users,
  PhoneCall,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SlideIn, FadeIn } from '../motion/MotionWrappers';

interface SWSHeroSectionProps {
  onBookNow: () => void;
  onRequestQuote: () => void;
  onExploreServices: () => void;
  onExploreRentals?: () => void;
}

export const SWSHeroSection: React.FC<SWSHeroSectionProps> = ({
  onBookNow,
  onRequestQuote,
  onExploreServices,
  onExploreRentals,
}) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white pt-24 pb-20 sm:pt-28 sm:pb-24">
      {/* Background Image with Dark Vignette & Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85"
          alt="SWS Luxury Event Decor, Stage & Equipment Rentals"
          className="w-full h-full object-cover object-center opacity-35 scale-105 transform animate-pulse duration-10000"
          style={{ animationDuration: '20s' }}
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/80" />
        {/* Subtle Luxury Pattern / Light Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <FadeIn delay={0.1}>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              Primary Flagship Division
            </span>
          </FadeIn>
          <FadeIn delay={0.15}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Mahdev Pvt Ltd Core Enterprise Pillar
            </span>
          </FadeIn>
        </div>

        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <SlideIn direction="up" delay={0.2}>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              Creating Moments.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                Crafting Grandeur.
              </span>
            </h1>
          </SlideIn>

          <SlideIn direction="up" delay={0.3}>
            <p className="text-lg sm:text-xl text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
              Mahdev’s primary division for turnkey event management, luxury wedding stage & mandap decor, concert-grade audio-visual production, and complete furniture & equipment rentals across Sri Lanka.
            </p>
          </SlideIn>

          {/* Action CTAs */}
          <SlideIn direction="up" delay={0.4}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="electric"
                size="lg"
                onClick={onBookNow}
                leftIcon={<Calendar className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-xl shadow-blue-600/30 px-8 py-3.5 text-sm font-bold"
              >
                Book Your Event
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onExploreRentals || onRequestQuote}
                className="bg-white/10 hover:bg-white/20 text-white border-white/25 backdrop-blur-md px-7 py-3.5 text-sm font-semibold"
              >
                Explore Rental Catalog (5,000+ Items)
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onRequestQuote}
                className="bg-slate-900/60 hover:bg-slate-800 text-slate-200 border-white/15 px-6 py-3.5 text-sm"
              >
                Request Custom Quote
              </Button>
            </div>
          </SlideIn>
        </div>

        {/* Live Metrics / Guarantee Strip */}
        <SlideIn direction="up" delay={0.5}>
          <div className="mt-16 sm:mt-20 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">450+</div>
                <div className="text-xs text-slate-400">Events Curated</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">5,000+</div>
                <div className="text-xs text-slate-400">Rental Units in Stock</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">120k+</div>
                <div className="text-xs text-slate-400">Guests Hosted</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">99.4%</div>
                <div className="text-xs text-slate-400">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </SlideIn>
      </div>
    </section>
  );
};
