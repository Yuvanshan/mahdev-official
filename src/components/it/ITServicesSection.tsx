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
import { ITService } from '../../data/itData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { isSameDivision } from '../../services/firestore/divisions';
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

export const ITServicesSection: React.FC<ITServicesSectionProps> = ({
  onSelectService,
  onRequestQuote,
  onStartProject,
}) => {
  const { services: rawServices } = useFirestoreDataContext();
  const [activeFilter, setActiveFilter] = useState<'all' | 'software' | 'enterprise' | 'infrastructure'>('all');

  const allServices = useMemo<ITService[]>(() => {
    if (rawServices && rawServices.length > 0) {
      const itServices = rawServices.filter(
        (s) => isSameDivision(s.division, 'it') || isSameDivision((s as any).divisionId, 'it')
      );
      if (itServices.length > 0) {
        return itServices.map((s) => ({
          id: s.id,
          name: s.name,
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

  if (allServices.length === 0) {
    return null;
  }

  const filteredServices = allServices.filter((svc) => {
    if (activeFilter === 'software') {
      return ['web-development', 'mobile-development', 'business-software'].includes(svc.id) || (svc as any).category === 'software';
    }
    if (activeFilter === 'enterprise') {
      return ['erp', 'pos', 'automation', 'it-consulting'].includes(svc.id) || (svc as any).category === 'enterprise';
    }
    if (activeFilter === 'infrastructure') {
      return ['cloud-solutions', 'ai-solutions', 'maintenance-support'].includes(svc.id) || (svc as any).category === 'infrastructure';
    }
    return true;
  });

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

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 self-start md:self-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#0052FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 10 Services
          </button>
          <button
            onClick={() => setActiveFilter('software')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'software'
                ? 'bg-[#0052FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Web & Apps
          </button>
          <button
            onClick={() => setActiveFilter('enterprise')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'enterprise'
                ? 'bg-[#0052FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ERP & POS Core
          </button>
          <button
            onClick={() => setActiveFilter('infrastructure')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'infrastructure'
                ? 'bg-[#0052FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cloud, AI & SLA
          </button>
        </div>
      </div>

      {/* Grid of 10 Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service, idx) => (
          <div
            key={service.id}
            onClick={() => onSelectService(service)}
            className="group relative rounded-2xl bg-white border border-slate-200 hover:border-blue-500/80 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            {/* Subtle top indicator on hover */}
            <div className="absolute top-0 left-6 right-6 h-[2px] bg-transparent group-hover:bg-[#0052FF] rounded-t-full transition-colors" />

            <div className="space-y-4">
              {/* Header: Icon + Badge */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052FF] group-hover:bg-[#0052FF] group-hover:text-white transition-colors flex items-center justify-center border border-blue-100">
                  {getServiceIcon(service.iconName)}
                </div>

                {service.badge && (
                  <Badge variant="default" size="sm" className="text-[10px] font-mono">
                    {service.badge}
                  </Badge>
                )}
              </div>

              {/* Title & Tagline */}
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{service.tagline}</p>
              </div>

              {/* Short Description */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {service.shortDescription}
              </p>

              {/* Problems Solved Teaser (2 items) */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Solves
                </div>
                {service.problemsSolved.slice(0, 2).map((prob, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                    <span className="text-rose-500 font-bold mt-0.5">•</span>
                    <span className="line-clamp-1">{prob}</span>
                  </div>
                ))}
              </div>

              {/* Micro Tech Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {service.technologies.slice(0, 4).map((tech, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200/60"
                  >
                    {tech.name}
                  </span>
                ))}
                {service.technologies.length > 4 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-50">
                    +{service.technologies.length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Action Ribbon */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] font-semibold text-[#0052FF] flex items-center gap-1 group-hover:underline">
                <span>View Full Architecture</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {service.startingTimeline}
              </span>
            </div>
          </div>
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
