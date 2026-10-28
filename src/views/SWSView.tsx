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
import { SWSLocalSection } from '../components/sws/SWSLocalSection';
import { SWSBookingModal } from '../components/sws/SWSBookingModal';
import { SectionContainer } from '../components/ui/SectionContainer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { IconRenderer } from '../components/ui/IconRenderer';
import { SWSService, SWSPackage, SWSRentalItem } from '../data/swsData';
import { DIVISION_SEO } from '../config/divisionSeo';
import { CANONICAL_SITE_ORIGIN } from '../config/site';
import { COMPANY_INFO, getTelLink } from '../config/company';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DivisionFilterBar, DivisionFilterProvider } from '../components/common/DivisionFilter';
import { parsePriceText, startOnlineBooking } from '../utils/onlineBooking';
import { useOnlineBookingEnabled } from '../hooks/useOnlineBookingEnabled';

interface SWSViewProps {
  onNavigate: (route: string) => void;
}

export const SWSView: React.FC<SWSViewProps> = ({ onNavigate }) => {
  const {
    companySettings,
    divisionLoadErrors,
    loadDivisionData,
  } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;

  React.useEffect(() => {
    loadDivisionData('sws');
  }, [loadDivisionData]);

  const onlineBookingEnabled = useOnlineBookingEnabled();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isQuoteMode, setIsQuoteMode] = useState(false);
  const [activeServiceForBooking, setActiveServiceForBooking] = useState<SWSService | null>(null);
  const [activePackageForBooking, setActivePackageForBooking] = useState<SWSPackage | null>(null);
  const [activeRentalForBooking, setActiveRentalForBooking] = useState<SWSRentalItem | null>(null);

  const handleBookNow = (service?: SWSService) => {
    // A chosen service is booked online; the general "Book now" keeps the enquiry form.
    if (service && onlineBookingEnabled) {
      startOnlineBooking({
        kind: 'service',
        id: service.id,
        title: service.name,
        images: service.gallery?.length ? service.gallery : [service.imageUrl],
        description: service.description,
        divisionId: 'sws',
        divisionName: 'SWS Event Management',
        price: service.price ?? parsePriceText(service.startingPrice),
        features: service.features,
      }, onNavigate);
      return;
    }
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
    if (rentalItem && onlineBookingEnabled) {
      // Rentals are booked like products: quantity plus delivery address.
      startOnlineBooking({
        kind: 'product',
        id: rentalItem.id,
        title: rentalItem.name,
        images: rentalItem.gallery?.length ? rentalItem.gallery : [rentalItem.imageUrl],
        description: rentalItem.description,
        divisionId: 'sws',
        divisionName: 'SWS Event Management',
        price: rentalItem.price ?? parsePriceText(rentalItem.dailyRate),
        features: rentalItem.features,
      }, onNavigate);
      return;
    }
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
    if (!onlineBookingEnabled) {
      setActivePackageForBooking(pkg);
      setActiveServiceForBooking(null);
      setActiveRentalForBooking(null);
      setIsQuoteMode(false);
      setBookingModalOpen(true);
      return;
    }
    startOnlineBooking({
      kind: 'service',
      id: pkg.id,
      title: pkg.name,
      images: pkg.images,
      description: pkg.description,
      divisionId: 'sws',
      divisionName: 'SWS Event Management',
      price: parsePriceText(pkg.price),
      features: pkg.includedServices,
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
        title={DIVISION_SEO.sws.title}
        description={DIVISION_SEO.sws.description}
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/sws`}
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

      {/* Sections render as their own data arrives rather than waiting for every collection.
          One shared search/category/price filter drives services, gallery and rentals. */}
      <DivisionFilterProvider>
        <DivisionFilterBar placeholder="Search SWS services, gallery & rentals..." />

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

        {/* Local search: service keywords, exact business address/phone, map and FAQ. */}
        <SWSLocalSection />
      </DivisionFilterProvider>

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
