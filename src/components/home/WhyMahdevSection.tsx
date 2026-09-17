import React, { useRef } from 'react';
import {
  ShieldCheck,
  Zap,
  Layers,
  PhoneCall,
  CheckCircle2,
  Award,
  Star,
  Clock,
  Heart,
  Building,
  Sparkles,
  Check,
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { EnterpriseStandardGuarantee } from '../../types/cms';
import { getRentalAssetCount } from '../../utils/assetMetrics';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { useDeviceMotion } from '../motion/MotionWrappers';

const ICON_MAP: Record<string, React.ElementType> = {
  ShieldCheck,
  Zap,
  Layers,
  PhoneCall,
  CheckCircle2,
  Award,
  Star,
  Clock,
  Heart,
  Building,
  Sparkles,
  Check,
};

const DEFAULT_GUARANTEES: EnterpriseStandardGuarantee[] = [
  {
    id: 'std-1',
    iconName: 'ShieldCheck',
    title: 'Direct Holding Governance',
    description: 'Zero third-party brokerages. You contract directly with certified in-house technical directors and crews.',
    tag: '100% In-House',
  },
  {
    id: 'std-2',
    iconName: 'Zap',
    title: 'Turnkey Execution Speed',
    description: 'From 3D CAD stage renders and software sprint cycles to immediate nationwide logistics.',
    tag: 'Turnkey SLA',
  },
  {
    id: 'std-3',
    iconName: 'Layers',
    title: '5,000+ Verified Assets',
    description: 'State-of-the-art concert audio, LED walls, German trussing, cinema cameras, and vehicle fleets.',
    tag: 'Fully Owned',
  },
  {
    id: 'std-4',
    iconName: 'PhoneCall',
    title: 'Dedicated Client Support Desk',
    description: 'Dedicated account managers ensuring uninterrupted coordination across all divisions 24/7.',
    tag: 'Always Active',
  },
];

export const WhyMahdevSection: React.FC = () => {
  const { homepageConfig, companySettings, siteSettings, products } = useFirestoreDataContext();
  const whyConfig = homepageConfig?.whyMahdev || {
    badge: 'Operational Standards',
    title: 'Why Leading Brands Trust Mahdev',
    subtitle: 'Rigorous quality control, in-house technical mastery, and clear accountability across every project.',
    enabled: true,
    guarantees: DEFAULT_GUARANTEES,
  };

  if (whyConfig?.enabled === false) {
    return null;
  }

  const rentalCount = getRentalAssetCount(
    products,
    (companySettings as any)?.rentalAssetCount || (siteSettings as any)?.rentalAssetCount
  );

  return (
    <WhyMahdevSectionContent
      whyConfig={whyConfig}
      companyPhone={companySettings?.primaryPhone}
      rentalCount={rentalCount}
    />
  );
};

const WhyMahdevSectionContent: React.FC<{
  whyConfig: any;
  companyPhone?: string;
  rentalCount?: string;
}> = ({ whyConfig, companyPhone, rentalCount = '5,000+' }) => {
  const { reducedMotion, isTouch } = useDeviceMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.1 });
  const yEven = useTransform(smoothProgress, [0, 1], ['-12px', '12px']);
  const yOdd = useTransform(smoothProgress, [0, 1], ['12px', '-12px']);

  const badge = whyConfig?.badge || 'Operational Standards';
  const title = whyConfig?.title || 'The Enterprise Standard';
  const subtitle =
    whyConfig?.subtitle ||
    'Rigorous quality control, in-house technical mastery, and clear accountability across every project.';
  const guarantees = (
    whyConfig?.guarantees && whyConfig.guarantees.length > 0
      ? whyConfig.guarantees
      : DEFAULT_GUARANTEES
  ).map((g: any) => {
    if (g.id === 'std-3') {
      return {
        ...g,
        title: `${rentalCount} Verified Assets`,
      };
    }
    if (g.id === 'std-4' && companyPhone) {
      return {
        ...g,
        title: `Direct Client Line: ${companyPhone}`,
      };
    }
    return g;
  });

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <ParallelWatermark text="05 // STANDARDS" />
      <SectionContainer id="why-mahdev" background="white" paddingY="xl" hasBorderBottom>
        <div className="relative z-10 max-w-2xl mb-8">
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 block mb-1 font-semibold">
            {badge}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {guarantees.map((item, idx) => {
            const Icon = (item.iconName && ICON_MAP[item.iconName]) || ShieldCheck;
            const yOffset = idx % 2 === 0 ? yEven : yOdd;

            return (
              <motion.div
                key={item.id || item.title || idx}
                style={!reducedMotion && !isTouch ? { y: yOffset } : undefined}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-5 sm:p-6 flex flex-col justify-between hover:border-blue-400 hover:bg-white hover:shadow-xs transition-all"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-blue-600">
                  <span className="flex items-center gap-1 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    {item.tag}
                  </span>
                  <span>Verified</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </SectionContainer>
    </div>
  );
};
