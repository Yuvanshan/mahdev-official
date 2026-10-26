import React, { useState, useMemo } from 'react';
import { servicePagePath } from '../../config/itemSeo';
import {
  Camera,
  Film,
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
import { newestListedFirst } from '../../utils/listingOrder';
import { getServiceStartingPrice } from '../common/StartingPriceTag';
import { DivisionFilterEmptyState, useDivisionFilteredItems } from '../common/DivisionFilter';

interface U1ServicesSectionProps {
  onBookService: (service: U1Service) => void;
}

const U1_CATEGORY_LABELS: Record<U1Service['category'], string> = {
  media: 'Cinema & Coverage',
  portrait: 'Portraits & Studio',
  commercial: 'Commercial & Product',
  print: 'Albums & Frames',
};

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
  const [activeModalService, setActiveModalService] = useState<U1Service | null>(null);

  const allServices = useMemo<U1Service[]>(() => {
    if (rawServices && rawServices.length > 0) {
      // Admin sort order, with newly added services shown first.
      const u1Services = newestListedFirst(rawServices
        .filter((s) => isSameDivision(s.division, 'u1') || isSameDivision((s as any).divisionId, 'u1'))
        .sort((a, b) => (a.order ?? (a as any).sortOrder ?? 0) - (b.order ?? (b as any).sortOrder ?? 0)));
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
          const price = getServiceStartingPrice(s as unknown as Record<string, any>);
          return {
            id: s.id,
          pagePath: servicePagePath(s),
            name: s.name,
            category: (((s as any).category && (s as any).category !== 'all' ? (s as any).category : 'media') as 'media' | 'portrait' | 'commercial' | 'print'),
            tagline: (s as any).tagline || s.description?.slice(0, 60) || '',
            description: s.description || '',
            detailedDescription: (s as any).detailedDescription || s.description || '',
            startingPrice: price !== null ? formatCurrency(price, 'LKR') : '',
            price,
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

  // Search, category and price come from the page-wide filter bar.
  const filteredServices = useDivisionFilteredItems('u1-services', allServices, (service) => ({
    title: service.name,
    category: U1_CATEGORY_LABELS[service.category] || service.category,
    price: service.price,
    text: [service.tagline, service.description].join(' '),
  }));

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
      </div>

      {/* Services Grid (Image-First Cards) */}
      {filteredServices.length === 0 && <DivisionFilterEmptyState label="services" />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cards show image, title, starting price and View; details and booking are in the modal. */}
        {filteredServices.map((service) => (
          <ServiceTile
            key={service.id}
            title={service.name}
            images={(service.gallery?.length ? service.gallery : [service.imageUrl]).filter(Boolean) as string[]}
            onView={() => setActiveModalService(service)}
            href={service.pagePath}
            price={service.price}
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
