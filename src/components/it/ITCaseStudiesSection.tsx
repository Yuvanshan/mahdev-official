import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  ArrowRight,
  Code2,
  Building,
  Quote,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { IT_CASE_STUDIES, ITCaseStudy } from '../../data/itData';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';

interface ITCaseStudiesSectionProps {
  onStartProject: () => void;
  onRequestQuote: () => void;
}

export const ITCaseStudiesSection: React.FC<ITCaseStudiesSectionProps> = ({
  onStartProject,
  onRequestQuote,
}) => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const activeCase = IT_CASE_STUDIES[activeCaseIndex];

  return (
    <SectionContainer id="case-studies" background="white" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block font-mono">
            Proven Engineering Deployments
          </Caption>
          <H2 className="text-slate-900">
            Case Studies: High-Impact ROI Delivered Across Asia
          </H2>
          <Body className="text-slate-600 mt-2">
            Explore how our custom software, ERPs, and cloud modernization projects have transformed high-volume logistics, garment manufacturing, and digital insurance.
          </Body>
        </ScrollReveal>
      </div>

      {/* Case Study Switcher Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 pb-3 border-b border-slate-200">
        {IT_CASE_STUDIES.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => setActiveCaseIndex(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeCaseIndex === idx
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{c.client}</span>
          </button>
        ))}
      </div>

      {/* Active Case Study Spotlight Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Narrative & Metrics */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-[#0052FF] uppercase tracking-wider">
                {activeCase.clientIndustry} • {activeCase.year}
              </span>
              <Badge variant="electric" size="sm" className="font-mono text-[10px]">
                Production Validated
              </Badge>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {activeCase.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeCase.summary}
            </p>

            {/* The Challenge */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                The Engineering Challenge
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeCase.challenge}
              </p>
            </div>

            {/* Testimonial */}
            {activeCase.testimonial && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <Quote className="w-4 h-4 text-blue-600" />
                <p className="text-xs italic text-slate-700 leading-relaxed">
                  "{activeCase.testimonial.quote}"
                </p>
                <div className="text-[11px] font-semibold text-slate-900">
                  {activeCase.testimonial.author} —{' '}
                  <span className="font-normal text-slate-500">{activeCase.testimonial.role}</span>
                </div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <Button
              variant="electric"
              size="sm"
              onClick={onRequestQuote}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Request Similar Project Quote
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onStartProject}
              className="text-xs"
            >
              Start a Project
            </Button>
          </div>
        </div>

        {/* Right Column: Architecture & Metrics Sidebar */}
        <div className="lg:col-span-5 bg-slate-950 text-white p-6 sm:p-8 space-y-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800">
          <div className="space-y-5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">
                Key Quantifiable Results
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 mt-3">
                {activeCase.results.map((r, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-mono text-2xl font-bold text-emerald-400">
                      {r.metric}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{r.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Stack */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5" />
                <span>Deployed Architecture Stack</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeCase.architecture.map((arch, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300"
                  >
                    {arch}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Verified Customer Implementation</span>
            <span className="text-emerald-400">● 100% Deployed</span>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};
