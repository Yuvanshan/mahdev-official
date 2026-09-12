import React, { useState } from 'react';
import { CheckCircle2, Sparkles, Layers, Clock, Building2, MapPin, Code2 } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
} from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DivisionId } from '../../types';

interface TimelineCinematicProps {
  initialDivision?: DivisionId | 'all';
}

// Fallback official 2022-2026 milestones
const DEFAULT_MILESTONES = [
  {
    id: 'ms-2022',
    year: '2022',
    title: 'The Beginning',
    description: 'Started SWS Event Management, marking the beginning of our journey in event management and creative experiences.',
    divisionId: 'sws',
    badge: 'Foundational Debut',
    keyOutcome: 'Established SWS Event Management brand.',
  },
  {
    id: 'ms-2023',
    year: '2023',
    title: 'U1 Studio',
    description: 'Launched U1 Studio, expanding our services into professional photography and creative media.',
    divisionId: 'u1',
    badge: 'Creative Media',
    keyOutcome: 'Expanded into cinema media & photography.',
  },
  {
    id: 'ms-2024',
    year: '2024',
    title: 'Islandwide Expansion',
    description: 'Expanded our services across Sri Lanka, bringing our expertise and services to clients nationwide.',
    divisionId: 'all',
    badge: 'National Reach',
    keyOutcome: 'Operations scaled to cover all provinces.',
  },
  {
    id: 'ms-2025',
    year: '2025',
    title: 'IT & Solutions',
    description: 'Introduced IT & Solutions, expanding our capabilities into technology, software, and digital business solutions.',
    divisionId: 'it',
    badge: 'Digital Innovation',
    keyOutcome: 'Launched full-stack IT & software solutions.',
  },
  {
    id: 'ms-2026',
    year: '2026',
    title: 'Mahdev Pvt Ltd',
    description: 'Officially registered Mahdev Pvt Ltd as a private company, bringing our growing services and ventures under one organization.',
    divisionId: 'all',
    badge: 'Company Group',
    keyOutcome: 'Incorporated as a unified private enterprise.',
  },
];

export const TimelineCinematic: React.FC<TimelineCinematicProps> = ({ initialDivision = 'all' }) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(initialDivision);
  const { milestones, homepageConfig } = useFirestoreDataContext();
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>('ms-2026');

  if (homepageConfig.milestones && !homepageConfig.milestones.enabled) {
    return null;
  }

  // Filter ONLY published, non-archived milestones directly from Firestore, or fallback to official
  const sortedMilestones = React.useMemo(() => {
    const published = milestones.filter(
      (m) => m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived' && m.year
    );
    if (published.length >= 3) {
      return [...published].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
    }
    return DEFAULT_MILESTONES;
  }, [milestones]);

  // Filter by division if selected
  const filteredMilestones = sortedMilestones.filter((m) => {
    const div = m.divisionId || (m as any).division;
    return selectedDivision === 'all' || div === selectedDivision || !div || div === 'all';
  });

  const activeMilestone =
    filteredMilestones.find((m) => m.id === activeMilestoneId) ||
    filteredMilestones[filteredMilestones.length - 1] ||
    sortedMilestones[0];

  const meta = homepageConfig.milestones || {
    badge: 'VERIFIED TRACK RECORD',
    title: 'Our Milestones & Trajectory',
    subtitle: 'A chronological journey detailing foundational chapters, division debuts, and institutional expansions from our founding in 2022 to the present.',
  };

  return (
    <SectionContainer id="milestones" background="subtle" paddingY="xl" hasBorderBottom>
      <ScrollReveal direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <Caption className="text-[#0052FF] mb-2 block font-bold uppercase tracking-wider">
              {meta.badge || 'Verified Track Record'}
            </Caption>
            <H2 className="text-slate-900 mb-3">{meta.title || 'Our Milestones & Trajectory'}</H2>
            <Body className="text-slate-600 text-base">
              {meta.subtitle ||
                'A chronological journey detailing key foundational chapters, division debuts, and institutional expansions from our founding in 2022 to the present.'}
            </Body>
          </div>

          {/* Division Filter Pills */}
          <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setSelectedDivision('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedDivision === 'all'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              All Eras
            </button>
            <button
              onClick={() => setSelectedDivision('sws')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedDivision === 'sws'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              SWS Events
            </button>
            <button
              onClick={() => setSelectedDivision('u1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedDivision === 'u1'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              U1 Studio
            </button>
            <button
              onClick={() => setSelectedDivision('it')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedDivision === 'it'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              IT & Tech
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Interactive Milestone Scrubber Rail */}
      <div className="relative max-w-5xl mx-auto mb-10">
        {/* Visual connecting gradient line */}
        <div className="hidden md:block absolute top-10 left-6 right-6 h-0.5 bg-gradient-to-r from-blue-200 via-[#0052FF] to-blue-300 z-0" />

        {/* Milestone Steps Matrix - Horizontal Scroll Rail on Mobile */}
        <div className="flex overflow-x-auto no-scrollbar snap-x gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-5 sm:overflow-visible relative z-10">
          {filteredMilestones.map((ms, idx) => {
            const isActive = activeMilestone && activeMilestone.id === ms.id;
            return (
              <div key={ms.id || idx} className="min-w-[140px] sm:min-w-0 snap-start shrink-0 sm:shrink">
                <Magnetic strength={0.15}>
                  <button
                    type="button"
                    onClick={() => setActiveMilestoneId(ms.id || '')}
                    className={`w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 border text-center h-full flex flex-col justify-between select-none ${
                      isActive
                        ? 'bg-white border-[#0052FF] shadow-lg ring-2 ring-blue-500/20'
                        : 'bg-white/80 border-slate-200/90 hover:border-blue-300 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                        isActive
                          ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/30 scale-110'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {ms.year.split(' ')[0]}
                    </div>

                    <div>
                      <div className="font-display font-bold text-sm text-slate-900 mb-0.5">
                        {ms.title || ms.year}
                      </div>
                      <div className="text-[11px] font-semibold text-[#0052FF] truncate">
                        {ms.badge || 'Milestone'}
                      </div>
                    </div>
                  </button>
                </Magnetic>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Milestone Card */}
      {activeMilestone && (
        <ScrollReveal key={activeMilestone.id} direction="up" delay={0.05}>
          <TiltCard maxTilt={4} glareEffect>
            <div className="p-7 sm:p-9 rounded-2xl bg-white border border-slate-200 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center border border-blue-100">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0052FF] uppercase tracking-wider block">
                      {activeMilestone.year} Chapter
                    </span>
                    <h3 className="font-display text-2xl font-bold text-slate-900">
                      {activeMilestone.title}
                    </h3>
                  </div>
                </div>
                {activeMilestone.badge && (
                  <Badge variant="secondary" className="bg-blue-50 text-[#0052FF] border-blue-200 w-fit">
                    {activeMilestone.badge}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8">
                  <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                    {activeMilestone.description}
                  </p>
                </div>
                {activeMilestone.keyOutcome && (
                  <div className="lg:col-span-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Key Verified Outcome:
                    </span>
                    <div className="flex items-start gap-2 text-xs text-slate-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{activeMilestone.keyOutcome}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>
      )}
    </SectionContainer>
  );
};
