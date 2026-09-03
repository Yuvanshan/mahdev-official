import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Filter, Sparkles } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Button } from '../ui/Button';
import { IconRenderer } from '../ui/IconRenderer';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
} from '../motion/MotionWrappers';
import { DivisionId } from '../../types';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DIVISIONS } from '../../config/divisions';

interface FeaturedServicesSectionProps {
  onNavigate: (route: string) => void;
  onInquireService?: (service: any) => void;
}

export const FeaturedServicesSection: React.FC<FeaturedServicesSectionProps> = ({
  onNavigate,
  onInquireService,
}) => {
  const [activeTab, setActiveTab] = useState<DivisionId | 'all'>('all');
  const { services, homepageConfig } = useFirestoreDataContext();

  if (homepageConfig.featuredServices && !homepageConfig.featuredServices.enabled) {
    return null;
  }

  const activeServices = services
    .filter((s) => (s as any).status !== 'archived')
    .sort((a, b) => (a.order ?? (a as any).sortOrder ?? 0) - (b.order ?? (b as any).sortOrder ?? 0));

  if (activeServices.length === 0) {
    return null;
  }

  const filteredServices =
    activeTab === 'all'
      ? activeServices
      : activeServices.filter((srv) => (srv.divisionId || srv.division) === activeTab);

  const filterTabs: { id: DivisionId | 'all'; label: string }[] = [
    { id: 'all', label: 'All Services' },
    { id: 'sws', label: 'Events & Decor' },
    { id: 'u1', label: 'Photography & Film' },
    { id: 'it', label: 'Software & Cloud' },
    { id: 'travels', label: 'Travel Packages' },
    { id: 'mart', label: 'Online Hardware' },
  ];

  const sectionMeta = homepageConfig.featuredServices || {
    badge: 'DYNAMIC SERVICE OFFERINGS',
    title: 'Featured Services & Solutions',
    subtitle: 'Explore key flagship services delivered across our 5 specialized enterprise divisions.',
  };

  return (
    <SectionContainer
      id="featured-services"
      background="white"
      paddingY="xl"
      hasBorderBottom
    >
      <ScrollReveal direction="up">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <Caption className="text-[#0052FF] mb-2 block font-bold uppercase tracking-wider">
              {sectionMeta.badge || 'Flagship Solutions'}
            </Caption>
            <H2 className="text-slate-900 mb-3">{sectionMeta.title || 'Featured Services & Solutions'}</H2>
            <Body className="text-slate-600 text-base">
              {sectionMeta.subtitle ||
                'Explore key flagship services delivered across our 5 specialized enterprise divisions, engineered to bring your vision to life.'}
            </Body>
          </div>

          {/* Division Filter Tabs - Horizontal Scroll on Mobile */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto no-scrollbar pb-1 max-w-full -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                id={`service-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0052FF] shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Reusable Service Cards Grid with 3D Tilt - Horizontal Scroll on Mobile */}
      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-slate-50/50 max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900">Custom Division Solutions</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Direct consultation and bespoke turnkey packages are available across all 5 Mahdev divisions. Explore our division portfolios or contact our executive desk.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => onNavigate('/contact')}
              className="text-xs cursor-pointer"
            >
              Contact Executive Desk
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('/services')}
              className="text-xs cursor-pointer"
            >
              Browse All Services
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible">
            {filteredServices.map((service, idx) => {
              const divId = (service.divisionId || service.division || 'sws') as DivisionId;
              const divConfig = DIVISIONS[divId];
              const divRoute = (divConfig && divConfig.route) || `/${divId}`;
              const divisionBadgeText =
                service.divisionName || (divConfig && divConfig.shortName) || (divId ? String(divId).toUpperCase() : 'ENTERPRISE');

              return (
                <div
                  key={service.id}
                  className="min-w-[85vw] sm:min-w-0 snap-center shrink-0 sm:shrink"
                >
                  <ScrollReveal direction="up" delay={idx * 0.05}>
                    <TiltCard maxTilt={6} className="h-full">
                      <div className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 p-7 shadow-xs hover:border-[#0052FF] hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 h-full">
                        {service.popular && (
                          <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              Popular
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center group-hover:bg-[#0052FF] group-hover:text-white transition-colors">
                              <IconRenderer name={service.iconName || 'Sparkles'} className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0052FF] block">
                                {divisionBadgeText}
                              </span>
                              <span className="text-xs text-slate-500">{service.badge || 'Enterprise Grade'}</span>
                            </div>
                          </div>

                          <h3 className="font-display text-lg font-bold text-slate-900 mb-2 group-hover:text-[#0052FF] transition-colors">
                            {service.title || service.name}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed mb-5">
                            {service.description}
                          </p>

                          {/* Key Features Bullet List */}
                          {service.features && service.features.length > 0 && (
                            <div className="space-y-2 mb-6 pt-3 border-t border-slate-100">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                What's Included:
                              </span>
                              {service.features.map((feature, fIdx) => (
                                <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0052FF] shrink-0 mt-0.5" />
                                  <span className="leading-snug">{feature}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Action Footer */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-medium text-slate-500">
                            {service.turnaroundTime || (service.startingPrice || service.price ? `From LKR ${(service.startingPrice || service.price).toLocaleString()}` : 'Custom SLA')}
                          </span>
                          <Magnetic strength={0.2}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onNavigate(divRoute)}
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                              className="text-xs hover:border-[#0052FF] hover:text-[#0052FF] cursor-pointer"
                            >
                              View Details
                            </Button>
                          </Magnetic>
                        </div>
                      </div>
                    </TiltCard>
                  </ScrollReveal>
                </div>
              );
            })}
          </div>

          {/* Bottom Explore All CTA Button */}
          <div className="mt-10 text-center">
            <Magnetic strength={0.15}>
              <Button
                variant="electric"
                size="lg"
                onClick={() => onNavigate('/services')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shadow-lg shadow-blue-500/20"
              >
                View All Services & Solution Packages
              </Button>
            </Magnetic>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
