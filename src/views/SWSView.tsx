import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
} from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { SWSHeroSection } from '../components/sws/SWSHeroSection';
import { SWSServicesSection } from '../components/sws/SWSServicesSection';
import { SWSRentalsSection } from '../components/sws/SWSRentalsSection';
import { SWSPackagesSection } from '../components/sws/SWSPackagesSection';
import { SWSGallerySection } from '../components/sws/SWSGallerySection';
import { SWSPortfolioSection } from '../components/sws/SWSPortfolioSection';
import { SWSProcessSection } from '../components/sws/SWSProcessSection';
import { SWSBookingModal } from '../components/sws/SWSBookingModal';
import { SectionContainer } from '../components/ui/SectionContainer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { IconRenderer } from '../components/ui/IconRenderer';
import { SWSService, SWSPackage, SWSRentalItem } from '../data/swsData';
import { DIVISION_LIST } from '../config/divisions';
import { COMPANY_INFO, getTelLink } from '../config/company';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { getRentalAssetCount } from '../utils/assetMetrics';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';
import { DivisionBelowHeroShimmer } from '../components/common/DivisionBelowHeroShimmer';
import { ServicesSectionShimmer } from '../components/common/ServicesSectionShimmer';
import { GallerySectionShimmer } from '../components/common/GallerySectionShimmer';

interface SWSViewProps {
  onNavigate: (route: string) => void;
}

export const SWSView: React.FC<SWSViewProps> = ({ onNavigate }) => {
  const {
    divisions,
    companySettings,
    siteSettings,
    products,
    isInitialLoading,
    isDivisionLoaded,
    isDivisionServicesLoaded,
    isDivisionGalleryLoaded,
    loadDivisionData,
  } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;

  React.useEffect(() => {
    loadDivisionData('sws');
  }, [loadDivisionData]);

  const swsDiv =
    divisions?.find(
      (d) =>
        d.id === 'sws' ||
        d.id === 'sws-event-management' ||
        d.slug === 'sws' ||
        d.slug === 'sws-event-management'
    ) || DIVISION_LIST.find((d) => d.id === 'sws');

  const isDataLoading = isInitialLoading || !isDivisionLoaded('sws');

  const rentalCount = getRentalAssetCount(
    products,
    (swsDiv as any)?.rentalAssetCount || (companySettings as any)?.rentalAssetCount || (siteSettings as any)?.rentalAssetCount
  );

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isQuoteMode, setIsQuoteMode] = useState(false);
  const [activeServiceForBooking, setActiveServiceForBooking] = useState<SWSService | null>(null);
  const [activePackageForBooking, setActivePackageForBooking] = useState<SWSPackage | null>(null);
  const [activeRentalForBooking, setActiveRentalForBooking] = useState<SWSRentalItem | null>(null);

  const handleBookNow = (service?: SWSService) => {
    setActiveServiceForBooking(service || null);
    setActivePackageForBooking(null);
    setActiveRentalForBooking(null);
    setIsQuoteMode(false);
    setBookingModalOpen(true);
  };

  const handleRequestQuote = (service?: SWSService) => {
    setActiveServiceForBooking(service || null);
    setActivePackageForBooking(null);
    setActiveRentalForBooking(null);
    setIsQuoteMode(true);
    setBookingModalOpen(true);
  };

  const handleBookRental = (rentalItem?: SWSRentalItem) => {
    setActiveRentalForBooking(rentalItem || null);
    setActiveServiceForBooking(null);
    setActivePackageForBooking(null);
    setIsQuoteMode(false);
    setBookingModalOpen(true);
  };

  const handleRequestRentalQuote = (rentalItem?: SWSRentalItem) => {
    setActiveRentalForBooking(rentalItem || null);
    setActiveServiceForBooking(null);
    setActivePackageForBooking(null);
    setIsQuoteMode(true);
    setBookingModalOpen(true);
  };

  const handleBookPackage = (pkg: SWSPackage) => {
    setActivePackageForBooking(pkg);
    setActiveServiceForBooking(null);
    setActiveRentalForBooking(null);
    setIsQuoteMode(false);
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
        title="SWS Event Management | Luxury Weddings, Decor, Stage Productions & Equipment Rentals"
        description={`SWS Event Management by Mahdev Pvt Ltd (Est. 2022). Comprehensive event design, wedding decorations, grand summits, stage engineering, ${rentalCount} rental inventory units, photography, catering, and complete packages in Sri Lanka.`}
        canonicalUrl="https://mahdev.lk/sws"
      />

      {/* 1. SWS CINEMATIC HERO SECTION */}
      <SWSHeroSection
        onBookNow={() => handleBookNow()}
        onRequestQuote={() => handleRequestQuote()}
        onExploreServices={() => scrollToAnchor('services')}
        onExploreRentals={() => scrollToAnchor('rentals')}
      />

      {/* 2. BELOW HERO SECTION: SEQUENTIAL SECTION LOADING (HERO -> SERVICES -> GALLERY) */}
      {/* 2. ALL SERVICES SHOWCASE: LOAD SERVICES FIRST AND FAST WITH SHIMMER */}
      {!isDivisionServicesLoaded('sws') ? (
        <ServicesSectionShimmer divisionName="SWS Event Management" />
      ) : (
        <SWSServicesSection
          onBookNow={handleBookNow}
          onRequestQuote={handleRequestQuote}
        />
      )}

      {/* 3. EVENT FURNITURE, STAGING & AV RENTALS INVENTORY SECTION */}
      <SWSRentalsSection
        onBookRental={handleBookRental}
        onRequestQuote={handleRequestRentalQuote}
      />

      {/* 4. TURNKEY PACKAGES SECTION */}
      <SWSPackagesSection onBookPackage={handleBookPackage} />

      {/* 5. CINEMATIC GALLERY: SHIMMER UNTIL GALLERY LOADS */}
      {!isDivisionGalleryLoaded('sws') ? (
        <GallerySectionShimmer divisionName="SWS Event Management" />
      ) : (
        <SWSGallerySection />
      )}

      {/* 6. EVENT PORTFOLIO & REAL CASE STUDIES */}
      <SWSPortfolioSection onConsultationClick={() => handleBookNow()} />

      {/* 7. INTERACTIVE BOOKING FOUNDATION MODAL */}
      <SWSBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialService={activeServiceForBooking}
        initialPackage={activePackageForBooking}
        initialRentalItem={activeRentalForBooking}
        isQuoteMode={isQuoteMode}
      />
    </div>
  );
};
