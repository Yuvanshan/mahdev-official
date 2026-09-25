import React, { useEffect } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, Star, Building2 } from 'lucide-react';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, Body, Caption } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { IconRenderer } from '../components/ui/IconRenderer';
import { ScrollReveal, TiltCard, Magnetic } from '../components/motion/MotionWrappers';
import { SEOHead } from '../components/layout/SEOHead';
import { DIVISIONS, DIVISION_LIST } from '../config/divisions';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';
import { ServicesSectionShimmer } from '../components/common/ServicesSectionShimmer';

interface DivisionsPageViewProps {
  onNavigate: (route: string) => void;
}

export const DivisionsPageView: React.FC<DivisionsPageViewProps> = ({ onNavigate }) => {
  const { divisions, companySettings, isInitialLoading, isFetching } = useFirestoreDataContext();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if ((!divisions || divisions.length === 0) && (isInitialLoading || isFetching)) {
    return (
      <div className="pt-24 pb-20 bg-white">
        <ServicesSectionShimmer divisionName="Divisions" />
      </div>
    );
  }

  const displayDivisions = React.useMemo(() => {
    if (divisions && divisions.length > 0) {
      const seen = new Set<string>();
      const result = [];

      for (const d of divisions) {
        if (d.status === 'inactive') continue;
        const rawId = (d.id || d.slug || '').toLowerCase();
        const canonicalId =
          rawId === 'u1' || rawId === 'u1-studio' || rawId === 'u1-cinema'
            ? 'u1'
            : rawId === 'sws' || rawId === 'sws-event-management' || rawId === 'sws-events'
            ? 'sws'
            : rawId === 'it' || rawId === 'it-solutions' || rawId === 'mahdev-it'
            ? 'it'
            : rawId === 'travels' || rawId === 'mahdev-travels'
            ? 'travels'
            : rawId === 'mart' || rawId === 'online-mart' || rawId === 'mahdev-mart'
            ? 'mart'
            : rawId;

        if (!canonicalId || seen.has(canonicalId)) continue;
        seen.add(canonicalId);

        const config = (DIVISIONS as any)[canonicalId] || DIVISION_LIST.find((item) => item.id === canonicalId) || {};

        const defaultComingSoon = canonicalId === 'it' || canonicalId === 'travels' || canonicalId === 'mart';
        const isComingSoon = (d as any).isComingSoon !== undefined
          ? !!(d as any).isComingSoon
          : (d as any).comingSoon !== undefined
          ? !!(d as any).comingSoon
          : (d as any).status !== undefined
          ? (d as any).status === 'coming_soon'
          : defaultComingSoon;

        const resolvedLogo =
          d.logoUrl ||
          (d as any).logo ||
          (config as any).logoUrl ||
          (config as any).logo ||
          '';

        const resolvedImg =
          (d as any).defaultImageUrl ||
          (d as any).fallbackImageUrl ||
          d.heroImageUrl ||
          d.imageUrl ||
          (d.hero as any)?.defaultImageUrl ||
          (d.hero as any)?.fallbackImageUrl ||
          (d.hero as any)?.imageUrl ||
          (d.hero as any)?.bgImage ||
          config.imageUrl ||
          '';

        result.push({
          ...config,
          id: canonicalId,
          name: d.name || config.name || canonicalId.toUpperCase(),
          shortName: config.shortName || d.name || canonicalId.toUpperCase(),
          tagline: d.hero?.subtitle || config.tagline || '',
          description: d.description || config.description || '',
          route: config.route || `/${d.slug || canonicalId}`,
          badge: d.hero?.badge || config.badge || 'Enterprise Division',
          iconName: config.iconName || 'Building',
          color: config.color || '#0052FF',
          logoUrl: resolvedLogo,
          imageUrl: resolvedImg,
          isComingSoon,
          coreServices:
            (d as any).coreServices && (d as any).coreServices.length > 0
              ? (d as any).coreServices
              : config.coreServices || [],
          stats:
            (d as any).stats && (d as any).stats.length > 0
              ? (d as any).stats
              : config.stats || [],
          cardHighlight: (d as any).cardHighlight || config.cardHighlight || '',
        });
      }

      if (result.length < 5) {
        for (const defaultDiv of DIVISION_LIST) {
          if (!seen.has(defaultDiv.id)) {
            seen.add(defaultDiv.id);
            result.push({
              ...defaultDiv,
              isComingSoon: defaultDiv.id === 'it' || defaultDiv.id === 'travels' || defaultDiv.id === 'mart',
            });
          }
        }
      }

      return result;
    }
    return DIVISION_LIST.map((item) => ({
      ...item,
      isComingSoon: item.id === 'it' || item.id === 'travels' || item.id === 'mart' ? true : !!(item as any).isComingSoon,
    }));
  }, [divisions]);

  return (
    <div className="pt-24 pb-12 bg-white">
      <SEOHead
        title="Our Divisions & Operating Units | Mahdev Pvt Ltd"
        description="Discover the five specialized business divisions under Mahdev Pvt Ltd: Event Management, Studio Media, IT Solutions, Travels, and Online Mart."
        canonicalUrl="https://mahdev.lk/divisions"
      />

      {/* Header Banner */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="electric" size="sm">
                Our Divisions
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                5 Operating Divisions • Nationwide Services
              </span>
            </div>
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
              Our Operating Business Divisions
            </H1>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* Divisions In-Depth List */}
      <SectionContainer background="white" paddingY="xl" hasBorderBottom>
        <div className="space-y-12 max-w-6xl mx-auto">
          {displayDivisions.map((division: any, index: number) => {
            const isEven = index % 2 === 0;

            return (
              <ScrollReveal key={division.id} direction="up" delay={index * 0.05}>
                <div className="p-8 sm:p-10 rounded-3xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:bg-white hover:shadow-2xl transition-all duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Division Narrative */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {division.logoUrl ? (
                          <div className="w-10 h-10 rounded-xl bg-white p-1.5 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                            <img src={division.logoUrl} alt={division.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: division.accentColor || '#0052FF' }}
                          >
                            <IconRenderer name={division.iconName || 'Building'} className="w-5 h-5" />
                          </div>
                        )}
                        <Badge variant="electric" size="sm">
                          {division.badge}
                        </Badge>
                        {division.isPrimary && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            Primary Division
                          </span>
                        )}
                        {division.isComingSoon && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-2.5 h-2.5" />
                            Coming Soon
                          </span>
                        )}
                      </div>

                      <div>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                          {division.name}
                        </h2>
                        <p className="text-sm font-semibold text-[#0052FF]">
                          {division.tagline}
                        </p>
                      </div>

                      {/* Capabilities Highlights */}
                      {division.coreServices && division.coreServices.length > 0 && (
                        <div className="pt-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                            Key Capabilities & Services:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {division.coreServices.slice(0, 4).map((service: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="flex items-start gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#0052FF] shrink-0 mt-0.5" />
                                <span className="font-medium">
                                  {service.title || service.name || service}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-4 flex flex-wrap items-center gap-3">
                        <Magnetic strength={0.2}>
                          <Button
                            variant="electric"
                            size="md"
                            onClick={() => onNavigate(division.route)}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                            className="cursor-pointer"
                          >
                            Explore {division.shortName || division.name}
                          </Button>
                        </Magnetic>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() => onNavigate('/book')}
                          className="cursor-pointer"
                        >
                          Book Services
                        </Button>
                      </div>
                    </div>

                    {/* Division Visual & Stats Panel */}
                    <div className="lg:col-span-5">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl space-y-5 overflow-hidden">
                        {division.imageUrl && (
                          <div className="h-32 -mx-6 -mt-6 mb-3 relative overflow-hidden">
                            <img
                              src={division.imageUrl}
                              alt={division.name}
                              className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                          </div>
                        )}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Division Overview
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>

                        {division.stats && division.stats.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {division.stats.map((stat: any, stIdx: number) => (
                              <div key={stIdx} className="p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="font-display text-lg sm:text-xl font-bold text-blue-300">
                                  {stat.value}
                                </div>
                                <div className="text-[11px] text-slate-400 font-medium leading-tight">
                                  {stat.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2 text-xs text-slate-300">
                            <div className="flex justify-between py-1 border-b border-white/10">
                              <span>Service Reach</span>
                              <span className="text-white font-medium">Islandwide (9 Provinces)</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-white/10">
                              <span>Quality Guarantee</span>
                              <span className="text-blue-300 font-medium">Enterprise Standard</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span>Availability</span>
                              <span className="text-emerald-400 font-medium">24/7 Dispatch</span>
                            </div>
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-blue-600/15 border border-blue-500/25 text-xs text-blue-200">
                          <span className="font-semibold text-white block mb-0.5">Parent Enterprise Governance</span>
                          Backed by Mahdev Pvt Ltd enterprise infrastructure, contracts, and insurance.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </SectionContainer>

      {/* CTA */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/about')}
      />
    </div>
  );
};
