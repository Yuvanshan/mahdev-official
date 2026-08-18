import React from 'react';
import {
  Camera,
  Film,
  Sparkles,
  ArrowRight,
  Calendar,
  Layers,
  ChevronDown,
  Maximize2,
  Compass,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SlideIn, FadeIn } from '../motion/MotionWrappers';

interface U1HeroSectionProps {
  onBookSession: () => void;
  onExplorePortfolio: () => void;
  onExploreServices: () => void;
}

export const U1HeroSection: React.FC<U1HeroSectionProps> = ({
  onBookSession,
  onExplorePortfolio,
  onExploreServices,
}) => {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-slate-950 text-white pt-24 pb-20 sm:pt-28 sm:pb-24">
      {/* Background Editorial Visuals with Subtle Film Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=2000&q=85"
          alt="U1 Studio Photography & Cinema"
          className="w-full h-full object-cover object-center opacity-30 scale-105 transform animate-pulse duration-10000"
          style={{ animationDuration: '24s' }}
        />
        {/* Soft Vignettes & Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-slate-950/80" />
        {/* Ambient Film Light Leak */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Studio Badge */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <FadeIn delay={0.1}>
            <Badge variant="electric" size="md" className="px-3.5 py-1 text-xs tracking-wider uppercase font-bold">
              U1 Studio
            </Badge>
          </FadeIn>
          <FadeIn delay={0.15}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              Media & Creative Cinema Division of Mahdev
            </span>
          </FadeIn>
        </div>

        {/* Master Heading */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <SlideIn direction="up" delay={0.2}>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              Capturing Timeless Memories.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 font-serif italic">
                Mastering Light.
              </span>
            </h1>
          </SlideIn>

          <SlideIn direction="up" delay={0.3}>
            <p className="text-lg sm:text-xl text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
              Editorial photography, 4K cinema films, high-fashion studio portraiture, and luxury heirloom flush-mount albums crafted with medium-format precision.
            </p>
          </SlideIn>

          {/* Action CTAs */}
          <SlideIn direction="up" delay={0.4}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="electric"
                size="lg"
                onClick={onBookSession}
                leftIcon={<Calendar className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-xl shadow-blue-600/30 px-8 py-3.5 text-sm font-bold"
              >
                Book Studio / On-Location Shoot
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={onExplorePortfolio}
                className="bg-white/10 hover:bg-white/20 text-white border-white/25 backdrop-blur-md px-7 py-3.5 text-sm"
              >
                View Visual Portfolio
              </Button>

              <button
                type="button"
                onClick={onExploreServices}
                className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-4 cursor-pointer transition-colors px-3 py-2"
              >
                11 Studio Services ↓
              </button>
            </div>
          </SlideIn>
        </div>

        {/* Minimalist Specs & Studio Metrics */}
        <SlideIn direction="up" delay={0.5}>
          <div className="mt-16 sm:mt-20 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">61 MP</div>
                <div className="text-xs text-slate-400">Medium-Format Sensor</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center shrink-0">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">4K / 120p</div>
                <div className="text-xs text-slate-400">10-Bit Log Cinema</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">25ft</div>
                <div className="text-xs text-slate-400">Infinity Cyclorama Wall</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white">100 Yrs</div>
                <div className="text-xs text-slate-400">Archival Print Guarantee</div>
              </div>
            </div>
          </div>
        </SlideIn>
      </div>
    </section>
  );
};
