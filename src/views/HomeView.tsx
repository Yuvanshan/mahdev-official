import React, { lazy, Suspense } from 'react';
import { SEOHead } from '../components/layout/SEOHead';
import { HeroSection } from '../components/home/HeroSection';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DEFAULT_HOMEPAGE_SECTIONS } from '../services/firestore/settings';
import { DynamicSectionItem } from '../types/cms';

const FeaturedServicesSection = lazy(() =>
  import('../components/home/FeaturedServicesSection').then((module) => ({ default: module.FeaturedServicesSection }))
);
const FeaturedWorkSection = lazy(() =>
  import('../components/home/FeaturedWorkSection').then((module) => ({ default: module.FeaturedWorkSection }))
);
const HomeGallerySection = lazy(() =>
  import('../components/home/HomeGallerySection').then((module) => ({ default: module.HomeGallerySection }))
);
const DecorationVideoShowcase = lazy(() =>
  import('../components/home/DecorationVideoShowcase').then((module) => ({ default: module.DecorationVideoShowcase }))
);
const TestimonialsSection = lazy(() =>
  import('../components/corporate/TestimonialsSection').then((module) => ({ default: module.TestimonialsSection }))
);
const MilestonesSection = lazy(() =>
  import('../components/home/MilestonesSection').then((module) => ({ default: module.MilestonesSection }))
);
const TrustedCompaniesSection = lazy(() =>
  import('../components/home/TrustedCompaniesSection').then((module) => ({ default: module.TrustedCompaniesSection }))
);
const CallToActionSection = lazy(() =>
  import('../components/home/CallToActionSection').then((module) => ({ default: module.CallToActionSection }))
);

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
    const HOMEPAGE_SECTIONS = new Set([
      'services',
      'gallery',
      'portfolio',
      'decorationShowcase',
      'testimonials',
      'milestones',
      'trustedCompanies',
      'companies',
      'cta',
    ]);

    return [...sections]
      .filter((section) => section.enabled !== false && HOMEPAGE_SECTIONS.has(section.sectionKey))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [homepageConfig?.sectionsOrder]);

  const renderSectionByKey = (sectionKey: string, id: string) => {
    switch (sectionKey) {
      case 'services':
        return <FeaturedServicesSection key={id} onNavigate={onNavigate} />;
      case 'gallery':
        return <HomeGallerySection key={id} />;
      case 'portfolio':
        return <FeaturedWorkSection key={id} onNavigate={onNavigate} />;
      case 'decorationShowcase':
        return <DecorationVideoShowcase key={id} onNavigate={onNavigate} />;
      case 'testimonials':
        return <TestimonialsSection key={id} onNavigate={onNavigate} />;
      case 'milestones':
        return <MilestonesSection key={id} onNavigate={onNavigate} />;
      case 'trustedCompanies':
      case 'companies':
        return <TrustedCompaniesSection key={id} />;
      case 'cta':
        return <CallToActionSection key={id} onExploreServices={() => onNavigate('/services')} />;
      default:
        return null;
    }
  };

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

      {/* 1. PRIMARY LANDING HERO SECTION — ALWAYS USES THE DEFAULT HERO VIDEO */}
      <HeroSection
        onNavigate={onNavigate}
        onExploreMahdev={() => onNavigate('/services')}
        onContactUs={() => onNavigate('/contact')}
        onExploreServices={() => onNavigate('/services')}
      />

      <div className="flex flex-col">
        {activeSections.map((section) => {
          const content = renderSectionByKey(section.sectionKey, section.id);
          if (!content) return null;
          return (
            <Suspense key={section.id} fallback={<div className="min-h-48 animate-pulse bg-slate-50" />}>
              {content}
            </Suspense>
          );
        })}
      </div>
    </div>
  );
};
