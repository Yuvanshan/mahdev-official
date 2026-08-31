import React from 'react';
import { SEOHead } from '../components/layout/SEOHead';
import { WelcomeAnimation } from '../components/home/WelcomeAnimation';
import { HeroSection } from '../components/home/HeroSection';
import { DivisionsSection } from '../components/home/DivisionsSection';
import { DecorationVideoShowcase } from '../components/home/DecorationVideoShowcase';
import { FeaturedWorkSection } from '../components/home/FeaturedWorkSection';
import { MilestonesSection } from '../components/home/MilestonesSection';
import { TrustedCompaniesSection } from '../components/home/TrustedCompaniesSection';
import { TestimonialsSection } from '../components/corporate/TestimonialsSection';
import { ContactCorporateSection } from '../components/corporate/ContactCorporateSection';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';

interface HomeViewProps {
  onNavigate: (route: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { companySettings, siteSettings } = useFirestoreDataContext();

  const brandName = companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd';
  const tagline = companySettings?.tagline || 'Creating Moments. Capturing Memories. Delivering Innovation.';

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col pb-24 lg:pb-0">
      {/* 0. WELCOME ANIMATION (Shown smoothly on first site visit) */}
      <WelcomeAnimation />

      <SEOHead
        title="Corporate Ecosystem"
        description={`${brandName} — ${tagline} Multi-division enterprise spanning Event Management, Studio Cinema, IT & Cloud, Travels, and E-Commerce.`}
        canonicalUrl="https://mahdev.lk"
      />

      {/* 1. HERO SECTION */}
      <HeroSection
        onNavigate={onNavigate}
        onExploreMahdev={() => scrollToSection('divisions')}
        onContactUs={() => onNavigate('/contact')}
        onExploreServices={() => onNavigate('/divisions')}
      />

      {/* 2. OUR DIVISIONS */}
      <DivisionsSection onNavigate={onNavigate} />

      {/* 3. CINEMATIC EVENT & DECORATION VIDEO SHOWCASE */}
      <DecorationVideoShowcase onNavigate={onNavigate} />

      {/* 4. OUR PROJECTS */}
      <FeaturedWorkSection onNavigate={onNavigate} />

      {/* 5. COMPANY MILESTONES */}
      <MilestonesSection onNavigate={onNavigate} />

      {/* 6. TRUSTED COMPANIES */}
      <TrustedCompaniesSection onExplorePartners={() => onNavigate('/clients')} />

      {/* 7. TESTIMONIALS */}
      <TestimonialsSection onNavigate={onNavigate} />

      {/* 8. CONTACT / CTA SECTION */}
      <ContactCorporateSection />
    </div>
  );
};

