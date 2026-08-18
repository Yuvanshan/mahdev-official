import React from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Code2,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Smartphone,
  Building2,
  Receipt,
  Cloud,
  Cpu,
  Compass,
  ShieldCheck,
  Clock,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { ITService } from '../../data/itData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ITServiceDetailModalProps {
  service: ITService | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: (service: ITService) => void;
  onStartProject: (service: ITService) => void;
  onContactTeam: (service: ITService) => void;
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

export const ITServiceDetailModal: React.FC<ITServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onRequestQuote,
  onStartProject,
  onContactTeam,
}) => {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              {getServiceIcon(service.iconName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-white">
                  {service.name}
                </h3>
                {service.badge && (
                  <Badge variant="electric" size="sm" className="bg-[#0052FF]/30 text-blue-300 text-[10px]">
                    {service.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">{service.tagline}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8 text-slate-800">
          {/* 1. HERO & FULL DESCRIPTION */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0052FF]">
              Engineering Overview
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {service.fullDescription}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Typical Delivery: {service.startingTimeline}</span>
              </span>
              <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Recommended for: {service.recommendedFor}</span>
              </span>
            </div>
          </div>

          {/* 2. PROBLEMS SOLVED */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Core Business Problems Solved</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {service.problemsSolved.map((prob, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                  <span className="text-rose-500 font-bold mt-0.5">•</span>
                  <span>{prob}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. CORE TECHNICAL CAPABILITIES & FEATURES */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#0052FF]" />
              <span>Key Technical Features & Architecture</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {service.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. LIFECYCLE / PROCESS STEPS */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Delivery Process & Milestones</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {service.process.map((step, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <div className="font-mono text-xs font-bold text-[#0052FF]">{step.step}</div>
                  <div className="text-xs font-bold text-slate-900">{step.title}</div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. TECHNOLOGY STACK */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-sky-600" />
              <span>Technology Stack & Frameworks</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {service.technologies.map((t, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-mono text-xs flex items-center gap-2 border border-slate-800"
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {t.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. PORTFOLIO & PROVEN ROI */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">
                  Featured Case Study
                </span>
                <h4 className="font-display text-base font-bold text-white mt-0.5">
                  {service.caseStudy.title}
                </h4>
                <p className="text-xs text-slate-400">Client: {service.caseStudy.client}</p>
              </div>
              <div className="hidden sm:block">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Verified Outcome
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {service.caseStudy.impact}
            </p>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-blue-400 font-semibold">Tech Matrix:</span> {service.caseStudy.techSummary}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              {service.caseStudy.metrics.map((m, idx) => (
                <div key={idx} className="text-left">
                  <div className="font-mono text-base sm:text-lg font-bold text-emerald-400">
                    {m.value}
                  </div>
                  <div className="text-[10px] text-slate-400">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer CTAs */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Blueprint
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onContactTeam(service);
              }}
              className="text-xs"
            >
              Contact IT Team
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                onStartProject(service);
              }}
              className="text-xs"
            >
              Start a Project
            </Button>
            <Button
              variant="electric"
              size="sm"
              onClick={() => {
                onClose();
                onRequestQuote(service);
              }}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs shadow-md shadow-blue-500/20 font-bold"
            >
              Request a Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
