import React from 'react';
import {
  ShoppingBag,
  Search,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

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
}) => {
  const { divisions } = useFirestoreDataContext();

  const martDiv = divisions?.find(
    (d) =>
      d.id === 'mart' ||
      d.id === 'online-mart' ||
      d.id === 'mahdev-mart' ||
      d.id === 'div-mart' ||
      d.id === 'div-online-mart' ||
      (d as any).divisionKey === 'mart' ||
      d.slug === 'mart' ||
      d.slug === 'online-mart' ||
      d.slug === 'mahdev-mart'
  );

  const rawHeroVideo =
    (martDiv as any)?.heroVideoUrl ||
    (martDiv as any)?.videoUrl ||
    (martDiv?.hero as any)?.videoUrl ||
    ((martDiv?.hero as any)?.mediaType === 'video' ? (martDiv?.hero as any)?.mediaUrl : '') ||
    ((martDiv?.hero as any)?.mediaUrl?.startsWith?.('firestore://') ? (martDiv?.hero as any)?.mediaUrl : '') ||
    '';

  const rawHeroImage =
    (martDiv as any)?.defaultImageUrl ||
    (martDiv as any)?.heroImageUrl ||
    (martDiv as any)?.imageUrl ||
    (martDiv?.hero as any)?.defaultImageUrl ||
    (martDiv?.hero as any)?.imageUrl ||
    (martDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=2000&q=80';

  const effectiveVideoUrl = (martDiv as any)?.heroMediaType === 'image' && !(martDiv as any)?.heroVideoUrl && !(martDiv as any)?.videoUrl ? '' : rawHeroVideo;

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
    (martDiv as any)?.heroSubtitle ||
    martDiv?.tagline ||
    martDiv?.description ||
    'Premium event decoration materials, professional illumination systems, bespoke floral structures, and smart tech accessories delivered across Sri Lanka.';

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-[#061033] text-white">
      {/* Reliable Full-Width Video Background with guaranteed autoplay and poster fallback */}
      <HeroVideoBackground
        videoUrl={effectiveVideoUrl}
        imageUrl={heroImage}
        posterImageUrl={heroImage}
        title={martDiv?.name || 'Curated Event Decor & Smart Tech'}
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
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0052FF]/20 border border-[#0052FF]/40 text-xs font-bold text-blue-300 backdrop-blur-md shadow-lg">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
              <span className="tracking-wide">{badgeText}</span>
              <span className="text-white/40">•</span>
              <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Curated Store
              </span>
            </div>
          </div>

          {/* High-Impact Headline */}
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-md">
            {headline}
          </h1>

          {/* Subheadline / Store Description */}
          {subheadline && (
            <p className="text-base sm:text-lg lg:text-xl text-slate-200 font-normal leading-relaxed max-w-2xl drop-shadow">
              {subheadline}
            </p>
          )}

          {/* Integrated Search Box */}
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
                placeholder="Search event decor, stage light bars, candelabras, tech gear..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm text-slate-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
              />
              <Button
                type="submit"
                variant="electric"
                size="sm"
                className="font-bold text-xs shrink-0 py-2.5 px-5 bg-[#0052FF] hover:bg-blue-600 shadow-sm"
              >
                Search
              </Button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};
