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

interface U1ViewProps {
  onNavigate: (route: string) => void;
}

export const U1View: React.FC<U1ViewProps> = ({ onNavigate }) => {
  const { divisions, companySettings } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;
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

  const sisterDivisions = useMemo(() => {
    const list = divisions && divisions.length > 0 ? divisions : DIVISION_LIST;
    const seen = new Set<string>(['u1']);
    const result = [];
    for (const d of list) {
      const rawId = (d.id || (d as any).slug || '').toLowerCase();
      const canonicalId =
        rawId === 'u1' || rawId === 'u1-studio' || rawId === 'u1-cinema'
          ? 'u1'
          : rawId === 'sws' || rawId === 'sws-event-management' || rawId === 'sws-events'
          ? 'sws'
          : rawId === 'it' || rawId === 'it-solutions' || rawId === 'mahdev-it'
          ? 'it'
          : rawId === 'travels' || rawId === 'mahdev-travels'
          ? 'travels'
          : rawId === 'mart' || rawId === 'online-mart' || rawId === 'mahdev-mart'
          ? 'mart'
          : rawId;

      if (!canonicalId || seen.has(canonicalId)) continue;
      seen.add(canonicalId);
      result.push({
        ...d,
        id: canonicalId,
      });
    }
    return result;
  }, [divisions]);

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
          {sisterDivisions.map((sister) => {
            const sisterRoute = sister.route || `/division/${(sister as any).slug || sister.id}`;
            const sisterLogo = (sister as any).logoUrl || (sister as any).imageUrl;
            const sisterTagline = sister.tagline || (sister as any).description;
            const sisterBadge = (sister as any).badge || 'Mahdev Division';
            const sisterShortName = (sister as any).shortName || sister.name;

            return (
              <div
                key={sister.id}
                onClick={() => onNavigate(sisterRoute)}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-[#0052FF] group-hover:bg-[#0052FF] group-hover:text-white transition-colors overflow-hidden">
                      {sisterLogo ? (
                        <img
                          src={sisterLogo}
                          alt={sister.name}
                          className="w-5 h-5 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <IconRenderer name={sister.iconName || 'Layers'} className="w-4 h-4" />
                      )}
                    </div>
                    <Badge size="sm" variant="default" className="text-[10px]">
                      {sisterBadge}
                    </Badge>
                  </div>
                  <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors mb-1">
                    {sister.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{sisterTagline}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-[#0052FF]">
                  <span>Explore {sisterShortName}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
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
