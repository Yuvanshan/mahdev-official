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

interface SWSViewProps {
  onNavigate: (route: string) => void;
}

export const SWSView: React.FC<SWSViewProps> = ({ onNavigate }) => {
  const { divisions, companySettings, siteSettings, products, isInitialLoading, isFetching } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;

  if (divisions.length === 0 && (isInitialLoading || isFetching)) {
    return (
      <div className="pt-28 pb-24 min-h-[60vh] flex items-center justify-center bg-slate-950 text-white">
        <DataLoadingOverlay
          dark
          message="Loading SWS Event Management..."
          subMessage="Fetching division assets & services from Firestore"
        />
      </div>
    );
  }

  const swsDiv = divisions?.find(
    (d) =>
      d.id === 'sws' ||
      d.id === 'sws-event-management' ||
      d.slug === 'sws' ||
      d.slug === 'sws-event-management'
  );

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

  const sisterDivisions = useMemo(() => {
    const list = divisions && divisions.length > 0 ? divisions : DIVISION_LIST;
    const seen = new Set<string>(['sws']);
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

      {/* 2. ALL SERVICES SHOWCASE WITH VIEW DETAILS / BOOK NOW / REQUEST QUOTE */}
      <SWSServicesSection
        onBookNow={handleBookNow}
        onRequestQuote={handleRequestQuote}
      />

      {/* 3. EVENT FURNITURE, STAGING & AV RENTALS INVENTORY SECTION */}
      <SWSRentalsSection
        onBookRental={handleBookRental}
        onRequestQuote={handleRequestRentalQuote}
      />

      {/* 4. TURNKEY PACKAGES SECTION */}
      <SWSPackagesSection onBookPackage={handleBookPackage} />

      {/* 5. CINEMATIC GALLERY WITH CATEGORY TABS & LIGHTBOX */}
      <SWSGallerySection />

      {/* 6. EVENT PORTFOLIO & REAL CASE STUDIES */}
      <SWSPortfolioSection onConsultationClick={() => handleBookNow()} />

      {/* 7. 4-STEP EVENT ORCHESTRATION PROCESS */}
      <SWSProcessSection />

      {/* 8. CROSS-ECOSYSTEM SISTER DIVISIONS */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Integrated Group Strengths
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
                className="p-5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors overflow-hidden">
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
                  <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                    {sister.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{sisterTagline}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-blue-600">
                  <span>Explore {sisterShortName}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </SectionContainer>

      {/* 9. INTERACTIVE BOOKING FOUNDATION MODAL */}
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
