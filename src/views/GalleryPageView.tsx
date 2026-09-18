import React, { useMemo, useState, useEffect } from 'react';
import { Expand, X, MapPin, Sparkles, MessageCircle, ArrowLeft, Filter, Camera } from 'lucide-react';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, Body, Caption } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { openWhatsAppInquiry } from '../utils/whatsapp';
import { CallToActionSection } from '../components/home/CallToActionSection';

interface GalleryPageViewProps {
  onNavigate: (route: string) => void;
  initialSku?: string;
}

interface DisplayGalleryItem {
  id: string;
  sku: string;
  url: string;
  title: string;
  category: string;
  divisionId?: string;
  location?: string;
}

export const GalleryPageView: React.FC<GalleryPageViewProps> = ({ onNavigate, initialSku }) => {
  const { gallery } = useFirestoreDataContext();
  const [activeItem, setActiveItem] = useState<DisplayGalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const allItems: DisplayGalleryItem[] = useMemo(() => {
    return gallery
      .filter((item) => item.status !== 'hidden')
      .flatMap((item, itemIdx) => {
        const media = item.images?.length ? item.images : [item.mediaUrl || item.url || item.thumbnailUrl || ''];
        const itemDivision = (item as any).divisionId || (item as any).division || '';
        const skuPrefix = itemDivision ? String(itemDivision).toUpperCase() : 'MDV';
        return media.filter(Boolean).map((url, index) => {
          const itemSku = (item as any).sku || `GAL-${skuPrefix}-${String(itemIdx + 1).padStart(3, '0')}${index > 0 ? `-${index + 1}` : ''}`;
          return {
            id: `${item.id}-${index}`,
            sku: itemSku,
            url,
            title: item.title || 'Mahdev Production Showcase',
            category: item.category || item.tag || 'Mahdev Group',
            divisionId: itemDivision,
            location: (item as any).location || item.caption || 'Sri Lanka',
          };
        });
      });
  }, [gallery]);

  // Check URL or prop for initialSku to auto-open lightbox
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetSku = initialSku || params.get('sku') || params.get('id');
    if (targetSku && allItems.length > 0) {
      const clean = targetSku.trim().toLowerCase();
      const match = allItems.find(
        (i) => i.sku.toLowerCase() === clean || i.id.toLowerCase() === clean || i.title.toLowerCase().includes(clean)
      );
      if (match) {
        setActiveItem(match);
      }
    }
  }, [initialSku, allItems]);

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
    openWhatsAppInquiry({
      sku: item.sku,
      title: item.title,
      category: item.category,
      imageUrl: item.url,
      type: 'gallery',
      divisionName: item.divisionId || 'Mahdev Group',
    });
  };

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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <Expand className="w-3.5 h-3.5" />
                      View Details
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
                  Captured directly during live production by Mahdev’s certified specialists. Inquire to schedule a similar project or request full production logistics.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => handleInquire(activeItem)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Inquire via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
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
