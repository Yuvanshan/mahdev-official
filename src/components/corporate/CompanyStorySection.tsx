import React, { useState } from 'react';
import { Target, Sparkles, Award, Shield, Layers, Heart, CheckCircle2, ArrowRight } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
  BlurReveal,
} from '../motion/MotionWrappers';
import { COMPANY_STORY, MISSION_VISION, COMPANY_VALUES } from '../../data/corporateData';
import { IconRenderer } from '../ui/IconRenderer';

interface CompanyStorySectionProps {
  onExploreDivisions?: () => void;
}

export const CompanyStorySection: React.FC<CompanyStorySectionProps> = ({ onExploreDivisions }) => {
  const [activeTab, setActiveTab] = useState<'mission' | 'vision'>('mission');

  return (
    <SectionContainer id="story" background="white" paddingY="xl" hasBorderBottom>
      {/* 1. Main Company Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
        <div className="lg:col-span-7 space-y-6">
          <ScrollReveal direction="up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0052FF] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Mahdev Story</span>
            </div>

            <H2 className="text-slate-900 mt-2 mb-4 font-display text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              {COMPANY_STORY.headline}
            </H2>

            <p className="text-base sm:text-lg font-medium text-slate-700 leading-relaxed">
              {COMPANY_STORY.subheadline}
            </p>

            <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              {COMPANY_STORY.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {onExploreDivisions && (
              <div className="pt-4">
                <Magnetic strength={0.2}>
                  <Button
                    variant="electric"
                    onClick={onExploreDivisions}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Discover Our 5 Divisions
                  </Button>
                </Magnetic>
              </div>
            )}
          </ScrollReveal>
        </div>

        {/* Story Stats Matrix */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {COMPANY_STORY.stats.map((stat, idx) => (
            <ScrollReveal key={stat.label} direction="up" delay={idx * 0.08}>
              <TiltCard maxTilt={8} className="h-full">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 h-full flex flex-col justify-between hover:border-[#0052FF] hover:shadow-lg transition-all">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                      {stat.label}
                    </span>
                    <div className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                      {stat.value}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[#0052FF] mt-3 pt-3 border-t border-slate-200">
                    {stat.subtext}
                  </p>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* 2. Vision & Mission Cinematic Dual-Cards */}
      <div className="mb-20">
        <ScrollReveal direction="up">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Caption className="text-[#0052FF] mb-2 block">Guiding Principles</Caption>
            <H2 className="text-slate-900 mb-3">Vision & Mission</H2>
            <Body className="text-slate-600 text-base">
              The foundational purpose that shapes our multi-sector strategy and daily operational execution.
            </Body>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission Card */}
          <ScrollReveal direction="up" delay={0.1}>
            <TiltCard maxTilt={6} className="h-full">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md h-full flex flex-col justify-between hover:border-[#0052FF] transition-all">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center mb-6">
                    <Target className="w-6 h-6" />
                  </div>
                  <Badge variant="electric" size="sm" className="mb-3">
                    Core Purpose
                  </Badge>
                  <h3 className="font-display text-2xl font-bold text-slate-900 mb-3">
                    {MISSION_VISION.mission.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 font-medium">
                    {MISSION_VISION.mission.statement}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Strategic Commitments
                  </span>
                  {MISSION_VISION.mission.keyPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>

          {/* Vision Card */}
          <ScrollReveal direction="up" delay={0.2}>
            <TiltCard maxTilt={6} className="h-full">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border border-slate-800 shadow-xl h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-400/30 flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <Badge variant="electric" size="sm" className="mb-3 bg-blue-600 text-white">
                    Future Horizon
                  </Badge>
                  <h3 className="font-display text-2xl font-bold text-white mb-3">
                    {MISSION_VISION.vision.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                    {MISSION_VISION.vision.statement}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                    Long-Term Aspirations
                  </span>
                  {MISSION_VISION.vision.keyPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>

      {/* 3. Core Corporate Values */}
      <div>
        <ScrollReveal direction="up">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Caption className="text-[#0052FF] mb-2 block">Our DNA</Caption>
            <H2 className="text-slate-900 mb-3">Core Values</H2>
            <Body className="text-slate-600 text-base">
              The five non-negotiable principles that drive our standards of workmanship, governance, and client relationships.
            </Body>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPANY_VALUES.map((val, idx) => (
            <ScrollReveal key={val.id} direction="up" delay={idx * 0.07}>
              <TiltCard maxTilt={6} className="h-full">
                <div className="p-7 rounded-2xl bg-slate-50/80 border border-slate-200/90 h-full flex flex-col justify-between hover:border-[#0052FF] hover:bg-white hover:shadow-lg transition-all duration-300 group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#0052FF] flex items-center justify-center group-hover:bg-[#0052FF] group-hover:text-white transition-colors duration-300">
                        <IconRenderer name={val.iconName} className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" size="sm" className="text-slate-500 font-mono">
                        0{idx + 1}
                      </Badge>
                    </div>

                    <h3 className="font-display text-lg font-bold text-slate-900 mb-1 group-hover:text-[#0052FF] transition-colors">
                      {val.title}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 mb-3">
                      {val.tagline}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                      {val.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
                    <span>{val.commitment}</span>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
};
