import React, { useState, useMemo, useEffect } from 'react';
import {
  Maximize2,
  MapPin,
  Share2,
  MessageCircle,
  Check,
} from 'lucide-react';
import { U1PortfolioItem } from '../../data/u1Data';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { GallerySectionShimmer } from '../common/GallerySectionShimmer';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';
import { shareMediaAsset, inquireMediaAssetOnWhatsApp } from '../../utils/mediaShare';
import { useAutoSlideImage } from '../../hooks/useAutoSlideImage';
import { ServiceDetailsModal, wrapIndex } from '../services/ServiceDetailsModal';
import { StartingPriceTag, getStartingPriceDetails } from '../common/StartingPriceTag';
import { DivisionFilterEmptyState, useDivisionFilteredItems } from '../common/DivisionFilter';
import { newestListedFirst } from '../../utils/listingOrder';
import { CrossfadeImage } from '../common/CrossfadeImage';
import { getU1ImageAlt } from '../../data/u1LocalSeo';
import { ImageWatermark } from '../common/ImageWatermark';
import { BRANCH_LOCATION_LABEL, branchLocationTag } from '../../config/imageAlt';

const U1PortfolioCardImage: React.FC<{ item: U1PortfolioItem }> = ({ item }) => {
  const images = (item.images?.length ? item.images : [item.imageUrl]).filter(Boolean);
  const { activeIndex, containerRef } = useAutoSlideImage(images.length);

  return (
    <div ref={containerRef} className="relative aspect-[4/3] overflow-hidden bg-slate-100">
      <CrossfadeImage
        src={images[activeIndex] || item.imageUrl}
        alt={getU1ImageAlt(item.title, item.category)}
        className="absolute inset-0"
        objectFit="contain"
        imageClassName="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <ImageWatermark label="U1 STUDIO" />
      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1">
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


export const U1PortfolioSection: React.FC = () => {
  const {
    portfolio: rawPortfolio,
    gallery: rawGallery,
    mediaAssets,
    isInitialLoading,
    isDivisionGalleryLoaded,
    divisionLoadErrors,
    loadDivisionData,
    loadMediaAssets,
  } = useFirestoreDataContext();
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [cardCopiedId, setCardCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadMediaAssets().catch((error) => {
      console.error('[U1PortfolioSection] Could not load media assets:', error);
    });
  }, [loadMediaAssets]);

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
          images: (p.images || [p.imageUrl]).filter(Boolean).slice(0, 3),
          location: branchLocationTag(p.location),
          year: '2026',
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
            images: ((g as any).images || [galUrl]).filter(Boolean).slice(0, 3),
            location: BRANCH_LOCATION_LABEL,
            year: '2026',
            description: g.caption || (g as any).description || '',
            client: 'U1 Gallery Collection',
            tags: g.tags || [],
            price: g.price,
            listedAt: g.listedAt,
          });
        }
      });
    }

    // 3. From media_assets collection (Directly binds user-uploaded media assets)
    if (mediaAssets && mediaAssets.length > 0) {
      // U1 media only: media assigned to another division never shows here (keeps the
      // page's categories to U1's own); media with no division is matched by U1 tags.
      const u1RelevantMedia = mediaAssets.filter((m) => {
        if (isU1(m.division) || isU1(m.divisionId)) return true;
        if (m.division || m.divisionId) return false;
        const tags = (m.tags || []).map((t) => t.toLowerCase());
        return tags.some((t) => ['u1', 'u1-studio', 'studio', 'photo', 'photography', 'cinema', 'frame', 'frames', '12x18', 'print', 'album', 'portrait', 'wedding'].includes(t));
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
            images: [m.url],
            location: m.dimensions ? `Master Format • ${m.dimensions}` : 'U1 Media Asset',
            year: '2026',
            description: (m as any).description || (m.tags?.length ? `Tags: ${m.tags.join(', ')}` : 'Fine Art Studio Production'),
            client: 'U1 Studio Master Asset',
            tags: m.tags || [],
          });
        }
      });
    }

    // Newly added gallery items first; everything else keeps its current order.
    return newestListedFirst(items);
  }, [rawPortfolio, rawGallery, mediaAssets]);

  // Deep-link SKU or mediaSku support: auto-open item in lightbox if directed here
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetSku = params.get('mediaSku') || params.get('sku') || params.get('id');
    if (targetSku && portfolioItems.length > 0) {
      const clean = targetSku.trim().toLowerCase();
      const idx = portfolioItems.findIndex(
        (item) =>
          item.id.toLowerCase() === clean ||
          item.id.toLowerCase().includes(clean) ||
          clean.includes(item.id.toLowerCase()) ||
          item.title.toLowerCase().includes(clean)
      );
      if (idx !== -1) {
        setActiveLightboxIndex(idx);
      }
    }
  }, [portfolioItems]);


  // Search, category and price come from the page-wide filter bar.
  const filteredItems = useDivisionFilteredItems('u1-portfolio', portfolioItems, (item) => ({
    title: item.title,
    category: item.category,
    price: item.price,
    text: [item.client, item.location, item.year, item.description, ...(item.tags || [])].join(' '),
  }));

  if (portfolioItems.length === 0) {
    if (isInitialLoading || !isDivisionGalleryLoaded('u1')) {
      if (divisionLoadErrors.u1) {
        return (
          <SectionContainer background="subtle" paddingY="xl">
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>{divisionLoadErrors.u1}</span>
              <button
                type="button"
                onClick={() => void loadDivisionData('u1', true)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold hover:bg-amber-100"
              >
                Retry loading
              </button>
            </div>
          </SectionContainer>
        );
      }
      return <GallerySectionShimmer divisionName="U1 Studio" />;
    }
    return null;
  }

  const activeItem = activeLightboxIndex !== null ? filteredItems[activeLightboxIndex] : null;

  return (
    <SectionContainer id="portfolio" background="subtle" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <H2 className="text-slate-900">
              The U1 Visual Portfolio
            </H2>
          </ScrollReveal>
        </div>

      </div>

      {/* Visual Masonry / Dynamic Grid */}
      {filteredItems.length === 0 && <DivisionFilterEmptyState label="portfolio items" />}
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
            <div className="relative">
              <U1PortfolioCardImage item={item} />

              {/* Top Action Icons: Inquire on WhatsApp, Share, Zoom */}
              <div className="absolute right-3 top-3 flex items-center gap-1.5">
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
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition-transform hover:scale-105"
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
            </div>

            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-display text-sm font-semibold text-slate-900 sm:text-base">
                  {item.title}
                </h3>
                <Badge variant="default" size="sm" className="shrink-0 bg-blue-50 text-blue-700">
                  {item.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3 shrink-0" />
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

      {/* Same pop-up as services: large image, swipe/arrow keys, WhatsApp, Share. */}
      <ServiceDetailsModal
        service={activeItem ? {
          title: activeItem.title,
          images: activeItem.images?.length ? activeItem.images : [activeItem.imageUrl],
          subtitle: [activeItem.category, activeItem.client, activeItem.location, activeItem.year].filter(Boolean).join(' · '),
          description: activeItem.description,
          divisionName: 'U1 Studio',
          ...getStartingPriceDetails(activeItem.price),
          sections: activeItem.cameraMetadata ? [{
            label: 'Shot on',
            items: [
              activeItem.cameraMetadata.camera,
              [activeItem.cameraMetadata.lens, activeItem.cameraMetadata.focalLength, activeItem.cameraMetadata.aperture]
                .filter(Boolean).join(' · '),
            ].filter(Boolean),
          }] : undefined,
        } : null}
        watermarkLabel="U1 STUDIO"
        onClose={() => setActiveLightboxIndex(null)}
        itemNavigation={activeLightboxIndex !== null && filteredItems.length > 1 ? {
          onPrevious: () => setActiveLightboxIndex((index) => wrapIndex(index ?? 0, -1, filteredItems.length)),
          onNext: () => setActiveLightboxIndex((index) => wrapIndex(index ?? 0, 1, filteredItems.length)),
          positionLabel: `${activeLightboxIndex + 1} of ${filteredItems.length}`,
        } : undefined}
        whatsappInquiry={activeItem ? {
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
              division: 'u1',
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
