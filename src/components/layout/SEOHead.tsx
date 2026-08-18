import React, { useEffect } from 'react';
import { SEOMetaData } from '../../types';
import { BRAND_CONFIG } from '../../config/brand';

const SEO_STORAGE_KEY = 'mahdev_cms_seo_configs_v1';

export const SEOHead: React.FC<SEOMetaData> = ({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogType = 'website',
}) => {
  useEffect(() => {
    // Check if there is an admin-configured SEO override in CMS
    let effectiveTitle = title;
    let effectiveDesc = description;
    let effectiveOgTitle = ogTitle || title;
    let effectiveOgDesc = ogDescription || description;
    let effectiveCanonical = canonicalUrl;
    let effectiveOgImage = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

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

    // Update Page Title
    const formattedTitle = effectiveTitle.includes(BRAND_CONFIG.legalName)
      ? effectiveTitle
      : `${effectiveTitle} | ${BRAND_CONFIG.legalName}`;
    document.title = formattedTitle;

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

    setMetaTag('name', 'description', effectiveDesc);
    setMetaTag('property', 'og:title', effectiveOgTitle);
    setMetaTag('property', 'og:description', effectiveOgDesc);
    setMetaTag('property', 'og:image', effectiveOgImage);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', effectiveCanonical);

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

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: BRAND_CONFIG.legalName,
      url: BRAND_CONFIG.domain,
      logo: 'https://mahdev.lk/logo.png',
      description: BRAND_CONFIG.tagline,
      sameAs: Object.values(BRAND_CONFIG.socials).filter(Boolean),
    };

    scriptTag.textContent = JSON.stringify(schema);
  }, [title, description, canonicalUrl, ogTitle, ogDescription, ogType]);

  return null;
};
