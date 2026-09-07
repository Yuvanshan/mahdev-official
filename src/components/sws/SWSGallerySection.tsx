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
} from 'lucide-react';
import { SWS_GALLERY_ITEMS, SWSGalleryItem } from '../../data/swsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';
import { openWhatsAppInquiry } from '../../utils/whatsapp';

export const SWSGallerySection: React.FC = () => {
  const { gallery: rawGallery } = useFirestoreDataContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const galleryItems = useMemo<SWSGalleryItem[]>(() => {
    if (rawGallery && rawGallery.length > 0) {
      const swsGal = rawGallery.filter(
        (g) => g.division === 'sws' || (g as any).divisionId === 'sws'
      );
      if (swsGal.length > 0) {
        return swsGal.map((g) => {
          const cat = (g as any).category || (g as any).tag || 'Weddings';
          return {
            id: g.id,
            title: g.title,
            category: cat as any,
            imageUrl: (g as any).imageUrl || (g as any).url || (g as any).image || '',
            location: (g as any).location || 'Colombo, Sri Lanka',
            year: (g as any).year || '2024',
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
    if (customCats.length === 0) {
      return ['All', 'Weddings', 'Corporate', 'Birthdays & Socials', 'Stage & Lighting', 'Dining & Decor'];
    }
    return ['All', ...customCats];
  }, [galleryItems]);

  if (galleryItems.length === 0) {
    return null;
  }

  const filteredItems = galleryItems.filter((item) => {
    return selectedCategory === 'All' || item.category === selectedCategory;
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
    <SectionContainer id="gallery" background="white" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <Caption className="text-[#0052FF] mb-2 block">Visual Showcase</Caption>
            <H2 className="text-slate-900">Cinematic Gallery of Live Productions</H2>
            <Body className="text-slate-600 mt-2 max-w-2xl">
              Immerse yourself in our curated visual archives—capturing the emotion, scale, and bespoke craftsmanship of Sri Lanka’s most extraordinary events.
            </Body>
          </ScrollReveal>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
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

      {/* Masonry / Grid Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => setActiveLightboxIndex(index)}
            className="group relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] cursor-pointer border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-500"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            />
            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />

            {/* Top Category Badge & WhatsApp Button */}
            <div className="absolute top-3 left-3">
              <Badge variant="default" size="sm" className="bg-black/60 backdrop-blur-md text-white text-[10px]">
                {item.category}
              </Badge>
            </div>

            {/* Direct WhatsApp button with image + Expand Icon */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openWhatsAppInquiry({
                    title: item.title,
                    category: item.category,
                    divisionName: 'SWS Event Management',
                    imageUrl: item.imageUrl,
                    location: item.location,
                    description: item.description,
                    type: 'gallery',
                  });
                }}
                title="Send WhatsApp inquiry with this photo to 0750928078"
                className="px-2.5 py-1 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center gap-1 text-[11px] font-bold shadow-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer active:scale-95"
              >
                <MessageCircle className="w-3 h-3 fill-white/20" />
                <span>WhatsApp</span>
              </button>

              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Bottom Details */}
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
            <div className="relative rounded-2xl overflow-hidden max-h-[75vh] w-auto border border-white/10 shadow-2xl bg-black">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.title}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

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

              {/* Direct WhatsApp Action Button */}
              <button
                type="button"
                onClick={() => {
                  openWhatsAppInquiry({
                    title: activeItem.title,
                    category: activeItem.category,
                    divisionName: 'SWS Event Management',
                    imageUrl: activeItem.imageUrl,
                    location: activeItem.location,
                    description: activeItem.description,
                    type: 'gallery',
                  });
                }}
                title="Send inquiry with this photo to WhatsApp 0750928078"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>Inquire on WhatsApp (0750928078)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
