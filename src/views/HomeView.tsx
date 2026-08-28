import React from 'react';
import { SEOHead } from '../components/layout/SEOHead';
import { HeroSection } from '../components/home/HeroSection';
import { IntroSection } from '../components/home/IntroSection';
import { DivisionsSection } from '../components/home/DivisionsSection';
import { FeaturedServicesSection } from '../components/home/FeaturedServicesSection';
import { FeaturedWorkSection } from '../components/home/FeaturedWorkSection';
import { TimelineCinematic } from '../components/corporate/TimelineCinematic';
import { TrustedCompaniesMatrix } from '../components/corporate/TrustedCompaniesMatrix';
import { CompanyStorySection } from '../components/corporate/CompanyStorySection';
import { LeadershipSection } from '../components/corporate/LeadershipSection';
import { TestimonialsSection } from '../components/corporate/TestimonialsSection';
import { WhyMahdevSection } from '../components/home/WhyMahdevSection';
import { ContactCorporateSection } from '../components/corporate/ContactCorporateSection';
import { CallToActionSection } from '../components/home/CallToActionSection';

interface HomeViewProps {
  onNavigate: (route: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col">
      <SEOHead
        title="Corporate Ecosystem"
        description="Mahdev Pvt Ltd — Creating Moments. Capturing Memories. Delivering Innovation. Multi-division enterprise spanning Event Management, Studio Cinema, IT & Cloud, Travels, and E-Commerce."
        canonicalUrl="https://mahdev.lk"
      />

      {/* 1. HERO SECTION */}
      <HeroSection
        onNavigate={onNavigate}
        onExploreMahdev={() => scrollToSection('divisions')}
        onExploreServices={() => scrollToSection('featured-services')}
      />

      {/* 2. MAHDEV INTRODUCTION SECTION */}
      <IntroSection />

      {/* 3. FIVE BUSINESS DIVISIONS */}
      <DivisionsSection onNavigate={onNavigate} />

      {/* 4. FEATURED SERVICES SECTION */}
      <FeaturedServicesSection onNavigate={onNavigate} />

      {/* 5. FEATURED WORK & PORTFOLIO HORIZONTAL CAROUSEL */}
      <FeaturedWorkSection onNavigate={onNavigate} />

      {/* 6. CINEMATIC MILESTONES TIMELINE (2018 - PRESENT) */}
      <TimelineCinematic />

      {/* 7. TRUSTED ENTERPRISE COMPANIES MATRIX */}
      <TrustedCompaniesMatrix />

      {/* 8. ABOUT MAHDEV: STORY, VISION, MISSION & VALUES */}
      <CompanyStorySection onExploreDivisions={() => scrollToSection('divisions')} />

      {/* 9. CORPORATE LEADERSHIP TEAM */}
      <LeadershipSection onContactLeadership={() => scrollToSection('contact')} />

      {/* 10. CLIENT TESTIMONIALS & ENDORSEMENTS */}
      <TestimonialsSection />

      {/* 11. WHY MAHDEV (DIFFERENTIATORS) */}
      <WhyMahdevSection />

      {/* 12. DIRECT CORPORATE DISPATCH & CONTACT */}
      <ContactCorporateSection />

      {/* 13. CALL TO ACTION */}
      <CallToActionSection
        onPrimaryClick={() => scrollToSection('contact')}
        onSecondaryClick={() => scrollToSection('featured-services')}
      />
    </div>
  );
};
