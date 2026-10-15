import React, { useMemo, useState } from 'react';
import { X, MapPin, MessageCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { Caption, H2, Body } from '../ui/Heading';
import { openWhatsAppInquiry } from '../../utils/whatsapp';
import { GallerySectionShimmer } from '../common/GallerySectionShimmer';
import { ImageWithShimmer } from '../ui/ImageWithShimmer';
import { useAutoSlideImage } from '../../hooks/useAutoSlideImage';

interface HomeGalleryItem {
  id: string;
  images: string[];
  url: string;
  title: string;
  category: string;
  location: string;
}

interface ActiveGalleryImage {
  item: HomeGalleryItem;
  imageIndex: number;
}

const HomeGalleryCard: React.FC<{
  item: HomeGalleryItem;
  index: number;
  isFeatured: boolean;
  onOpen: (item: HomeGalleryItem, imageIndex: number) => void;
}> = ({ item, index, isFeatured, onOpen }) => {
  const { activeIndex, containerRef } = useAutoSlideImage(item.images.length);
  const imageUrl = item.images[activeIndex] || item.url;

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item, activeIndex)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(item, activeIndex);
        }
      }}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        isFeatured ? 'col-span-2 sm:col-span-2 xl:col-span-2' : ''
      }`}
    >
      <div className="relative">
        <ImageWithShimmer
          src={imageUrl}
          alt={item.title}
          className={`bg-slate-100 ${isFeatured ? 'aspect-[16/10]' : 'aspect-[4/5]'}`}
          loading={index < 4 ? 'eager' : 'lazy'}
          imageClassName="object-contain transition duration-500 group-hover:scale-[1.02]"
          fallbackText={item.title}
        />
        {item.images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1">
            {item.images.map((_, imageIndex) => (
              <span
                key={imageIndex}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === imageIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openWhatsAppInquiry({
              title: item.title,
              category: item.category,
              divisionName: 'Mahdev Group',
              itemId: item.id,
              imageUrl,
              location: item.location,
              type: 'gallery',
            });
          }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600"
          title="Ask on WhatsApp"
          aria-label={`Ask about ${item.title} on WhatsApp`}
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">{item.title}</h3>
          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
            {item.category}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" />
          <span className="truncate">{item.location}</span>
        </p>
      </div>
    </div>
  );
};

/** A premium gallery that mirrors the polished presentation used in the division pages. */
export const HomeGallerySection: React.FC = () => {
  const {
    gallery,
    isGalleryLoading,
    isInitialLoading,
    isFetching,
    error,
    refreshAll,
  } = useFirestoreDataContext();
  const [activeImage, setActiveImage] = useState<ActiveGalleryImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const items = useMemo<HomeGalleryItem[]>(() => gallery
    .filter((item) => item.status !== 'hidden')
    .map((item) => {
      const images = (item.images?.length ? item.images : [item.mediaUrl || item.url || item.thumbnailUrl || ''])
        .filter(Boolean)
        .slice(0, 3);
      return {
        id: item.id,
        images,
        url: images[0] || '',
        title: item.title || 'Mahdev Gallery',
        category: item.category || item.tag || 'Mahdev Group',
        location: (item as any).location || item.caption || 'Sri Lanka',
      };
    }), [gallery]);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.category));
    return ['All', ...Array.from(set)];
  }, [items]);

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((item) => item.category === selectedCategory);
  const searchedItems = filteredItems.filter((item) =>
    `${item.title} ${item.category} ${item.location}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const displayedItems = searchQuery.trim() || selectedCategory !== 'All'
    ? searchedItems
    : searchedItems.slice(0, 9);

  if (!items.length) {
    if (isGalleryLoading || isInitialLoading || isFetching) {
      return <GallerySectionShimmer divisionName="Corporate" />;
    }
    if (error) {
      return (
        <SectionContainer background="white" paddingY="xl">
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>Gallery content could not be loaded. Please retry.</span>
            <button
              type="button"
              onClick={() => void refreshAll(true)}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold hover:bg-amber-100"
            >
              Retry loading
            </button>
          </div>
        </SectionContainer>
      );
    }
    return null;
  }

  return (
    <SectionContainer id="gallery" background="white" paddingY="xl" hasBorderBottom>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <Caption className="mb-2 block text-[#0052FF]">Visual Showcase</Caption>
          <H2 className="font-editorial text-slate-900">Selected Work Across Every Division</H2>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          <label className="relative block w-full md:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search gallery..."
              aria-label="Search gallery"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
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
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4">
        {displayedItems.map((item, index) => {
          const isFeatured = index === 0;

          return (
            <HomeGalleryCard
              key={item.id}
              item={item}
              index={index}
              isFeatured={isFeatured}
              onOpen={(openedItem, imageIndex) => setActiveImage({ item: openedItem, imageIndex })}
            />
          );
        })}
      </div>
      {displayedItems.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600" role="status">
          No gallery items match “{searchQuery}”.
        </p>
      )}

      {activeImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.item.title}
          onClick={() => setActiveImage(null)}
        >
          <div className="relative flex max-h-full w-full max-w-5xl flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="absolute right-1 top-1 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 sm:right-2 sm:top-2"
              aria-label="Close gallery image"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative flex h-[62vh] w-full items-center justify-center overflow-hidden rounded-2xl bg-black/30 sm:h-[70vh]">
              <img
                src={activeImage.item.images[activeImage.imageIndex] || activeImage.item.url}
                alt={`${activeImage.item.title} photo ${activeImage.imageIndex + 1}`}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                  const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                  fallback?.classList.remove('hidden');
                }}
                className="max-h-full max-w-full object-contain"
              />
              <div className="hidden h-64 w-full flex-col items-center justify-center p-6 text-center text-slate-300">
                <span className="mb-1 text-sm font-semibold">{activeImage.item.title}</span>
                <span className="text-xs text-slate-400">{activeImage.item.category}</span>
              </div>
              {activeImage.item.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage((current) => current && ({
                        ...current,
                        imageIndex: (current.imageIndex - 1 + current.item.images.length) % current.item.images.length,
                      }))
                    }
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 sm:left-4"
                    aria-label="Previous gallery photo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImage((current) => current && ({
                        ...current,
                        imageIndex: (current.imageIndex + 1) % current.item.images.length,
                      }))
                    }
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75 sm:right-4"
                    aria-label="Next gallery photo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {activeImage.item.images.length > 1 && (
              <div className="mt-3 flex max-w-full items-center justify-center gap-2 overflow-x-auto px-1">
                {activeImage.item.images.map((image, imageIndex) => (
                  <button
                    key={`${image}-${imageIndex}`}
                    type="button"
                    onClick={() => setActiveImage((current) => current && ({ ...current, imageIndex }))}
                    aria-label={`View photo ${imageIndex + 1}`}
                    aria-current={activeImage.imageIndex === imageIndex}
                    className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-black/40 transition sm:h-16 sm:w-24 ${
                      activeImage.imageIndex === imageIndex ? 'border-blue-400' : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
              <span className="truncate font-medium">{activeImage.item.title}</span>
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                {activeImage.item.category}
              </span>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
