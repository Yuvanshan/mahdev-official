import React, { useMemo } from 'react';
import {
  Car,
  Users,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Vehicle } from '../../data/travelsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { ScrollReveal } from '../motion/MotionWrappers';

interface TravelsFleetSectionProps {
  onBookTransport: (vehicle: Vehicle) => void;
}

export const TravelsFleetSection: React.FC<TravelsFleetSectionProps> = ({
  onBookTransport,
}) => {
  const { services: rawServices, products: rawProducts } = useFirestoreDataContext();

  const vehicles = useMemo<Vehicle[]>(() => {
    const list: Vehicle[] = [];
    if (rawServices && rawServices.length > 0) {
      const fleetServices = rawServices.filter(
        (s) =>
          (s.division === 'travels' || (s as any).divisionId === 'travels') &&
          ((s as any).category === 'fleet' || (s as any).type === 'vehicle')
      );
      fleetServices.forEach((s) => {
        list.push({
          id: s.id,
          name: s.name,
          category: ((s as any).category || 'Luxury Sedan') as any,
          capacity: (s as any).capacity || (s as any).passengers || '1-3 Passengers',
          luggage: (s as any).luggage || '2 Large + 2 Small Bags',
          dailyRate: typeof s.price === 'number' ? `$${s.price}/day` : String(s.price || '$75/day'),
          features: s.features || ['Air-conditioned', 'English-speaking driver'],
          imageUrl: s.images && s.images.length > 0 ? s.images[0] : (s as any).imageUrl || '',
        });
      });
    }
    return list;
  }, [rawServices, rawProducts]);

  if (vehicles.length === 0) {
    return null;
  }

  return (
    <SectionContainer id="transport" background="subtle" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block font-mono">
            Chauffeur Fleet & Private Mobility
          </Caption>
          <H2 className="text-slate-900">
            Premium Transport, VIP Vans & 4x4 Safari Expeditions
          </H2>
          <Body className="text-slate-600 mt-2">
            Travel across Sri Lanka in total comfort with our private fleet of meticulously maintained, fully insured luxury vehicles operated by seasoned English-speaking tourist chauffeurs.
          </Body>
        </ScrollReveal>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="group rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <img
                  src={v.imageUrl}
                  alt={v.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-white font-semibold">
                  {v.category}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors leading-snug">
                  {v.name}
                </h3>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 font-mono">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{v.capacity}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{v.luggage}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  {v.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 space-y-3">
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">Daily Rental</span>
                <span className="text-xs font-mono font-bold text-slate-900">{v.dailyRate}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onBookTransport(v)}
                className="w-full text-xs hover:border-[#0052FF] hover:text-[#0052FF]"
              >
                Book This Vehicle
              </Button>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};
