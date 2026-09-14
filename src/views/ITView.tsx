import React, { useState, useMemo } from 'react';
import {
  Cpu,
  ChevronLeft,
  ArrowRight,
  Send,
  Phone,
  Terminal,
  Layers,
  Code2,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { ITHeroSection } from '../components/it/ITHeroSection';
import { ITServicesSection } from '../components/it/ITServicesSection';
import { ITServiceDetailModal } from '../components/it/ITServiceDetailModal';
import { ITArchitectureSection } from '../components/it/ITArchitectureSection';
import { ITCaseStudiesSection } from '../components/it/ITCaseStudiesSection';
import { ITQuoteModal, ITModalType } from '../components/it/ITQuoteModal';
import { SectionContainer } from '../components/ui/SectionContainer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { IconRenderer } from '../components/ui/IconRenderer';
import { ITService } from '../data/itData';
import { DIVISION_LIST } from '../config/divisions';
import { COMPANY_INFO, getTelLink } from '../config/company';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';

interface ITViewProps {
  onNavigate: (route: string) => void;
}

export const ITView: React.FC<ITViewProps> = ({ onNavigate }) => {
  const { divisions, companySettings } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;
  const [selectedServiceForDetail, setSelectedServiceForDetail] = useState<ITService | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteModalService, setQuoteModalService] = useState<ITService | null>(null);
  const [quoteModalType, setQuoteModalType] = useState<ITModalType>('quote');

  const handleOpenQuoteModal = (service?: ITService, type: ITModalType = 'quote') => {
    setQuoteModalService(service || null);
    setQuoteModalType(type);
    setQuoteModalOpen(true);
  };

  const handleOpenServiceDetail = (service: ITService) => {
    setSelectedServiceForDetail(service);
  };

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sisterDivisions = useMemo(() => {
    const list = divisions && divisions.length > 0 ? divisions : DIVISION_LIST;
    const seen = new Set<string>(['it']);
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
    <div className="w-full flex flex-col bg-white">
      <SEOHead
        title="Mahdev IT & Solutions | Enterprise Software, Cloud & AI Engineering"
        description="Enterprise web applications, native mobile apps, custom ERPs, POS systems, AWS/GCP cloud orchestration, generative AI agents, and 24/7 SLA maintenance by Mahdev Pvt Ltd."
        canonicalUrl="https://mahdev.lk/it"
      />

      {/* 1. HIGH-TECH HERO SECTION WITH LIVE ARCHITECTURE TERMINAL */}
      <ITHeroSection
        onRequestQuote={() => handleOpenQuoteModal(undefined, 'quote')}
        onStartProject={() => handleOpenQuoteModal(undefined, 'project')}
        onContactTeam={() => handleOpenQuoteModal(undefined, 'contact')}
        onExploreServices={() => scrollToAnchor('services')}
      />

      {/* 2. ALL 10 IT & SOLUTIONS SERVICES WITH FILTERING */}
      <ITServicesSection
        onSelectService={handleOpenServiceDetail}
        onRequestQuote={(svc) => handleOpenQuoteModal(svc, 'quote')}
        onStartProject={(svc) => handleOpenQuoteModal(svc, 'project')}
      />

      {/* 3. ARCHITECTURAL PHILOSOPHY & PRODUCTION TECH MATRIX */}
      <ITArchitectureSection />

      {/* 4. PROVEN ENTERPRISE CASE STUDIES */}
      <ITCaseStudiesSection
        onStartProject={() => handleOpenQuoteModal(undefined, 'project')}
        onRequestQuote={() => handleOpenQuoteModal(undefined, 'quote')}
      />

      {/* 5. SISTER DIVISIONS CROSS-PROMOTION */}
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
            const rawSisterLogo = (sister as any).logoUrl || (sister as any).imageUrl;
            const sisterLogo = typeof rawSisterLogo === 'string' && rawSisterLogo.trim() !== '' ? rawSisterLogo.trim() : null;
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

      {/* 6. INDIVIDUAL SERVICE BLUEPRINT MODAL */}
      <ITServiceDetailModal
        service={selectedServiceForDetail}
        isOpen={!!selectedServiceForDetail}
        onClose={() => setSelectedServiceForDetail(null)}
        onRequestQuote={(svc) => handleOpenQuoteModal(svc, 'quote')}
        onStartProject={(svc) => handleOpenQuoteModal(svc, 'project')}
        onContactTeam={(svc) => handleOpenQuoteModal(svc, 'contact')}
      />

      {/* 7. QUOTE & PROJECT INQUIRY FOUNDATION MODAL */}
      <ITQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialService={quoteModalService}
        initialType={quoteModalType}
      />
    </div>
  );
};
