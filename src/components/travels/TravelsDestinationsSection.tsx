import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { TRAVEL_DESTINATIONS, TravelDestination } from '../../data/travelsData';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';

interface TravelsDestinationsSectionProps {
  onPlanTripForDestination: (dest: TravelDestination) => void;
}

export const TravelsDestinationsSection: React.FC<TravelsDestinationsSectionProps> = ({
  onPlanTripForDestination,
}) => {
  const [activeDestId, setActiveDestId] = useState(TRAVEL_DESTINATIONS[0].id);
  const activeDest = TRAVEL_DESTINATIONS.find((d) => d.id === activeDestId) || TRAVEL_DESTINATIONS[0];

  return (
    <SectionContainer id="destinations" background="white" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block font-mono">
            Iconic Sri Lankan Landscapes
          </Caption>
          <H2 className="text-slate-900">
            Destinations Imbued with Heritage, Wildlife & Natural Wonder
          </H2>
          <Body className="text-slate-600 mt-2">
            From mist-shrouded cloud forests and ancient UNESCO rock citadels to untamed leopard savannahs and golden surf beaches.
          </Body>
        </ScrollReveal>
      </div>

      {/* Destination Grid with Interactive Visual Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: List of 6 Destinations */}
        <div className="lg:col-span-5 space-y-3">
          {TRAVEL_DESTINATIONS.map((dest) => {
            const isSelected = dest.id === activeDestId;
            return (
              <div
                key={dest.id}
                onClick={() => setActiveDestId(dest.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-[#0052FF] bg-blue-50/50 shadow-md ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-slate-900">
                      {dest.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {dest.region}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{dest.tagline}</p>
                </div>

                <div className={`p-1 rounded-full ${isSelected ? 'text-[#0052FF]' : 'text-slate-400'}`}>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Destination Detailed Spotlight Card */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
              <img
                src={activeDest.imageUrl}
                alt={activeDest.name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-300">
                  {activeDest.region}
                </div>
                <h3 className="font-display text-2xl font-bold text-white mt-0.5">
                  {activeDest.name}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activeDest.description}
              </p>

              {/* Highlights Chips */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Curated Destination Highlights
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeDest.highlights.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Travel Info Bar */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-semibold block text-slate-900">Best Season</span>
                    <span className="text-[11px] text-slate-500">{activeDest.bestTimeToVisit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold block text-slate-900">Recommended Pace</span>
                    <span className="text-[11px] text-slate-500">{activeDest.recommendedDays}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0 flex items-center justify-between">
            <button
              onClick={() => onPlanTripForDestination(activeDest)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#0052FF] text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              <span>Customize Itinerary Including {activeDest.name}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};
