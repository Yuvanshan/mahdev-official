import React, { useEffect } from 'react';
import { CompanyStorySection } from '../components/corporate/CompanyStorySection';
import { LeadershipSection } from '../components/corporate/LeadershipSection';
import { TimelineCinematic } from '../components/corporate/TimelineCinematic';
import { TrustedCompaniesMatrix } from '../components/corporate/TrustedCompaniesMatrix';
import { WhyMahdevSection } from '../components/home/WhyMahdevSection';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { H1, Body } from '../components/ui/Heading';
import { SectionContainer } from '../components/ui/SectionContainer';
import { ScrollReveal } from '../components/motion/MotionWrappers';
import { Badge } from '../components/ui/Badge';
import { BRAND_CONFIG } from '../config/brand';
import { LeadershipMember } from '../types';
import { SEOHead } from '../components/layout/SEOHead';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';

interface AboutViewProps {
  onNavigate: (route: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  const { companySettings, homepageConfig } = useFirestoreDataContext();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleContactLeadership = (member: LeadershipMember) => {
    onNavigate('/contact');
  };

  const aboutPage = homepageConfig?.aboutPage || {};
  const aboutTitle = aboutPage.title || (companySettings?.tagline ? `${companySettings.name} — ${companySettings.tagline}` : 'Pioneering Creative Artistry & Modern Technology');
  const aboutDescription = aboutPage.description || companySettings?.description || 'Mahdev Pvt Ltd is an integrated parent enterprise governing five autonomous business divisions—harmonizing event production, cinema media, cloud computing, luxury travel expeditions, and professional hardware procurement under a unified standard of excellence.';

  return (
    <div className="pt-20 sm:pt-24 pb-12 bg-white">
      <SEOHead
        title="About Mahdev Pvt Ltd | Enterprise Architecture"
        description="Learn about the origins, vision, leadership, and verified milestones of Mahdev Pvt Ltd—governing 5 specialized divisions in Sri Lanka."
        canonicalUrl="https://mahdev.lk/about"
      />

      {/* Hero Banner for About Mahdev */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="electric" size="sm">
                About Mahdev Pvt Ltd
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                Est. {BRAND_CONFIG.establishedYear} • Colombo & Trincomalee, Sri Lanka
              </span>
            </div>
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              {aboutTitle}
            </H1>
            <Body className="text-slate-600 text-base sm:text-lg">
              {aboutDescription}
            </Body>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* Story, Vision, Mission, Core Values */}
      <CompanyStorySection onExploreDivisions={() => onNavigate('/services')} />

      {/* Why Mahdev (Differentiators & Guarantees) */}
      <WhyMahdevSection />

      {/* Corporate Leadership Team */}
      <LeadershipSection onContactLeadership={handleContactLeadership} />

      {/* Verified Milestones Timeline */}
      <TimelineCinematic />

      {/* Trusted Enterprise Partners */}
      <TrustedCompaniesMatrix />

      {/* Call to Action Banner */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/services')}
      />
    </div>
  );
};

