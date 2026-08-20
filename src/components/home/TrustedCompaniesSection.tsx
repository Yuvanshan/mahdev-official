import React from 'react';
import { Handshake } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { ScrollReveal, Magnetic } from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

export const TrustedCompaniesSection: React.FC = () => {
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

      {/* Partner Logos Matrix with Magnetic Feel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-center justify-center">
        {trustedCompanies.map((company, idx) => (
          <ScrollReveal key={company.id} direction="up" delay={idx * 0.05}>
            <Magnetic strength={0.18}>
              <div className="p-4 rounded-xl bg-white/90 border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center justify-center text-center group cursor-default">
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
        ))}
      </div>
    </SectionContainer>
  );
};
