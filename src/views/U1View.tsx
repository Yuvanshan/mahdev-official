import React, { useState, useMemo } from 'react';
import {
  Camera,
  Film,
  Phone,
  ChevronLeft,
  ArrowRight,
  Calendar,
  Sparkles,
  Layers,
  Frame,
} from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { U1HeroSection } from '../components/u1/U1HeroSection';
import { U1ServicesSection } from '../components/u1/U1ServicesSection';
import { U1PortfolioSection } from '../components/u1/U1PortfolioSection';
import { U1PackagesSection } from '../components/u1/U1PackagesSection';
import { U1StudioExperienceSection } from '../components/u1/U1StudioExperienceSection';
import { U1LocalSection } from '../components/u1/U1LocalSection';
import { U1BookingModal } from '../components/u1/U1BookingModal';
import { SectionContainer } from '../components/ui/SectionContainer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { IconRenderer } from '../components/ui/IconRenderer';
import { U1Service, U1Package } from '../data/u1Data';
import { DIVISION_LIST } from '../config/divisions';
import { DIVISION_SEO } from '../config/divisionSeo';
import { CANONICAL_SITE_ORIGIN } from '../config/site';
import { COMPANY_INFO, getTelLink } from '../config/company';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DivisionFilterBar, DivisionFilterProvider } from '../components/common/DivisionFilter';
import { parsePriceText, startOnlineBooking } from '../utils/onlineBooking';
import { useOnlineBookingEnabled } from '../hooks/useOnlineBookingEnabled';

interface U1ViewProps {
  onNavigate: (route: string) => void;
}

export const U1View: React.FC<U1ViewProps> = ({ onNavigate }) => {
  const {
    divisions,
    companySettings,
    loadDivisionData,
  } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;

  React.useEffect(() => {
    loadDivisionData('u1');
  }, [loadDivisionData]);

  const onlineBookingEnabled = useOnlineBookingEnabled();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeServiceForBooking, setActiveServiceForBooking] = useState<U1Service | null>(null);
  const [activePackageForBooking, setActivePackageForBooking] = useState<U1Package | null>(null);

  // Chosen services and packages are booked online when it is switched on in the admin;
  // otherwise the U1 booking pop-up opens as before.
  const handleBookService = (service: U1Service) => {
    if (!onlineBookingEnabled) {
      setActiveServiceForBooking(service);
      setActivePackageForBooking(null);
      setBookingModalOpen(true);
      return;
    }
    startOnlineBooking({
      kind: 'service',
      id: service.id,
      title: service.name,
      images: service.gallery?.length ? service.gallery : [service.imageUrl],
      description: service.description,
      divisionId: 'u1',
      divisionName: 'U1 Studio',
      price: service.price ?? parsePriceText(service.startingPrice),
      features: service.deliverables,
    }, onNavigate);
  };

  const handleBookPackage = (pkg: U1Package) => {
    if (!onlineBookingEnabled) {
      setActivePackageForBooking(pkg);
      setActiveServiceForBooking(null);
      setBookingModalOpen(true);
      return;
    }
    startOnlineBooking({
      kind: 'service',
      id: pkg.id,
      title: pkg.name,
      images: pkg.gallery?.length ? pkg.gallery : [pkg.imageUrl],
      description: pkg.description,
      divisionId: 'u1',
      divisionName: 'U1 Studio',
      price: parsePriceText(pkg.price),
      features: pkg.deliverables,
    }, onNavigate);
  };

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="division-experience min-h-screen w-full flex flex-col bg-[#FAF9F6]">
      <SEOHead
        title={DIVISION_SEO.u1.title}
        description={DIVISION_SEO.u1.description}
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/u1`}
      />

      {/* 1. U1 CINEMATIC IMAGE-FIRST HERO */}
      <U1HeroSection
        onExploreServices={() => scrollToAnchor('services')}
      />

      {/* Render content progressively as each Turso-backed collection arrives.
          One shared search/category/price filter drives services and the portfolio. */}
      <DivisionFilterProvider>
        <DivisionFilterBar placeholder="Search U1 studio services & portfolio..." />

        <div id="services">
          <U1ServicesSection onBookService={handleBookService} />
        </div>

        <U1PortfolioSection />

        <U1PackagesSection onBookPackage={handleBookPackage} />

        <U1StudioExperienceSection />
      </DivisionFilterProvider>

      <U1LocalSection />

      {/* 6. DEDICATED U1 BOOKING MODAL */}
      <U1BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialService={activeServiceForBooking}
        initialPackage={activePackageForBooking}
      />
    </div>
  );
};
