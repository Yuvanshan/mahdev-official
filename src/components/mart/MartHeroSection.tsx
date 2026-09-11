import React from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Zap,
  Tag,
} from 'lucide-react';
import { MART_CATEGORIES } from '../../data/martData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface MartHeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  onSelectCategory: (categoryId: string) => void;
  onExploreAll: () => void;
}

export const MartHeroSection: React.FC<MartHeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSelectCategory,
  onExploreAll,
}) => {
  const { divisions } = useFirestoreDataContext();

  const martDiv = divisions?.find(
    (d) =>
      d.id === 'mart' ||
      d.id === 'mahdev-mart' ||
      d.slug === 'mart' ||
      d.slug === 'mahdev-mart'
  );

  const rawHeroImage =
    (martDiv as any)?.imageUrl ||
    (martDiv as any)?.heroImageUrl ||
    (martDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=2000&q=80';

  const badgeText =
    (martDiv as any)?.hero?.badge ||
    martDiv?.badge ||
    'MAHDEV ONLINE MART';

  const headline =
    (martDiv as any)?.heroHeadline ||
    (martDiv as any)?.hero?.title ||
    martDiv?.name ||
    'Curated Event & Home Decor, Ambient Lighting & Smart Tech';

  const subheadline =
    (martDiv as any)?.heroSubheadline ||
    (martDiv as any)?.hero?.subtitle ||
    martDiv?.description ||
    'Handpicked event & stage decor, ambient lighting fixtures, luxury interior accents, and authenticated modern tech accessories delivered island-wide.';

  return (
    <div className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800">
      {/* Background Graphic */}
      <div className="absolute inset-0 bg-slate-950">
        <img
          src={heroImage}
          alt={martDiv?.name || 'Curated Event Decor & Smart Tech'}
          className="w-full h-full object-cover object-center opacity-25 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 z-10">
        <div className="max-w-3xl space-y-6">
          <ScrollReveal direction="up">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge
                variant="electric"
                size="sm"
                className="bg-[#0052FF]/30 text-blue-300 border border-[#0052FF]/40 font-mono text-[11px]"
              >
                <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                {badgeText}
              </Badge>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                Curated Decor & Smart Tech Collections
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {headline}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mt-2">
              {subheadline}
            </p>
          </ScrollReveal>

          {/* Integrated Search Box */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="pt-2 max-w-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSearchSubmit();
                }}
                className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md border border-white/20 p-1.5 focus-within:ring-2 focus-within:ring-blue-500"
              >
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search event decor, stage light bars, candelabras, wireless chargers, microphones..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm text-slate-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="electric"
                  size="sm"
                  className="font-bold text-xs shrink-0 py-2.5 px-4 shadow-sm"
                >
                  Search
                </Button>
              </form>

              {/* Quick Filter Category Pills */}
              <div className="flex flex-wrap gap-2 pt-3">
                <span className="text-[11px] text-slate-400 font-mono self-center">Popular:</span>
                {MART_CATEGORIES.slice(0, 4).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors cursor-pointer"
                  >
                    {cat.name.split('&')[0]}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Value Props Strip */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Quality & Warranty</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Free Island-Wide Delivery over $75</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Direct WhatsApp Fast Dispatch</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};
