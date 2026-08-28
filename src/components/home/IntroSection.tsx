import React from 'react';
import { Layers, ShieldCheck, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import {
  BlurReveal,
  ScrollReveal,
  TiltCard,
  ParallaxContainer,
} from '../motion/MotionWrappers';
import { BRAND_CONFIG } from '../../config/brand';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface IntroSectionProps {
  onLearnMore?: () => void;
}

export const IntroSection: React.FC<IntroSectionProps> = () => {
  const { homepageConfig, companySettings } = useFirestoreDataContext();
  const intro = homepageConfig?.intro || {
    badge: 'Parent Company Architecture',
    headline: 'A Unified Ecosystem of Specialized Industry Leaders',
    subheadline: 'Mahdev Pvt Ltd acts as the strategic and operational holding foundation behind five distinguished business divisions.',
    description: 'From landmark corporate galas and cinematic storytelling to cloud infrastructure, island expeditions, and hardware commerce, Mahdev bridges diverse disciplines into one dependable partner.',
  };

  const companyName = companySettings?.name || 'Mahdev Pvt Ltd';

  return (
    <SectionContainer id="intro" background="white" paddingY="xl" hasBorderBottom>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Column: Sticky Storytelling Narrative */}
        <div className="lg:col-span-6 lg:sticky lg:top-28 space-y-6">
          <ScrollReveal direction="up">
            <div className="inline-flex items-center gap-2">
              <Badge variant="electric" size="sm">
                {intro.badge || 'Parent Company Architecture'}
              </Badge>
            </div>
            <H2 className="text-slate-900 mt-2 mb-4">
              {intro.headline || 'A Unified Ecosystem of Specialized Industry Leaders'}
            </H2>
            {intro.subheadline && (
              <Body className="text-slate-700 text-base font-medium leading-relaxed mb-3">
                {intro.subheadline}
              </Body>
            )}
            <Body className="text-slate-600 text-base leading-relaxed">
              {intro.description ||
                `${companyName} acts as the strategic and operational holding foundation behind five distinguished business divisions. While each division functions with autonomous creative and technical mastery, they share a collective standard of precision, financial resilience, and client devotion.`}
            </Body>

            {/* Key Pillars Checklist with Blur-to-Sharp effect */}
            <BlurReveal delay={0.2} className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-800">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Single Corporate Accountability</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Strict Quality Standards</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Cross-Division Synergy</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-[#0052FF] shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Colombo HQ & Island Reach</span>
              </div>
            </BlurReveal>
          </ScrollReveal>
        </div>

        {/* Right Column: 3D Perspective Corporate Synergy Cards */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ScrollReveal direction="up" delay={0.1}>
            <TiltCard maxTilt={7} className="h-full">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50/90 border border-slate-200/90 h-full flex flex-col justify-between hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-blue-100/90 text-[#0052FF] flex items-center justify-center mb-4 shadow-xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-slate-900 mb-2">
                    5 Specialized Units
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Deep domain specialization in Events, Visual Cinema, Cloud Systems, Luxury Travel, and E-commerce.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                  100% In-house Execution
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <TiltCard maxTilt={7} className="h-full">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50/90 border border-slate-200/90 h-full flex flex-col justify-between hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-blue-100/90 text-[#0052FF] flex items-center justify-center mb-4 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-slate-900 mb-2">
                    Enterprise Governance
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unified financial stability, legal compliance, and strict SLA guarantees backed by parent governance.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                  Established {BRAND_CONFIG.establishedYear}
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <TiltCard maxTilt={7} className="h-full">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50/90 border border-slate-200/90 h-full flex flex-col justify-between hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-blue-100/90 text-[#0052FF] flex items-center justify-center mb-4 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-slate-900 mb-2">
                    Creative & Technical Rigor
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Equipped with 8K cinema gear, concert-grade acoustic arrays, and modern type-safe cloud platforms.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                  High-Fidelity Assets
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.4}>
            <TiltCard maxTilt={7} className="h-full">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50/90 border border-slate-200/90 h-full flex flex-col justify-between hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-blue-100/90 text-[#0052FF] flex items-center justify-center mb-4 shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="font-display text-lg font-bold text-slate-900 mb-2">
                    Proven Track Record
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Thousands of satisfied attendees, corporate delegates, travelers, and platform users nationwide.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                  99.6% Retention
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>
    </SectionContainer>
  );
};
