import React, { useEffect } from 'react';
import { PortfolioShowcase } from '../components/corporate/PortfolioShowcase';
import { TestimonialsSection } from '../components/corporate/TestimonialsSection';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { H1, Body } from '../components/ui/Heading';
import { SectionContainer } from '../components/ui/SectionContainer';
import { ScrollReveal } from '../components/motion/MotionWrappers';
import { Badge } from '../components/ui/Badge';
import { PortfolioProject } from '../types';

interface PortfolioViewProps {
  onNavigate: (route: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleInquireProject = (project: PortfolioProject) => {
    onNavigate('/contact');
  };

  return (
    <div className="pt-24 pb-12 bg-white">
      {/* Portfolio Header Banner */}
      <SectionContainer background="white" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="electric" size="sm">
                Parent Group Showcase
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                SWS • U1 Studio • IT • Travels • Mart
              </span>
            </div>
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              Integrated Portfolio & Work
            </H1>
            <Body className="text-slate-600 text-base sm:text-lg">
              Explore landmark engagements across all five Mahdev divisions—from large-scale corporate summits and 8K docuseries to mission-critical cloud software and curated VIP expeditions.
            </Body>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* Main Portfolio Showcase with Division & Category Filters */}
      <PortfolioShowcase onInquireProject={handleInquireProject} onNavigate={onNavigate} />

      {/* Client Testimonials */}
      <TestimonialsSection />

      {/* CTA */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/about')}
      />
    </div>
  );
};
