import React, { useMemo } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DayTour } from '../../data/travelsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { ScrollReveal } from '../motion/MotionWrappers';

interface TravelsDayToursSectionProps {
  onBookDayTour: (tour: DayTour) => void;
}

export const TravelsDayToursSection: React.FC<TravelsDayToursSectionProps> = ({
  onBookDayTour,
}) => {
  const { services: rawServices } = useFirestoreDataContext();

  const dayTours = useMemo<DayTour[]>(() => {
    const list: DayTour[] = [];
    if (rawServices && rawServices.length > 0) {
      const tourServices = rawServices.filter(
        (s) =>
          (s.division === 'travels' || (s as any).divisionId === 'travels') &&
          ((s as any).category === 'day-tours' || (s as any).type === 'day-tour')
      );
      tourServices.forEach((s) => {
        list.push({
          id: s.id,
          title: s.name,
          duration: (s as any).duration || (s as any).leadTime || 'Full Day (8-10 Hours)',
          location: (s as any).location || (s as any).startLocation || 'Colombo / Negombo',
          price: typeof s.price === 'number' ? `$${s.price}` : String(s.price || '$95'),
          description: s.description || '',
          imageUrl: s.images && s.images.length > 0 ? s.images[0] : (s as any).imageUrl || '',
          highlights: s.features || [],
          included: (s as any).included || ['Air-conditioned transport', 'Chauffeur guide'],
        });
      });
    }
    return list;
  }, [rawServices]);

  if (dayTours.length === 0) {
    return null;
  }

  return (
    <SectionContainer id="tours" background="white" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block font-mono">
            Single-Day Guided Excursions
          </Caption>
          <H2 className="text-slate-900">
            Day Tours & Immersive Micro-Adventures
          </H2>
          <Body className="text-slate-600 mt-2">
            Perfect for cruise passengers, transit layovers, or hotel guests wanting private round-trip excursions with private chauffeur and entrance tickets included.
          </Body>
        </ScrollReveal>
      </div>

      {/* Grid of Day Tours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dayTours.map((tour) => (
          <div
            key={tour.id}
            className="group rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                <img
                  src={tour.imageUrl}
                  alt={tour.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-mono">
                  <span className="bg-slate-950/70 px-2 py-0.5 rounded">
                    {tour.duration}
                  </span>
                  <span className="font-bold text-amber-300">{tour.price}</span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors leading-snug">
                  {tour.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {tour.description}
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-100">
                  {tour.highlights.slice(0, 2).map((h, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="line-clamp-1">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBookDayTour(tour)}
                className="w-full text-xs hover:border-[#0052FF] hover:text-[#0052FF]"
              >
                Book Day Tour
              </Button>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};
