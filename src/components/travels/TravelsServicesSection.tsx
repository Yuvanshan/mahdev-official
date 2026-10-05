import React, { useMemo } from 'react';
import { Compass, CheckCircle2 } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { isSameDivision } from '../../services/firestore/divisions';

export const TravelsServicesSection: React.FC = () => {
  const { services: rawServices } = useFirestoreDataContext();

  const travelServices = useMemo(() => {
    if (rawServices && rawServices.length > 0) {
      const filtered = rawServices.filter(
        (s) =>
          (isSameDivision(s.division, 'travels') || isSameDivision((s as any).divisionId, 'travels')) &&
          (s as any).category !== 'packages' &&
          (s as any).type !== 'package'
      );
      if (filtered.length > 0) {
        return filtered.map((s) => ({
          title: s.name,
          desc: s.description || (s as any).detailedDescription || '',
          icon: <Compass className="w-5 h-5 text-blue-600" />,
        }));
      }
    }
    return [];
  }, [rawServices]);

  if (travelServices.length === 0) {
    return null;
  }

  return (
    <SectionContainer id="services" background="white" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block font-mono">
            Full-Spectrum Travel Concierge
          </Caption>
          <H2 className="text-slate-900">
            Comprehensive On-Ground Tourism & Travel Services
          </H2>
          <Body className="text-slate-600 mt-2">
            Every detail of your journey is coordinated by local specialists, ensuring seamless transitions, authentic local connections, and absolute peace of mind.
          </Body>
        </ScrollReveal>
      </div>

      {/* Grid of Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {travelServices.map((svc, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                {svc.icon}
              </div>
              <h3 className="font-display text-base font-bold text-slate-900">{svc.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{svc.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Included in all bespoke bookings</span>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};
