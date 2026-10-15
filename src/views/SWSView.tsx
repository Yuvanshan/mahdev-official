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

interface SWSViewProps {
  onNavigate: (route: string) => void;
}

export const SWSView: React.FC<SWSViewProps> = ({ onNavigate }) => {
  const {
    divisions,
    companySettings,
    siteSettings,
    products,
    divisionLoadErrors,
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
    <div className="division-experience min-h-screen w-full flex flex-col bg-[#FAF9F6]">
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

      {divisionLoadErrors.sws && (
        <div className="mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
        </div>
      )}

      {/* Sections render as their own data arrives rather than waiting for every collection. */}
      <>
        <SWSServicesSection
          onBookNow={handleBookNow}
          onRequestQuote={handleRequestQuote}
        />

        <SWSGallerySection />

        <SWSRentalsSection
          onBookRental={handleBookRental}
          onRequestQuote={handleRequestRentalQuote}
        />

        <SWSPackagesSection onBookPackage={handleBookPackage} />

        <SWSPortfolioSection onConsultationClick={() => handleBookNow()} />
      </>

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
