import React, { useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import {
  ScrollReveal,
  TiltCard,
  BlurReveal,
  Magnetic,
} from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

export const MilestonesSection: React.FC = () => {
  const { milestones } = useFirestoreDataContext();
  const sortedMilestones = [...milestones].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);

  if (sortedMilestones.length === 0) {
    return null;
  }

  const currentMilestone =
    sortedMilestones.find((m) => m.id === activeMilestoneId) ||
    sortedMilestones[sortedMilestones.length - 1];

  return (
    <SectionContainer
      id="milestones"
      background="white"
      paddingY="xl"
      hasBorderBottom
    >
      <ScrollReveal direction="up">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Caption className="text-[#0052FF] mb-2 block">Corporate Evolution</Caption>
          <H2 className="text-slate-900 mb-3">Milestones of Excellence</H2>
          <Body className="text-slate-600 text-base">
            From our founding creative beginnings to an integrated five-division digital holding enterprise today.
          </Body>
        </div>
      </ScrollReveal>

      {/* Visual Timeline Rail */}
      <div className="relative max-w-5xl mx-auto">
        {/* Central timeline connector line */}
        <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-[#0052FF] to-blue-200 -z-0" />

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 relative z-10 mb-10">
          {sortedMilestones.map((ms, idx) => {
            const isActive = currentMilestone.id === ms.id;
            return (
              <Magnetic key={ms.id} strength={0.15}>
                <div
                  onClick={() => setActiveMilestoneId(ms.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border text-center h-full flex flex-col justify-between ${
                    isActive
                      ? 'bg-blue-50/90 border-[#0052FF] shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/60'
                  }`}
                >
                  {/* Visual node badge */}
                  <div
                    className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-colors ${
                      isActive
                        ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-slate-900 mb-0.5">
                      {ms.year}
                    </div>
                    <div className="text-[11px] font-semibold text-[#0052FF] truncate">
                      {ms.badge || ms.title}
                    </div>
                  </div>
                </div>
              </Magnetic>
            );
          })}
        </div>

        {/* Active Milestone Highlight Card with 3D Depth */}
        {currentMilestone && (
          <ScrollReveal key={currentMilestone.id} direction="up" delay={0.1}>
            <TiltCard maxTilt={5} glareEffect>
              <div className="p-7 sm:p-9 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white border border-slate-800 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 flex items-center justify-center shadow-xs">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                        Year {currentMilestone.year} Milestone
                      </span>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                        {currentMilestone.title}
                      </h3>
                    </div>
                  </div>
                  {currentMilestone.badge && (
                    <Badge variant="secondary" className="bg-blue-900/80 text-blue-200 border-blue-700">
                      {currentMilestone.badge}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7">
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4">
                      {currentMilestone.description}
                    </p>
                  </div>
                  {currentMilestone.keyOutcome && (
                    <div className="lg:col-span-5 p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
                        Key Milestone Outcome:
                      </span>
                      <div className="flex items-start gap-2 text-xs text-slate-200 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{currentMilestone.keyOutcome}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        )}
      </div>
    </SectionContainer>
  );
};
