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
import { U1BookingModal } from '../components/u1/U1BookingModal';
import { SectionContainer } from '../components/ui/SectionContainer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { IconRenderer } from '../components/ui/IconRenderer';
import { U1Service, U1Package } from '../data/u1Data';
import { DIVISION_LIST } from '../config/divisions';
import { COMPANY_INFO, getTelLink } from '../config/company';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';
import { DivisionBelowHeroShimmer } from '../components/common/DivisionBelowHeroShimmer';
import { ServicesSectionShimmer } from '../components/common/ServicesSectionShimmer';
import { GallerySectionShimmer } from '../components/common/GallerySectionShimmer';

interface U1ViewProps {
  onNavigate: (route: string) => void;
}

export const U1View: React.FC<U1ViewProps> = ({ onNavigate }) => {
  const {
    divisions,
    companySettings,
    isInitialLoading,
    isDivisionLoaded,
    isDivisionServicesLoaded,
    isDivisionGalleryLoaded,
    loadDivisionData,
  } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;

  React.useEffect(() => {
    loadDivisionData('u1');
  }, [loadDivisionData]);

  const isDataLoading = isInitialLoading || !isDivisionLoaded('u1');

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeServiceForBooking, setActiveServiceForBooking] = useState<U1Service | null>(null);
  const [activePackageForBooking, setActivePackageForBooking] = useState<U1Package | null>(null);

  const handleBookService = (service: U1Service) => {
    setActiveServiceForBooking(service);
    setActivePackageForBooking(null);
    setBookingModalOpen(true);
  };

  const handleBookPackage = (pkg: U1Package) => {
    setActivePackageForBooking(pkg);
    setActiveServiceForBooking(null);
    setBookingModalOpen(true);
  };

  const handleOpenGeneralBooking = () => {
    setActiveServiceForBooking(null);
    setActivePackageForBooking(null);
    setBookingModalOpen(true);
  };

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col">
      <SEOHead
        title="U1 Studio | Luxury Photography, 4K Cinema & Creative Studio"
        description="U1 Studio by Mahdev Pvt Ltd. High-end editorial photography, 4K cinema wedding films, fashion portraits, commercial product imaging, and heirloom flush-mount albums in Sri Lanka."
        canonicalUrl="https://mahdev.lk/u1"
      />

      {/* 1. U1 CINEMATIC IMAGE-FIRST HERO */}
      <U1HeroSection
        onBookSession={handleOpenGeneralBooking}
        onExplorePortfolio={() => scrollToAnchor('portfolio')}
        onExploreServices={() => scrollToAnchor('services')}
      />

      {/* 2. BELOW HERO SECTION: SEQUENTIAL SECTION LOADING (HERO -> SERVICES -> GALLERY) */}
      {/* 2. ALL STUDIO SERVICES: LOAD SERVICES FIRST AND FAST WITH SHIMMER */}
      {!isDivisionServicesLoaded('u1') ? (
        <ServicesSectionShimmer divisionName="U1 Studio" />
      ) : (
        <U1ServicesSection onBookService={handleBookService} />
      )}

      {/* 3. VISUAL PORTFOLIO / GALLERY: SHIMMER UNTIL LOADED */}
      {!isDivisionGalleryLoaded('u1') ? (
        <GallerySectionShimmer divisionName="U1 Studio" />
      ) : (
        <U1PortfolioSection />
      )}

      {/* 4. PHOTOGRAPHY & CINEMA PACKAGES */}
      <U1PackagesSection onBookPackage={handleBookPackage} />

      {/* 5. STUDIO FACILITY, CYCLORAMA WALL & ALBUM CRAFT */}
      <U1StudioExperienceSection />

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
