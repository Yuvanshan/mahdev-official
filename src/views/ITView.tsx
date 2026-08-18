import React, { useState } from 'react';
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

interface ITViewProps {
  onNavigate: (route: string) => void;
}

export const ITView: React.FC<ITViewProps> = ({ onNavigate }) => {
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

  const sisterDivisions = DIVISION_LIST.filter((d) => d.id !== 'it');

  return (
    <div className="w-full flex flex-col bg-white">
      <SEOHead
        title="Mahdev IT & Solutions | Enterprise Software, Cloud & AI Engineering"
        description="Enterprise web applications, native mobile apps, custom ERPs, POS systems, AWS/GCP cloud orchestration, generative AI agents, and 24/7 SLA maintenance by Mahdev Pvt Ltd."
        canonicalUrl="https://mahdev.lk/it"
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
                10 IT Disciplines
              </button>
              <button
                onClick={() => scrollToAnchor('case-studies')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Case Studies & ROI
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
              variant="outline"
              onClick={() => handleOpenQuoteModal(undefined, 'project')}
              className="text-xs py-1.5 px-3 border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
            >
              Start a Project
            </Button>
            <Button
              size="sm"
              variant="electric"
              onClick={() => handleOpenQuoteModal(undefined, 'quote')}
              rightIcon={<Send className="w-3 h-3" />}
              className="text-xs py-1.5 px-3.5 shadow-sm font-semibold"
            >
              Request a Quote
            </Button>
          </div>
        </div>
      </div>

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
