import React, { useMemo } from 'react';
import { servicePagePath } from '../../config/itemSeo';
import {
  Compass,
  Plane,
  Building2,
  Users,
  FileCheck,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ServiceTile } from '../services/ServiceTile';
import { ServiceDetailsModal, toServiceDetails } from '../services/ServiceDetailsModal';
import { isSameDivision } from '../../services/firestore/divisions';
import { getServiceStartingPrice } from '../common/StartingPriceTag';
import { DivisionFilterEmptyState, useDivisionFilteredItems } from '../common/DivisionFilter';
import { getImageAlt } from '../../config/imageAlt';

export const TravelsServicesSection: React.FC = () => {
  const { services: rawServices } = useFirestoreDataContext();
  const [selectedService, setSelectedService] = React.useState<Record<string, any> | null>(null);

  const defaultServices = [
    {
      title: 'Custom Itinerary Design',
      desc: 'Bespoke route planning mapped around your exact interests—photography, culinary, wellness, surfing, architecture, or wildlife.',
      icon: <Compass className="w-5 h-5 text-blue-600" />,
    },
    {
      title: 'Bandaranaike Airport VIP Transfers',
      desc: 'Meet-and-greet curbside concierge, luggage handling, and direct express highway transit to your resort in Colombo, Negombo, or Galle.',
      icon: <Plane className="w-5 h-5 text-sky-600" />,
    },
    {
      title: 'Boutique & Heritage Hotel Bookings',
      desc: 'Preferred rates and room upgrades at Sri Lanka’s finest luxury resorts, colonial tea bungalows, and wild tented safari camps.',
      icon: <Building2 className="w-5 h-5 text-amber-600" />,
    },
    {
      title: 'National Multilingual Tourist Guides',
      desc: 'SLTDA-licensed English, German, French, Mandarin, and Russian speaking lecturer guides with deep archaeological expertise.',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
    },
    {
      title: 'Visa & ETA Concierge Advisory',
      desc: 'Assistance with online Electronic Travel Authorization (ETA), fast-track immigration protocols, and customs clearance.',
      icon: <FileCheck className="w-5 h-5 text-indigo-600" />,
    },
    {
      title: 'Helicopter & Scenic Charters',
      desc: 'Direct point-to-point luxury Airbus helicopter charters connecting Colombo directly to Sigiriya, Castlereagh Lake, or Yala in 40 minutes.',
      icon: <Zap className="w-5 h-5 text-rose-600" />,
    },
  ];

  const travelServices = useMemo(() => {
    if (rawServices && rawServices.length > 0) {
      const filtered = rawServices.filter(
        (s) =>
          (isSameDivision(s.division, 'travels') || isSameDivision((s as any).divisionId, 'travels')) &&
          (s as any).category !== 'packages' &&
          (s as any).type !== 'package'
      );
      if (filtered.length > 0) {
        return filtered.map((s) => ({
          title: s.name,
          desc: s.description || (s as any).detailedDescription || '',
          icon: <Compass className="w-5 h-5 text-blue-600" />,
          record: s as unknown as Record<string, any>,
        }));
      }
    }
    return [];
  }, [rawServices]);

  // Search, category and price come from the page-wide filter bar.
  const filteredServices = useDivisionFilteredItems('travels-services', travelServices, (svc) => ({
    title: svc.title,
    category: svc.record.category || 'Travel Services',
    price: getServiceStartingPrice(svc.record),
    text: svc.desc,
  }));

  if (travelServices.length === 0) {
    return null;
  }

  return (
    <SectionContainer id="services" background="white" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block font-mono">
            Full-Spectrum Travel Concierge
          </Caption>
          <H2 className="text-slate-900">
            Comprehensive On-Ground Tourism & Travel Services
          </H2>
        </ScrollReveal>
      </div>

      {/* Grid of Services */}
      {filteredServices.length === 0 && <DivisionFilterEmptyState label="services" />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards show image, title, starting price and View; full details open in a modal. */}
        {filteredServices.map((svc) => (
          <ServiceTile
            key={svc.record.id || svc.title}
            title={svc.title}
            imageAlt={getImageAlt(svc.title, 'travels')}
            images={toServiceDetails(svc.record).images}
            onView={() => setSelectedService(svc.record)}
            href={svc.record ? servicePagePath(svc.record) : undefined}
            price={getServiceStartingPrice(svc.record)}
          />
        ))}
      </div>

      <ServiceDetailsModal
        service={selectedService ? toServiceDetails(selectedService, 'Mahdev Travels') : null}
        onClose={() => setSelectedService(null)}
        bookOnline={selectedService?.id ? { kind: 'service', id: String(selectedService.id), price: getServiceStartingPrice(selectedService), divisionId: 'travels' } : undefined}
      />
    </SectionContainer>
  );
};
