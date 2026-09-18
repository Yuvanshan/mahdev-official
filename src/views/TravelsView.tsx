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
import { COMPANY_INFO, getTelLink } from '../config/company';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';
import { DivisionBelowHeroShimmer } from '../components/common/DivisionBelowHeroShimmer';

interface TravelsViewProps {
  onNavigate: (route: string) => void;
}

export const TravelsView: React.FC<TravelsViewProps> = ({ onNavigate }) => {
  const { divisions, companySettings, isInitialLoading, isDivisionLoaded, loadDivisionData } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;

  React.useEffect(() => {
    loadDivisionData('travels');
  }, [loadDivisionData]);

  const isDataLoading = isInitialLoading || !isDivisionLoaded('travels');

  const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<TravelPackage | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPackage, setBookingPackage] = useState<TravelPackage | null>(null);
  const [bookingTour, setBookingTour] = useState<DayTour | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);

  const handleOpenBooking = (
    pkg?: TravelPackage | null,
    tour?: DayTour | null,
    vehicle?: Vehicle | null
  ) => {
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
        title="Mahdev Travels & Tours | Luxury Sri Lanka Expeditions & Private Chauffeurs"
        description="Curated luxury private tours, tea country rail journeys, leopard wildlife safaris, VIP airport transfers, and bespoke holiday itineraries across Sri Lanka by Mahdev Pvt Ltd."
        canonicalUrl="https://mahdev.lk/travels"
      />

      {/* 1. CINEMATIC HERO SECTION */}
      <TravelsHeroSection
        onPlanTrip={() => handleOpenBooking()}
        onExplorePackages={() => scrollToAnchor('packages')}
        onExploreDestinations={() => scrollToAnchor('destinations')}
      />

      {/* 2. BELOW HERO SECTION: SHOW SHIMMER UNTIL DATA LOADS FROM FIRESTORE */}
      {isDataLoading ? (
        <DivisionBelowHeroShimmer divisionName="Mahdev Travels & Tours" />
      ) : (
        <>
          {/* 2. DESTINATIONS SPOTLIGHT */}
          <TravelsDestinationsSection
            onPlanTripForDestination={(dest) => handleOpenBooking(null, null, null)}
          />

          {/* 3. CURATED PACKAGES */}
          <TravelsPackagesSection
            onSelectPackage={(pkg) => setSelectedPackageForDetail(pkg)}
            onBookPackageDirect={(pkg) => handleOpenBooking(pkg)}
          />

          {/* 4. DAY TOURS & MICRO-ADVENTURES */}
          <TravelsDayToursSection
            onBookDayTour={(tour) => handleOpenBooking(null, tour)}
          />

          {/* 5. PRIVATE TRANSPORT & CHAUFFEUR FLEET */}
          <TravelsFleetSection
            onBookTransport={(vehicle) => handleOpenBooking(null, null, vehicle)}
          />

          {/* 6. CONCIERGE TRAVEL SERVICES */}
          <TravelsServicesSection />

          {/* 7. CINEMATIC GALLERY & GUEST STORIES */}
          <TravelsGalleryStoriesSection />
        </>
      )}

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
