import React from 'react';
import { Handshake } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { ScrollReveal, Magnetic } from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface TrustedCompaniesSectionProps {
  onExplorePartners?: () => void;
}

export const TrustedCompaniesSection: React.FC<TrustedCompaniesSectionProps> = ({ onExplorePartners }) => {
  const { trustedCompanies } = useFirestoreDataContext();

  if (trustedCompanies.length === 0) {
    return null;
  }

  return (
    <SectionContainer
      id="companies"
      background="subtle"
      paddingY="lg"
      hasBorderBottom
    >
      <ScrollReveal direction="up">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 mb-2 shadow-2xs">
            <Handshake className="w-3.5 h-3.5 text-[#0052FF]" />
            <span>Enterprise Collaborations</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Trusted by leading enterprises, government partners, and creative agencies across Sri Lanka.
          </p>
        </div>
      </ScrollReveal>

      {/* Partner Logos Matrix with Magnetic Feel - Horizontal Scroll on Mobile */}
      <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-6 sm:gap-4 items-center justify-start sm:justify-center sm:overflow-visible">
        {trustedCompanies.map((company, idx) => (
          <div
            key={company.id}
            className="min-w-[140px] sm:min-w-0 snap-center shrink-0 sm:shrink"
          >
            <ScrollReveal direction="up" delay={idx * 0.05}>
              <Magnetic strength={0.18}>
                <div
                  onClick={onExplorePartners}
                  className={`p-4 rounded-xl bg-white/90 border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center justify-center text-center group ${
                    onExplorePartners ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="h-8 max-w-[120px] object-contain mb-1 group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-display font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#0052FF] transition-colors">
                      {company.name}
                    </span>
                  )}
                  {company.industry && (
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {company.industry}
                    </span>
                  )}
                </div>
              </Magnetic>
            </ScrollReveal>
          </div>
        ))}
      </div>

      {onExplorePartners && (
        <div className="mt-6 text-center">
          <button
            onClick={onExplorePartners}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052FF] hover:underline cursor-pointer"
          >
            <span>View All Partner Case Studies & Client Testimonials</span>
            <span>→</span>
          </button>
        </div>
      )}
    </SectionContainer>
  );
};
