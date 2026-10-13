import React, { useEffect } from 'react';
import { ContactCorporateSection } from '../components/corporate/ContactCorporateSection';
import { TrustedCompaniesMatrix } from '../components/corporate/TrustedCompaniesMatrix';
import { H1 } from '../components/ui/Heading';
import { SectionContainer } from '../components/ui/SectionContainer';
import { ScrollReveal } from '../components/motion/MotionWrappers';

interface ContactViewProps {
  onNavigate: (route: string) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="pt-24 pb-12 bg-white">
      {/* Contact Header */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">
                Colombo & Trincomalee, Sri Lanka
              </span>
            </div>
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              Get in Touch with Mahdev
            </H1>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* Main Contact Form & Location Details */}
      <ContactCorporateSection />

      {/* Trusted Partners */}
      <TrustedCompaniesMatrix />
    </div>
  );
};
