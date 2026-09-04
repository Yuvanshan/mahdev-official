import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { IconRenderer } from '../ui/IconRenderer';
import {
  ScrollReveal,
  TiltCard,
} from '../motion/MotionWrappers';
import { DIVISIONS, DIVISION_LIST } from '../../config/divisions';
import { BRAND_CONFIG } from '../../config/brand';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DivisionId } from '../../types';

interface DivisionsSectionProps {
  onNavigate: (route: string) => void;
}

export const DivisionsSection: React.FC<DivisionsSectionProps> = ({ onNavigate }) => {
  const { divisions, activeDivisions, companySettings } = useFirestoreDataContext();

  // Merge Firestore division data with division route/icon configs
  const displayDivisions = React.useMemo(() => {
    if (divisions && divisions.length > 0) {
      return divisions
        .filter((d) => d.status !== 'inactive')
        .map((d) => {
          const config = DIVISIONS[d.id as DivisionId] || DIVISION_LIST.find((item) => item.id === d.id) || {
            id: d.id,
            name: d.name,
            shortName: d.name,
            tagline: d.hero?.subtitle || '',
            description: d.description,
            route: `/${d.slug || d.id}`,
            badge: d.hero?.badge || 'Enterprise Division',
            iconName: 'Building',
            color: '#0052FF',
            coreServices: [],
            stats: [],
          };

          return {
            id: d.id,
            name: d.name || config.name,
            shortName: (config as any).shortName || d.name,
            tagline: d.hero?.subtitle || (config as any).tagline || '',
            description: d.description || config.description,
            route: (config as any).route || `/${d.slug || d.id}`,
            badge: d.hero?.badge || (config as any).badge || 'Active Division',
            iconName: (config as any).iconName || 'Building',
            color: (config as any).color || '#0052FF',
            coreServices:
              (d as any).coreServices && (d as any).coreServices.length > 0
                ? (d as any).coreServices
                : (config as any).coreServices || [],
            stats:
              (d as any).stats && (d as any).stats.length > 0
                ? (d as any).stats
                : (config as any).stats || [{ label: 'Operational Status', value: 'Active' }],
            cardHighlight: (d as any).cardHighlight || (config as any).cardHighlight || '',
          };
        });
    }
    return [];
  }, [divisions]);

  const totalCount = displayDivisions.length;

  return (
    <SectionContainer
      id="divisions"
      background="subtle"
      paddingY="xl"
      hasBorderBottom
    >
      <ScrollReveal direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0052FF] block mb-2">
              Our Portfolio
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-2">
              Operating Business Divisions
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Dedicated industry mastery with turnkey execution under the unified governance of {companySettings?.name || 'Mahdev Group'}.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-200/70 text-slate-700">
              {totalCount} Active Divisions
            </span>
          </div>
        </div>
      </ScrollReveal>

      {totalCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h3 className="font-display font-bold text-slate-800 text-lg mb-1">No Divisions Available</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Divisions synchronized from Cloud Firestore will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayDivisions.map((division, idx) => (
            <ScrollReveal key={division.id} direction="up" delay={idx * 0.06}>
              <div
                id={`division-card-${division.id}`}
                onClick={() => onNavigate(division.route)}
                className="group relative flex flex-col justify-between rounded-xl bg-white border border-slate-200/90 p-6 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer h-full"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center group-hover:bg-[#0052FF] group-hover:text-white transition-colors">
                      <IconRenderer name={division.iconName} className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                      {division.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900 mb-1.5 group-hover:text-[#0052FF] transition-colors">
                    {division.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-5 line-clamp-2">
                    {division.description}
                  </p>

                  {division.coreServices && division.coreServices.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {division.coreServices.slice(0, 3).map((service: any, sIdx: number) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200/70"
                        >
                          {service.title ? service.title.split('&')[0] : (service.name || 'Service')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {(division as any).cardHighlight || 'Specialized Solutions'}
                  </span>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-[#0052FF] group-hover:translate-x-0.5 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* View All Divisions CTA Button */}
      <div className="mt-12 text-center">
        <button
          onClick={() => onNavigate('/divisions')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold text-xs hover:border-[#0052FF] hover:text-[#0052FF] hover:shadow-xs transition-all cursor-pointer group"
        >
          <span>View All Divisions & Portfolios</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#0052FF] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </SectionContainer>
  );
};
