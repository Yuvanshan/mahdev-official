import React, { useMemo } from 'react';
import { Sparkles, ChevronRight, Trophy } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { HorizontalScrollArea } from '../ui/HorizontalScrollArea';
import { H2 } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { FirestoreMilestone } from '../../types/firestore';
import { MilestonesSectionShimmer } from '../common/MilestonesSectionShimmer';

interface MilestonesSectionProps {
  onNavigate?: (route: string) => void;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({ onNavigate }) => {
  const { milestones, homepageConfig, isMilestonesLoading } = useFirestoreDataContext();
  const reducedMotion = useReducedMotion();

  const milestonesCms = homepageConfig?.milestones;

  // Published milestones from Turso
  const displayMilestones = useMemo<FirestoreMilestone[]>(() => {
    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
      return [];
    }

    const filtered = milestones.filter(
      (m) => m && m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived'
    );

    return [...filtered].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
      const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
      if (orderA !== orderB) return orderA - orderB;
      const yearA = parseInt(a.year || '0', 10);
      const yearB = parseInt(b.year || '0', 10);
      return yearA - yearB;
    });
  }, [milestones]);

  const totalPoints = displayMilestones.length;

  if (homepageConfig?.milestones && homepageConfig.milestones.enabled === false) {
    return null;
  }

  // 1. Show the loading placeholder while Turso milestones are being fetched.
  if (isMilestonesLoading && displayMilestones.length === 0) {
    return <MilestonesSectionShimmer />;
  }

  // 2. Show an empty state when there are no published milestones.
  if (displayMilestones.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white py-16">
        <SectionContainer id="milestones" background="none" paddingY="lg" hasBorderBottom>
          <div className="max-w-4xl mx-auto text-center p-8 sm:p-12 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">
              {milestonesCms?.title || 'Our Milestones & Trajectory'}
            </h3>
            <p className="hidden max-w-lg text-sm text-slate-600 sm:block mx-auto">
              {milestonesCms?.subtitle || 'Create and publish corporate milestones from the Admin Portal.'}
            </p>
          </div>
        </SectionContainer>
      </div>
    );
  }

  return (
    <div className="milestones-showcase relative overflow-hidden bg-[#2A0810] text-white">
      <ParallelWatermark text="07 // TRAJECTORY" />
      <SectionContainer id="milestones" background="none" paddingY="xl" hasBorderBottom>
        <div className="mx-auto mb-8 flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#DFC070]/40 bg-[#DFC070]/10 text-[#DFC070]">
                <Trophy className="h-4 w-4" aria-hidden="true" />
              </span>
              <Badge variant="electric" size="sm" className="border-[#DFC070]/40 bg-[#DFC070]/10 font-mono text-[11px] uppercase tracking-wider text-[#F0D88F]">
                {milestonesCms?.badge || 'Our achievements'}
              </Badge>
            </div>
            <H2 className="mb-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {milestonesCms?.title || 'A journey worth celebrating'}
            </H2>
            {milestonesCms?.subtitle && (
              <p className="max-w-2xl text-sm text-white/65 sm:text-base">{milestonesCms.subtitle}</p>
            )}
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
            <span className="h-2 w-2 rounded-full bg-[#DFC070]" />
            {totalPoints} achievements
          </span>
        </div>

        <HorizontalScrollArea
          ariaLabel="Company milestones"
          className="milestones-rail mb-10"
          contentClassName="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-5 touch-pan-x no-visible-scrollbar sm:gap-4"
        >
          {displayMilestones.map((ms, index) => {
            const milestoneKey = ms.id ? `ms-card-${ms.id}` : `ms-card-${ms.year}-${index}`;
            return (
              <motion.article
                key={milestoneKey}
                initial={reducedMotion ? false : { opacity: 0, x: 32 }}
                whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: reducedMotion ? 0 : Math.min(index, 5) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="group relative w-[78vw] max-w-xs shrink-0 snap-start overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-5 shadow-lg shadow-black/10 backdrop-blur-sm transition-colors hover:border-[#DFC070]/60 hover:bg-white/[0.11] sm:w-72 sm:p-6"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#DFC070] via-[#F2D98C] to-transparent" aria-hidden="true" />
                <div className="mb-7 flex items-start justify-between gap-3">
                  <span className="font-mono text-3xl font-bold tracking-tight text-[#F0D88F] sm:text-4xl">{ms.year}</span>
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-[#DFC070]/30 bg-[#DFC070]/10 text-[#DFC070] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="mb-3 h-px w-full bg-gradient-to-r from-[#DFC070]/60 to-white/10" aria-hidden="true" />
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Achievement {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="font-display text-base font-semibold leading-snug text-white sm:text-lg">{ms.title}</h3>
              </motion.article>
            );
          })}
        </HorizontalScrollArea>

        {/* View Company Journey Button */}
        {onNavigate && (
          <div className="mt-10 text-center">
            <button
              onClick={() => onNavigate('/milestones')}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DFC070]/35 bg-[#DFC070] px-5 text-sm font-bold text-[#2A0810] transition-all hover:bg-[#F0D88F] cursor-pointer group"
            >
              <span>View Full Company Journey & Timeline</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </SectionContainer>
    </div>
  );
};
