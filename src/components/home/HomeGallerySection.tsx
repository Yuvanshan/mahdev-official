import React, { useMemo, useState } from 'react';
import { Expand, X, MapPin, Sparkles, MessageCircle } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { Caption, H2, Body } from '../ui/Heading';
import { openWhatsAppInquiry } from '../../utils/whatsapp';
import { GallerySectionShimmer } from '../common/GallerySectionShimmer';

/** A premium gallery that mirrors the polished presentation used in the division pages. */
export const HomeGallerySection: React.FC = () => {
  const { gallery, isGalleryLoading, isInitialLoading, isFetching } = useFirestoreDataContext();
  const [activeImage, setActiveImage] = useState<{ url: string; title: string; category: string; location?: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const items = useMemo(() => gallery
    .filter((item) => item.status !== 'hidden')
    .flatMap((item) => {
      const media = item.images?.length ? item.images : [item.mediaUrl || item.url || item.thumbnailUrl || ''];
      return media.filter(Boolean).map((url, index) => ({
        id: `${item.id}-${index}`,
        url,
        title: item.title || 'Mahdev Gallery',
        category: item.category || item.tag || 'Mahdev Group',
        location: (item as any).location || item.caption || 'Sri Lanka',
      }));
    })
    .slice(0, 9), [gallery]);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.category));
    return ['All', ...Array.from(set)];
  }, [items]);

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((item) => item.category === selectedCategory);

  if (!items.length) {
    if (isGalleryLoading) {
      return <GallerySectionShimmer divisionName="Corporate" />;
    }
    return null;
  }

  return (
    <SectionContainer id="gallery" background="white" paddingY="xl" hasBorderBottom>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <Caption className="mb-2 block text-[#0052FF]">Visual Showcase</Caption>
          <H2 className="text-slate-900">Selected Work Across Every Division</H2>
          <Body className="mt-2 text-slate-600">
            A curated look at the craftsmanship, excitement, and production quality we deliver across events, media, technology, and lifestyle experiences.
          </Body>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === category
                  ? 'border-[#0052FF] bg-[#0052FF] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4">
        {filteredItems.map((item, index) => {
          const isFeatured = index === 0;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveImage(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveImage(item);
                }
              }}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${
                isFeatured ? 'col-span-2 sm:col-span-2 xl:col-span-2 aspect-[16/10]' : 'aspect-[4/5]'
              }`}
            >
              <img
                src={item.url}
                alt={item.title}
                loading={index < 4 ? 'eager' : 'lazy'}
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fb) fb.classList.remove('hidden');
                }}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="hidden h-full w-full bg-gradient-to-br from-slate-900 to-blue-950 flex flex-col items-center justify-center p-4 text-center">
                <span className="text-white/80 font-display font-semibold text-sm">{item.title}</span>
                <span className="text-blue-400 text-xs mt-1">{item.category}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

              <div className="absolute left-3 top-3 flex items-center gap-2">
                <span className="rounded-full border border-white/30 bg-slate-950/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                  {item.category}
                </span>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openWhatsAppInquiry({
                    title: item.title,
                    category: item.category,
                    divisionName: 'Mahdev Group',
                    imageUrl: item.url,
                    location: item.location,
                    type: 'gallery',
                  });
                }}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/80 bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
                title="Ask on WhatsApp"
                aria-label={`Ask about ${item.title} on WhatsApp`}
              >
                <MessageCircle className="h-4 w-4" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-200">
                  <MapPin className="h-3.5 w-3.5 text-[#95b8ff]" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#95b8ff]" />
                  <span className="text-sm font-semibold sm:text-base">{item.title}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.title}
          onClick={() => setActiveImage(null)}
        >
          <div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
              aria-label="Close gallery image"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={activeImage.url}
              alt={activeImage.title}
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
              <span className="truncate font-medium">{activeImage.title}</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                {activeImage.category}
              </span>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
