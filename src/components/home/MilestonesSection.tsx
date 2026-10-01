import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  Building2,
  Layers,
  MapPin,
  Code2,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Award,
  ChevronRight,
} from 'lucide-react';
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
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>('');

  const milestonesCms = homepageConfig?.milestones;

  // Icon mapping dictionary
  const getAchievementIcon = (name?: string) => {
    switch (name?.toLowerCase()) {
      case 'briefcase':
        return Briefcase;
      case 'checkcircle2':
      case 'check':
        return CheckCircle2;
      case 'trendingup':
      case 'growth':
        return TrendingUp;
      case 'layers':
      case 'divisions':
        return Layers;
      case 'mappin':
      case 'location':
        return MapPin;
      case 'sparkles':
      case 'creed':
        return Sparkles;
      case 'award':
        return Award;
      case 'shieldcheck':
      case 'shield':
        return ShieldCheck;
      case 'building':
      case 'building2':
        return Building2;
      default:
        return Sparkles;
    }
  };

  const getMilestoneIcon = (year?: string, title?: string) => {
    const text = `${year} ${title}`.toLowerCase();
    if (text.includes('sws') || text.includes('decor')) return Sparkles;
    if (text.includes('u1') || text.includes('studio') || text.includes('media') || text.includes('cinema'))
      return Layers;
    if (text.includes('island') || text.includes('reach') || text.includes('provinces')) return MapPin;
    if (text.includes('it') || text.includes('solutions') || text.includes('code')) return Code2;
    if (text.includes('incorporation') || text.includes('pvt ltd') || text.includes('holding'))
      return Building2;
    if (text.includes('travel') || text.includes('mart') || text.includes('commercial')) return Briefcase;
    if (text.includes('global') || text.includes('horizon') || text.includes('vision') || text.includes('ai'))
      return Award;
    return Building2;
  };

  // Verified Firestore milestones
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

  const displayAchievements = useMemo(() => {
    return Array.isArray(milestonesCms?.achievements) ? milestonesCms.achievements : [];
  }, [milestonesCms?.achievements]);

  const totalPoints = displayMilestones.length;

  const currentMilestone = useMemo(() => {
    if (displayMilestones.length === 0) return null;
    const found = displayMilestones.find(
      (m) => m.id === activeMilestoneId || m.year === activeMilestoneId
    );
    return found || displayMilestones[displayMilestones.length - 1];
  }, [displayMilestones, activeMilestoneId]);

  const activeMilestoneIndex = useMemo(() => {
    if (displayMilestones.length === 0) return 0;
    const idx = displayMilestones.findIndex(
      (m) => m.id === activeMilestoneId || m.year === activeMilestoneId
    );
    return idx >= 0 ? idx : displayMilestones.length - 1;
  }, [displayMilestones, activeMilestoneId]);

  const handleSelectMilestone = useCallback((ms: FirestoreMilestone) => {
    setActiveMilestoneId(ms.id || ms.year);
  }, []);

  const CurrentIcon = getMilestoneIcon(currentMilestone?.year, currentMilestone?.title);

  const gridClass = useMemo(() => {
    const count = displayMilestones.length;
    if (count === 1) return 'grid grid-cols-1 max-w-md mx-auto gap-4 relative z-10';
    if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-4 relative z-10';
    if (count === 3) return 'grid grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto gap-4 relative z-10';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10';
  }, [displayMilestones.length]);

  if (homepageConfig?.milestones && homepageConfig.milestones.enabled === false) {
    return null;
  }

  // 1. SHOW CRISP SHIMMER UNTIL DATA LOADS FROM CLOUD FIRESTORE
  if (isMilestonesLoading && displayMilestones.length === 0) {
    return <MilestonesSectionShimmer />;
  }

  // 2. ZERO FAKE DATA: If loaded and 0 milestones in Firestore, show clean state
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
              {milestonesCms?.subtitle || 'Live synchronization with Cloud Firestore milestones. You can create, edit, and publish verified corporate milestones from the Admin Portal.'}
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
          <Body className="text-slate-600 text-sm sm:text-base max-w-2xl">
            {milestonesCms?.subtitle || 'Follow our evolution through verified milestone cards as Mahdev progresses from creative event staging to islandwide scale, enterprise technology, and private corporate governance.'}
          </Body>
        </div>

        {/* Milestone Cards Grid (Clean, Static, Responsive) */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className={gridClass}>
            {displayMilestones.map((ms, index) => {
              const milestoneKey = ms.id ? `ms-card-${ms.id}` : `ms-card-${ms.year}-${index}`;
              const isSelected = activeMilestoneIndex === index;
              const Icon = getMilestoneIcon(ms.year, ms.title);

              return (
                <div
                  key={milestoneKey}
                  onClick={() => handleSelectMilestone(ms)}
                  className={`relative rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between h-full border text-left group overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-white via-blue-50/70 to-blue-100/40 border-blue-600 ring-2 ring-blue-500/40 shadow-lg'
                      : 'bg-white border-slate-200/90 hover:border-blue-400 hover:bg-slate-50/90 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  {/* Active Indicator Top Edge */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600" />
                  )}

                  {/* Card Top Row: Year Pill & Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
                      <span>{ms.year}</span>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Card Content: Title & Subtitle */}
                  <div className="mb-2">
                    <h4
                      className={`font-display text-sm sm:text-base font-bold leading-tight mb-1 transition-colors ${
                        isSelected ? 'text-blue-950 font-extrabold' : 'text-slate-900 group-hover:text-blue-600'
                      }`}
                    >
                      {ms.title}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[11px] font-semibold text-blue-600 truncate">
                        {ms.subtitle || ms.badge || 'Official Milestone'}
                      </p>
                      {ms.date && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {ms.date}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Description Snippet */}
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed pt-2 border-t border-slate-100">
                    {ms.keyOutcome || ms.description}
                  </p>

                  {/* Milestone Metric Badge if configured in Admin */}
                  {ms.metric && (
                    <div className="mt-2 text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 inline-block w-fit">
                      {ms.metric}
                    </div>
                  )}

                  {/* Active Milestone Status Pin */}
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>Selected Milestone</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Milestone Full Spotlight Card */}
        {currentMilestone && (
          <div className="max-w-6xl mx-auto mb-14">
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-800 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 flex items-center justify-center shadow-xs">
                    <CurrentIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">
                        {currentMilestone.year} {currentMilestone.date ? `• ${currentMilestone.date}` : ''} Milestone
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs font-mono text-cyan-300">
                        {activeMilestoneIndex + 1} of {totalPoints}
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                      {currentMilestone.title}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {currentMilestone.badge && (
                    <Badge variant="secondary" className="bg-blue-900/80 text-blue-200 border-blue-700">
                      {currentMilestone.badge}
                    </Badge>
                  )}
                  {currentMilestone.metric && (
                    <div className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-700/80 text-[11px] font-mono font-bold text-cyan-300">
                      {currentMilestone.metric}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
                  {currentMilestone.description}
                </p>

                {currentMilestone.keyOutcome && (
                  <div className="flex items-start gap-2.5 pt-2 text-sm sm:text-base text-cyan-300 font-medium bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Key Outcome:</strong> {currentMilestone.keyOutcome}</span>
                  </div>
                )}

                {Array.isArray(currentMilestone.details) && currentMilestone.details.length > 0 && (
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                    {currentMilestone.details.map((detail: string, dIdx: number) => (
                      <div key={dIdx} className="flex items-start gap-2 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Integrated Key Achievements / By The Numbers Grid */}
        {displayAchievements && displayAchievements.length > 0 && (
          <div className="max-w-6xl mx-auto pt-8 border-t border-slate-200">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider">
                  {milestonesCms?.achievementsTitle || 'Verified Operational Scale'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
              {displayAchievements.map((item, idx) => {
                const Icon = (item as any).icon || getAchievementIcon(item.iconName);
                return (
                  <div
                    key={item.id || idx}
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between h-full ${
                      item.highlight
                        ? 'bg-blue-50/70 border-blue-200/90 shadow-2xs'
                        : 'bg-slate-50/80 border-slate-200/90 hover:bg-white hover:border-blue-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100/90 text-blue-600 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {item.badge && (
                          <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="font-display text-2xl font-bold tracking-tight text-slate-900 mb-0.5">
                        {item.metric}
                      </div>
                      <div className="text-xs font-bold text-blue-600 mb-1 leading-tight">
                        {item.label}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug mt-2 pt-2 border-t border-slate-200/60">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
