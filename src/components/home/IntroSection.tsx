import React, { useRef } from 'react';
import { Layers, ShieldCheck, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { BRAND_CONFIG } from '../../config/brand';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { useDeviceMotion } from '../motion/MotionWrappers';

interface IntroSectionProps {
  onLearnMore?: () => void;
}

export const IntroSection: React.FC<IntroSectionProps> = () => {
  const { homepageConfig, companySettings } = useFirestoreDataContext();
  const { reducedMotion, isTouch } = useDeviceMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.1 });
  const yOffset = useTransform(smoothProgress, [0, 1], ['-20px', '20px']);

  const intro = homepageConfig?.intro || {
    badge: 'Parent Company Architecture',
    headline: 'A Unified Enterprise of Specialized Industry Leaders',
    subheadline: 'Mahdev Pvt Ltd acts as the strategic and operational holding foundation behind five distinguished business divisions.',
    description: 'From landmark galas and cinematic storytelling to cloud infrastructure, island expeditions, and hardware commerce, Mahdev bridges diverse disciplines into one dependable partner.',
  };

  const rawHeadline = intro.headline || 'A Unified Enterprise of Specialized Industry Leaders';
  const headline = rawHeadline;

  const companyName = companySettings?.name || 'Mahdev Pvt Ltd';

  const pillars = [
    {
      icon: Layers,
      title: '5 Specialized Units',
      desc: 'Deep domain specialization in Events, Visual Cinema, Cloud Systems, Luxury Travel, and E-commerce.',
      metric: '100% In-house Execution',
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Governance',
      desc: 'Unified financial stability, legal compliance, and strict SLA guarantees backed by parent governance.',
      metric: `Established ${BRAND_CONFIG.establishedYear}`,
    },
    {
      icon: Sparkles,
      title: 'Creative & Technical Rigor',
      desc: 'Equipped with 8K cinema gear, concert-grade acoustic arrays, and modern type-safe cloud platforms.',
      metric: 'High-Fidelity Assets',
    },
    {
      icon: TrendingUp,
      title: 'Proven Track Record',
      desc: 'Thousands of satisfied attendees, delegates, travelers, and platform users nationwide.',
      metric: '99.6% Retention',
    },
  ];

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <ParallelWatermark text="09 // STRUCTURE" />
      <SectionContainer id="intro" background="white" paddingY="xl" hasBorderBottom>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Sticky Storytelling Narrative */}
          <div className="lg:col-span-6 lg:sticky lg:top-28 space-y-6">
            <div className="inline-flex items-center gap-2">
              <Badge variant="electric" size="sm">
                {intro.badge || 'Parent Company Architecture'}
              </Badge>
            </div>
            <H2 className="text-slate-900 mt-2 mb-4">
              {headline}
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

            {/* Key Pillars Checklist */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-800">
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Single Point of Accountability</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Strict Quality Standards</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Cross-Division Synergy</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Colombo HQ & Island Reach</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Enterprise Grid with Parallel Depth */}
          <motion.div
            style={!reducedMotion && !isTouch ? { y: yOffset } : undefined}
            className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
          >
            {pillars.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-base font-bold text-slate-900 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {item.metric}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </SectionContainer>
    </div>
  );
};
