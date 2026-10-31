import React, { useState, useMemo } from 'react';
import {
  MapPin,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { SWSGalleryItem } from '../../data/swsData';
import { getSwsImageAlt } from '../../data/swsLocalSeo';
import { branchLocationTag, preferSavedAlt } from '../../config/imageAlt';
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
import { ServiceDetailsModal, wrapIndex } from '../services/ServiceDetailsModal';
import { CrossfadeImage } from '../common/CrossfadeImage';
import { ImageWatermark } from '../common/ImageWatermark';
import { StartingPriceTag, getStartingPriceDetails, getStartingPriceInquiryText } from '../common/StartingPriceTag';
import { DivisionFilterEmptyState, useDivisionFilteredItems } from '../common/DivisionFilter';

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
        objectFit="cover"
        imageClassName="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
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
  const { gallery: rawGallery, isDivisionGalleryLoaded, divisionLoadErrors, loadDivisionData } = useFirestoreDataContext();
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

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
            imageAlt: (g as any).imageAlt,
            title: g.title,
            category: cat as any,
            imageUrl: images[0] || (g as any).imageUrl || (g as any).url || '',
            images: images,
            location: branchLocationTag((g as any).location),
            year: !galleryYear || String(galleryYear) === '2024' ? '2026' : String(galleryYear),
            description: (g as any).description || (g as any).caption || '',
            tags: (g as any).tags || [cat],
            price: g.price,
          };
        });
      }
    }
    return [];
  }, [rawGallery]);


  // Search, category and price come from the page-wide filter bar.
  const filteredItems = useDivisionFilteredItems('sws-gallery', galleryItems, (item) => ({
    title: item.title,
    category: item.category,
    price: item.price,
    text: [item.location, item.year, item.description, ...item.tags].join(' '),
  }));

  if (galleryItems.length === 0 && !isDivisionGalleryLoaded('sws')) {
    if (divisionLoadErrors.sws) {
      return (
        <SectionContainer background="white" paddingY="xl">
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{divisionLoadErrors.sws}</span>
            <button
              type="button"
              onClick={() => void loadDivisionData('sws', true)}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold hover:bg-amber-100"
            >
              Retry loading
            </button>
          </div>
        </SectionContainer>
      );
    }
    return <GallerySectionShimmer divisionName="SWS" />;
  }

  if (galleryItems.length === 0) {
    return null;
  }

  const activeItem = activeLightboxIndex !== null ? filteredItems[activeLightboxIndex] : null;

  return (
    <SectionContainer id="gallery" background="white" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <H2 className="font-editorial text-slate-900">Cinematic Gallery of Live Productions</H2>
          </ScrollReveal>
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
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveLightboxIndex(index);
              }
            }}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <SWSGalleryCardImage
                images={(item.images?.length ? item.images : [item.imageUrl]).filter(Boolean).slice(0, 3)}
                alt={preferSavedAlt(item.imageAlt, getSwsImageAlt(item.title, item.category))}
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
                      price: getStartingPriceInquiryText(item.price),
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
              <StartingPriceTag price={item.price} />
            </div>
          </div>
        ))}
      </div>
      {filteredItems.length === 0 && <DivisionFilterEmptyState label="gallery items" />}

      {/* Same pop-up as services: large image, swipe/arrow keys, WhatsApp, Share. */}
      <ServiceDetailsModal
        service={activeItem ? {
          title: activeItem.title,
          images: activeItem.images?.length ? activeItem.images : [activeItem.imageUrl],
          subtitle: [activeItem.category, activeItem.location, activeItem.year].filter(Boolean).join(' · '),
          description: activeItem.description,
          divisionName: 'SWS Event Management',
          ...getStartingPriceDetails(activeItem.price),
        } : null}
        watermarkLabel="SWS EVENT MANAGEMENT"
        onClose={() => setActiveLightboxIndex(null)}
        bookOnline={activeItem ? { kind: 'gallery', id: activeItem.id, price: activeItem.price, divisionId: 'sws' } : undefined}
        itemNavigation={activeLightboxIndex !== null && filteredItems.length > 1 ? {
          onPrevious: () => setActiveLightboxIndex((index) => wrapIndex(index ?? 0, -1, filteredItems.length)),
          onNext: () => setActiveLightboxIndex((index) => wrapIndex(index ?? 0, 1, filteredItems.length)),
          positionLabel: `${activeLightboxIndex + 1} of ${filteredItems.length}`,
        } : undefined}
        whatsappInquiry={activeItem ? {
          sku: `SWS-${activeItem.id.toUpperCase()}`,
          itemId: activeItem.id,
          category: activeItem.category,
          location: activeItem.location,
          type: 'gallery',
        } : undefined}
        actions={activeItem ? [{
          label: shareToast || 'Share photo',
          keepOpen: true,
          onClick: async (imageIndex) => {
            const res = await shareMediaAsset({
              id: activeItem.id,
              title: activeItem.title,
              url: activeItem.images?.[imageIndex] || activeItem.imageUrl,
              category: activeItem.category,
              division: 'sws',
              description: activeItem.description,
            });
            setShareToast(res.message);
            setTimeout(() => setShareToast(null), 2500);
          },
        }] : []}
      />
    </SectionContainer>
  );
};
