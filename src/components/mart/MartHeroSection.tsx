import React from 'react';
import {
  ShoppingBag,
  Search,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '../ui/Button';
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
}) => {
  const { divisions } = useFirestoreDataContext();

  const martDiv = divisions?.find(
    (d) =>
      d.id === 'mart' ||
      d.id === 'mahdev-mart' ||
      d.slug === 'mart' ||
      d.slug === 'mahdev-mart'
  );

  const rawHeroVideo =
    (martDiv as any)?.heroVideoUrl ||
    (martDiv as any)?.videoUrl ||
    (martDiv?.hero as any)?.videoUrl ||
    '';

  const [videoFailed, setVideoFailed] = React.useState(false);

  const rawHeroImage =
    (martDiv as any)?.imageUrl ||
    (martDiv as any)?.heroImageUrl ||
    (martDiv as any)?.hero?.bgImage;

  const heroImage =
    typeof rawHeroImage === 'string' && rawHeroImage.trim() !== ''
      ? rawHeroImage.trim()
      : 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=2000&q=80';

  const isExplicitVideo = (martDiv as any)?.heroMediaType === 'video';
  const isExplicitImage = (martDiv as any)?.heroMediaType === 'image';
  const isVideoUrl =
    rawHeroVideo.includes('.mp4') ||
    rawHeroVideo.includes('.webm') ||
    rawHeroVideo.includes('.ogg') ||
    rawHeroVideo.includes('youtube.com') ||
    rawHeroVideo.includes('youtu.be');

  const isVideo =
    !videoFailed &&
    (isExplicitVideo
      ? rawHeroVideo.trim() !== ''
      : isExplicitImage
      ? false
      : isVideoUrl && rawHeroVideo.trim() !== '');

  const badgeText =
    (martDiv as any)?.hero?.badge ||
    martDiv?.badge ||
    'MAHDEV ONLINE MART';

  const headline =
    (martDiv as any)?.heroHeadline ||
    (martDiv as any)?.hero?.title ||
    martDiv?.name ||
    'Curated Event & Home Decor, Ambient Lighting & Smart Tech';

  return (
    <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-slate-950 text-white">
      {/* ================= FULL SCREEN WIDTH BACKGROUND VIDEO / PICTURE COVER ================= */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {isVideo ? (
          rawHeroVideo.includes('youtube.com') || rawHeroVideo.includes('youtu.be') ? (
            <iframe
              src={
                rawHeroVideo.includes('embed')
                  ? rawHeroVideo
                  : `https://www.youtube.com/embed/${rawHeroVideo.split('v=')[1] || rawHeroVideo.split('/').pop()}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0`
              }
              title="Mart Showcase Video"
              className="w-full h-full object-cover pointer-events-none scale-125 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <video
              src={rawHeroVideo}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoFailed(true)}
              className="w-full h-full object-cover"
              title="Mart Showcase Video"
            />
          )
        ) : (
          <img
            src={heroImage}
            alt={martDiv?.name || 'Curated Event Decor & Smart Tech'}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Left-Side Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 sm:via-slate-950/70 md:via-slate-950/50 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 pointer-events-none z-10" />
      </div>

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
