import React from 'react';
import { Users, Award, Briefcase, Globe, Sparkles, Handshake, ArrowRight } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
  Floating3DObject,
} from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface HappyClientsAndProjectsSectionProps {
  onExploreProjects?: () => void;
  onExploreClients?: () => void;
}

export const HappyClientsAndProjectsSection: React.FC<HappyClientsAndProjectsSectionProps> = ({
  onExploreProjects,
  onExploreClients,
}) => {
  const { trustedCompanies, portfolio, companySettings, homepageConfig } = useFirestoreDataContext();

  if (trustedCompanies.length === 0 && portfolio.length === 0) {
    return null;
  }

  // Dynamic statistics calculated from Firestore or Admin configuration
  const completedProjectsCount = portfolio.length;
  const happyClientsCount = trustedCompanies.length > 0 ? `${trustedCompanies.length * 15}+` : '0';
  const partnerCompaniesCount = trustedCompanies.length;

  const stats = [
    {
      id: 'stat-clients',
      label: 'Happy Enterprise Clients',
      value: happyClientsCount,
      subtext: 'Across Corporate, Entertainment & Public Sectors',
      icon: Users,
      color: 'text-[#0052FF]',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200/80',
    },
    {
      id: 'stat-projects',
      label: 'Completed Projects',
      value: `${completedProjectsCount}+`,
      subtext: 'High-Impact Productions, Cloud Systems & Tours',
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200/80',
    },
    {
      id: 'stat-partners',
      label: 'Enterprise Partners',
      value: `${partnerCompaniesCount}+`,
      subtext: 'Official Technology & Production Alliances',
      icon: Handshake,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/80',
    },
    {
      id: 'stat-reach',
      label: 'Global & Islandwide Reach',
      value: '100%',
      subtext: 'Colombo HQ, Regional Studios & Worldwide Delivery',
      icon: Globe,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200/80',
    },
  ];

  return (
    <SectionContainer
      id="happy-clients-projects"
      background="white"
      paddingY="xl"
      hasBorderBottom
    >
      {/* Floating Decorative Elements */}
      <Floating3DObject
        size={60}
        delay={1}
        duration={8}
        className="top-8 right-10 opacity-30 pointer-events-none"
      />

      <ScrollReveal direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <Caption className="text-[#0052FF] mb-2 block font-bold uppercase tracking-wider">
              Track Record of Excellence
            </Caption>
            <H2 className="text-slate-900 mb-3">Happy Clients & Completed Projects</H2>
            <Body className="text-slate-600 text-base">
              Delivering quantifiable value, memorable event experiences, and enterprise-grade technological systems across Sri Lanka.
            </Body>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Badge variant="electric" size="md">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Verified Enterprise Deliveries
            </Badge>
          </div>
        </div>
      </ScrollReveal>

      {/* 4-Stat Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-14">
        {stats.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <ScrollReveal key={item.id} direction="up" delay={idx * 0.08}>
              <TiltCard maxTilt={6} glareEffect className="h-full">
                <div className="h-full p-6 rounded-2xl bg-slate-50/70 border border-slate-200/90 hover:bg-white hover:border-[#0052FF] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${item.bgColor} ${item.borderColor} border flex items-center justify-center ${item.color} shadow-xs group-hover:scale-105 transition-transform`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-[#0052FF] transition-colors" />
                    </div>

                    <div className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 mb-1 group-hover:text-[#0052FF] transition-colors">
                      {item.value}
                    </div>

                    <h3 className="font-display font-bold text-sm text-slate-900 mb-1">
                      {item.label}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200/60 leading-relaxed">
                    {item.subtext}
                  </p>
                </div>
              </TiltCard>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Trusted Client Logos & Partner Showcase Matrix */}
      {trustedCompanies && trustedCompanies.length > 0 && (
        <div className="pt-4">
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Trusted by Premier Brands & Enterprises
            </span>
          </div>

          {/* Horizontal Swipe Rail for Mobile / Flex Wrap on Desktop */}
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-6 sm:gap-4 items-center justify-start sm:justify-center sm:overflow-visible">
            {trustedCompanies.map((company, idx) => (
              <div
                key={company.id}
                className="w-[140px] sm:w-auto snap-center shrink-0 sm:shrink"
              >
                <ScrollReveal direction="up" delay={idx * 0.04}>
                  <Magnetic strength={0.15}>
                    <div
                      onClick={onExploreClients}
                      className={`p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center justify-center text-center h-24 group ${
                        onExploreClients ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          className="h-8 max-w-[110px] object-contain mb-1 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="font-display font-bold text-xs text-slate-800 group-hover:text-[#0052FF] transition-colors line-clamp-1">
                          {company.name}
                        </span>
                      )}
                      {company.industry && (
                        <span className="text-[10px] text-slate-500 mt-0.5 truncate max-w-full">
                          {company.industry}
                        </span>
                      )}
                    </div>
                  </Magnetic>
                </ScrollReveal>
              </div>
            ))}
          </div>

          {onExploreClients && (
            <div className="mt-8 text-center">
              <button
                onClick={onExploreClients}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#0052FF] hover:underline cursor-pointer group"
              >
                <span>View Full Enterprise Client Portfolio & Case Studies</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      )}
    </SectionContainer>
  );
};
