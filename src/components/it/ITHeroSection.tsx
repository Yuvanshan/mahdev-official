import React from 'react';
import {
  Terminal,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  Code2,
  Server,
  Layers,
  CheckCircle2,
  Sparkles,
  GitBranch,
  Activity,
  Lock,
  Phone,
} from 'lucide-react';
import { getTelLink } from '../../config/company';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface ITHeroSectionProps {
  onRequestQuote: () => void;
  onStartProject: () => void;
  onContactTeam: () => void;
  onExploreServices: () => void;
}

export const ITHeroSection: React.FC<ITHeroSectionProps> = ({
  onRequestQuote,
  onStartProject,
  onContactTeam,
  onExploreServices,
}) => {
  const { divisions, companySettings } = useFirestoreDataContext();

  const itDiv = divisions?.find(
    (d) =>
      d.id === 'it' ||
      d.id === 'it-solutions' ||
      d.slug === 'it' ||
      d.slug === 'it-solutions'
  );

  const hotline =
    (itDiv as any)?.contactPhone ||
    (itDiv as any)?.contactNumber ||
    companySettings?.primaryPhone ||
    '075 092 8078';

  const badgeText =
    (itDiv as any)?.hero?.badge ||
    itDiv?.badge ||
    'MAHDEV IT & SOLUTIONS';

  const headline =
    (itDiv as any)?.heroHeadline ||
    (itDiv as any)?.hero?.title ||
    itDiv?.name ||
    'Enterprise Software, Cloud & AI Engineered for Uncompromising Scale';

  const subheadline =
    (itDiv as any)?.heroSubheadline ||
    (itDiv as any)?.hero?.subtitle ||
    itDiv?.description ||
    'We design, build, and maintain mission-critical digital systems—from custom ERPs and sub-second POS terminals to high-concurrency web platforms, native mobile apps, and private generative AI agents.';

  const statsList =
    (itDiv as any)?.stats && (itDiv as any).stats.length > 0
      ? (itDiv as any).stats
      : [
          { value: '100%', label: 'Source IP Ownership' },
          { value: '<50ms', label: 'Target Latency SLA' },
          { value: 'Zero-Trust', label: 'ISO 27001 / SOC 2 Ready' },
        ];
  return (
    <div className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800">
      {/* High-tech Blueprint Matrix Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 pointer-events-none" />

      {/* Radial Blue Glow Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <ScrollReveal direction="up">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="electric" size="sm" className="bg-[#0052FF]/20 text-[#60A5FA] border border-[#0052FF]/40 font-mono text-[11px]">
                  <Cpu className="w-3.5 h-3.5 mr-1" />
                  {badgeText}
                </Badge>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Production Ready • 99.99% SLA
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {headline}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mt-4">
                {subheadline}
              </p>
            </ScrollReveal>

            {/* 3 Primary CTAs */}
            <ScrollReveal direction="up" delay={0.1}>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="electric"
                  size="lg"
                  onClick={onRequestQuote}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-lg shadow-blue-600/30 text-xs sm:text-sm font-semibold"
                >
                  Request a Quote
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={onStartProject}
                  leftIcon={<GitBranch className="w-4 h-4 text-blue-400" />}
                  className="border-slate-700 bg-slate-900/80 text-white hover:bg-slate-800 hover:border-slate-600 text-xs sm:text-sm font-semibold"
                >
                  Start a Project
                </Button>

                <a
                  href={getTelLink(hotline)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 text-xs sm:text-sm font-semibold hover:border-blue-400 hover:text-white transition-all backdrop-blur-sm"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{hotline}</span>
                </a>
              </div>
            </ScrollReveal>

            {/* System Trust Pillars */}
            <ScrollReveal direction="up" delay={0.2}>
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-left">
                {statsList.slice(0, 3).map((st: any, idx: number) => (
                  <div key={idx}>
                    <div className="font-mono text-xl sm:text-2xl font-bold text-white">{st.value}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{st.label}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Live Interactive Tech Terminal Card */}
          <div className="lg:col-span-5">
            <ScrollReveal direction="left" delay={0.15}>
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      mahdev-it-engine :: stack_v2026.ts
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    LIVE CLUSTER
                  </span>
                </div>

                {/* Code Body */}
                <div className="p-5 font-mono text-xs text-slate-300 space-y-3 leading-relaxed bg-slate-950/60 select-none">
                  <div>
                    <span className="text-blue-400">const</span>{' '}
                    <span className="text-amber-300">enterpriseSystem</span> ={' '}
                    <span className="text-blue-400">await</span>{' '}
                    <span className="text-emerald-400">MahdevIT</span>.
                    <span className="text-sky-300">architect</span>({'{'}
                  </div>

                  <div className="pl-4 space-y-1 text-slate-400">
                    <div>
                      <span className="text-indigo-300">tier</span>:{' '}
                      <span className="text-emerald-300">'MISSION_CRITICAL'</span>,
                    </div>
                    <div>
                      <span className="text-indigo-300">services</span>: [
                      <span className="text-amber-200">'ERP'</span>,{' '}
                      <span className="text-amber-200">'Next.js'</span>,{' '}
                      <span className="text-amber-200">'Cloud_AWS'</span>,{' '}
                      <span className="text-amber-200">'Private_LLM'</span>],
                    </div>
                    <div>
                      <span className="text-indigo-300">database</span>:{' '}
                      <span className="text-emerald-300">'PostgreSQL_Multi_AZ'</span>,
                    </div>
                    <div>
                      <span className="text-indigo-300">zeroDowntimeDeploy</span>:{' '}
                      <span className="text-cyan-300">true</span>,
                    </div>
                    <div>
                      <span className="text-indigo-300">uptimeSLA</span>:{' '}
                      <span className="text-cyan-300">0.9999</span>,
                    </div>
                  </div>

                  <div>
                    {'}'});
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cluster healthy (14 nodes active)</span>
                    </span>
                    <button
                      onClick={onExploreServices}
                      className="text-blue-400 hover:text-blue-300 underline font-sans text-xs cursor-pointer"
                    >
                      View 10 Services ↓
                    </button>
                  </div>
                </div>

                {/* Micro Tech Matrix Quick Badges */}
                <div className="p-4 bg-slate-900 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
                  <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                    Next.js 15
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                    Flutter
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                    Python RAG
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                    AWS EKS
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                    PostgreSQL
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                    Docker
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};
