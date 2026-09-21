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
  Share2,
  MessageCircle,
  Check,
} from 'lucide-react';
import { U1_PORTFOLIO_ITEMS, U1PortfolioItem } from '../../data/u1Data';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { GallerySectionShimmer } from '../common/GallerySectionShimmer';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';
import { shareMediaAsset, inquireMediaAssetOnWhatsApp } from '../../utils/mediaShare';

type PortfolioCategory = string;

export const U1PortfolioSection: React.FC = () => {
  const { portfolio: rawPortfolio, gallery: rawGallery, mediaAssets, isInitialLoading, isDivisionGalleryLoaded } = useFirestoreDataContext();
  const [activeCategory, setActiveCategory] = useState<PortfolioCategory>('All');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [cardCopiedId, setCardCopiedId] = useState<string | null>(null);

  const portfolioItems = useMemo<U1PortfolioItem[]>(() => {
    const items: U1PortfolioItem[] = [];

    // Helper to test if a division matches u1
    const isU1 = (d?: string) => {
      if (!d) return false;
      const lower = d.toLowerCase().trim();
      return lower === 'u1' || lower === 'u1-studio' || lower === 'div-u1' || lower === 'studio';
    };

    // 1. From portfolio collection
    if (rawPortfolio && rawPortfolio.length > 0) {
      const u1Items = rawPortfolio.filter(
        (p) => isU1(p.division) || isU1((p as any).divisionId)
      );
      u1Items.forEach((p) => {
        items.push({
          id: p.id,
          title: p.title,
          category: (((p as any).category && (p as any).category !== 'All' ? (p as any).category : 'Portraits') as any),
          imageUrl: p.imageUrl || (p.images && p.images.length > 0 ? p.images[0] : ''),
          location: p.location || 'Colombo, Sri Lanka',
          year: p.year || (p.date ? p.date.slice(-4) : '2024'),
          description: p.description || p.summary || '',
          client: p.client || 'Creative Client',
          tags: p.tags || ['Studio', 'Cinema'],
        });
      });
    }

    // 2. From gallery collection
    if (rawGallery && rawGallery.length > 0) {
      const u1Gal = rawGallery.filter(
        (g) => isU1(g.division) || isU1((g as any).divisionId)
      );
      u1Gal.forEach((g) => {
        const galUrl = g.url || (g as any).imageUrl || (g.images && g.images[0]) || '';
        if (!items.some((i) => i.id === g.id || (galUrl && i.imageUrl === galUrl))) {
          items.push({
            id: g.id,
            title: g.title,
            category: ((g.category || 'Portraits') as any),
            imageUrl: galUrl,
            location: 'Colombo Studio',
            year: g.createdAt ? new Date(g.createdAt).getFullYear().toString() : '2024',
            description: g.caption || (g as any).description || '',
            client: 'U1 Gallery Collection',
            tags: g.tags || [],
          });
        }
      });
    }

    // 3. From media_assets collection (Directly binds user-uploaded media assets)
    if (mediaAssets && mediaAssets.length > 0) {
      const u1RelevantMedia = mediaAssets.filter((m) => {
        if (isU1(m.division) || isU1(m.divisionId)) return true;
        const tags = (m.tags || []).map((t) => t.toLowerCase());
        if (tags.some((t) => ['u1', 'u1-studio', 'studio', 'photo', 'photography', 'cinema', 'frame', 'frames', '12x18', 'print', 'album', 'portrait', 'wedding'].includes(t))) {
          return true;
        }
        if (m.category === 'portfolio' || m.category === 'gallery' || m.category === 'services') {
          return true;
        }
        return false;
      });

      u1RelevantMedia.forEach((m) => {
        if (!items.some((i) => i.id === m.id || (m.url && i.imageUrl === m.url))) {
          const tags = (m.tags || []).map((t) => t.toLowerCase());
          let detectedCategory = 'Portraits';
          if (tags.some((t) => t.includes('frame') || t.includes('album') || t.includes('print') || t.includes('12x18') || t.includes('18'))) {
            detectedCategory = 'Prints & Framing';
          } else if (tags.some((t) => t.includes('wedding'))) {
            detectedCategory = 'Weddings';
          } else if (tags.some((t) => t.includes('commercial') || t.includes('product'))) {
            detectedCategory = 'Commercial & Product';
          } else if (tags.some((t) => t.includes('event') || t.includes('cinema') || t.includes('video'))) {
            detectedCategory = 'Events & Cinema';
          } else if (tags.some((t) => t.includes('pre-shoot') || t.includes('preshoot'))) {
            detectedCategory = 'Pre-Shoots';
          } else if (m.category === 'services') {
            detectedCategory = 'Studio Showcase';
          }

          items.push({
            id: m.id,
            title: m.title,
            category: detectedCategory as any,
            imageUrl: m.url,
            location: m.dimensions ? `Master Format • ${m.dimensions}` : 'U1 Media Asset',
            year: m.createdAt ? new Date(m.createdAt).getFullYear().toString() : '2024',
            description: (m as any).description || (m.tags?.length ? `Tags: ${m.tags.join(', ')}` : 'Fine Art Studio Production'),
            client: 'U1 Studio Master Asset',
            tags: m.tags || [],
          });
        }
      });
    }

    return items;
  }, [rawPortfolio, rawGallery, mediaAssets]);

  const categories = useMemo<PortfolioCategory[]>(() => {
    const list: PortfolioCategory[] = ['All'];
    const standardOrder = [
      'Prints & Framing',
      'Weddings',
      'Portraits',
      'Commercial & Product',
      'Pre-Shoots',
      'Events & Cinema',
      'Studio Showcase',
    ];

    standardOrder.forEach((cat) => {
      if (portfolioItems.some((item) => item.category === cat)) {
        list.push(cat);
      }
    });

    // Any other custom categories
    portfolioItems.forEach((item) => {
      if (item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });

    return list;
  }, [portfolioItems]);

  if (portfolioItems.length === 0) {
    if (isInitialLoading || !isDivisionGalleryLoaded('u1')) {
      return <GallerySectionShimmer divisionName="U1 Studio" />;
    }
    return null;
  }

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

            {/* Top Action Icons: Inquire on WhatsApp, Share, Zoom */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {/* WhatsApp Quick Incur / Inquire */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inquireMediaAssetOnWhatsApp({
                    id: item.id,
                    title: item.title,
                    url: item.imageUrl,
                    category: item.category,
                    division: 'u1',
                    description: item.description,
                  });
                }}
                className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                title="Inquire about this frame on WhatsApp"
                aria-label="Inquire on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
              </button>

              {/* Share Asset Button */}
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  const res = await shareMediaAsset({
                    id: item.id,
                    title: item.title,
                    url: item.imageUrl,
                    category: item.category,
                    division: 'u1',
                    description: item.description,
                  });
                  setCardCopiedId(item.id);
                  setTimeout(() => setCardCopiedId(null), 2000);
                }}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                title="Share this frame"
                aria-label="Share frame"
              >
                {cardCopiedId === item.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Full-Screen Zoom Icon */}
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
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

      {/* Full-Screen Lightbox Preview with Camera Metadata, WhatsApp Inquiry & Share */}
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
            <div className="relative rounded-2xl overflow-hidden max-h-[70vh] w-auto border border-white/10 shadow-2xl bg-black">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="max-h-[66vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Meta & Interactive Action Bar */}
            <div className="w-full max-w-4xl mt-3 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-md">
                <div className="flex items-center gap-2">
                  <Badge variant="electric" size="sm">
                    {activeItem.category}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {activeItem.location} ({activeItem.year})
                  </span>
                </div>
                <h4 className="font-display text-base sm:text-lg font-bold text-white mt-1">
                  {activeItem.title} — <span className="text-slate-400 text-xs font-normal">{activeItem.client}</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{activeItem.description}</p>
              </div>

              {/* Action Buttons: WhatsApp Incur / Inquiry + Share Asset */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
                {/* Camera EXIF optics info if present */}
                {activeItem.cameraMetadata && (
                  <div className="hidden sm:block p-2 rounded-lg bg-white/5 border border-white/10 text-left text-[11px] text-slate-300 font-mono">
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{activeItem.cameraMetadata.camera}</span>
                    </div>
                    <div>{activeItem.cameraMetadata.lens} • {activeItem.cameraMetadata.aperture}</div>
                  </div>
                )}

                {/* WhatsApp Direct Inquiry Button */}
                <button
                  type="button"
                  onClick={() =>
                    inquireMediaAssetOnWhatsApp({
                      id: activeItem.id,
                      title: activeItem.title,
                      url: activeItem.imageUrl,
                      category: activeItem.category,
                      division: 'u1',
                      description: activeItem.description,
                    })
                  }
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
                  title="Send inquiry with this photo/video to WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>Inquire on WhatsApp</span>
                </button>

                {/* Share Frame Button */}
                <button
                  type="button"
                  onClick={async () => {
                    const res = await shareMediaAsset({
                      id: activeItem.id,
                      title: activeItem.title,
                      url: activeItem.imageUrl,
                      category: activeItem.category,
                      division: 'u1',
                      description: activeItem.description,
                    });
                    setShareToast(res.message);
                    setTimeout(() => setShareToast(null), 2500);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95"
                  title="Share frame link or via social"
                >
                  {shareToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">{shareToast}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Share Frame</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
