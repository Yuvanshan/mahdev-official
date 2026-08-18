import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { IconRenderer } from '../ui/IconRenderer';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
  BlurReveal,
} from '../motion/MotionWrappers';
import { DIVISION_LIST } from '../../config/divisions';

interface DivisionsSectionProps {
  onNavigate: (route: string) => void;
}

export const DivisionsSection: React.FC<DivisionsSectionProps> = ({ onNavigate }) => {
  return (
    <SectionContainer
      id="divisions"
      background="subtle"
      paddingY="xl"
      hasBorderBottom
    >
      <ScrollReveal direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <Caption className="text-[#0052FF] mb-2 block">Our Specialized Portfolio</Caption>
            <H2 className="text-slate-900 mb-3">Five Distinct Business Divisions</H2>
            <Body className="text-slate-600 text-base">
              Each enterprise division operates with specialized domain mastery, offering distinct services while adhering to the core governance, technical precision, and reliability of Mahdev Pvt Ltd.
            </Body>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Badge variant="electric" size="md">
              5 Operating Divisions
            </Badge>
          </div>
        </div>
      </ScrollReveal>

      {/* Grid of the 5 Divisions with 3D Perspective Tilt Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {DIVISION_LIST.map((division, idx) => (
          <ScrollReveal key={division.id} direction="up" delay={idx * 0.08}>
            <TiltCard
              id={`division-card-${division.id}`}
              maxTilt={9}
              glareEffect
              onClick={() => onNavigate(division.route)}
              className="h-full cursor-pointer"
            >
              <div className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 p-7 shadow-xs hover:border-[#0052FF] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden h-full">
                {/* Top active hover strip */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#0052FF] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                <div>
                  {/* Header with Icon and Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-13 h-13 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center transition-all duration-300 group-hover:bg-[#0052FF] group-hover:text-white group-hover:shadow-md group-hover:shadow-blue-500/25 group-hover:scale-105">
                      <IconRenderer name={division.iconName} className="w-6 h-6" />
                    </div>
                    <Badge variant="electric" size="sm">
                      {division.badge}
                    </Badge>
                  </div>

                  {/* Division Title & Tagline */}
                  <h3 className="font-display text-xl font-bold text-slate-900 mb-1 group-hover:text-[#0052FF] transition-colors">
                    {division.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#0052FF] mb-3">
                    {division.tagline}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {division.description}
                  </p>

                  {/* Core Service Highlights Preview */}
                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Core Capabilities:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {division.coreServices.slice(0, 3).map((service, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-700 group-hover:border-blue-200 transition-colors"
                        >
                          <span className="w-1 h-1 rounded-full bg-[#0052FF]" />
                          <span>{service.title.split('&')[0]}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer CTA & Stat Preview */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-500">
                    {division.stats[0]?.value} {division.stats[0]?.label}
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052FF] group-hover:translate-x-1 transition-transform">
                    <span>Explore {division.shortName}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}

        {/* 6th Card: Centralized Holding Governance in 3D */}
        <ScrollReveal direction="up" delay={0.4}>
          <TiltCard maxTilt={8} glareEffect className="h-full">
            <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white border border-slate-800 p-7 shadow-xl h-full">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-xl bg-blue-600/25 border border-blue-400/30 text-blue-400 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-blue-900/70 text-blue-300 border-blue-700/60" size="sm">
                    Holding Enterprise
                  </Badge>
                </div>

                <h3 className="font-display text-xl font-bold text-white mb-2">
                  Mahdev Synergy & Governance
                </h3>
                <p className="text-xs font-semibold text-blue-400 mb-3">
                  Centralized Quality & Operational Support
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Unifying financial resilience, security compliance, technology leadership, and executive accountability so our five divisions deliver consistent excellence.
                </p>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center justify-between font-medium">
                    <span>Headquarters</span>
                    <span className="text-white">Colombo, Sri Lanka</span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span>Operational Scope</span>
                    <span className="text-blue-400">Island-wide & Global</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-blue-300 font-semibold">
                <span>Established 2018</span>
                <span className="flex items-center gap-1 text-white">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>1 Parent Vision</span>
                </span>
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>
      </div>
    </SectionContainer>
  );
};
