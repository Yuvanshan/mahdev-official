import React from 'react';
import { SEOHead } from '../components/layout/SEOHead';
import { HeroSection } from '../components/home/HeroSection';
import { AboutMahdevSection } from '../components/home/AboutMahdevSection';
import { DivisionsSection } from '../components/home/DivisionsSection';
import { FeaturedServicesSection } from '../components/home/FeaturedServicesSection';
import { WhyMahdevSection } from '../components/home/WhyMahdevSection';
import { HappyClientsAndProjectsSection } from '../components/home/HappyClientsAndProjectsSection';
import { DecorationVideoShowcase } from '../components/home/DecorationVideoShowcase';
import { FeaturedWorkSection } from '../components/home/FeaturedWorkSection';
import { MilestonesSection } from '../components/home/MilestonesSection';
import { TrustedCompaniesSection } from '../components/home/TrustedCompaniesSection';
import { TestimonialsSection } from '../components/corporate/TestimonialsSection';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { ContactCorporateSection } from '../components/corporate/ContactCorporateSection';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DEFAULT_HOMEPAGE_SECTIONS } from '../services/firestore/settings';
import { DynamicSectionItem } from '../types/cms';

interface HomeViewProps {
  onNavigate: (route: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { companySettings, siteSettings, homepageConfig } = useFirestoreDataContext();

  const brandName = companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd';
  const tagline = companySettings?.tagline || 'Creating Moments. Capturing Memories. Delivering Innovation.';

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Reorderable sections from Firestore CMS
  const activeSections: DynamicSectionItem[] = React.useMemo(() => {
    const sections = homepageConfig?.sectionsOrder && homepageConfig.sectionsOrder.length > 0
      ? homepageConfig.sectionsOrder
      : DEFAULT_HOMEPAGE_SECTIONS;

    return [...sections]
      .filter((s) => s.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [homepageConfig?.sectionsOrder]);

  const renderSectionByKey = (sectionKey: string, id: string) => {
    switch (sectionKey) {
      case 'hero':
        return (
          <HeroSection
            key={id}
            onNavigate={onNavigate}
            onExploreMahdev={() => scrollToSection('divisions')}
            onContactUs={() => onNavigate('/contact')}
            onExploreServices={() => onNavigate('/divisions')}
          />
        );
      case 'about':
        return (
          <AboutMahdevSection
            key={id}
            onExploreDivisions={() => onNavigate('/divisions')}
          />
        );
      case 'divisions':
        return <DivisionsSection key={id} onNavigate={onNavigate} />;
      case 'services':
        return <FeaturedServicesSection key={id} onNavigate={onNavigate} />;
      case 'whyMahdev':
        return <WhyMahdevSection key={id} />;
      case 'statistics':
        return <HappyClientsAndProjectsSection key={id} />;
      case 'gallery':
      case 'portfolio':
        return <FeaturedWorkSection key={id} onNavigate={onNavigate} />;
      case 'decorationShowcase':
        return <DecorationVideoShowcase key={id} onNavigate={onNavigate} />;
      case 'milestones':
        return <MilestonesSection key={id} onNavigate={onNavigate} />;
      case 'trustedCompanies':
      case 'companies':
        return (
          <TrustedCompaniesSection
            key={id}
            onExplorePartners={() => onNavigate('/clients')}
          />
        );
      case 'testimonials':
        return <TestimonialsSection key={id} onNavigate={onNavigate} />;
      case 'cta':
        return (
          <CallToActionSection
            key={id}
            onExploreServices={() => onNavigate('/divisions')}
            onPrimaryClick={() => onNavigate('/contact')}
            onSecondaryClick={() => onNavigate('/divisions')}
          />
        );
      case 'contact':
        return <ContactCorporateSection key={id} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col pb-24 lg:pb-0">
      <SEOHead
        title={homepageConfig?.seo?.pageTitle && homepageConfig.seo.pageTitle !== 'Corporate Ecosystem' ? homepageConfig.seo.pageTitle : 'Mahdev Pvt Ltd – Creating. Capturing. Innovating.'}
        description={homepageConfig?.seo?.metaDescription || `${brandName} — Creating. Capturing. Innovating. Multi-division enterprise spanning Event Management, Studio Cinema, IT & Cloud, Travels, and E-Commerce.`}
        canonicalUrl={homepageConfig?.seo?.canonicalUrl || 'https://mahdev.lk'}
        ogTitle={homepageConfig?.seo?.pageTitle && homepageConfig.seo.pageTitle !== 'Corporate Ecosystem' ? homepageConfig.seo.pageTitle : 'Mahdev Pvt Ltd – Creating. Capturing. Innovating.'}
        ogDescription={homepageConfig?.seo?.metaDescription}
      />

      {/* DYNAMIC CMS SECTIONS IN CONFIGURED ORDER */}
      {activeSections.map((sec) => renderSectionByKey(sec.sectionKey, sec.id))}
    </div>
  );
};


