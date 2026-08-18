import React, { useEffect } from 'react';
import { CompanyStorySection } from '../components/corporate/CompanyStorySection';
import { LeadershipSection } from '../components/corporate/LeadershipSection';
import { TimelineCinematic } from '../components/corporate/TimelineCinematic';
import { TrustedCompaniesMatrix } from '../components/corporate/TrustedCompaniesMatrix';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { H1, Body, Caption } from '../components/ui/Heading';
import { SectionContainer } from '../components/ui/SectionContainer';
import { ScrollReveal } from '../components/motion/MotionWrappers';
import { Badge } from '../components/ui/Badge';
import { LeadershipMember } from '../types';

interface AboutViewProps {
  onNavigate: (route: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleContactLeadership = (member: LeadershipMember) => {
    onNavigate('/contact');
  };

  return (
    <div className="pt-24 pb-12 bg-white">
      {/* Hero Banner for About Mahdev */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="electric" size="sm">
                About Mahdev Pvt Ltd
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                Est. 2018 • Colombo, Sri Lanka
              </span>
            </div>
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              Pioneering Creative Artistry & Modern Technology
            </H1>
            <Body className="text-slate-600 text-base sm:text-lg">
              Mahdev Pvt Ltd is an integrated parent company governing five autonomous business divisions—harmonizing event production, cinema media, cloud computing, bespoke travel, and certified hardware procurement under a unified standard of excellence.
            </Body>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* Story, Vision, Mission, Core Values */}
      <CompanyStorySection onExploreDivisions={() => onNavigate('/')} />

      {/* Corporate Leadership Team */}
      <LeadershipSection onContactLeadership={handleContactLeadership} />

      {/* Verified Milestones Timeline */}
      <TimelineCinematic />

      {/* Trusted Enterprise Partners */}
      <TrustedCompaniesMatrix />

      {/* Call to Action Banner */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/portfolio')}
      />
    </div>
  );
};
