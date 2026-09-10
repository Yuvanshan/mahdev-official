import React, { useRef } from 'react';
import { Award, ChevronRight, Globe, ShieldCheck, Users, Phone } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { Button } from '../ui/Button';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getTelLink } from '../../config/company';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { useDeviceMotion } from '../motion/MotionWrappers';

interface AboutMahdevSectionProps {
  onExploreDivisions: () => void;
}

export const AboutMahdevSection: React.FC<AboutMahdevSectionProps> = ({ onExploreDivisions }) => {
  const { companySettings, homepageConfig, divisions } = useFirestoreDataContext();
  const establishedYear = companySettings?.establishedYear || '2022';
  const hotline = companySettings?.primaryPhone || '075 092 8078';
  const intro = homepageConfig?.intro;
  const badge = intro?.badge || 'Enterprise Architecture';
  const headline = intro?.headline || 'A Unified Enterprise of Specialized Industry Leaders';
  const description =
    intro?.description ||
    companySettings?.description ||
    'Mahdev Group unites luxury event production, cinema filmmaking, custom software engineering, Ceylon travel, and retail commerce under unified governance and strict quality standards.';

  const { reducedMotion, isTouch } = useDeviceMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.1 });
  const yLeft = useTransform(smoothProgress, [0, 1], ['-10px', '25px']);
  const yCol1 = useTransform(smoothProgress, [0, 1], ['-24px', '24px']);
  const yCol2 = useTransform(smoothProgress, [0, 1], ['24px', '-24px']);

  const divisionCount = divisions && divisions.length > 0 ? `${divisions.length} Units` : '5 Units';

  const col1Metrics = [
    {
      value: establishedYear,
      label: 'Established',
      caption: 'Incorporated in Sri Lanka',
      icon: Award,
    },
    {
      value: '9 Provinces',
      label: 'Nationwide Reach',
      caption: 'Turnkey Islandwide Operations',
      icon: Globe,
    },
  ];

  const col2Metrics = [
    {
      value: divisionCount,
      label: 'Specialized Units',
      caption: 'Events, Media, IT, Travel, Mart',
      icon: Users,
    },
    {
      value: '100%',
      label: 'Direct Delivery',
      caption: 'Verified In-House Technical Teams',
      icon: ShieldCheck,
    },
  ];

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <ParallelWatermark text="02 // ECOSYSTEM" />
      <SectionContainer id="about" background="white" paddingY="xl" hasBorderBottom>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Narrative Column - Parallel Drift */}
          <motion.div
            style={!reducedMotion && !isTouch ? { y: yLeft } : undefined}
            className="lg:col-span-6 space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-mono uppercase tracking-wider text-blue-700">
              <span>{badge}</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              {headline}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                id="about-divisions-btn"
                variant="electric"
                size="md"
                onClick={onExploreDivisions}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="font-bold cursor-pointer"
              >
                Explore All Divisions
              </Button>

              <a
                href={getTelLink(hotline)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Direct: {hotline}</span>
              </a>
            </div>
          </motion.div>

          {/* Right Column: Two Staggered Parallel Columns */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Column 1 - Negative Parallel Drift */}
            <motion.div
              style={!reducedMotion && !isTouch ? { y: yCol1 } : undefined}
              className="space-y-4"
            >
              {col1Metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-0.5">
                      {m.value}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mb-0.5">
                      {m.label}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {m.caption}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Column 2 - Positive Parallel Drift */}
            <motion.div
              style={!reducedMotion && !isTouch ? { y: yCol2 } : undefined}
              className="space-y-4 sm:pt-6"
            >
              {col2Metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:border-blue-400 hover:bg-white transition-all shadow-xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-0.5">
                      {m.value}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mb-0.5">
                      {m.label}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {m.caption}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
};
