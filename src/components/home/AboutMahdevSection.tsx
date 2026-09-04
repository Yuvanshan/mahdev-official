import React from 'react';
import { Award, ChevronRight, Globe, ShieldCheck, Users } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { Button } from '../ui/Button';
import { ScrollReveal } from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface AboutMahdevSectionProps {
  onExploreDivisions: () => void;
}

export const AboutMahdevSection: React.FC<AboutMahdevSectionProps> = ({ onExploreDivisions }) => {
  const { companySettings, homepageConfig, divisions } = useFirestoreDataContext();

  const establishedYear = companySettings.establishedYear || '2022';
  const divisionCount = divisions.filter((d) => d.status === 'active').length || 5;

  const pillars = [
    {
      icon: Award,
      title: 'Established Foundation',
      stat: `${establishedYear}`,
      desc: 'Incorporated in Sri Lanka with sustained growth across diverse markets.',
    },
    {
      icon: Users,
      title: 'Integrated Units',
      stat: `${divisionCount} Divisions`,
      desc: 'Specialized domain leadership under centralized executive governance.',
    },
    {
      icon: Globe,
      title: 'Islandwide Reach',
      stat: '9 Provinces',
      desc: 'Executing events, media productions, and logistics across the country.',
    },
    {
      icon: ShieldCheck,
      title: 'Quality Standard',
      stat: '100% In-House',
      desc: 'Direct execution, dedicated technical crews, and verified delivery.',
    },
  ];

  return (
    <SectionContainer id="about" background="white" paddingY="xl" hasBorderBottom>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Narrative Column */}
        <div className="lg:col-span-6 space-y-6">
          <ScrollReveal direction="up">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0052FF] block mb-2">
              Corporate Overview
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-4">
              A Multi-Sector Enterprise Built on Quality & Trust
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6">
              Mahdev Group is a Sri Lankan holding enterprise managing autonomous operations across luxury event production, cinema media, software engineering, bespoke travel, and retail commerce.
            </p>

            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700 mb-8">
              <span className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200">
                Turnkey Execution
              </span>
              <span className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200">
                Direct Governance
              </span>
              <span className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200">
                Enterprise Reliability
              </span>
            </div>

            <div>
              <Button
                id="about-divisions-btn"
                variant="electric"
                size="md"
                onClick={onExploreDivisions}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="font-semibold cursor-pointer"
              >
                Explore Divisions
              </Button>
            </div>
          </ScrollReveal>
        </div>

        {/* Right Matrix: 4 Clean Minimal Cards */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal key={pillar.title} direction="up" delay={idx * 0.08}>
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-blue-300 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-display text-2xl font-bold text-slate-900 mb-1">
                    {pillar.stat}
                  </div>
                  <h3 className="font-semibold text-xs text-slate-800 mb-1.5 uppercase tracking-wide">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
};
