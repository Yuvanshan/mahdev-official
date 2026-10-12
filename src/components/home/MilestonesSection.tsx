import React, { useMemo } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body } from '../ui/Heading';
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
            <p className="text-slate-600 text-sm max-w-lg mx-auto">
              {milestonesCms?.subtitle || 'Create and publish corporate milestones from the Admin Portal.'}
            </p>
          </div>
        </SectionContainer>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white">
      <ParallelWatermark text="07 // TRAJECTORY" />
      <SectionContainer id="milestones" background="none" paddingY="xl" hasBorderBottom>
        {/* Section Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            <Badge variant="electric" size="sm" className="font-mono text-[11px] uppercase tracking-wider">
              {milestonesCms?.badge || 'Corporate Trajectory'}
            </Badge>
            <span className="text-xs font-semibold text-slate-500">
              • {totalPoints} Key Milestone{totalPoints === 1 ? '' : 's'}
            </span>
          </div>
          <H2 className="text-slate-900 mb-2 font-display text-3xl sm:text-4xl font-bold tracking-tight">
            {milestonesCms?.title || 'Our Milestones & Trajectory'}
          </H2>
        </div>

        {/* Swipe horizontally to browse milestone titles and years. */}
        <div
          aria-label="Company milestones"
          className="mb-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 touch-pan-x"
        >
            {displayMilestones.map((ms, index) => {
              const milestoneKey = ms.id ? `ms-card-${ms.id}` : `ms-card-${ms.year}-${index}`;

              return (
                <article
                  key={milestoneKey}
                  className="w-[78vw] max-w-xs shrink-0 snap-start rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:border-blue-400 hover:bg-slate-50/90 sm:w-72"
                >
                  <p className="mb-3 text-xs font-mono font-bold tracking-wide text-blue-700">{ms.year}</p>
                  <h3 className="font-display text-base font-bold leading-snug text-slate-900">
                    {ms.title}
                  </h3>
                </article>
              );
            })}
        </div>

        {/* View Company Journey Button */}
        {onNavigate && (
          <div className="mt-10 text-center">
            <button
              onClick={() => onNavigate('/milestones')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold text-sm hover:border-blue-600 hover:text-blue-600 hover:shadow-md transition-all cursor-pointer group"
            >
              <span>View Full Company Journey & Timeline</span>
              <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </SectionContainer>
    </div>
  );
};
