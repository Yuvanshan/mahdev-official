import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ParallelWatermark } from '../motion/ParallelScroll';
import {
  Milestone3DOverlay,
  TRANSPORT_MODES,
  getTransportModeLabel,
  TransportMode,
} from './MilestoneJourneyAnimation';
import { FirestoreMilestone } from '../../types/firestore';
import { MilestonesSectionShimmer } from '../common/MilestonesSectionShimmer';

interface MilestonesSectionProps {
  onNavigate?: (route: string) => void;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({ onNavigate }) => {
  const { milestones, homepageConfig, isMilestonesLoading, isInitialLoading, isReady } = useFirestoreDataContext();
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [mouseTilt, setMouseTilt] = useState<{ rotateX: number; rotateY: number }>({
    rotateX: 0,
    rotateY: 0,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

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

  // Display achievements from homepageConfig only if configured
  const displayAchievements = useMemo(() => {
    if (Array.isArray(milestonesCms?.achievements)) {
      return milestonesCms.achievements;
    }
    return [];
  }, [milestonesCms]);

  // Display milestones: Strictly real documents from Cloud Firestore configured by the admin (ZERO FAKE DATA)
  const displayMilestones: FirestoreMilestone[] = useMemo(() => {
    if (!milestones || milestones.length === 0) return [];
    return [...milestones]
      .filter(
        (m) => m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived' && m.year
      )
      .sort(
        (a, b) =>
          (a.order ?? 0) - (b.order ?? 0) ||
          (Number(a.year) || 0) - (Number(b.year) || 0)
      );
  }, [milestones]);

  const totalPoints = displayMilestones.length;

  // Initialize active milestone when real milestones load from Firestore
  useEffect(() => {
    if (displayMilestones.length > 0 && !activeMilestoneId) {
      const latest = displayMilestones[displayMilestones.length - 1];
      setActiveMilestoneId(latest.id || latest.year);
      setProgress(1);
    }
  }, [displayMilestones, activeMilestoneId]);

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

  // Select a milestone card and slide character smoothly to that milestone
  const handleSelectMilestone = useCallback(
    (ms: FirestoreMilestone, idx: number) => {
      setActiveMilestoneId(ms.id || ms.year);
      if (totalPoints > 1) {
        setProgress(idx / (totalPoints - 1));
      }
    },
    [totalPoints]
  );

  // Main Loop: Character travels smoothly across milestone cards
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const journeyDurationMs = 28000; // 28-second full loop across 8 cards

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setProgress((prev) => {
        let next = prev + delta / journeyDurationMs;
        if (next > 1) {
          next = 0; // Loop back smoothly to start
        }

        // Synchronize active card based on progress
        const targetIdx = Math.min(
          Math.floor(next * (totalPoints - 1) + 0.5),
          totalPoints - 1
        );
        const currentTarget = displayMilestones[targetIdx];
        if (currentTarget && (currentTarget.id || currentTarget.year) !== activeMilestoneId) {
          setActiveMilestoneId(currentTarget.id || currentTarget.year);
        }

        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = null;
    };
  }, [isPlaying, totalPoints, displayMilestones, activeMilestoneId]);

  // 3D Parallel Parallax Mouse Movement handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 4.5;
    const rotY = ((x - centerX) / centerX) * 4.5;

    setMouseTilt({ rotateX: rotX, rotateY: rotY });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ rotateX: 0, rotateY: 0 });
  };

  const currentSegment = totalPoints > 1
    ? Math.min(Math.floor(progress * (totalPoints - 1)), TRANSPORT_MODES.length - 1)
    : 0;
  const activeTransportMode: TransportMode = TRANSPORT_MODES[currentSegment] || 'walk';
  const CurrentIcon = getMilestoneIcon(currentMilestone?.year, currentMilestone?.title);

  const gridClass = useMemo(() => {
    const count = displayMilestones.length;
    if (count === 1) return 'grid grid-cols-1 max-w-md mx-auto gap-4 relative z-10';
    if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto gap-4 relative z-10';
    if (count === 3) return 'grid grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto gap-4 relative z-10';
    return 'grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10';
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
        {/* Section Header with Admin Configuration */}
        <div className="flex flex-col md:flex-row md:items-end justify-between max-w-6xl mx-auto mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping" />
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
              {milestonesCms?.subtitle || 'Follow our evolution through parallel milestone cards as Mahdev progresses from creative event staging to islandwide scale, enterprise technology, and private corporate governance.'}
            </Body>
          </div>

          {/* Interactive Trajectory Controls */}
          {totalPoints > 1 && (
            <div className="flex items-center gap-2.5 shrink-0 bg-white/90 border border-slate-200/90 rounded-xl p-1.5 shadow-2xs backdrop-blur-sm self-start md:self-end">
              <div className="px-2.5 py-1 text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="hidden sm:inline text-[11px] text-slate-500 uppercase">Phase:</span>
                <span className="text-blue-600 text-[11px] font-semibold truncate max-w-[140px] sm:max-w-[180px]">
                  {getTransportModeLabel(activeTransportMode)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-slate-700 transition-colors cursor-pointer"
                title={isPlaying ? 'Pause Animation' : 'Play Animation'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProgress(0);
                  setActiveMilestoneId(displayMilestones[0]?.id || displayMilestones[0]?.year);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Restart Journey"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 
          3D PARALLEL PARALLAX STAGE:
          The milestone cards are rendered here in a cohesive perspective grid.
          The Handsome Boy character & neon trajectory line float as an OVERLAY directly over these cards!
        */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative max-w-6xl mx-auto mb-10 select-none"
          style={{ perspective: '1200px' }}
        >
          {/* 3D Tilted Card Deck & Floating Overlay Plane */}
          <div
            className="relative transition-transform duration-150 ease-out"
            style={{
              transform: `rotateX(${mouseTilt.rotateX}deg) rotateY(${mouseTilt.rotateY}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* 1. BACKGROUND 3D GRID AMBIENCE */}
            <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-indigo-500/5 rounded-3xl blur-xl pointer-events-none -z-10" />

            {/* 2. THE DYNAMIC MILESTONE CARDS GRID (Sitting in 3D Space) */}
            <div className={gridClass}>
              {displayMilestones.map((ms, index) => {
                const milestoneKey = ms.id ? `ms-card-${ms.id}` : `ms-card-${ms.year}-${index}`;
                const isSelected = activeMilestoneIndex === index;
                const isPassed = progress >= index / (totalPoints - 1) - 0.05;
                const Icon = getMilestoneIcon(ms.year, ms.title);

                return (
                  <div
                    key={milestoneKey}
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                    onClick={() => handleSelectMilestone(ms, index)}
                    className={`relative rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between h-full border text-left group overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-b from-white via-blue-50/70 to-blue-100/40 border-blue-600 ring-2 ring-blue-500/40 shadow-xl shadow-blue-500/15 -translate-y-2'
                        : isPassed
                        ? 'bg-white/95 border-slate-200/95 hover:border-blue-400 hover:bg-slate-50/90 shadow-2xs hover:-translate-y-1'
                        : 'bg-white/80 border-slate-200/70 hover:border-blue-300 hover:bg-white shadow-2xs hover:-translate-y-0.5'
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isSelected ? 'translateZ(26px)' : 'translateZ(10px)',
                    }}
                  >
                    {/* Active Radiant Top Edge Line */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 animate-pulse" />
                    )}

                    {/* Card Top Row: Year Pill & Active Dot */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-all duration-300 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                            : isPassed
                            ? 'bg-blue-100/90 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white animate-ping' : isPassed ? 'bg-blue-600' : 'bg-slate-400'}`} />
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

                    {/* Card Content: Title & Badge */}
                    <div className="mb-2">
                      <h4
                        className={`font-display text-sm sm:text-base font-bold leading-tight mb-1 transition-colors ${
                          isSelected ? 'text-blue-950 font-extrabold' : 'text-slate-900 group-hover:text-blue-600'
                        }`}
                      >
                        {ms.title}
                      </h4>
                      <p className="text-[11px] font-semibold text-blue-600 truncate">
                        {ms.subtitle || ms.badge || 'Official Milestone'}
                      </p>
                    </div>

                    {/* Card Description Snippet */}
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed pt-2 border-t border-slate-100">
                      {ms.keyOutcome || ms.description}
                    </p>

                    {/* Active Milestone Status Pin */}
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-mono font-semibold text-blue-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <span>Active Stage</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 
              3. THE 3D PARALLEL PARALLAX OVERLAY (Rendered directly OVER the milestone cards!)
              Features the Handsome Boy character in classic 3/4 isometric perspective angle.
            */}
            <Milestone3DOverlay
              milestones={displayMilestones}
              activeIndex={activeMilestoneIndex}
              onSelectMilestone={handleSelectMilestone}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              progress={progress}
              setProgress={setProgress}
              cardRefs={cardRefs}
              containerRef={containerRef}
            />
          </div>
        </div>

        {/* Active Milestone Full Cinematic Feature Spotlight Card */}
        {currentMilestone && (
          <div className="max-w-6xl mx-auto mb-14">
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-800 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 flex items-center justify-center shadow-xs">
                    <CurrentIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider">
                        {currentMilestone.year} Trajectory Milestone
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs font-mono text-cyan-300">
                        Step {activeMilestoneIndex + 1} of {totalPoints}
                      </span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                      {currentMilestone.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentMilestone.badge && (
                    <Badge variant="secondary" className="bg-blue-900/80 text-blue-200 border-blue-700">
                      {currentMilestone.badge}
                    </Badge>
                  )}
                  <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-300">
                    Mode: {activeTransportMode.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-3">
                <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
                  {currentMilestone.description}
                </p>

                {currentMilestone.keyOutcome && (
                  <div className="flex items-start gap-2 pt-2 text-xs sm:text-sm text-cyan-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Key Outcome:</strong> {currentMilestone.keyOutcome}</span>
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
