import React, { useState } from 'react';
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

interface TravelsViewProps {
  onNavigate: (route: string) => void;
}

export const TravelsView: React.FC<TravelsViewProps> = ({ onNavigate }) => {
  const { companySettings } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;
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

  const sisterDivisions = DIVISION_LIST.filter((d) => d.id !== 'travels');

  return (
    <div className="w-full flex flex-col bg-white">
      <SEOHead
        title="Mahdev Travels & Tours | Luxury Sri Lanka Expeditions & Private Chauffeurs"
        description="Curated luxury private tours, tea country rail journeys, leopard wildlife safaris, VIP airport transfers, and bespoke holiday itineraries across Sri Lanka by Mahdev Pvt Ltd."
        canonicalUrl="https://mahdev.lk/travels"
      />

      {/* Sticky Sub-Header Quick-Ribbon */}
      <div className="sticky top-16 z-30 bg-slate-950/95 backdrop-blur-md border-b border-white/10 shadow-md text-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Mahdev Group</span>
            </button>

            <span className="h-4 w-px bg-white/15" />

            <nav className="flex items-center gap-5 text-xs font-semibold text-slate-300">
              <button
                onClick={() => scrollToAnchor('destinations')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Destinations
              </button>
              <button
                onClick={() => scrollToAnchor('packages')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Travel Packages
              </button>
              <button
                onClick={() => scrollToAnchor('tours')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Day Tours
              </button>
              <button
                onClick={() => scrollToAnchor('transport')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Transport & Fleet
              </button>
              <button
                onClick={() => scrollToAnchor('gallery')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Gallery & Stories
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={getTelLink(primaryPhone)}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{primaryPhone}</span>
            </a>
            <Button
              size="sm"
              variant="electric"
              onClick={() => handleOpenBooking()}
              rightIcon={<Send className="w-3 h-3" />}
              className="text-xs py-1.5 px-3.5 shadow-sm font-semibold"
            >
              Plan Your Journey
            </Button>
          </div>
        </div>
      </div>

      {/* 1. CINEMATIC HERO SECTION */}
      <TravelsHeroSection
        onPlanTrip={() => handleOpenBooking()}
        onExplorePackages={() => scrollToAnchor('packages')}
        onExploreDestinations={() => scrollToAnchor('destinations')}
      />

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

      {/* 8. SISTER DIVISIONS CROSS-PROMOTION */}
      <SectionContainer background="white" paddingY="lg" hasBorderBottom>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Integrated Group Network
            </span>
            <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
              Explore Sister Divisions in the Mahdev Group
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/')}
            className="mt-4 md:mt-0 text-xs"
          >
            All Divisions Overview
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sisterDivisions.map((sister) => (
            <div
              key={sister.id}
              onClick={() => onNavigate(sister.route)}
              className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-[#0052FF] group-hover:bg-[#0052FF] group-hover:text-white transition-colors">
                    <IconRenderer name={sister.iconName} className="w-4 h-4" />
                  </div>
                  <Badge size="sm" variant="default" className="text-[10px]">
                    {sister.badge}
                  </Badge>
                </div>
                <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors mb-1">
                  {sister.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">{sister.tagline}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-[#0052FF]">
                <span>Explore {sister.shortName}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>

      {/* 9. DETAILED DAY-BY-DAY ITINERARY MODAL */}
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
