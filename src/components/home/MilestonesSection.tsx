import React, { useState, useRef } from 'react';
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
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { ParallelWatermark } from '../motion/ParallelScroll';

// Official verified 2022-2026 company trajectory
const OFFICIAL_MILESTONES = [
  {
    id: 'ms-2022',
    year: '2022',
    title: 'The Beginning',
    subtitle: 'SWS Event Management',
    description:
      'Launched SWS Event Management, establishing our foundation in creative event production.',
    badge: 'Foundation',
    keyOutcome: 'Core event management and spatial production operations established.',
    icon: Sparkles,
    gradient: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'ms-2023',
    year: '2023',
    title: 'U1 Studio',
    subtitle: 'Photography & Media',
    description:
      'Launched U1 Studio, expanding into professional cinematography and fine-art photography.',
    badge: 'Media & Film',
    keyOutcome: 'Cinema 8K production, studio suites, and wedding photojournalism.',
    icon: Layers,
    gradient: 'from-indigo-600 to-purple-600',
  },
  {
    id: 'ms-2024',
    year: '2024',
    title: 'Islandwide Reach',
    subtitle: 'All 9 Provinces',
    description:
      'Expanded delivery infrastructure nationwide to serve commercial and private clients islandwide.',
    badge: 'National Scale',
    keyOutcome: 'Operational capacity scaled across all 9 provinces in Sri Lanka.',
    icon: MapPin,
    gradient: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'ms-2025',
    year: '2025',
    title: 'IT & Solutions',
    subtitle: 'Digital Transformation',
    description:
      'Introduced IT & Solutions, expanding into custom software engineering and cloud systems.',
    badge: 'Tech Innovation',
    keyOutcome: 'Full-stack web, cloud architectures, and digital business systems.',
    icon: Code2,
    gradient: 'from-cyan-600 to-blue-600',
  },
  {
    id: 'ms-2026',
    year: '2026',
    title: 'Mahdev Pvt Ltd',
    subtitle: 'Company Incorporation',
    description:
      'Officially registered Mahdev Pvt Ltd, unifying all specialized divisions under established leadership.',
    badge: 'Registered Entity',
    keyOutcome: 'Unified business divisions under registered private enterprise governance.',
    icon: Building2,
    gradient: 'from-blue-600 to-indigo-700',
  },
];

// Official verified company achievements
const OFFICIAL_ACHIEVEMENTS = [
  {
    id: 'projects',
    metric: '1,800+',
    label: 'Projects Completed',
    description: 'Completed projects across events, media, and digital systems.',
    icon: Briefcase,
    badge: 'Deliverables',
    highlight: true,
  },
  {
    id: 'success-rate',
    metric: '98%',
    label: 'Success Rate',
    description: 'Committed to verified quality and reliable client delivery.',
    icon: CheckCircle2,
    badge: 'Quality Standard',
  },
  {
    id: 'growth',
    metric: '5+',
    label: 'Years of Growth',
    description: 'Consistent expansion across diverse industry sectors.',
    icon: TrendingUp,
    badge: 'Track Record',
  },
  {
    id: 'divisions',
    metric: '5',
    label: 'Business Divisions',
    description: 'Events, Studio Media, IT Solutions, Travels, and Mart.',
    icon: Layers,
    badge: 'Divisions',
  },
  {
    id: 'coverage',
    metric: '9 / 9',
    label: 'Provinces Covered',
    description: 'Nationwide execution and logistics delivery across Sri Lanka.',
    icon: MapPin,
    badge: 'Nationwide',
  },
  {
    id: 'vision',
    metric: 'One Vision',
    label: 'Unified Standard',
    description: 'Creating Moments. Capturing Memories. Delivering Innovation.',
    icon: Sparkles,
    badge: 'Core Creed',
    highlight: true,
  },
];

