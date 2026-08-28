import React from 'react';
import { SEOHead } from '../components/layout/SEOHead';
import { HeroSection } from '../components/home/HeroSection';
import { IntroSection } from '../components/home/IntroSection';
import { DivisionsSection } from '../components/home/DivisionsSection';
import { WhyMahdevSection } from '../components/home/WhyMahdevSection';
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
        onExploreMahdev={() => scrollToSection('intro')}
        onExploreServices={() => scrollToSection('divisions')}
      />

      {/* 2. WHO ARE WE? — MAHDEV ENTERPRISE FOUNDATION */}
      <IntroSection />

      {/* 3. WHAT DO WE OFFER? — FIVE BUSINESS DIVISIONS */}
      <DivisionsSection onNavigate={onNavigate} />

      {/* 4. WHY CHOOSE US? — CORE ADVANTAGES & INSTITUTIONAL SLA */}
      <WhyMahdevSection />

      {/* 5. WHAT SHOULD THE VISITOR DO NEXT? — DIRECT CONSULTATION & DISPATCH */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/catalog')}
      />
    </div>
  );
};

