import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Users,
  Compass,
} from 'lucide-react';
import { TRAVEL_PACKAGES, TravelPackage } from '../../data/travelsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { isSameDivision } from '../../services/firestore/divisions';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';
import { CmsPackage } from '../../types/cms';
import { cmsService } from '../../services/cmsService';

interface TravelsPackagesSectionProps {
  onSelectPackage: (pkg: TravelPackage) => void;
  onBookPackageDirect: (pkg: TravelPackage) => void;
}

export const TravelsPackagesSection: React.FC<TravelsPackagesSectionProps> = ({
  onSelectPackage,
  onBookPackageDirect,
}) => {
  const { services: rawServices } = useFirestoreDataContext();
  const [cmsPackages, setCmsPackages] = useState<CmsPackage[]>(() =>
    cmsService.getAll<CmsPackage>('packages', { divisionId: 'travels', status: 'active' })
  );

  useEffect(() => {
    const refreshPackages = () => {
      setCmsPackages(cmsService.getAll<CmsPackage>('packages', { divisionId: 'travels', status: 'active' }));
    };
    const unsubscribe = cmsService.subscribe('packages', refreshPackages);
    refreshPackages();
    return unsubscribe;
  }, []);

  const packages = useMemo<TravelPackage[]>(() => {
    if (cmsPackages.length > 0) {
      return cmsPackages.map((pkg) => ({
        id: pkg.id,
        title: pkg.name,
        destination: pkg.serviceTitle || 'Sri Lanka',
        duration: pkg.duration || 'Available on request',
        tagline: pkg.tagline || pkg.name,
        description: pkg.tagline || pkg.name,
        heroImage: '',
        gallery: [],
        highlights: pkg.features,
        price: `${pkg.currency} ${pkg.price.toLocaleString()}`,
        pricePerPerson: pkg.price,
        priceNote: pkg.billingCycle || 'Per package',
        availability: 'Available on request',
        difficulty: 'Moderate',
        tourType: 'Private Tour',
        badge: pkg.badge || 'Signature Itinerary',
        overview: pkg.tagline || pkg.name,
        itinerary: [],
        included: pkg.features,
        excluded: [],
        pricingTiers: [],
        faqs: [],
      }));
    }

    if (rawServices && rawServices.length > 0) {
      const travelServices = rawServices.filter(
        (s) => isSameDivision(s.division, 'travels') || isSameDivision((s as any).divisionId, 'travels')
      );
      if (travelServices.length > 0) {
        return travelServices.map((s) => ({
          id: s.id,
          title: s.name,
          destination: (s as any).destination || 'Sri Lanka',
          duration: (s as any).duration || (s as any).leadTime || '7 Days / 6 Nights',
          tagline: (s as any).tagline || s.description?.slice(0, 60) || '',
          description: s.description || '',
          heroImage: s.images && s.images.length > 0 ? s.images[0] : (s as any).imageUrl || '',
          gallery: s.images || [],
          highlights: s.features || ['Private Air-Conditioned Vehicle', 'Chauffeur Guide', 'Daily Breakfast'],
          price: typeof s.price === 'number' ? `$${s.price.toLocaleString()}` : String(s.price || '$850'),
          pricePerPerson: typeof s.price === 'number' ? s.price : 850,
          priceNote: (s as any).priceNote || 'Per Person Sharing',
          availability: (s as any).availability || 'Year-round daily departures',
          difficulty: 'Moderate',
          tourType: 'Private Tour',
          badge: s.badge || 'Signature Itinerary',
          overview: (s as any).overview || s.description || '',
          itinerary: (s as any).itinerary || [
            { day: 1, title: 'Arrival & Welcome', location: 'Negombo', description: 'Airport pickup and relaxation', meals: 'Dinner', stay: 'Luxury Beach Resort' },
            { day: 2, title: 'Cultural Triangle', location: 'Sigiriya', description: 'Climb Lion Rock fortress', meals: 'Breakfast, Dinner', stay: 'Eco Luxury Resort' },
          ],
          included: s.features || ['Air-conditioned vehicle with fuel and tolls', 'English-speaking tourist driver guide'],
          excluded: (s as any).excluded || ['International flights and visa fees', 'Entrance tickets to historical monuments'],
          pricingTiers: (s as any).pricingTiers || [{ tier: 'Standard (3-4 Star)', price: '$850 / person', description: 'Comfortable hotels' }],
          faqs: (s as any).faqs || [{ question: 'Can this itinerary be customized?', answer: 'Yes, all itineraries can be personalized.' }],
        }));
      }
    }
    return [];
  }, [cmsPackages, rawServices]);

  if (packages.length === 0) {
    return null;
  }

  return (
    <SectionContainer id="packages" background="subtle" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block font-mono">
            Handcrafted Signature Itineraries
          </Caption>
          <H2 className="text-slate-900">
            Curated Multi-Day Expeditions & Luxury Retreats
          </H2>
        </ScrollReveal>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="group rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
          >
            {/* Top Half: Image, Badges & Destination */}
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <img
                  src={pkg.heroImage}
                  alt={pkg.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Top Badge */}
                {pkg.badge && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="electric" size="sm" className="bg-[#0052FF]/90 text-white font-mono text-[10px]">
                      {pkg.badge}
                    </Badge>
                  </div>
                )}

                {/* Duration & Destination */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <span className="flex items-center gap-1 font-semibold bg-slate-950/60 backdrop-blur-md px-2.5 py-1 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>{pkg.duration}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold bg-slate-950/60 backdrop-blur-md px-2.5 py-1 rounded-md">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{pkg.destination}</span>
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors leading-snug">
                    {pkg.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">{pkg.tagline}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {pkg.description}
                </p>

                {/* Key Highlights Chips */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                    Package Highlights
                  </div>
                  {pkg.highlights.slice(0, 3).map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{hl}</span>
                    </div>
                  ))}
                </div>

                {/* Availability Notice */}
                <div className="pt-2 text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Availability: {pkg.availability}</span>
                </div>
              </div>
            </div>

            {/* Bottom Footer: Price & CTAs */}
            <div className="p-6 pt-0 border-t border-slate-100 mt-4 space-y-3">
              <div className="flex items-baseline justify-between pt-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    Starting from
                  </span>
                  <div className="font-mono text-2xl font-bold text-slate-900">
                    {pkg.price}
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 text-right">{pkg.priceNote}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectPackage(pkg)}
                  className="text-xs w-full"
                >
                  View Itinerary
                </Button>

                <Button
                  variant="electric"
                  size="sm"
                  onClick={() => onBookPackageDirect(pkg)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  className="text-xs w-full font-bold shadow-md shadow-blue-500/20"
                >
                  Book Package
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};