interface MilestonesSectionProps {
  onNavigate?: (route: string) => void;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({ onNavigate }) => {
  const { milestones, homepageConfig } = useFirestoreDataContext();
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>('ms-2026');

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

  // Display achievements from homepageConfig or default
  const displayAchievements = React.useMemo(() => {
    if (milestonesCms?.achievements && milestonesCms.achievements.length > 0) {
      return milestonesCms.achievements;
    }
    return OFFICIAL_ACHIEVEMENTS;
  }, [milestonesCms]);

  // Display milestones from Firestore (editable via Admin Portal) or fallback to official milestones
  const displayMilestones = React.useMemo(() => {
    if (milestones && milestones.length > 0) {
      const valid = milestones.filter(
        (m) => m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived' && m.year
      );
      if (valid.length > 0) {
        return [...valid].sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0) || (a.order || 0) - (b.order || 0));
      }
    }
    return OFFICIAL_MILESTONES;
  }, [milestones]);

  if (homepageConfig.milestones && homepageConfig.milestones.enabled === false) {
    return null;
  }

  if (displayMilestones.length === 0 && displayAchievements.length === 0) {
    return null;
  }

  const currentMilestone =
    displayMilestones.find((m) => m.id === activeMilestoneId || m.year === activeMilestoneId) ||
    displayMilestones[displayMilestones.length - 1];

  const CurrentIcon = (currentMilestone as any)?.icon || Building2;

  return (
    <div className="relative overflow-hidden">
      <ParallelWatermark text="07 // TRAJECTORY" />
      <SectionContainer
        id="milestones"
        background="white"
        paddingY="xl"
        hasBorderBottom
      >
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>Our Trajectory & Key Achievements</span>
          </div>
          <H2 className="text-slate-900 mb-3">Our Milestones</H2>
          <Body className="text-slate-600 text-base">
            The official journey of Mahdev Pvt Ltd from our beginnings to a registered multi-service enterprise.
          </Body>
        </div>

        {/* Interactive Timeline Rail */}
        <div className="relative max-w-5xl mx-auto mb-14">
          {/* Milestone Steps Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 relative z-10 mb-8">
            {displayMilestones.map((ms, index) => {
              const milestoneKey = ms.id ? `step-${ms.id}` : `step-${ms.year}-${index}`;
              const isSelected = currentMilestone?.id === ms.id || (ms.id && currentMilestone?.id ? currentMilestone.id === ms.id : currentMilestone?.year === ms.year);
              return (
                <button
                  key={milestoneKey}
                  type="button"
                  id={`milestone-step-${ms.id || `${ms.year}-${index}`}`}
                  onClick={() => setActiveMilestoneId(ms.id || ms.year)}
                  className={`w-full p-4 rounded-xl cursor-pointer transition-all duration-200 border text-center h-full flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-blue-50/95 border-blue-600 shadow-sm ring-1 ring-blue-600/30'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  {/* Year badge node */}
                  <div
                    className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {ms.year}
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-slate-900 mb-0.5">
                      {ms.title}
                    </div>
                    <div className="text-[11px] font-semibold text-blue-600 truncate">
                      {ms.badge || 'Official Milestone'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Milestone Highlight Card */}
          {currentMilestone && (
            <div key={currentMilestone.id ? `active-ms-${currentMilestone.id}` : `active-ms-${currentMilestone.year}`}>
              <div className="p-6 sm:p-9 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white border border-slate-800 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 flex items-center justify-center shadow-xs">
                      <CurrentIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider block">
                        {currentMilestone.year} Milestone
                      </span>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                        {currentMilestone.title}
                      </h3>
                    </div>
                  </div>
                  {currentMilestone.badge && (
                    <Badge variant="secondary" className="bg-blue-900/80 text-blue-200 border-blue-700 w-fit">
                      {currentMilestone.badge}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-8">
                    <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
                      {currentMilestone.description}
                    </p>
                  </div>
                  {currentMilestone.keyOutcome && (
                    <div className="lg:col-span-4 p-4 rounded-xl bg-white/5 border border-white/10">
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
            </div>
          )}
        </div>

        {/* Integrated Key Achievements / By The Numbers Grid */}
        <div className="max-w-5xl mx-auto pt-8 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900">
                {milestonesCms?.achievementsTitle || 'Key Verified Achievements'}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {milestonesCms?.achievementsSubtitle || 'Official Company Metrics'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
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
        </div>
      </SectionContainer>
    </div>
  );
};
