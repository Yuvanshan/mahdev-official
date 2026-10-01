import React, { useEffect } from 'react';
import { Award, Calendar, CheckCircle2, TrendingUp, Sparkles, Building2, MapPin, Layers, Code2, ArrowRight } from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, Body, Caption } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ScrollReveal, TiltCard } from '../components/motion/MotionWrappers';
import { SEOHead } from '../components/layout/SEOHead';
import { BRAND_CONFIG } from '../config/brand';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';
import { DEFAULT_OFFICIAL_MILESTONES } from '../services/firestore/milestones';

import { MilestonesTimelineShimmer } from '../components/common/MilestonesTimelineShimmer';

interface MilestonesViewProps {
  onNavigate: (route: string) => void;
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({ onNavigate }) => {
  const { milestones, companySettings, isMilestonesLoading } = useFirestoreDataContext();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const displayMilestones = React.useMemo(() => {
    if (!milestones || milestones.length === 0) return [];
    return milestones
      .filter((m) => m.isPublished !== false && m.status !== 'draft' && m.status !== 'archived')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (Number(a.year) || 0) - (Number(b.year) || 0));
  }, [milestones]);

  // 1. Shimmer during loading until data fetches
  if (isMilestonesLoading && displayMilestones.length === 0) {
    return (
      <div className="pt-24 pb-12 bg-white">
        <SEOHead
          title="Our Milestones & Achievements | Mahdev Pvt Ltd"
          description="Explore the journey of Mahdev Pvt Ltd from 2022 foundation to islandwide expansion, IT innovation, and 1,800+ delivered projects."
          canonicalUrl="https://mahdev.lk/milestones"
        />
        <MilestonesTimelineShimmer />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 bg-white">
      <SEOHead
        title="Our Milestones & Achievements | Mahdev Pvt Ltd"
        description="Explore the journey of Mahdev Pvt Ltd from 2022 foundation to islandwide expansion, IT innovation, and 1,800+ delivered projects."
        canonicalUrl="https://mahdev.lk/milestones"
      />

      {/* Header Banner */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="electric" size="sm">
                Company Journey & Milestones
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                2022 – {new Date().getFullYear()} • Verified Trajectory
              </span>
            </div>
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              Our Journey of Growth & Innovation
            </H1>
            <Body className="text-slate-600 text-base sm:text-lg">
              From our humble beginnings in 2022 as SWS Event Management to a registered multi-division enterprise, explore key milestones that have shaped {companySettings?.name || 'Mahdev Pvt Ltd'}.
            </Body>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* Milestones Vertical Cinematic Timeline */}
      <SectionContainer background="white" paddingY="xl" hasBorderBottom>
        <div className="max-w-4xl mx-auto relative">
          {/* Vertical timeline center guideline */}
          <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#0052FF] via-blue-300 to-slate-200 -translate-x-1/2" />

          <div className="space-y-12 sm:space-y-16 relative z-10">
            {displayMilestones.map((ms: any, index: number) => {
              const isEven = index % 2 === 0;

              return (
                <ScrollReveal key={ms.id ? `ms-view-${ms.id}` : `ms-view-${ms.year}-${index}`} direction="up" delay={index * 0.08}>
                  <div
                    className={`flex flex-col sm:flex-row items-start ${
                      isEven ? 'sm:flex-row-reverse' : ''
                    } gap-6 sm:gap-12 relative`}
                  >
                    {/* Year Marker Center Node */}
                    <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#0052FF] text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/30 ring-4 ring-white z-20">
                      {ms.year.slice(2)}
                    </div>

                    {/* Timeline Content Card */}
                    <div className={`w-full sm:w-[calc(50%-2rem)] pl-12 sm:pl-0 ${isEven ? 'sm:text-right' : ''}`}>
                      <TiltCard maxTilt={4} glareEffect>
                        <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#0052FF] hover:bg-white hover:shadow-xl transition-all duration-300 group overflow-hidden">
                          <div className={`flex items-center gap-2 mb-3 flex-wrap ${isEven ? 'sm:justify-end' : ''}`}>
                            <span className="px-2.5 py-1 rounded-md bg-blue-100/90 text-[#0052FF] font-bold text-xs">
                              {ms.year}
                            </span>
                            {ms.date && (
                              <span className="text-xs font-mono text-slate-500">
                                {ms.date}
                              </span>
                            )}
                            {ms.badge && (
                              <Badge variant="outline" size="sm">
                                {ms.badge}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-1 group-hover:text-[#0052FF] transition-colors">
                            {ms.title}
                          </h3>

                          {ms.subtitle && (
                            <p className="text-xs font-semibold text-[#0052FF] mb-2">
                              {ms.subtitle}
                            </p>
                          )}

                          {ms.metric && (
                            <div className={`mb-3 ${isEven ? 'sm:text-right' : ''}`}>
                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
                                {ms.metric}
                              </span>
                            </div>
                          )}

                          <p className="text-sm text-slate-600 leading-relaxed mb-4 text-left">
                            {ms.description}
                          </p>

                          {ms.keyOutcome && (
                            <div className="pt-2 text-xs text-blue-800 font-semibold flex items-start gap-1.5 text-left mb-3 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span><strong>Key Outcome:</strong> {ms.keyOutcome}</span>
                            </div>
                          )}

                          {ms.details && ms.details.length > 0 && (
                            <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-left">
                              {ms.details.map((detail: string, dIdx: number) => (
                                <div key={dIdx} className="flex items-start gap-2 text-xs text-slate-600">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{detail}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TiltCard>
                    </div>

                    {/* Empty spacer for the opposite side on desktop */}
                    <div className="hidden sm:block sm:w-[calc(50%-2rem)]" />
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </SectionContainer>

      {/* CTA Section */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/divisions')}
      />
    </div>
  );
};
