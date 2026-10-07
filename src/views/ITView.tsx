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

interface ITViewProps {
  onNavigate: (route: string) => void;
}

export const ITView: React.FC<ITViewProps> = ({ onNavigate }) => {
  const { divisions, companySettings, loadDivisionData } = useFirestoreDataContext();
  const primaryPhone = companySettings?.primaryPhone || COMPANY_INFO.primaryPhone;

  React.useEffect(() => {
    loadDivisionData('it');
  }, [loadDivisionData]);

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

      {/* Render content progressively as each Turso-backed collection arrives. */}
      <>
        <ITServicesSection
          onSelectService={handleOpenServiceDetail}
          onRequestQuote={(svc) => handleOpenQuoteModal(svc, 'quote')}
          onStartProject={(svc) => handleOpenQuoteModal(svc, 'project')}
        />

        <ITArchitectureSection />

        <ITCaseStudiesSection
          onStartProject={() => handleOpenQuoteModal(undefined, 'project')}
          onRequestQuote={() => handleOpenQuoteModal(undefined, 'quote')}
        />
      </>

      {/* 5. INDIVIDUAL SERVICE BLUEPRINT MODAL */}
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
