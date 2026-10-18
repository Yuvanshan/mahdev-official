import React, { useState, useMemo } from 'react';
import {
  Camera,
  Film,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  Heart,
  Palette,
  Frame,
} from 'lucide-react';
import { U1_SERVICES, U1Service } from '../../data/u1Data';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ServiceTile } from '../services/ServiceTile';
import { ServicesSectionShimmer } from '../common/ServicesSectionShimmer';
import { isSameDivision } from '../../services/firestore/divisions';
import { formatCurrency } from '../../utils/currency';
import { U1ServiceDetailModal } from './U1ServiceDetailModal';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';
import { useAutoSlideImage } from '../../hooks/useAutoSlideImage';
import { CrossfadeImage } from '../common/CrossfadeImage';
import { ImageWatermark } from '../common/ImageWatermark';
import { getImageSourceCandidates } from '../../utils/imageSources';

interface U1ServicesSectionProps {
  onBookService: (service: U1Service) => void;
}

type U1FilterCategory = 'all' | 'media' | 'portrait' | 'commercial' | 'print';

const U1ServiceCardImage: React.FC<{ service: U1Service }> = ({ service }) => {
  const images = (service.gallery?.length ? service.gallery : [service.imageUrl]).filter(Boolean);
  const { activeIndex, containerRef } = useAutoSlideImage(images.length);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[16/10] cursor-pointer overflow-hidden bg-slate-950"
    >
      <CrossfadeImage
        src={images[activeIndex] || service.imageUrl}
        alt={service.name}
        className="absolute inset-0"
        imageClassName="transition-transform duration-700 group-hover:scale-105"
      />
      <ImageWatermark label="U1 STUDIO" />
      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1" aria-hidden="true">
          {images.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index ? 'w-3.5 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const U1ServicesSection: React.FC<U1ServicesSectionProps> = ({
  onBookService,
}) => {
  const {
    services: rawServices,
    isInitialLoading,
    isDivisionServicesLoaded,
    divisionLoadErrors,
    loadDivisionData,
  } = useFirestoreDataContext();
  const [selectedCategory, setSelectedCategory] = useState<U1FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalService, setActiveModalService] = useState<U1Service | null>(null);

  const allServices = useMemo<U1Service[]>(() => {
    if (rawServices && rawServices.length > 0) {
      const u1Services = rawServices
        .filter((s) => isSameDivision(s.division, 'u1') || isSameDivision((s as any).divisionId, 'u1'))
        .sort((a, b) => (a.order ?? (a as any).sortOrder ?? 0) - (b.order ?? (b as any).sortOrder ?? 0));
      if (u1Services.length > 0) {
        return u1Services.map((s) => {
          const raw = s as typeof s & Record<string, unknown>;
          const images = getImageSourceCandidates(
            s.images,
            s.imageUrl,
            raw.image,
            raw.galleryImages,
            raw.media,
            raw.thumbnailUrl,
            raw.url
          );
          return {
            id: s.id,
            name: s.name,
            category: (((s as any).category && (s as any).category !== 'all' ? (s as any).category : 'media') as 'media' | 'portrait' | 'commercial' | 'print'),
            tagline: (s as any).tagline || s.description?.slice(0, 60) || '',
            description: s.description || '',
            detailedDescription: (s as any).detailedDescription || s.description || '',
            startingPrice: typeof s.price === 'number' || typeof (s as any).startingPrice === 'number'
              ? formatCurrency(s.price || (s as any).startingPrice || 0, 'LKR')
              : String(s.price || 'Rs. 50,000'),
            turnaround: (s as any).turnaround || (s as any).leadTime || '7-10 Days',
            deliverables: (s as any).deliverables || s.features || ['High-Res Digital Master Gallery'],
            imageUrl: images[0] || '',
            gallery: images,
            badge: s.badge || 'Popular Studio Package',
            popular: (s as any).popular ?? true,
          };
        });
      }
    }
    return [];
  }, [rawServices]);

  if (allServices.length === 0) {
    if (isInitialLoading || !isDivisionServicesLoaded('u1')) {
      if (divisionLoadErrors.u1) {
        return (
          <SectionContainer background="white" paddingY="xl">
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
      return <ServicesSectionShimmer divisionName="U1 Studio" />;
    }
    return null;
  }

  const categories: { id: U1FilterCategory; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: `All ${allServices.length} Services`, count: allServices.length, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'media', label: 'Cinema & Coverage', count: allServices.filter((s) => s.category === 'media').length, icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'portrait', label: 'Portraits & Studio', count: allServices.filter((s) => s.category === 'portrait').length, icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'commercial', label: 'Commercial & Product', count: allServices.filter((s) => s.category === 'commercial').length, icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'print', label: 'Albums & Frames', count: allServices.filter((s) => s.category === 'print').length, icon: <Frame className="w-3.5 h-3.5" /> },
  ];

  const filteredServices = allServices.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SectionContainer background="white" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <H2 className="text-slate-900">
              Visual Craftsmanship & Creative Production
            </H2>
          </ScrollReveal>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search studio services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Services Grid (Image-First Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cards show only image, title and View; details and booking are in the modal. */}
        {filteredServices.map((service) => (
          <ServiceTile
            key={service.id}
            title={service.name}
            images={(service.gallery?.length ? service.gallery : [service.imageUrl]).filter(Boolean) as string[]}
            onView={() => setActiveModalService(service)}
          />
        ))}
      </div>

      {/* Service Detail Modal */}
      <U1ServiceDetailModal
        service={activeModalService}
        isOpen={!!activeModalService}
        onClose={() => setActiveModalService(null)}
        onBookNow={(s) => {
          setActiveModalService(null);
          onBookService(s);
        }}
      />
    </SectionContainer>
  );
};
