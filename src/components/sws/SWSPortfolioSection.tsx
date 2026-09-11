import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Quote,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { SWS_PORTFOLIO_ITEMS, SWSPortfolioItem } from '../../data/swsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ScrollReveal } from '../motion/MotionWrappers';

interface SWSPortfolioSectionProps {
  onConsultationClick: () => void;
}

export const SWSPortfolioSection: React.FC<SWSPortfolioSectionProps> = ({
  onConsultationClick,
}) => {
  const { portfolio: rawPortfolio } = useFirestoreDataContext();

  const portfolioItems = useMemo<SWSPortfolioItem[]>(() => {
    if (rawPortfolio && rawPortfolio.length > 0) {
      const swsItems = rawPortfolio.filter(
        (p) => p.division === 'sws' || (p as any).divisionId === 'sws'
      );
      if (swsItems.length > 0) {
        return swsItems.map((p) => ({
          id: p.id,
          title: p.title,
          client: p.client || 'Distinguished Client',
          eventType: (p as any).eventType || (p as any).category || 'Signature Event',
          date: (p as any).date || (p as any).completionDate || '2024',
          location: (p as any).location || 'Colombo, Sri Lanka',
          guestCount: (p as any).guestCount || '350+ Guests',
          summary: p.description || '',
          detailedCase: (p as any).detailedCase || (p as any).challenge || p.description || '',
          imageUrl: p.images && p.images.length > 0 ? p.images[0] : (p as any).imageUrl || '',
          gallery: p.images || [],
          servicesDelivered: (p as any).servicesDelivered || (p as any).highlights || ['Event Architecture', 'Production Management'],
          highlights: (p as any).results || (p as any).highlights || ['Bespoke Aesthetic Lighting Architecture', 'Flawless Live Orchestration'],
          metrics: (p as any).metrics || [
            { label: 'Setup Time', value: '14 Hours' },
            { label: 'Guests', value: '350+' },
            { label: 'Client Rating', value: '5.0 / 5.0' },
          ],
        }));
      }
    }
    return [];
  }, [rawPortfolio]);

  const [selectedCase, setSelectedCase] = useState<SWSPortfolioItem | null>(() => portfolioItems[0] || null);

  if (portfolioItems.length === 0) {
    return null;
  }

  const activeCase = selectedCase || portfolioItems[0];

  return (
    <SectionContainer id="portfolio" background="subtle" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block">Proven Execution & Case Studies</Caption>
          <H2 className="text-slate-900">Hallmark Event Portfolio</H2>
          <Body className="text-slate-600 mt-2">
            Explore how SWS transformed high-stakes client briefs into celebrated productions across Sri Lanka’s most prestigious ballrooms and outdoor sanctuaries.
          </Body>
        </ScrollReveal>
      </div>

      {/* Case Studies Layout: Left Selector / Right Deep View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Case Selector Cards */}
        <div className="lg:col-span-4 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Select Featured Production
          </div>
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedCase(item)}
              className={`p-4 rounded-xl transition-all cursor-pointer border ${
                activeCase.id === item.id
                  ? 'bg-white border-[#0052FF] shadow-md ring-2 ring-blue-500/15'
                  : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    item.imageUrl && item.imageUrl.trim() !== ''
                      ? item.imageUrl.trim()
                      : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={item.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0052FF]">
                    {item.eventType}
                  </div>
                  <h4 className="font-display text-sm font-bold text-slate-900 truncate">
                    {item.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{item.client}</span>
                    <span>•</span>
                    <span>{item.date ? (item.date.split(' ')[1] || item.date) : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Deep Case Study Display */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Main Visual Header */}
          <div className="relative rounded-xl overflow-hidden aspect-[16/9] max-h-[360px] bg-slate-950">
            <img
              src={
                activeCase.imageUrl && activeCase.imageUrl.trim() !== ''
                  ? activeCase.imageUrl.trim()
                  : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80'
              }
              alt={activeCase.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <Badge variant="electric" size="sm" className="mb-1.5">
                {activeCase.eventType}
              </Badge>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
                {activeCase.title}
              </h3>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Client</span>
              <span className="font-semibold text-slate-900 truncate block">{activeCase.client}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Timeline</span>
              <span className="font-semibold text-slate-900">{activeCase.date}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Location</span>
              <span className="font-semibold text-slate-900 truncate block">{activeCase.location}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance</span>
              <span className="font-semibold text-[#0052FF]">{activeCase.guestCount}</span>
            </div>
          </div>

          {/* Narrative & Case Summary */}
          <div className="space-y-3">
            <h4 className="font-display text-base font-bold text-slate-900">
              The Production Challenge & Execution
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">{activeCase.detailedCase}</p>
          </div>

          {/* Key Highlights */}
          {activeCase.highlights && activeCase.highlights.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Highlights & Deliverables
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCase.highlights.map((high, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/40 border border-blue-100 text-xs text-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{high}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonial Quote */}
          {activeCase.testimonial && (
            <div className="p-4 rounded-xl bg-slate-900 text-white relative overflow-hidden">
              <Quote className="w-16 h-16 text-white/5 absolute -right-2 -bottom-2 pointer-events-none" />
              <p className="text-xs italic text-slate-200 leading-relaxed mb-3 relative z-10">
                "{activeCase.testimonial.quote}"
              </p>
              <div className="text-xs relative z-10 flex items-center justify-between border-t border-white/10 pt-2">
                <div>
                  <span className="font-bold text-white block">{activeCase.testimonial.author}</span>
                  <span className="text-[10px] text-slate-400">{activeCase.testimonial.designation}</span>
                </div>
                <Badge variant="electric" size="sm">
                  Verified Client
                </Badge>
              </div>
            </div>
          )}

          {/* Footer Call to Action */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Planning a similar event in {activeCase.location?.split(',')[0]}?
            </div>
            <Button
              variant="electric"
              size="sm"
              onClick={onConsultationClick}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Consult On Your Vision
            </Button>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};
