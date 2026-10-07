import React from 'react';
import { SEOHead } from '../components/layout/SEOHead';
import { HeroSection } from '../components/home/HeroSection';
import { DivisionsSection } from '../components/home/DivisionsSection';
import { FeaturedServicesSection } from '../components/home/FeaturedServicesSection';
import { FeaturedWorkSection } from '../components/home/FeaturedWorkSection';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DEFAULT_HOMEPAGE_SECTIONS } from '../services/firestore/settings';
import { DynamicSectionItem } from '../types/cms';

interface HomeViewProps {
  onNavigate: (route: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { companySettings, siteSettings, homepageConfig } = useFirestoreDataContext();

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Keep the homepage focused on the core offer and avoid rendering every CMS module at once.
  const activeSections: DynamicSectionItem[] = React.useMemo(() => {
    const sections = homepageConfig?.sectionsOrder && homepageConfig.sectionsOrder.length > 0
      ? homepageConfig.sectionsOrder
      : DEFAULT_HOMEPAGE_SECTIONS;
    const HOMEPAGE_SECTIONS = new Set(['divisions', 'services', 'portfolio']);

    const middleSections = [...sections]
      .filter((section) => section.enabled !== false && HOMEPAGE_SECTIONS.has(section.sectionKey))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return middleSections.some((section) => section.sectionKey === 'divisions')
      ? middleSections
      : [
          { id: 'default-divisions', name: 'Businesses', sectionKey: 'divisions', enabled: true, order: 0 },
          ...middleSections,
        ];
  }, [homepageConfig?.sectionsOrder]);

  const renderSectionByKey = (sectionKey: string, id: string) => {
    switch (sectionKey) {
      case 'divisions':
        return <DivisionsSection key={id} onNavigate={onNavigate} />;
      case 'services':
        return <FeaturedServicesSection key={id} onNavigate={onNavigate} />;
      case 'portfolio':
        return <FeaturedWorkSection key={id} onNavigate={onNavigate} />;
      default:
        return null;
    }
  };

  const renderedSections = React.useMemo(() => {
    return activeSections
      .map((section) => renderSectionByKey(section.sectionKey, section.id))
      .filter(Boolean);
  }, [activeSections]);

  const effectiveBrandName = companySettings?.name
    ? companySettings.name
    : siteSettings?.siteName || 'Mahdev Group';
  const effectivePageTitle = homepageConfig?.seo?.pageTitle || `${effectiveBrandName} | Products, experiences and technology`;

  return (
    <div className="w-full flex flex-col pb-24 lg:pb-0">
      <SEOHead
        title={effectivePageTitle}
        description={homepageConfig?.seo?.metaDescription || `${effectiveBrandName} brings together events, creative studio, technology, travel and retail.`}
        canonicalUrl={homepageConfig?.seo?.canonicalUrl || 'https://mahdev.lk'}
        ogTitle={effectivePageTitle}
        ogDescription={homepageConfig?.seo?.metaDescription}
      />

      {/* 1. PRIMARY LANDING HERO SECTION — ALWAYS USES /assets/hero_main.mp4 */}
      <HeroSection
        onNavigate={onNavigate}
        onExploreMahdev={() => scrollToSection('divisions')}
        onContactUs={() => onNavigate('/contact')}
        onExploreServices={() => onNavigate('/divisions')}
      />

      {/* Focused sections: businesses, selected services, and work. */}
      {renderedSections}
    </div>
  );
};
