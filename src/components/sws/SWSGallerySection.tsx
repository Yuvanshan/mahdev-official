import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Filter,
  MessageCircle,
  Share2,
  Check,
  Search,
} from 'lucide-react';
import { SWSGalleryItem } from '../../data/swsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { isSameDivision } from '../../services/firestore/divisions';
import { SectionContainer } from '../ui/SectionContainer';
import { GallerySectionShimmer } from '../common/GallerySectionShimmer';
import { H2, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';
import { openWhatsAppInquiry } from '../../utils/whatsapp';
import { shareMediaAsset } from '../../utils/mediaShare';
import { useAutoSlideImage } from '../../hooks/useAutoSlideImage';
import { CrossfadeImage } from '../common/CrossfadeImage';
import { ImageWatermark } from '../common/ImageWatermark';

const SWSGalleryCardImage: React.FC<{ images: string[]; alt: string }> = ({ images, alt }) => {
  const { activeIndex, containerRef } = useAutoSlideImage(images.length);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <CrossfadeImage
        src={
          images[activeIndex] ||
          images[0] ||
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
        }
        alt={alt}
        className="h-full w-full"
        imageClassName="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <ImageWatermark label="SWS EVENT MANAGEMENT" />
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1" aria-hidden="true">
          {images.map((_, imageIndex) => (
            <span
              key={imageIndex}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === imageIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SWSGallerySection: React.FC = () => {
  const { gallery: rawGallery, isDivisionGalleryLoaded } = useFirestoreDataContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [activeSubImageIdx, setActiveSubImageIdx] = useState<number>(0);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const galleryItems = useMemo<SWSGalleryItem[]>(() => {
    if (rawGallery && rawGallery.length > 0) {
      const swsGal = rawGallery.filter(
        (g) => isSameDivision(g.division, 'sws') || isSameDivision((g as any).divisionId, 'sws')
      );
      if (swsGal.length > 0) {
        return swsGal.map((g) => {
          const cat = (g as any).category || (g as any).tag || 'Weddings';
          const galleryYear = (g as any).year;
          const images = Array.isArray((g as any).images) && (g as any).images.length > 0
            ? (g as any).images.filter(Boolean).slice(0, 3)
            : ((g as any).imageUrl || (g as any).mediaUrl || (g as any).url || (g as any).image
              ? [(g as any).imageUrl || (g as any).mediaUrl || (g as any).url || (g as any).image]
              : []);
          return {
            id: g.id,
            title: g.title,
            category: cat as any,
            imageUrl: images[0] || (g as any).imageUrl || (g as any).url || '',
            images: images,
            location: (g as any).location || 'Colombo, Sri Lanka',
            year: !galleryYear || String(galleryYear) === '2024' ? '2026' : String(galleryYear),
            description: (g as any).description || (g as any).caption || '',
            tags: (g as any).tags || [cat],
          };
        });
      }
    }
    return [];
  }, [rawGallery]);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    galleryItems.forEach((item) => {
      const cat = item.category as string;
      if (cat && cat !== 'All') set.add(cat);
    });
    const customCats = Array.from(set);
    return ['All', ...customCats];
  }, [galleryItems]);

  if (galleryItems.length === 0 && !isDivisionGalleryLoaded('sws')) {
    return <GallerySectionShimmer divisionName="SWS" />;
  }

  if (galleryItems.length === 0) {
    return null;
  }

  const filteredItems = galleryItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All'
      || (selectedCategory === 'Conferences'
        ? item.category === 'Conferences' || item.category === 'Corporate'
        : item.category === selectedCategory);
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [
      item.title,
      item.category,
      item.location,
      item.year,
      item.description,
      ...item.tags,
    ].some((value) => value.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const activeItem = activeLightboxIndex !== null ? filteredItems[activeLightboxIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null) {
      setActiveSubImageIdx(0);
      setActiveLightboxIndex((prev) =>
        prev === 0 ? filteredItems.length - 1 : (prev as number) - 1
      );
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null) {
      setActiveSubImageIdx(0);
      setActiveLightboxIndex((prev) =>
        prev === filteredItems.length - 1 ? 0 : (prev as number) + 1
      );
    }
  };

  return (
    <SectionContainer id="gallery" background="white" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <H2 className="font-editorial text-slate-900">Cinematic Gallery of Live Productions</H2>
          </ScrollReveal>
        </div>

        {/* Category Pills */}
        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          <label className="relative block w-full md:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search events, places, years..."
              aria-label="Search the SWS gallery"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry / Grid Gallery */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveLightboxIndex(index);
              setActiveSubImageIdx(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveLightboxIndex(index);
                setActiveSubImageIdx(0);
              }
            }}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <SWSGalleryCardImage
                images={(item.images?.length ? item.images : [item.imageUrl]).filter(Boolean).slice(0, 3)}
                alt={item.title}
              />

              <div className="absolute right-3 top-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openWhatsAppInquiry({
                      title: item.title,
                      sku: `SWS-${item.id.toUpperCase()}`,
                      itemId: item.id,
                      category: item.category,
                      divisionName: 'SWS Event Management',
                      imageUrl: item.imageUrl,
                      location: item.location,
                      description: item.description,
                      type: 'gallery',
                    });
                  }}
                  title="Ask about this event on WhatsApp"
                  aria-label={`Ask about ${item.title} on WhatsApp`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition hover:bg-[#20bd5a]"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await shareMediaAsset({
                      id: item.id,
                      title: item.title,
                      url: item.imageUrl,
                      category: item.category,
                      division: 'sws',
                      description: item.description,
                    });
                  }}
                  title="Share frame"
                  aria-label={`Share ${item.title}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md transition hover:bg-white"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

            </div>

            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-display text-sm font-semibold text-slate-900 sm:text-base">{item.title}</h3>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="default" size="sm" className="bg-blue-50 text-blue-700">{item.category}</Badge>
                  {item.images && item.images.length > 1 && (
                    <span className="text-[10px] font-medium text-slate-500">{item.images.length} photos</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span className="truncate">{item.location}</span>
                <span aria-hidden="true">·</span>
                <span>{item.year}</span>
              </div>
              {item.description && <p className="line-clamp-2 text-xs leading-5 text-slate-600">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
      {filteredItems.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600" role="status">
          No events match “{searchQuery}”.
        </p>
      )}

      {/* Lightbox Modal */}
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
            <div className="relative flex h-[58vh] w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl sm:h-[65vh]">
              <img
                src={
                  (activeItem.images && activeItem.images[activeSubImageIdx]) ||
                  activeItem.imageUrl ||
                  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'
                }
                alt={activeItem.title}
                className="max-h-full max-w-full object-contain"
              />
              <ImageWatermark label="SWS EVENT MANAGEMENT" />
            </div>

            {/* Thumbnail switcher for multiple photos (up to 3) */}
            {activeItem.images && activeItem.images.length > 1 && (
              <div className="mt-3 flex max-w-full items-center justify-center gap-2 overflow-x-auto px-1">
                {activeItem.images.map((subImg, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setActiveSubImageIdx(sIdx)}
                    className={`relative h-12 w-16 shrink-0 rounded-lg overflow-hidden border-2 bg-black transition-all cursor-pointer sm:h-14 sm:w-20 ${
                      activeSubImageIdx === sIdx
                        ? 'border-purple-400 ring-2 ring-purple-400/40 scale-105'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={subImg} alt={`Photo ${sIdx + 1}`} className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Image Details Caption Bar */}
            <div className="w-full max-w-3xl mt-4 bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="electric" size="sm">
                    {activeItem.category}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {activeItem.location} ({activeItem.year})
                  </span>
                </div>
                <h4 className="font-display text-base font-bold text-white">
                  {activeItem.title}
                </h4>
                <p className="text-xs text-slate-300">{activeItem.description}</p>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeItem.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-white/10 text-slate-200 px-2 py-0.5 rounded-md"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions: WhatsApp + Share */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    openWhatsAppInquiry({
                      title: activeItem.title,
                      sku: `SWS-${activeItem.id.toUpperCase()}`,
                      itemId: activeItem.id,
                      category: activeItem.category,
                      divisionName: 'SWS Event Management',
                      imageUrl: (activeItem.images && activeItem.images[activeSubImageIdx]) || activeItem.imageUrl,
                      location: activeItem.location,
                      description: activeItem.description,
                      type: 'gallery',
                    });
                  }}
                  title="Send inquiry with this photo to WhatsApp"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>Inquire on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await shareMediaAsset({
                      id: activeItem.id,
                      title: activeItem.title,
                      url: (activeItem.images && activeItem.images[activeSubImageIdx]) || activeItem.imageUrl,
                      category: activeItem.category,
                      division: 'sws',
                      description: activeItem.description,
                    });
                    setShareToast(res.message);
                    setTimeout(() => setShareToast(null), 2500);
                  }}
                  title="Share Photo"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  {shareToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">{shareToast}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
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
