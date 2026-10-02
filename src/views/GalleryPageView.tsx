import React, { useMemo, useState, useEffect } from 'react';
import { Expand, X, MapPin, Sparkles, MessageCircle, ArrowLeft, Filter, Camera, Share2, Check } from 'lucide-react';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, Body, Caption } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { openWhatsAppInquiry, deriveLookupSku } from '../utils/whatsapp';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { shareMediaAsset, inquireMediaAssetOnWhatsApp } from '../utils/mediaShare';
import { SWS_GALLERY_ITEMS } from '../data/swsData';
import { U1_PORTFOLIO_ITEMS } from '../data/u1Data';
import {
  DisplayGalleryItem,
  matchGalleryItem,
  resolveMediaAssetSku,
  synthesizeInquiryItemFromParams,
} from '../utils/itemLookup';
import { InquiredItemSpotlight } from '../components/common/InquiredItemSpotlight';
import { InquiredItemShimmer } from '../components/common/InquiredItemShimmer';
import { InquiryItemNotFound } from '../components/common/InquiryItemNotFound';

interface GalleryPageViewProps {
  onNavigate: (route: string) => void;
  initialSku?: string;
}

export const GalleryPageView: React.FC<GalleryPageViewProps> = ({ onNavigate, initialSku }) => {
  const { gallery, mediaAssets, isInitialLoading, isFetching, isLiveHydrated } = useFirestoreDataContext();
  const [activeItem, setActiveItem] = useState<DisplayGalleryItem | null>(null);
  const [inquiredItem, setInquiredItem] = useState<DisplayGalleryItem | null>(null);
  const [showFullGallery, setShowFullGallery] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Read target query from prop or URL
  const targetQuery = useMemo(() => {
    if (initialSku) return initialSku.trim();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q =
        params.get('sku') ||
        params.get('id') ||
        params.get('item') ||
        params.get('title') ||
        params.get('name');
      if (q && q.trim()) return q.trim();
    }
    return null;
  }, [initialSku]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const allItems: DisplayGalleryItem[] = useMemo(() => {
    const items: DisplayGalleryItem[] = [];
    const seenUrls = new Set<string>();

    // 1. From standard Firestore gallery collection
    if (gallery && gallery.length > 0) {
      gallery
        .filter((item) => item.status !== 'hidden')
        .forEach((item, itemIdx) => {
          const media = item.images?.length ? item.images : [item.mediaUrl || item.url || item.thumbnailUrl || ''];
          const itemDivision = (item as any).divisionId || (item as any).division || '';
          const skuPrefix = itemDivision ? String(itemDivision).toUpperCase() : 'MDV';
          media.filter(Boolean).forEach((url, index) => {
            if (!seenUrls.has(url)) {
              seenUrls.add(url);
              const itemSku = (item as any).sku || `GAL-${skuPrefix}-${String(itemIdx + 1).padStart(3, '0')}${index > 0 ? `-${index + 1}` : ''}`;
              items.push({
                id: `${item.id}-${index}`,
                sku: itemSku,
                url,
                title: item.title || 'Mahdev Production Showcase',
                category: item.category || item.tag || 'Mahdev Group',
                divisionId: itemDivision,
                divisionName: itemDivision,
                location: (item as any).location || item.caption || 'Sri Lanka',
                description: (item as any).description,
              });
            }
          });
        });
    }

    // 2. From Firestore mediaAssets collection
    if (mediaAssets && mediaAssets.length > 0) {
      mediaAssets
        .filter((m) => m.url && m.title)
        .forEach((m, idx) => {
          if (!seenUrls.has(m.url)) {
            seenUrls.add(m.url);
            const div = m.divisionId || m.division || 'U1';
            const sku = resolveMediaAssetSku(m);
            items.push({
              id: m.id || `med-${idx}`,
              sku,
              url: m.url,
              title: m.title,
              category: m.category || 'Studio Media Asset',
              divisionId: div,
              divisionName: div,
              location: m.dimensions ? `Master Format: ${m.dimensions}` : 'Production Asset',
              description: (m as any).description,
              dimensions: m.dimensions,
            });
          }
        });
    }

    // 3. From SWS Event Management Gallery dataset
    if (SWS_GALLERY_ITEMS && SWS_GALLERY_ITEMS.length > 0) {
      SWS_GALLERY_ITEMS.forEach((sws) => {
        if (!seenUrls.has(sws.imageUrl)) {
          seenUrls.add(sws.imageUrl);
          items.push({
            id: sws.id,
            sku: `SWS-${sws.id.toUpperCase()}`,
            url: sws.imageUrl,
            title: sws.title,
            category: sws.category,
            divisionId: 'sws',
            divisionName: 'SWS Event Management',
            location: sws.location,
            description: sws.description,
            year: sws.year,
            tags: sws.tags,
          });
        }
      });
    }

    // 4. From U1 Cinema & Studio Portfolio dataset
    if (U1_PORTFOLIO_ITEMS && U1_PORTFOLIO_ITEMS.length > 0) {
      U1_PORTFOLIO_ITEMS.forEach((u1) => {
        if (!seenUrls.has(u1.imageUrl)) {
          seenUrls.add(u1.imageUrl);
          items.push({
            id: u1.id,
            sku: `U1-${u1.id.toUpperCase()}`,
            url: u1.imageUrl,
            title: u1.title,
            category: u1.category,
            divisionId: 'u1',
            divisionName: 'U1 Cinema & Studio',
            location: u1.location,
            description: u1.description,
            year: u1.year,
            tags: u1.tags,
          });
        }
      });
    }

    // 5. Travels Scenic Stories
    const travelPhotos = [
      { id: 'trv-sigiriya', title: 'Sigiriya Rock Fortress at Dawn', url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80', location: 'Cultural Triangle, Sri Lanka' },
      { id: 'trv-ella', title: 'Nine Arch Bridge & Mist-Covered Tea Valleys', url: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80', location: 'Ella Highlands, Sri Lanka' },
      { id: 'trv-yala', title: 'Sri Lankan Wild Leopard in Yala', url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80', location: 'Yala National Park, Sri Lanka' },
      { id: 'trv-mirissa', title: 'Mirissa Golden Beach & Palm Tree Grove', url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80', location: 'Southern Coast, Sri Lanka' },
    ];
    travelPhotos.forEach((tp) => {
      if (!seenUrls.has(tp.url)) {
        seenUrls.add(tp.url);
        items.push({
          id: tp.id,
          sku: `TRV-${tp.id.toUpperCase()}`,
          url: tp.url,
          title: tp.title,
          category: 'Travels & Safari',
          divisionId: 'travels',
          divisionName: 'Mahdev Travels',
          location: tp.location,
          description: `Exclusive wildlife & heritage expedition moment by Mahdev Travels in ${tp.location}.`,
        });
      }
    });

    return items;
  }, [gallery, mediaAssets]);

  // Check URL or prop for targetQuery to resolve customer-inquired item
  useEffect(() => {
    if (!targetQuery) return;
    if (allItems.length > 0) {
      let match = matchGalleryItem(allItems, targetQuery);
      if (!match && typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const titleParam = params.get('title') || params.get('name');
        if (titleParam) {
          match = matchGalleryItem(allItems, titleParam);
        }
      }
      if (match) {
        setInquiredItem(match);
        setActiveItem(match);
        setShowFullGallery(false);
      } else if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const fallback = synthesizeInquiryItemFromParams(params);
        if (fallback) {
          setInquiredItem(fallback);
          setActiveItem(fallback);
          setShowFullGallery(false);
        }
      }
    }
  }, [targetQuery, allItems]);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    allItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['All', ...Array.from(set)];
  }, [allItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [allItems, selectedCategory, searchQuery]);

  const handleInquire = (item: DisplayGalleryItem) => {
    inquireMediaAssetOnWhatsApp({
      sku: item.sku,
      title: item.title,
      category: item.category,
      imageUrl: item.url,
      type: 'gallery',
      divisionName: item.divisionName || item.divisionId || 'Mahdev Group',
      description: item.description,
      id: item.id,
      url: item.url,
      division: item.divisionId,
    });
  };

  // If customer is navigating to a specific inquired item from a link:
  if (targetQuery && !showFullGallery) {
    // 1. Display shimmer while Firestore data is actively loading
    if ((isInitialLoading || !isLiveHydrated) && allItems.length === 0) {
      return (
        <div className="min-h-screen bg-slate-50 pt-20">
          <InquiredItemShimmer />
        </div>
      );
    }

    // 2. Display exact item retrieved from Firestore
    if (inquiredItem) {
      return (
        <div className="min-h-screen bg-slate-50 pt-20">
          <InquiredItemSpotlight
            item={inquiredItem}
            totalGalleryCount={allItems.length}
            onClearSingleItemMode={() => setShowFullGallery(true)}
            onNavigate={onNavigate}
          />
          <CallToActionSection />
        </div>
      );
    }

    // 3. Document not found in Firestore: Show clean not found state, NEVER fake data
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <InquiryItemNotFound
          query={targetQuery}
          onBrowseAll={() => setShowFullGallery(true)}
          onNavigate={onNavigate}
        />
        <CallToActionSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Header Banner */}
      <div className="border-b border-slate-200 bg-white py-10 sm:py-14">
        <SectionContainer background="white" paddingY="none">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Home
                </button>
                <span className="text-slate-300">•</span>
                <Badge variant="electric" size="sm">
                  Media & Portfolio Archive
                </Badge>
              </div>
              <H1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 tracking-tight mb-3">
                Visual Gallery & Live Archives
              </H1>
              <Body className="text-slate-600 text-sm sm:text-base">
                Explore real project snapshots, backstage captures, and high-resolution media across all five Mahdev divisions. Click any photo to inquire or request tailored production packages.
              </Body>
            </div>

            {/* Filter Pill List */}
            <div className="flex flex-wrap gap-1.5 max-w-md">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedCategory === category
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </SectionContainer>
      </div>

      {/* Main Grid */}
      <SectionContainer background="subtle" paddingY="xl">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-slate-900 text-base mb-1">No Moments Found</h3>
            <p className="text-xs text-slate-500 mb-4">No gallery items match the current category or search criteria.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 sm:p-3">
                    {/* Top right quick actions */}
                    <div className="flex items-center justify-end gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInquire(item);
                        }}
                        className="w-7 h-7 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer"
                        title="Inquire on WhatsApp"
                        aria-label="Inquire on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const res = await shareMediaAsset({
                            id: item.id,
                            title: item.title,
                            url: item.url,
                            category: item.category,
                            division: item.divisionId,
                            sku: item.sku,
                            description: item.description,
                          });
                          setShareFeedback(res.message);
                          setTimeout(() => setShareFeedback(null), 2500);
                        }}
                        className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer"
                        title="Share Asset"
                        aria-label="Share Asset"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full self-start">
                      <Expand className="w-3.5 h-3.5" />
                      View Frame
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-mono font-semibold text-blue-600">{item.sku}</span>
                    <span className="truncate max-w-[120px]">{item.category}</span>
                  </div>
                  <h4 className="font-display font-medium text-xs sm:text-sm text-slate-900 truncate">
                    {item.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionContainer>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/75 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image Section */}
            <div className="md:w-3/5 bg-black flex items-center justify-center overflow-hidden max-h-[60vh] md:max-h-[80vh]">
              <img
                src={activeItem.url}
                alt={activeItem.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Info Section */}
            <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="electric" size="sm">
                    {activeItem.category}
                  </Badge>
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {activeItem.sku}
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  {activeItem.title}
                </h3>
                {activeItem.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeItem.location}</span>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeItem.description ||
                    'Captured directly during live production by Mahdev’s certified specialists. Inquire on WhatsApp to book a shoot or request licensing logistics.'}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => handleInquire(activeItem)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20bd5a] transition-colors shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  Inquire via WhatsApp
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const res = await shareMediaAsset({
                      id: activeItem.id,
                      title: activeItem.title,
                      url: activeItem.url,
                      category: activeItem.category,
                      division: activeItem.divisionId,
                      sku: activeItem.sku,
                      description: activeItem.description,
                    });
                    setShareFeedback(res.message);
                    setTimeout(() => setShareFeedback(null), 2500);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {shareFeedback ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">{shareFeedback}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-slate-500" />
                      <span>Share Media Asset</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="w-full rounded-xl border border-transparent px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/portfolio')}
      />
    </div>
  );
};
