import React, { useState, useMemo } from 'react';
import { servicePagePath } from '../../config/itemSeo';
import {
  Sparkles,
} from 'lucide-react';
import { SWSService, SWS_SERVICES } from '../../data/swsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { isSameDivision } from '../../services/firestore/divisions';
import { formatCurrency } from '../../utils/currency';
import { SWSServiceCard } from './SWSServiceCard';
import { SWSServiceDetailModal } from './SWSServiceDetailModal';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';
import { getImageSourceCandidates } from '../../utils/imageSources';
import { newestListedFirst } from '../../utils/listingOrder';
import { getServiceStartingPrice } from '../common/StartingPriceTag';
import { DivisionFilterEmptyState, useDivisionFilteredItems } from '../common/DivisionFilter';

interface SWSServicesSectionProps {
  onBookNow: (service?: SWSService) => void;
  onRequestQuote: (service?: SWSService) => void;
}

export const SWSServicesSection: React.FC<SWSServicesSectionProps> = ({
  onBookNow,
  onRequestQuote,
}) => {
  const {
    services: rawServices,
    categories: rawCategories,
    isDivisionServicesLoaded,
    divisionLoadErrors,
    loadDivisionData,
  } = useFirestoreDataContext();
  const [activeModalService, setActiveModalService] = useState<SWSService | null>(null);

  // Dynamically resolve services from Firestore if available
  const allServices = useMemo<SWSService[]>(() => {
    if (rawServices && rawServices.length > 0) {
      // Admin sort order, with newly added services shown first.
      const swsServices = newestListedFirst(rawServices
        .filter((s) => isSameDivision(s.division, 'sws') || isSameDivision((s as any).divisionId, 'sws'))
        .sort((a, b) => (a.order ?? (a as any).sortOrder ?? 0) - (b.order ?? (b as any).sortOrder ?? 0)));
      if (swsServices.length > 0) {
        return swsServices.map((s) => {
          const price = getServiceStartingPrice(s as unknown as Record<string, any>);
          return {
          id: s.id,
          imageAlt: (s as any).imageAlt,
          pagePath: servicePagePath(s),
          name: s.name,
          category: (s.category || (s as any).categoryId || 'General') as any,
          tagline: (s as any).tagline || s.description?.slice(0, 60) || '',
          description: s.description || '',
          detailedDescription: (s as any).detailedDescription || s.description || '',
          startingPrice: price !== null ? formatCurrency(price, 'LKR') : '',
          price,
          priceNote: (s as any).priceNote || 'Customized to event scale',
          imageUrl: getImageSourceCandidates(
            s.images,
            s.imageUrl,
            (s as unknown as Record<string, unknown>).image,
            (s as unknown as Record<string, unknown>).galleryImages,
            (s as unknown as Record<string, unknown>).media
          )[0] || '',
          gallery: getImageSourceCandidates(
            s.images,
            s.imageUrl,
            (s as unknown as Record<string, unknown>).image,
            (s as unknown as Record<string, unknown>).galleryImages,
            (s as unknown as Record<string, unknown>).media
          ).slice(0, 5),
          features: s.features || ['Professional Consultation', 'Dedicated Stage Crew'],
          specs: (s as any).specs || [],
          badge: s.badge || 'Featured Service',
        };
        });
      }
    }
    return [];
  }, [rawServices]);

  // Category ids/slugs from the Admin Portal resolve to their display names.
  const categoryLabels = useMemo(() => {
    const map = new Map<string, string>();
    (rawCategories || []).forEach((c) => {
      if (c.name) {
        map.set(c.id, c.name);
        map.set(c.slug, c.name);
        map.set(c.name.toLowerCase(), c.name);
      }
    });
    return map;
  }, [rawCategories]);

  // Search, category and price come from the page-wide filter bar.
  const filteredServices = useDivisionFilteredItems('sws-services', allServices, (service) => {
    const rawCat = (service.category || 'General').trim();
    return {
      title: service.name,
      category: categoryLabels.get(rawCat) || categoryLabels.get(rawCat.toLowerCase()) || rawCat,
      price: service.price,
      text: [service.description, ...service.features].join(' '),
    };
  }, [categoryLabels]);

  if (allServices.length === 0) {
    if (!isDivisionServicesLoaded('sws')) {
      if (divisionLoadErrors.sws) {
        return (
          <SectionContainer background="subtle" paddingY="xl">
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
      return (
        <SectionContainer background="subtle" paddingY="xl">
          <div className="animate-pulse space-y-8">
            <div className="space-y-3">
              <div className="h-3 w-28 rounded bg-slate-200" />
              <div className="h-8 w-64 max-w-full rounded-lg bg-slate-200" />
              <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-2/3 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-4/5 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>
      );
    }
    return null;
  }

  return (
    <SectionContainer id="services" background="white" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <H2 className="text-slate-900">
              Our Services
            </H2>
          </ScrollReveal>
        </div>
      </div>

      {/* Services Grid (All 13 Services Rendered) */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredServices.map((service) => (
            <SWSServiceCard
              key={service.id}
              service={service}
              onViewDetails={(s) => setActiveModalService(s)}
              onBookNow={(s) => onBookNow(s)}
              onRequestQuote={(s) => onRequestQuote(s)}
            />
          ))}
        </div>
      ) : (
        <DivisionFilterEmptyState label="services" />
      )}

      {/* Service Detail Modal with Gallery & Specs */}
      <SWSServiceDetailModal
        service={activeModalService}
        isOpen={!!activeModalService}
        onClose={() => setActiveModalService(null)}
        onBookNow={(s) => {
          setActiveModalService(null);
          onBookNow(s);
        }}
        onRequestQuote={(s) => {
          setActiveModalService(null);
          onRequestQuote(s);
        }}
      />
    </SectionContainer>
  );
};
