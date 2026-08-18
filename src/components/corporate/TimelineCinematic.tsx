import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, ChevronRight, Sparkles, TrendingUp, Filter, Award } from 'lucide-react';
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
import { cmsService } from '../../services/cmsService';
import { CmsMilestone, HomepageCmsConfig } from '../../types/cms';
import { DivisionId } from '../../types';

interface TimelineCinematicProps {
  initialDivision?: DivisionId | 'all';
}

export const TimelineCinematic: React.FC<TimelineCinematicProps> = ({ initialDivision = 'all' }) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(initialDivision);
  const [milestones, setMilestones] = useState<CmsMilestone[]>([]);
  const [config, setConfig] = useState<HomepageCmsConfig>(() => cmsService.getHomepageConfig());
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>('');

  const loadData = () => {
    const list = cmsService.getAll<CmsMilestone>('milestones', { status: 'active' });
    setMilestones(list);
    setConfig(cmsService.getHomepageConfig());
    if (list.length > 0 && !activeMilestoneId) {
      setActiveMilestoneId(list[list.length - 1].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsubM = cmsService.subscribe('milestones', loadData);
    const unsubH = cmsService.subscribeHomepage(loadData);
    return () => {
      unsubM();
      unsubH();
    };
  }, []);

  if (config.milestones && !config.milestones.enabled) {
    return null;
  }

  const filteredMilestones = milestones.filter(
    (m) => selectedDivision === 'all' || m.divisionId === selectedDivision || !m.divisionId
  );

  const activeMilestone =
    filteredMilestones.find((m) => m.id === activeMilestoneId) ||
    filteredMilestones[0] ||
    milestones[0];

  const meta = config.milestones || {
    badge: 'VERIFIED TRACK RECORD',
    title: 'Milestones of Excellence',
    subtitle: 'A chronological journey detailing key foundational chapters, division debuts, and institutional expansions from 2018 to the present.',
  };

  return (
    <SectionContainer id="milestones" background="subtle" paddingY="xl" hasBorderBottom>
      <ScrollReveal direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <Caption className="text-[#0052FF] mb-2 block font-bold uppercase tracking-wider">
              {meta.badge || 'Verified Track Record'}
            </Caption>
            <H2 className="text-slate-900 mb-3">{meta.title || 'Milestones of Excellence'}</H2>
            <Body className="text-slate-600 text-base">
              {meta.subtitle ||
                'A chronological journey detailing key foundational chapters, division debuts, and institutional expansions from 2018 to the present.'}
            </Body>
          </div>

          {/* Division Filter Pills for CMS Extensibility */}
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

        {/* Milestone Steps Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 relative z-10">
          {filteredMilestones.map((ms, idx) => {
            const isActive = activeMilestone.id === ms.id;
            return (
              <Magnetic key={ms.id || idx} strength={0.15}>
                <div
                  onClick={() => setActiveMilestoneId(ms.id || '')}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border text-center h-full flex flex-col justify-between ${
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
                      {ms.year}
                    </div>
                    <div className="text-[11px] font-semibold text-[#0052FF] truncate">
                      {ms.badge || 'Milestone'}
                    </div>
                  </div>
                </div>
              </Magnetic>
            );
          })}
        </div>
      </div>

      {/* Active Milestone Cinematic 3D Feature Card */}
      {activeMilestone && (
        <div className="max-w-5xl mx-auto">
          <ScrollReveal key={activeMilestone.id} direction="up" delay={0.1}>
            <TiltCard maxTilt={4} glareEffect>
              <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border border-slate-800 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Left Column: Deep Context */}
                  <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <Badge variant="electric" size="sm" className="bg-blue-600 text-white font-bold">
                          {activeMilestone.badge || 'Corporate Milestone'}
                        </Badge>
                        <span className="text-xs font-semibold text-blue-300">
                          Year {activeMilestone.year}
                        </span>
                      </div>

                      <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mb-4">
                        {activeMilestone.title}
                      </h3>

                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                        {activeMilestone.description}
                      </p>
                    </div>

                    {/* Key Outcome Box */}
                    {activeMilestone.keyOutcome && (
                      <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                              Institutional Outcome
                            </span>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                              {activeMilestone.keyOutcome}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Visual Archival Imagery */}
                  <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full bg-slate-900">
                    <img
                      src={activeMilestone.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop'}
                      alt={activeMilestone.title}
                      className="w-full h-full object-cover opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white text-xs font-mono opacity-80 flex items-center justify-between">
                      <span>Ref: MDV-MS-{activeMilestone.year.split(' ')[0]}</span>
                      <span className="text-emerald-400 font-sans font-semibold">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      )}
    </SectionContainer>
  );
};
