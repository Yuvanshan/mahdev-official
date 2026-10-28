import React, { useState, useMemo } from 'react';
import {
  Compass,
  ChevronLeft,
  ArrowRight,
  Send,
  Phone,
  MapPin,
  Calendar,
  Car,
  Camera,
} from 'lucide-react';
import { DivisionFilterBar, DivisionFilterProvider } from '../components/common/DivisionFilter';
import { SEOHead } from '../components/layout/SEOHead';
import { TravelsHeroSection } from '../components/travels/TravelsHeroSection';
import { TravelsDestinationsSection } from '../components/travels/TravelsDestinationsSection';
import { TravelsPackagesSection } from '../components/travels/TravelsPackagesSection';
import { TravelsPackageDetailModal } from '../components/travels/TravelsPackageDetailModal';
import { TravelsDayToursSection } from '../components/travels/TravelsDayToursSection';
import { TravelsFleetSection } from '../components/travels/TravelsFleetSection';
import { TravelsServicesSection } from '../components/travels/TravelsServicesSection';
import { TravelsGalleryStoriesSection } from '../components/travels/TravelsGalleryStoriesSection';
import { TravelsBookingModal } from '../components/travels/TravelsBookingModal';
import { SectionContainer } from '../components/ui/SectionContainer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { IconRenderer } from '../components/ui/IconRenderer';
import { TravelPackage, TravelDestination, DayTour, Vehicle } from '../data/travelsData';
import { DIVISION_LIST } from '../config/divisions';
import { DIVISION_SEO } from '../config/divisionSeo';
import { CANONICAL_SITE_ORIGIN } from '../config/site';
import { COMPANY_INFO, getTelLink } from '../config/company';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { parsePriceText, startOnlineBooking } from '../utils/onlineBooking';
import { useOnlineBookingEnabled } from '../hooks/useOnlineBookingEnabled';

interface TravelsViewProps {
  onNavigate: (route: string) => void;
}

export const TravelsView: React.FC<TravelsViewProps> = ({ onNavigate }) => {
  const { divisions, companySettings, loadDivisionData } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;

  React.useEffect(() => {
    loadDivisionData('travels');
  }, [loadDivisionData]);

  const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<TravelPackage | null>(null);
  const onlineBookingEnabled = useOnlineBookingEnabled();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPackage, setBookingPackage] = useState<TravelPackage | null>(null);
  const [bookingTour, setBookingTour] = useState<DayTour | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);

  const handleOpenBooking = (
    pkg?: TravelPackage | null,
    tour?: DayTour | null,
    vehicle?: Vehicle | null
  ) => {
    // A chosen package, tour or vehicle is booked online; "Plan a trip" keeps the enquiry form.
    const travelItem = pkg
      ? { id: pkg.id, title: pkg.title, images: [pkg.heroImage, ...pkg.gallery], description: pkg.description, price: pkg.pricePerPerson || parsePriceText(pkg.price), features: pkg.highlights }
      : tour
        ? { id: tour.id, title: tour.title, images: [tour.imageUrl], description: tour.description, price: parsePriceText(tour.price), features: tour.highlights }
        : vehicle
          ? { id: vehicle.id, title: vehicle.name, images: [vehicle.imageUrl], description: `${vehicle.category} · ${vehicle.capacity}`, price: parsePriceText(vehicle.dailyRate), features: vehicle.features }
          : null;
    if (travelItem && onlineBookingEnabled) {
      startOnlineBooking({ kind: 'service', divisionId: 'travels', divisionName: 'MAHDEV Travels', ...travelItem }, onNavigate);
      return;
    }
    setBookingPackage(pkg || null);
    setBookingTour(tour || null);
    setBookingVehicle(vehicle || null);
    setBookingModalOpen(true);
  };

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col bg-white">
      <SEOHead
        title={DIVISION_SEO.travels.title}
        description={DIVISION_SEO.travels.description}
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/travels`}
      />

      {/* 1. CINEMATIC HERO SECTION */}
      <TravelsHeroSection
        onPlanTrip={() => handleOpenBooking()}
        onExplorePackages={() => scrollToAnchor('packages')}
        onExploreDestinations={() => scrollToAnchor('destinations')}
      />

      {/* Render content progressively as each Turso-backed collection arrives.
          One shared search/category/price filter drives packages, day tours, services and gallery. */}
      <DivisionFilterProvider>
        <DivisionFilterBar placeholder="Search Mahdev Travels packages, tours, services & gallery..." />

        <TravelsDestinationsSection
          onPlanTripForDestination={() => handleOpenBooking(null, null, null)}
        />

        <TravelsPackagesSection
          onSelectPackage={(pkg) => setSelectedPackageForDetail(pkg)}
          onBookPackageDirect={(pkg) => handleOpenBooking(pkg)}
        />

        <TravelsDayToursSection
          onBookDayTour={(tour) => handleOpenBooking(null, tour)}
        />

        <TravelsFleetSection
          onBookTransport={(vehicle) => handleOpenBooking(null, null, vehicle)}
        />

        <TravelsServicesSection />

        <TravelsGalleryStoriesSection />
      </DivisionFilterProvider>

      {/* 8. DETAILED DAY-BY-DAY ITINERARY MODAL */}
      <TravelsPackageDetailModal
        pkg={selectedPackageForDetail}
        isOpen={!!selectedPackageForDetail}
        onClose={() => setSelectedPackageForDetail(null)}
        onBookPackage={(pkg) => handleOpenBooking(pkg)}
      />

      {/* 10. BOOKING FOUNDATION RESERVATION MODAL */}
      <TravelsBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialPackage={bookingPackage}
        initialTour={bookingTour}
        initialVehicle={bookingVehicle}
      />
    </div>
  );
};
