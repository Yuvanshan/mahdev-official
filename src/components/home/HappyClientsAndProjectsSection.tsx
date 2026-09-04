import React from 'react';
import { Users, Briefcase, Globe, Handshake, ArrowRight } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { ScrollReveal } from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface HappyClientsAndProjectsSectionProps {
  onExploreProjects?: () => void;
  onExploreClients?: () => void;
}

export const HappyClientsAndProjectsSection: React.FC<HappyClientsAndProjectsSectionProps> = ({
  onExploreProjects,
  onExploreClients,
}) => {
  const { trustedCompanies, portfolio } = useFirestoreDataContext();

  if (trustedCompanies.length === 0 && portfolio.length === 0) {
    return null;
  }

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
    <SectionContainer
      id="happy-clients-projects"
      background="white"
      paddingY="xl"
      hasBorderBottom
    >
      <ScrollReveal direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0052FF] block mb-2">
              Performance Metrics
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Measurable Scale & Reach
            </h2>
          </div>
        </div>
      </ScrollReveal>

      {/* 4-Stat Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
        {stats.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <ScrollReveal key={item.id} direction="up" delay={idx * 0.05}>
              <div className="p-6 rounded-xl bg-slate-50/70 border border-slate-200/90 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center mb-3">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="font-display text-3xl font-bold text-slate-950 mb-1">
                    {item.value}
                  </div>
                  <h3 className="font-semibold text-xs text-slate-800 uppercase tracking-wide">
                    {item.label}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {item.subtext}
                </p>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Trusted Client Logos */}
      {trustedCompanies && trustedCompanies.length > 0 && (
        <div className="pt-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block text-center mb-5">
            Trusted By Organizations Across Sri Lanka
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 items-center">
            {trustedCompanies.slice(0, 6).map((company, idx) => (
              <ScrollReveal key={company.id} direction="up" delay={idx * 0.03}>
                <div
                  onClick={onExploreClients}
                  className={`p-3 rounded-lg bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:border-blue-300 transition-colors flex flex-col items-center justify-center text-center h-20 ${
                    onExploreClients ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {company.logoUrl ? (
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
              </ScrollReveal>
            ))}
          </div>

          {onExploreClients && (
            <div className="mt-6 text-center">
              <button
                onClick={onExploreClients}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0052FF] hover:underline cursor-pointer"
              >
                <span>View All Client Partners</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </SectionContainer>
  );
};
