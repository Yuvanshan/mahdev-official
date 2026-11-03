import React, { lazy, Suspense } from 'react';
import { SEOHead } from '../components/layout/SEOHead';
import { HeroSection } from '../components/home/HeroSection';
import { DivisionsSection } from '../components/home/DivisionsSection';
import { BookingGuide } from '../components/home/BookingGuide';
import { HomeDashboardShell } from '../components/home/HomeDashboardShell';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DEFAULT_HOMEPAGE_SECTIONS } from '../services/firestore/settings';
import { DynamicSectionItem } from '../types/cms';
import { motion, useReducedMotion } from 'motion/react';
import { CANONICAL_SITE_ORIGIN } from '../config/site';
import { useAdminAuth } from '../context/AdminAuthContext';

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
  const { companySettings, siteSettings, homepageConfig, isSettingsLoading } = useFirestoreDataContext();
  const { admin, isAuthenticated, isRestoringSession, ensureSessionRestored } = useAdminAuth();
  const reducedMotion = useReducedMotion();
  const [previewCheckStarted, setPreviewCheckStarted] = React.useState(false);
  const previewTheme = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('themePreview')
    : null;
  const requestedPreview = previewTheme === 'v1' || previewTheme === 'v2' ? previewTheme : null;
  const isLocalThemePreview = Boolean(
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
  );

  React.useEffect(() => {
    if (!requestedPreview || isLocalThemePreview) return;
    setPreviewCheckStarted(true);
    ensureSessionRestored();
  }, [ensureSessionRestored, isLocalThemePreview, requestedPreview]);

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

  const renderSectionByKey = (sectionKey: string, id: string, publishedOnly = false) => {
    switch (sectionKey) {
      case 'services':
        return (
          <FeaturedServicesSection
            key={id}
            onNavigate={onNavigate}
            publishedOnly={publishedOnly}
            showEmptyState={publishedOnly}
          />
        );
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
  const effectivePageTitle =
    homepageConfig?.seo?.pageTitle || 'Mahdev (Pvt) Ltd | Events, Studio, IT & Travel, Trincomalee & Colombo';
  const canPreviewTheme = isLocalThemePreview || (isAuthenticated && Boolean(admin));
  const activeTheme = requestedPreview && canPreviewTheme
    ? requestedPreview
    : siteSettings.websiteAppearance?.activeTheme || 'v1';
  const previewUnavailable = Boolean(
    requestedPreview &&
    canPreviewTheme &&
    siteSettings.websiteAppearance?.availableThemes[requestedPreview] === false
  );

  if (requestedPreview && !canPreviewTheme) {
    if (!previewCheckStarted || isRestoringSession) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />
          <span className="sr-only">Checking administrator access…</span>
        </div>
      );
    }

    return (
      <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">Theme preview is restricted</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Sign in through the existing Admin Portal to preview unpublished website themes.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/admin-yuvan1709')}
          className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
        >
          Open Admin Portal
        </button>
      </main>
    );
  }

  if (
    previewUnavailable ||
    (
    !requestedPreview &&
    isSettingsLoading &&
    !siteSettings.websiteAppearance
    )
  ) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center" role="status">
        <h1 className="font-display text-xl font-bold text-slate-900">
          {previewUnavailable ? 'This theme is not available for preview' : 'Loading website appearance'}
        </h1>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pb-24 lg:pb-0">
      <SEOHead
        title={effectivePageTitle}
        description={homepageConfig?.seo?.metaDescription || `${effectiveBrandName} brings together events, creative studio, technology, travel and retail.`}
        canonicalUrl={homepageConfig?.seo?.canonicalUrl || CANONICAL_SITE_ORIGIN}
        ogTitle={effectivePageTitle}
        ogDescription={homepageConfig?.seo?.metaDescription}
      />

      {activeTheme === 'v2' ? (
        <HomeDashboardShell onNavigate={onNavigate}>
          <DivisionsSection onNavigate={onNavigate} layout="grid" />
          <div className="flex flex-col">
            {activeSections.map((section) => {
              const content = renderSectionByKey(section.sectionKey, section.id, true);
              if (!content) return null;
              return (
                <motion.div
                  key={section.id}
                  initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={reducedMotion ? undefined : { once: true, amount: 0.08 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Suspense fallback={<div className="min-h-48 animate-pulse bg-slate-50" />}>
                    {content}
                  </Suspense>
                </motion.div>
              );
            })}
          </div>
          <BookingGuide />
        </HomeDashboardShell>
      ) : (
        <>
          <HeroSection
            onNavigate={onNavigate}
            onExploreMahdev={() => onNavigate('/services')}
            onContactUs={() => onNavigate('/contact')}
            onExploreServices={() => onNavigate('/services')}
          />
          <DivisionsSection onNavigate={onNavigate} />
          <BookingGuide />
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
                >
                  <Suspense fallback={<div className="min-h-48 animate-pulse bg-slate-50" />}>
                    {content}
                  </Suspense>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
