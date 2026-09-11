import React, { useRef } from 'react';
import { Users, Briefcase, Globe, Handshake, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { useDeviceMotion } from '../motion/MotionWrappers';

interface HappyClientsAndProjectsSectionProps {
  onExploreProjects?: () => void;
  onExploreClients?: () => void;
}

export const HappyClientsAndProjectsSection: React.FC<HappyClientsAndProjectsSectionProps> = (props) => {
  const { trustedCompanies, portfolio } = useFirestoreDataContext();

  if (trustedCompanies.length === 0 && portfolio.length === 0) {
    return null;
  }

  return (
    <HappyClientsAndProjectsSectionContent
      {...props}
      trustedCompanies={trustedCompanies}
      portfolio={portfolio}
    />
  );
};

const HappyClientsAndProjectsSectionContent: React.FC<
  HappyClientsAndProjectsSectionProps & {
    trustedCompanies: any[];
    portfolio: any[];
  }
> = ({ onExploreProjects, onExploreClients, trustedCompanies, portfolio }) => {
  const { reducedMotion, isTouch } = useDeviceMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.1 });
  const yEven = useTransform(smoothProgress, [0, 1], ['-15px', '15px']);
  const yOdd = useTransform(smoothProgress, [0, 1], ['15px', '-15px']);

  const completedProjectsCount = portfolio.length || 1800;
  const happyClientsCount = trustedCompanies.length > 0 ? `${trustedCompanies.length * 15}+` : '450+';
  const partnerCompaniesCount = trustedCompanies.length || 24;

  const stats = [
    {
      id: 'stat-clients',
      label: 'Clients Served',
      value: happyClientsCount,
      subtext: 'Corporate & private sectors',
      icon: Users,
    },
    {
      id: 'stat-projects',
      label: 'Projects Completed',
      value: `${completedProjectsCount}+`,
      subtext: 'Events, media & software',
      icon: Briefcase,
    },
    {
      id: 'stat-partners',
      label: 'Brand Partners',
      value: `${partnerCompaniesCount}+`,
      subtext: 'Active enterprise alliances',
      icon: Handshake,
    },
    {
      id: 'stat-reach',
      label: 'Provinces Covered',
      value: '9 / 9',
      subtext: 'Full Sri Lankan delivery',
      icon: Globe,
    },
  ];

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <ParallelWatermark text="06 // SCALE" />
      <SectionContainer
        id="happy-clients-projects"
        background="white"
        paddingY="xl"
        hasBorderBottom
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 block mb-2 font-semibold">
              Performance Metrics
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Measurable Scale & Reach
            </h2>
          </div>
        </div>

        {/* 4-Stat Metric Cards Grid with Parallel Motion */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {stats.map((item, idx) => {
            const IconComp = item.icon;
            const yOffset = idx % 2 === 0 ? yEven : yOdd;

            return (
              <motion.div
                key={item.id}
                style={!reducedMotion && !isTouch ? { y: yOffset } : undefined}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between shadow-2xs hover:border-blue-400 hover:bg-white transition-all"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="font-display text-3xl font-bold text-slate-950 mb-1">
                    {item.value}
                  </div>
                  <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wide">
                    {item.label}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  {item.subtext}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Trusted Client Logos */}
        {trustedCompanies && trustedCompanies.length > 0 && (
          <div className="relative z-10 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block text-center mb-6">
              Verified Client Partners Across Sri Lanka
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 items-center">
              {trustedCompanies.slice(0, 6).map((company) => (
                <div
                  key={company.id}
                  onClick={onExploreClients}
                  className={`p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-blue-300 transition-colors flex flex-col items-center justify-center text-center h-20 ${
                    onExploreClients ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {company.logoUrl && company.logoUrl.trim() !== '' ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="h-7 max-w-[100px] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-semibold text-xs text-slate-800 line-clamp-1">
                      {company.name}
                    </span>
                  )}
                  {company.industry && (
                    <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-full">
                      {company.industry}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {onExploreClients && (
              <div className="mt-6 text-center">
                <button
                  onClick={onExploreClients}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <span>View All Client Partners</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </SectionContainer>
    </div>
  );
};
