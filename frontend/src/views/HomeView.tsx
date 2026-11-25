import React, { lazy, Suspense } from 'react';
import { SEOHead } from '../components/layout/SEOHead';
import { HeroSection } from '../components/home/HeroSection';
import {
  HomeConversionSections,
  HomeDiscoverySections,
} from '../components/home/HomeRedesignSections';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DEFAULT_HOMEPAGE_SECTIONS } from '../services/firestore/settings';
import { DynamicSectionItem } from '../types/cms';
import { motion, useReducedMotion } from 'motion/react';
import { CANONICAL_SITE_ORIGIN } from '../config/site';
import { ShopHome } from '../components/shop/ShopHome';
import { FaqSection } from '../components/common/FaqSection';
import { usePageFaqs } from '../hooks/usePageFaqs';

const ServicesSolutionsSection = lazy(() =>
  import('../components/home/ServicesSolutionsSection').then((module) => ({ default: module.ServicesSolutionsSection }))
);
const FeaturedWorkSection = lazy(() =>
  import('../components/home/FeaturedWorkSection').then((module) => ({ default: module.FeaturedWorkSection }))
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
  const { homepageConfig } = useFirestoreDataContext();
  const reducedMotion = useReducedMotion();
  // Visible questions on the home page; FaqSection publishes the matching FAQPage data.
  const faqs = usePageFaqs('home');

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

    // Services and gallery share one "Services & Solutions" section, shown at the first of the two.
    let hasServicesAndGallery = false;
    return [...sections]
      .filter((section) => section.enabled !== false && HOMEPAGE_SECTIONS.has(section.sectionKey))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .filter((section) => {
        if (section.sectionKey !== 'services' && section.sectionKey !== 'gallery') return true;
        if (hasServicesAndGallery) return false;
        hasServicesAndGallery = true;
        return true;
      });
  }, [homepageConfig?.sectionsOrder]);

  const renderSectionByKey = (sectionKey: string, id: string) => {
    switch (sectionKey) {
      case 'services':
      case 'gallery':
        return <ServicesSolutionsSection key={id} onNavigate={onNavigate} />;
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

  const effectivePageTitle =
    homepageConfig?.seo?.pageTitle || 'Mahdev (Pvt) Ltd - Creating Moments | Capturing Memories | Delivering Innovation';
  const defaultHomeDescription =
    'Mahdev Group is the parent company behind SWS Event Management, U1 Studio, Mahdev IT Solutions, Mahdev Travels and Mahdev Online Mart, with more divisions to come.';
  return (
    <div className="w-full flex flex-col pb-24 lg:pb-0">
      <SEOHead
        title={effectivePageTitle}
        description={homepageConfig?.seo?.metaDescription || defaultHomeDescription}
        canonicalUrl={homepageConfig?.seo?.canonicalUrl || CANONICAL_SITE_ORIGIN}
        ogTitle={effectivePageTitle}
        ogDescription={homepageConfig?.seo?.metaDescription}
      />

      <ShopHome onNavigate={onNavigate} />
      <HeroSection
        onNavigate={onNavigate}
        onExploreMahdev={() => onNavigate('/services')}
        onContactUs={() => onNavigate('/contact')}
        onExploreServices={() => onNavigate('/services')}
      />
      <HomeDiscoverySections onNavigate={onNavigate} />
      <div className="flex flex-col">
        {activeSections.map((section) => {
          const content = renderSectionByKey(section.sectionKey, section.id);
          if (!content) return null;
          return (
            <motion.div
              key={section.id}
              initial={reducedMotion ? false : { opacity: 0, y: 28 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={reducedMotion ? undefined : { once: true, amount: 0.08 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="home-dynamic-section"
            >
              <Suspense fallback={<div className="min-h-48 animate-pulse bg-slate-50" />}>
                {content}
              </Suspense>
            </motion.div>
          );
        })}
      </div>
      <HomeConversionSections onNavigate={onNavigate} />
      <FaqSection
        items={faqs}
        id="home-faq"
        background="subtle"
        previewLimit={6}
        onNavigate={onNavigate}
      />
    </div>
  );
};
