import React, { useEffect } from 'react';
import { SEOMetaData } from '../../types';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { COMPANY_INFO } from '../../config/company';

const SEO_STORAGE_KEY = 'mahdev_cms_seo_configs_v1';

export const SEOHead: React.FC<SEOMetaData> = ({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogType = 'website',
}) => {
  const { siteSettings, companySettings } = useFirestoreDataContext();

  useEffect(() => {
    // 1. Dynamic Favicon from Firestore
    if (siteSettings?.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = siteSettings.faviconUrl;
    }

    // 2. Dynamic Title
    const baseCompanyName = companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd';
    const dynamicFullTitle = title.includes(baseCompanyName)
      ? title
      : `${title} | ${baseCompanyName}`;
    document.title = dynamicFullTitle;

    // Check if there is an admin-configured SEO override in CMS
    let effectiveTitle = dynamicFullTitle;
    let effectiveDesc = description || siteSettings?.metaDescription || COMPANY_INFO.description;
    let effectiveOgTitle = ogTitle || dynamicFullTitle;
    let effectiveOgDesc = ogDescription || effectiveDesc;
    let effectiveCanonical = canonicalUrl;
    let effectiveOgImage = siteSettings?.ogImageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

    try {
      const stored = localStorage.getItem(SEO_STORAGE_KEY);
      if (stored) {
        const configs: Array<{
          route: string;
          title: string;
          description: string;
          ogImage: string;
          canonicalUrl: string;
        }> = JSON.parse(stored);

        const currentPath = window.location.pathname || '/';
        const matched = configs.find(
          (c) => c.route === currentPath || (c.canonicalUrl && canonicalUrl && c.canonicalUrl.includes(currentPath))
        );

        if (matched) {
          if (matched.title) effectiveTitle = matched.title;
          if (matched.description) effectiveDesc = matched.description;
          if (matched.ogImage) effectiveOgImage = matched.ogImage;
          if (matched.canonicalUrl) effectiveCanonical = matched.canonicalUrl;
          effectiveOgTitle = matched.title;
          effectiveOgDesc = matched.description;
        }
      }
    } catch {
      // Use standard props
    }

    // Ensure canonical URL is always fully qualified with production domain https://mahdev.lk
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    if (!effectiveCanonical || !effectiveCanonical.startsWith('http')) {
      const cleanPath = effectiveCanonical ? (effectiveCanonical.startsWith('/') ? effectiveCanonical : `/${effectiveCanonical}`) : currentPath;
      effectiveCanonical = `https://mahdev.lk${cleanPath === '/' ? '' : cleanPath}`;
    }

    // Hostname evaluation for environment-aware search engine indexing
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isProductionHost = hostname === 'mahdev.lk' || hostname === 'www.mahdev.lk';

    // Helper to safely update or create meta tags
    const setMetaTag = (attr: string, key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Prevent search indexing on Preview / Development staging environments
    setMetaTag(
      'name',
      'robots',
      isProductionHost
        ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        : 'noindex, nofollow'
    );

    setMetaTag('name', 'description', effectiveDesc);
    setMetaTag('property', 'og:title', effectiveOgTitle);
    setMetaTag('property', 'og:description', effectiveOgDesc);
    setMetaTag('property', 'og:image', effectiveOgImage);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', effectiveCanonical);
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', effectiveOgTitle);
    setMetaTag('name', 'twitter:description', effectiveOgDesc);
    setMetaTag('name', 'twitter:image', effectiveOgImage);

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', effectiveCanonical);

    // Structured Data (JSON-LD)
    const structuredDataId = 'mahdev-json-ld';
    let scriptTag = document.getElementById(structuredDataId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = structuredDataId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const companyName = companySettings?.legalName || companySettings?.name || COMPANY_INFO.legalName;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: companyName,
      alternateName: companySettings?.name || COMPANY_INFO.name,
      url: `https://${companySettings?.website || COMPANY_INFO.domain}`,
      logo: siteSettings?.logoUrl || `https://${COMPANY_INFO.domain}/logo.png`,
      description: siteSettings?.metaDescription || COMPANY_INFO.description,
      email: companySettings?.email || COMPANY_INFO.email,
      telephone: [companySettings?.phone || COMPANY_INFO.primaryPhone, COMPANY_INFO.secondaryPhone].filter(Boolean),
      sameAs: [
        companySettings?.socialLinks?.linkedin || COMPANY_INFO.socials.linkedin,
        companySettings?.socialLinks?.facebook || COMPANY_INFO.socials.facebook,
        companySettings?.socialLinks?.instagram || COMPANY_INFO.socials.instagram,
        companySettings?.socialLinks?.youtube || COMPANY_INFO.socials.youtube,
      ].filter(Boolean),
      address: [
        {
          '@type': 'PostalAddress',
          streetAddress: companySettings?.offices?.colombo?.address || COMPANY_INFO.offices.colombo.address,
          addressLocality: companySettings?.offices?.colombo?.city || COMPANY_INFO.offices.colombo.city,
          addressRegion: 'Western Province',
          addressCountry: 'LK',
        },
        {
          '@type': 'PostalAddress',
          streetAddress: companySettings?.offices?.trincomalee?.address || COMPANY_INFO.offices.trincomalee.address,
          addressLocality: companySettings?.offices?.trincomalee?.city || COMPANY_INFO.offices.trincomalee.city,
          addressRegion: 'Eastern Province',
          addressCountry: 'LK',
        },
      ],
    };

    scriptTag.textContent = JSON.stringify(schema);
  }, [title, description, canonicalUrl, ogTitle, ogDescription, ogType, siteSettings, companySettings]);

  return null;
};

