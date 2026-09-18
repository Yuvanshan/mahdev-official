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
import { HomeGallerySection } from '../components/home/HomeGallerySection';
import { MilestonesSection } from '../components/home/MilestonesSection';
import { TestimonialsSection } from '../components/corporate/TestimonialsSection';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { ContactCorporateSection } from '../components/corporate/ContactCorporateSection';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DEFAULT_HOMEPAGE_SECTIONS } from '../services/firestore/settings';
import { DynamicSectionItem } from '../types/cms';
import { HomeBelowHeroShimmer } from '../components/home/HomeBelowHeroShimmer';

interface HomeViewProps {
  onNavigate: (route: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { companySettings, siteSettings, homepageConfig, isInitialLoading, divisions } = useFirestoreDataContext();

  const brandName = companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd';
  const tagline = companySettings?.tagline || 'Creating Moments. Capturing Memories. Delivering Innovation.';

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Reorderable sections from Firestore CMS (excluding hero which is rendered primarily at top)
  const activeSections: DynamicSectionItem[] = React.useMemo(() => {
    const sections = homepageConfig?.sectionsOrder && homepageConfig.sectionsOrder.length > 0
      ? homepageConfig.sectionsOrder
      : DEFAULT_HOMEPAGE_SECTIONS;

    // Filter out 'hero' (rendered explicitly at the very top), and banned or bottom sections
    const BANNED_SECTIONS = new Set([
      'hero',
      'whyMahdev',
      'advantage',
      'cta',
      'ctaSection',
      'contact',
      'pricing',
      'randomEvents',
      'welcomeAnimation',
    ]);

    // Bottom fixed sections that must appear at the very bottom before the footer
    const BOTTOM_KEYS = new Set(['milestones', 'trustedCompanies', 'companies', 'testimonials']);

    const middleSections = [...sections]
      .filter((s) => s.enabled !== false && !BANNED_SECTIONS.has(s.sectionKey) && !BOTTOM_KEYS.has(s.sectionKey))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return middleSections;
  }, [homepageConfig?.sectionsOrder]);

  const renderSectionByKey = (sectionKey: string, id: string) => {
    switch (sectionKey) {
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
      case 'statistics':
        return <HappyClientsAndProjectsSection key={id} />;
      case 'portfolio':
        return <FeaturedWorkSection key={id} onNavigate={onNavigate} />;
      case 'gallery':
        return <HomeGallerySection key={id} />;
      case 'decorationShowcase':
        return <DecorationVideoShowcase key={id} onNavigate={onNavigate} />;
      default:
        return null;
    }
  };

  const renderedSections = React.useMemo(() => {
    const sections = activeSections.map((sec) => renderSectionByKey(sec.sectionKey, sec.id));
    const servicesIndex = sections.findIndex((node) => node && (node as any)?.key === activeSections.find((sec) => sec.sectionKey === 'services')?.id);
    const galleryIndex = sections.findIndex((node) => node && (node as any)?.key === activeSections.find((sec) => sec.sectionKey === 'gallery' || sec.sectionKey === 'portfolio')?.id);

    if (servicesIndex >= 0 && galleryIndex >= 0 && galleryIndex < servicesIndex) {
      const galleryNode = sections.splice(galleryIndex, 1)[0];
      sections.splice(servicesIndex + 1, 0, galleryNode);
    }

    // A gallery is a required home section. CMS ordering may omit it on older
    // installations, so inject it directly after Services without duplicating it.
    const hasGallery = activeSections.some((section) => section.sectionKey === 'gallery');
    if (!hasGallery) {
      const serviceIndex = sections.findIndex((node) => node && (node as any)?.key === activeSections.find((section) => section.sectionKey === 'services')?.id);
      sections.splice(serviceIndex >= 0 ? serviceIndex + 1 : sections.length, 0, <HomeGallerySection key="firestore-gallery" />);
    }

    return sections.filter(Boolean);
  }, [activeSections]);

  const effectiveBrandName = companySettings?.name
    ? (companySettings.name.includes('(Pvt) Ltd') || companySettings.name.includes('Pvt Ltd') ? companySettings.name : `${companySettings.name} (Pvt) Ltd`)
    : (siteSettings?.siteName || 'Mahdev (Pvt) Ltd');
  const defaultPageTitle = `${effectiveBrandName} - Creating Moments | Capturing Memories | Delivering Innovation`;
  const rawPageTitle = homepageConfig?.seo?.pageTitle;
  const isCorporateTitle =
    rawPageTitle &&
    (rawPageTitle.toLowerCase().includes('corporate') ||
      rawPageTitle.toLowerCase().includes('corporate ecosystem') ||
      rawPageTitle.toLowerCase().includes('corporate eco'));
  const effectivePageTitle = rawPageTitle && !isCorporateTitle ? rawPageTitle : defaultPageTitle;

  const isDataLoading = isInitialLoading || !divisions || divisions.length === 0;

  return (
    <div className="w-full flex flex-col pb-24 lg:pb-0">
      <SEOHead
        title={effectivePageTitle}
        description={homepageConfig?.seo?.metaDescription || `${effectiveBrandName} - Creating Moments | Capturing Memories | Delivering Innovation. Multi-division enterprise spanning Event Management, Studio Cinema, IT & Cloud, Travels, and E-Commerce.`}
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

      {/* 2. BELOW HERO SECTION: SHOW SHIMMER UNTIL DATA LOADS FROM FIRESTORE (NO DEFAULT DATA) */}
      {isDataLoading ? (
        <HomeBelowHeroShimmer />
      ) : (
        <>
          {/* CORE DYNAMIC CMS SECTIONS */}
          {renderedSections}

          {/* MILESTONES (FROM FIRESTORE) */}
          <MilestonesSection onNavigate={onNavigate} />

          {/* TESTIMONIALS (FROM FIRESTORE) */}
          <TestimonialsSection onNavigate={onNavigate} />
        </>
      )}
    </div>
  );
};



