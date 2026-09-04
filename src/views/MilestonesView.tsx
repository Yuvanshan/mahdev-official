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

interface MilestonesViewProps {
  onNavigate: (route: string) => void;
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({ onNavigate }) => {
  const { milestones, companySettings } = useFirestoreDataContext();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const defaultMilestones = [
    {
      year: '2022',
      title: 'The Beginning',
      subtitle: 'SWS Event Management',
      description: 'Started SWS Event Management, marking the beginning of our journey in event management and creative experiences.',
      badge: 'Foundation',
      details: [
        'Established full-service event staging and decor operations',
        'Built initial core team of event designers and production technicians',
        'Delivered memorable wedding galas, celebrations, and corporate gatherings',
      ],
      icon: Sparkles,
    },
    {
      year: '2023',
      title: 'Studio U2 / U1 Studio',
      subtitle: 'Photography & Creative Media',
      description: 'Launched Studio U2 (U1 Studio), expanding our services into professional photography, cinematography, and creative media.',
      badge: 'Creative Media',
      details: [
        'State-of-the-art cinema media equipment and professional editing studio',
        'Specialized wedding cinematography, commercial photography, and aerial filming',
        'Collaborated with renowned brands and artists across the region',
      ],
      icon: Layers,
    },
    {
      year: '2024',
      title: 'Islandwide Expansion & 500+ Milestone',
      subtitle: 'Nationwide Service Capabilities',
      description: 'Expanded our services across Sri Lanka, bringing our expertise and services to clients nationwide. Completed 500+ successful event decorations.',
      badge: 'National Reach',
      details: [
        'Delivered high-profile events across all 9 provinces in Sri Lanka',
        'Crossed 500+ completed wedding and corporate event staging projects',
        'Formed strategic vendor partnerships for rapid islandwide deployment',
      ],
      icon: MapPin,
    },
    {
      year: '2025',
      title: 'IT & Solutions Division',
      subtitle: 'Technology & Digital Transformation',
      description: 'Introduced IT & Solutions, expanding our capabilities into technology, software, cloud infrastructure, and digital business solutions.',
      badge: 'Digital Innovation',
      details: [
        'Custom enterprise software engineering and responsive web platforms',
        'Cloud hosting, modern mobile apps, and secure digital workflows',
        'Expanded client base to fintech, retail, hospitality, and corporate sectors',
      ],
      icon: Code2,
    },
    {
      year: '2026',
      title: 'Mahdev Pvt Ltd Incorporation & Expansion',
      subtitle: 'Parent Holding Company & Multi-Division Growth',
      description: 'Officially registered Mahdev Pvt Ltd as a private company, bringing our growing services and ventures under one unified organization. Opened new Colombo branch, introduced Mahdev Travels, and achieved 1000+ completed projects and 1800+ happy customers.',
      badge: 'Corporate Incorporation',
      details: [
        'Incorporated Mahdev Pvt Ltd as a formal parent corporate entity',
        'Established secondary headquarters in Colombo alongside Trincomalee office',
        'Introduced Mahdev Travels for bespoke corporate and leisure tour curation',
        'Milestone achievement of 1,000+ projects and 1,800+ satisfied clients',
      ],
      icon: Building2,
    },
  ];

  const displayMilestones = milestones && milestones.length >= 3 ? milestones : defaultMilestones;

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
              const Icon = ms.icon || Award;

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
                        <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#0052FF] hover:bg-white hover:shadow-xl transition-all duration-300 group">
                          <div className={`flex items-center gap-2 mb-3 ${isEven ? 'sm:justify-end' : ''}`}>
                            <span className="px-2.5 py-1 rounded-md bg-blue-100/90 text-[#0052FF] font-bold text-xs">
                              {ms.year}
                            </span>
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
                            <p className="text-xs font-semibold text-[#0052FF] mb-3">
                              {ms.subtitle}
                            </p>
                          )}

                          <p className="text-sm text-slate-600 leading-relaxed mb-4">
                            {ms.description}
                          </p>

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
