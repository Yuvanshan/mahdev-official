import React, { useState, useMemo } from 'react';
import {
  Camera,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Layers,
  Sliders,
  Film,
  Info,
} from 'lucide-react';
import { U1_PORTFOLIO_ITEMS, U1PortfolioItem } from '../../data/u1Data';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';

type PortfolioCategory =
  | 'All'
  | 'Weddings'
  | 'Portraits'
  | 'Commercial & Product'
  | 'Pre-Shoots'
  | 'Events & Cinema';

export const U1PortfolioSection: React.FC = () => {
  const { portfolio: rawPortfolio } = useFirestoreDataContext();
  const [activeCategory, setActiveCategory] = useState<PortfolioCategory>('All');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const portfolioItems = useMemo<U1PortfolioItem[]>(() => {
    if (rawPortfolio && rawPortfolio.length > 0) {
      const u1Items = rawPortfolio.filter(
        (p) => p.division === 'u1' || (p as any).divisionId === 'u1'
      );
      if (u1Items.length > 0) {
        return u1Items.map((p) => ({
          id: p.id,
          title: p.title,
          category: (((p as any).category && (p as any).category !== 'All' ? (p as any).category : 'Portraits') as 'Weddings' | 'Commercial & Product' | 'Portraits' | 'Pre-Shoots' | 'Events & Cinema'),
          imageUrl: p.images && p.images.length > 0 ? p.images[0] : (p as any).imageUrl || '',
          location: (p as any).location || 'Colombo, Sri Lanka',
          date: (p as any).date || '2024',
          year: (p as any).year || (p as any).date?.slice(-4) || '2024',
          description: p.description || '',
          client: p.client || 'Creative Client',
          gearUsed: (p as any).gearUsed || 'Sony FX3 Cinema & Prime G-Master',
          tags: (p as any).tags || ['Cinema', 'Studio'],
        }));
      }
    }
    return [];
  }, [rawPortfolio]);

  if (portfolioItems.length === 0) {
    return null;
  }

  const categories: PortfolioCategory[] = [
    'All',
    'Weddings',
    'Portraits',
    'Commercial & Product',
    'Pre-Shoots',
    'Events & Cinema',
  ];

  const filteredItems = portfolioItems.filter((item) => {
    return activeCategory === 'All' || item.category === activeCategory;
  });

  const activeItem = activeLightboxIndex !== null ? filteredItems[activeLightboxIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((prev) =>
        prev === 0 ? filteredItems.length - 1 : (prev as number) - 1
      );
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null) {
      setActiveLightboxIndex((prev) =>
        prev === filteredItems.length - 1 ? 0 : (prev as number) + 1
      );
    }
  };

  return (
    <SectionContainer id="portfolio" background="subtle" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <Caption className="text-[#0052FF] mb-2 block">
              Curated Visual Archives
            </Caption>
            <H2 className="text-slate-900">
              The U1 Visual Portfolio
            </H2>
            <Body className="text-slate-600 mt-2 max-w-2xl">
              An image-first exhibition of our hallmark stills and cinema productions. Tap any frame to inspect full-screen composition and camera optics.
            </Body>
          </ScrollReveal>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/20'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Masonry / Dynamic Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setActiveLightboxIndex(index)}
            className="group relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] cursor-pointer border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-500"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            />
            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />

            {/* Category Tag */}
            <div className="absolute top-3 left-3">
              <Badge variant="default" size="sm" className="bg-black/60 backdrop-blur-md text-white text-[10px]">
                {item.category}
              </Badge>
            </div>

            {/* Full-Screen Zoom Icon */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>

            {/* Bottom Meta */}
            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-blue-300 font-medium">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.location}</span>
                <span className="text-white/40">•</span>
                <span>{item.year}</span>
              </div>
              <h3 className="font-display text-base font-bold text-white group-hover:text-blue-200 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-1 opacity-90">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Lightbox Preview with Camera Metadata */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setActiveLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setActiveLightboxIndex(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
            aria-label="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev / Next Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Lightbox Content Container */}
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-2xl overflow-hidden max-h-[72vh] w-auto border border-white/10 shadow-2xl bg-black">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="max-h-[68vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Meta bar */}
            <div className="w-full max-w-3xl mt-4 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 border border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="electric" size="sm">
                    {activeItem.category}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {activeItem.location} ({activeItem.year})
                  </span>
                </div>
                <h4 className="font-display text-base font-bold text-white mt-1">
                  {activeItem.title} — <span className="text-slate-400 text-xs font-normal">{activeItem.client}</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">{activeItem.description}</p>
              </div>

              {/* Camera EXIF optics info */}
              {activeItem.cameraMetadata && (
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-left text-[11px] text-slate-300 shrink-0 space-y-0.5 font-mono">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{activeItem.cameraMetadata.camera}</span>
                  </div>
                  <div>Lens: {activeItem.cameraMetadata.lens}</div>
                  <div>Aperture: {activeItem.cameraMetadata.aperture}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
