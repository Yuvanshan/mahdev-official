import React, { useState, useMemo } from 'react';
import {
  Globe,
  Smartphone,
  Building2,
  Receipt,
  Cloud,
  Cpu,
  Zap,
  Compass,
  Layers,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Code2,
  ChevronRight,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { IT_SERVICES, ITService } from '../../data/itData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ServiceTile } from '../services/ServiceTile';
import { toServiceDetails } from '../services/ServiceDetailsModal';
import { isSameDivision } from '../../services/firestore/divisions';
import { getServiceStartingPrice } from '../common/StartingPriceTag';
import { DivisionFilterEmptyState, useDivisionFilteredItems } from '../common/DivisionFilter';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';

interface ITServicesSectionProps {
  onSelectService: (service: ITService) => void;
  onRequestQuote: (service?: ITService) => void;
  onStartProject: (service?: ITService) => void;
}

const getServiceIcon = (iconName: string) => {
  switch (iconName) {
    case 'Globe':
      return <Globe className="w-5 h-5" />;
    case 'Smartphone':
      return <Smartphone className="w-5 h-5" />;
    case 'Building2':
      return <Building2 className="w-5 h-5" />;
    case 'Receipt':
      return <Receipt className="w-5 h-5" />;
    case 'Cloud':
      return <Cloud className="w-5 h-5" />;
    case 'Cpu':
      return <Cpu className="w-5 h-5" />;
    case 'Zap':
      return <Zap className="w-5 h-5" />;
    case 'Compass':
      return <Compass className="w-5 h-5" />;
    case 'Layers':
      return <Layers className="w-5 h-5" />;
    case 'ShieldCheck':
    default:
      return <ShieldCheck className="w-5 h-5" />;
  }
};

/** Groups IT services into the filter categories (by known id or stored category). */
function getITServiceGroup(svc: ITService): string {
  const category = (svc as any).category;
  if (['web-development', 'mobile-development', 'business-software'].includes(svc.id) || category === 'software') return 'Web & Apps';
  if (['erp', 'pos', 'automation', 'it-consulting'].includes(svc.id) || category === 'enterprise') return 'ERP & POS Core';
  if (['cloud-solutions', 'ai-solutions', 'maintenance-support'].includes(svc.id) || category === 'infrastructure') return 'Cloud, AI & SLA';
  return 'Other IT Services';
}

export const ITServicesSection: React.FC<ITServicesSectionProps> = ({
  onSelectService,
  onRequestQuote,
  onStartProject,
}) => {
  const { services: rawServices } = useFirestoreDataContext();

  const allServices = useMemo<ITService[]>(() => {
    if (rawServices && rawServices.length > 0) {
      const itServices = rawServices.filter(
        (s) => isSameDivision(s.division, 'it') || isSameDivision((s as any).divisionId, 'it')
      );
      if (itServices.length > 0) {
        return itServices.map((s) => ({
          id: s.id,
          name: s.name,
          images: toServiceDetails(s as unknown as Record<string, any>).images,
          price: getServiceStartingPrice(s as unknown as Record<string, any>),
          tagline: (s as any).tagline || s.description?.slice(0, 60) || '',
          iconName: (s as any).iconName || 'Code2',
          shortDescription: s.description || '',
          fullDescription: (s as any).detailedDescription || s.description || '',
          badge: s.badge || 'Enterprise Architecture',
          problemsSolved: (s as any).problemsSolved || ['Legacy technical debt', 'Scalability bottlenecks'],
          features: s.features || ['High-availability microservices', 'Automated CI/CD pipelines'],
          process: (s as any).process || [
            { step: '01', title: 'Architecture Review', desc: 'Comprehensive blueprint design' },
            { step: '02', title: 'Agile Sprints', desc: 'Bi-weekly builds with testing' },
            { step: '03', title: 'Production Deploy', desc: 'Zero-downtime cutover & monitoring' },
          ],
          technologies: (s as any).technologies || [
            { name: 'TypeScript', category: 'Core Language' },
            { name: 'React', category: 'Frontend' },
            { name: 'Node.js', category: 'Backend' },
            { name: 'PostgreSQL', category: 'Database' },
          ],
          caseStudy: (s as any).caseStudy || {
            title: `${s.name} Implementation`,
            client: 'Enterprise Client',
            impact: '99.99% Uptime & 4x Throughput',
            techSummary: 'Engineered for high concurrency and zero latency.',
            metrics: [
              { label: 'Speed', value: '<50ms' },
              { label: 'Uptime', value: '99.99%' },
            ],
          },
          startingTimeline: (s as any).startingTimeline || (s as any).turnaround || (s as any).leadTime || '2-4 Weeks',
          recommendedFor: (s as any).recommendedFor || 'Enterprises needing high reliability',
        }));
      }
    }
    return [];
  }, [rawServices]);

  // Search, category and price come from the page-wide filter bar.
  const filteredServices = useDivisionFilteredItems('it-services', allServices, (svc) => ({
    title: svc.name,
    category: getITServiceGroup(svc),
    price: svc.price,
    text: [svc.tagline, svc.shortDescription, svc.badge, ...svc.features].join(' '),
  }));

  if (allServices.length === 0) {
    return null;
  }

  return (
    <SectionContainer id="services" background="white" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="max-w-3xl">
          <ScrollReveal direction="up">
            <Caption className="text-[#0052FF] mb-2 block font-mono">
              Engineering Disciplines & Solutions
            </Caption>
            <H2 className="text-slate-900">
              10 Specialized IT Services Designed for Enterprise Resilience
            </H2>
          </ScrollReveal>
        </div>

      </div>

      {/* Grid of 10 Services */}
      {filteredServices.length === 0 && <DivisionFilterEmptyState label="services" />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards show image, title, starting price and View; full details open in the IT modal. */}
        {filteredServices.map((service) => (
          <ServiceTile
            key={service.id}
            title={service.name}
            images={service.images || []}
            onView={() => onSelectService(service)}
            price={service.price}
          />
        ))}
      </div>

      {/* Direct Quote Request Banner */}
      <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
            Have a custom requirement?
          </span>
          <h3 className="font-display text-lg sm:text-xl font-bold text-white">
            Need a Multi-Service Architecture or Legacy System Migration?
          </h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Our Principal Architects provide complimentary 30-minute scoping sessions to evaluate codebases, database schemas, and cloud deployment plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => onStartProject()}
            className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs"
          >
            Start a Project
          </Button>
          <Button
            variant="electric"
            size="md"
            onClick={() => onRequestQuote()}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs font-bold shadow-lg shadow-blue-500/20"
          >
            Request a Quote
          </Button>
        </div>
      </div>
    </SectionContainer>
  );
};
