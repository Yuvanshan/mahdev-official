import React, { useEffect } from 'react';
import { Handshake, Building2, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, Body, Caption } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ScrollReveal, Magnetic } from '../components/motion/MotionWrappers';
import { TrustedCompaniesMatrix } from '../components/corporate/TrustedCompaniesMatrix';
import { TestimonialsSection } from '../components/corporate/TestimonialsSection';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';

interface ClientsViewProps {
  onNavigate: (route: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onNavigate }) => {
  const { companySettings } = useFirestoreDataContext();
  const companyName = companySettings?.name || 'Mahdev Pvt Ltd';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="w-full flex flex-col pt-20 sm:pt-24 pb-12 bg-white">
      <SEOHead
        title="Enterprise Partners & Clients"
        description={`Discover the leading enterprises, brands, and institutions that trust ${companyName} for events, cinematography, cloud solutions, travel, and certified hardware.`}
        canonicalUrl="https://mahdev.lk/clients"
      />

      {/* 1. Header Banner */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="electric" size="sm">
                Institutional Collaborations
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                Commercial • Government • Private Sector
              </span>
            </div>
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              Enterprise Partners & Clients
            </H1>
            <Body className="text-slate-600 text-base sm:text-lg">
              We partner with industry pioneers, national brands, and creative leaders across Sri Lanka and South Asia to deliver landmark productions, reliable digital architectures, and world-class experiences.
            </Body>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* 2. Trusted Enterprise Partners Matrix */}
      <TrustedCompaniesMatrix />

      {/* 3. Verified Client Testimonials & Endorsements */}
      <TestimonialsSection />

      {/* 4. Partnership Inquiry Section */}
      <SectionContainer background="subtle" paddingY="xl" hasBorderBottom>
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <Badge variant="electric" size="sm" className="bg-blue-600 text-white border-transparent">
              B2B Strategic Alliances
            </Badge>
            <H2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-display font-bold">
              Become a Strategic Partner with {companyName}
            </H2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Gain access to integrated cross-division capabilities, preferred enterprise SLAs, dedicated account directors, and volume procurement pricing across all five business divisions.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Magnetic strength={0.2}>
                <Button
                  variant="electric"
                  size="lg"
                  onClick={() => onNavigate('/contact')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-lg shadow-blue-500/25"
                >
                  Initiate Partnership Inquiry
                </Button>
              </Magnetic>
              <Magnetic strength={0.15}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onNavigate('/services')}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40"
                >
                  Explore Service Spectrum
                </Button>
              </Magnetic>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* 5. Call to Action */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/portfolio')}
      />
    </div>
  );
};
