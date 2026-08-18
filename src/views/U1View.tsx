import React, { useState } from 'react';
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

interface U1ViewProps {
  onNavigate: (route: string) => void;
}

export const U1View: React.FC<U1ViewProps> = ({ onNavigate }) => {
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

  const sisterDivisions = DIVISION_LIST.filter((d) => d.id !== 'u1');

  return (
    <div className="w-full flex flex-col">
      <SEOHead
        title="U1 Studio | Luxury Photography, 4K Cinema & Creative Studio"
        description="U1 Studio by Mahdev Pvt Ltd. High-end editorial photography, 4K cinema wedding films, fashion portraits, commercial product imaging, and heirloom flush-mount albums in Sri Lanka."
        canonicalUrl="https://mahdev.lk/u1"
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
                onClick={() => scrollToAnchor('services')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                11 Studio Services
              </button>
              <button
                onClick={() => scrollToAnchor('portfolio')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Visual Portfolio
              </button>
              <button
                onClick={() => scrollToAnchor('packages')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Packages
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={getTelLink(COMPANY_INFO.primaryPhone)}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>{COMPANY_INFO.primaryPhone}</span>
            </a>
            <Button
              size="sm"
              variant="electric"
              onClick={handleOpenGeneralBooking}
              leftIcon={<Calendar className="w-3 h-3" />}
              className="text-xs py-1.5 px-3.5 shadow-sm"
            >
              Book Studio
            </Button>
          </div>
        </div>
      </div>

      {/* 1. U1 CINEMATIC IMAGE-FIRST HERO */}
      <U1HeroSection
        onBookSession={handleOpenGeneralBooking}
        onExplorePortfolio={() => scrollToAnchor('portfolio')}
        onExploreServices={() => scrollToAnchor('services')}
      />

      {/* 2. ALL 11 STUDIO SERVICES GRID WITH DETAIL MODAL */}
      <U1ServicesSection onBookService={handleBookService} />

      {/* 3. VISUAL PORTFOLIO WITH FULL-SCREEN LIGHTBOX & OPTICS EXIF */}
      <U1PortfolioSection />

      {/* 4. PHOTOGRAPHY & CINEMA PACKAGES */}
      <U1PackagesSection onBookPackage={handleBookPackage} />

      {/* 5. STUDIO FACILITY, CYCLORAMA WALL & ALBUM CRAFT */}
      <U1StudioExperienceSection />

      {/* 6. SISTER DIVISIONS CROSS-PROMOTION */}
      <SectionContainer background="white" paddingY="lg" hasBorderBottom>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Integrated Group Network
            </span>
            <h3 className="font-display text-xl font-bold text-slate-900 mt-1">
              Explore Sister Divisions in the Mahdev Ecosystem
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

      {/* 7. DEDICATED U1 BOOKING MODAL */}
      <U1BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialService={activeServiceForBooking}
        initialPackage={activePackageForBooking}
      />
    </div>
  );
};
