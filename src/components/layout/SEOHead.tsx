import React, { useEffect, useState } from 'react';
import { SEOMetaData } from '../../types';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from '../../lib/tursoFirestore';
import { CANONICAL_SITE_ORIGIN } from '../../config/site';

const SEO_CACHE_KEY = 'mahdev_cached_seo_configs';
const SEO_ORIGIN = CANONICAL_SITE_ORIGIN;
const IS_PRODUCTION_DEPLOYMENT = import.meta.env.VITE_SITE_DEPLOYMENT_ENV === 'production';

type SeoConfig = {
  route: string;
  title: string;
  description: string;
  keywords?: string | string[];
  ogImage: string;
  canonicalUrl: string;
  allowIndexing?: boolean;
};

function readCachedSeoConfigs(): SeoConfig[] | null {
  try {
    const cached = localStorage.getItem(SEO_CACHE_KEY);
    if (!cached) return null;
    const parsed: unknown = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed as SeoConfig[] : null;
  } catch {
    return null;
  }
}

export const SEOHead: React.FC<SEOMetaData> = ({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogType = 'website',
  keywords = [],
  noIndex = false,
}) => {
  const { siteSettings, companySettings } = useFirestoreDataContext();
  const [seoVersion, setSeoVersion] = useState(0);
  const [seoConfigs, setSeoConfigs] = useState<SeoConfig[]>(() => readCachedSeoConfigs() || []);

  useEffect(() => {
    const handleUpdate = () => setSeoVersion((v) => v + 1);
    window.addEventListener('mahdev_seo_updated', handleUpdate);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('mahdev_realtime_settings_channel');
        bc.addEventListener('message', (e) => {
          if (e.data?.type === 'seo') handleUpdate();
        });
      } catch {}
    }

    return () => {
      window.removeEventListener('mahdev_seo_updated', handleUpdate);
      if (bc) bc.close();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (seoVersion === 0) {
      const cachedConfigs = readCachedSeoConfigs();
      if (cachedConfigs) {
        setSeoConfigs(cachedConfigs);
        return () => {
          active = false;
        };
      }
    }
    getDoc(doc(db, 'settings', 'seo'))
      .then((snapshot) => {
        if (!active) return;
        const configs = snapshot.exists() ? snapshot.data().configs : [];
        if (!Array.isArray(configs)) return;
        setSeoConfigs(configs);
        try {
          localStorage.setItem(SEO_CACHE_KEY, JSON.stringify(configs));
        } catch (error) {
          console.warn('[SEOHead] Could not persist SEO settings cache:', error);
        }
      })
      .catch((error) => {
        console.error('[SEOHead] Could not load SEO overrides from Turso:', error);
      });
    return () => {
      active = false;
    };
  }, [seoVersion]);

  useEffect(() => {
    // 1. Dynamic Favicon synchronization from Firestore
    const favicon = siteSettings?.faviconUrl || companySettings?.faviconUrl || '/favicon.png';
    if (favicon && favicon.trim()) {
      const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
      rels.forEach((rel) => {
        let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);
        if (!link) {
          link = document.createElement('link');
          link.rel = rel;
          document.head.appendChild(link);
        }
        link.href = favicon;
      });
    }

    // 2. Dynamic Title
    const baseCompanyName = companySettings?.name
      ? (companySettings.name.includes('(Pvt) Ltd') || companySettings.name.includes('Pvt Ltd') ? companySettings.name : `${companySettings.name} (Pvt) Ltd`)
      : (siteSettings?.siteName || 'Mahdev (Pvt) Ltd');

    let sanitizedTitle = title;
    if (
      sanitizedTitle.toLowerCase().includes('corporate eco') ||
      sanitizedTitle.toLowerCase().includes('corporate ecosystem')
    ) {
      sanitizedTitle = `${baseCompanyName} - Creating Moments | Capturing Memories | Delivering Innovation`;
    }

    const dynamicFullTitle = sanitizedTitle.includes(baseCompanyName)
      ? sanitizedTitle
      : `${sanitizedTitle} | ${baseCompanyName}`;
    document.title = dynamicFullTitle;

    // Check if there is an admin-configured SEO override in CMS
    let effectiveTitle = dynamicFullTitle;
    let effectiveDesc = description || siteSettings?.metaDescription || companySettings?.description || 'Mahdev (Pvt) Ltd - Creating Moments | Capturing Memories | Delivering Innovation.';
    let effectiveOgTitle = ogTitle || dynamicFullTitle;
    let effectiveOgDesc = ogDescription || effectiveDesc;
    let effectiveCanonical = canonicalUrl;
    let effectiveOgImage = siteSettings?.ogImageUrl || `${SEO_ORIGIN}/logo.png`;
    let effectiveKeywords = keywords;
    let allowIndexing = true;
    const currentPath = window.location.pathname || '/';
    const matched = seoConfigs.find(
      (config) => config.route === currentPath ||
        (config.canonicalUrl && canonicalUrl && config.canonicalUrl.includes(currentPath))
    );

    if (matched) {
      if (matched.title) effectiveTitle = matched.title;
      if (matched.description) effectiveDesc = matched.description;
      if (matched.ogImage) effectiveOgImage = matched.ogImage;
      if (matched.canonicalUrl) effectiveCanonical = matched.canonicalUrl;
      if (matched.allowIndexing === false) allowIndexing = false;
      if (matched.keywords) {
        effectiveKeywords = Array.isArray(matched.keywords)
          ? matched.keywords
          : matched.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean);
      }
      effectiveOgTitle = matched.title;
      effectiveOgDesc = matched.description;
    }

    const canonicalPath = effectiveCanonical
      ? new URL(effectiveCanonical, window.location.origin).pathname
      : currentPath;
    effectiveCanonical = `${SEO_ORIGIN}${canonicalPath === '/' ? '' : canonicalPath}`;

    const privateRoutePrefixes = [
      '/admin',
      '/admin-login',
      '/adminlogin',
      '/adminportal',
      '/admin-portal',
      '/account',
      '/checkout',
      '/cart',
      '/order',
      '/orders',
      '/track-order',
      '/login',
      '/register',
      '/forgot-password',
    ];
    const isPrivateRoute = privateRoutePrefixes.some(
      (prefix) => currentPath === prefix || currentPath.startsWith(`${prefix}/`)
    );
    const canIndexPage = IS_PRODUCTION_DEPLOYMENT && !noIndex && !isPrivateRoute && allowIndexing;

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

    // Only production deployments may be indexed; Vercel preview and local builds remain noindex.
    setMetaTag(
      'name',
      'robots',
      canIndexPage
        ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        : 'noindex, nofollow'
    );
    setMetaTag(
      'name',
      'googlebot',
      canIndexPage
        ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        : 'noindex, nofollow'
    );

    setMetaTag('name', 'description', effectiveDesc);
    setMetaTag('name', 'keywords', effectiveKeywords.join(', '));
    const googleVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
    const bingVerification = import.meta.env.VITE_BING_SITE_VERIFICATION;
    if (googleVerification) setMetaTag('name', 'google-site-verification', googleVerification);
    if (bingVerification) setMetaTag('name', 'msvalidate.01', bingVerification);
    setMetaTag('property', 'og:title', effectiveOgTitle);
    setMetaTag('property', 'og:description', effectiveOgDesc);
    setMetaTag('property', 'og:image', effectiveOgImage);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', effectiveCanonical);
    setMetaTag('property', 'og:site_name', companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd');
    setMetaTag('property', 'og:locale', 'en_LK');
    setMetaTag('property', 'og:image:alt', effectiveOgTitle);
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

    const compName = companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd';
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Corporation',
      '@id': `${SEO_ORIGIN}/#organization`,
      name: compName,
      alternateName: compName,
      url: SEO_ORIGIN,
      logo: siteSettings?.logoUrl || companySettings?.logoUrl || `${SEO_ORIGIN}/logo.png`,
      description: siteSettings?.metaDescription || companySettings?.description || 'Mahdev Pvt Ltd – Creating. Capturing. Innovating. Multi-division enterprise group.',
      email: companySettings?.email || 'info@mahdev.lk',
      telephone: [companySettings?.primaryPhone || '075 092 8078', companySettings?.secondaryPhone || '075 092 8078'].filter(Boolean),
      sameAs: [
        companySettings?.socials?.linkedin,
        companySettings?.socials?.facebook,
        companySettings?.socials?.instagram,
        companySettings?.socials?.youtube,
        companySettings?.socials?.tiktok,
        companySettings?.socials?.whatsapp,
      ].filter(Boolean),
      address: [
        {
          '@type': 'PostalAddress',
          streetAddress: companySettings?.offices?.colombo?.address || 'No. 128, Galle Road, Colombo 03, Sri Lanka',
          addressLocality: companySettings?.offices?.colombo?.city || 'Colombo',
          addressRegion: 'Western Province',
          addressCountry: 'LK',
        },
        {
          '@type': 'PostalAddress',
          streetAddress: companySettings?.offices?.trincomalee?.address || 'No. 45, Main Street, Trincomalee, Sri Lanka',
          addressLocality: companySettings?.offices?.trincomalee?.city || 'Trincomalee',
          addressRegion: 'Eastern Province',
          addressCountry: 'LK',
        },
      ],
    };

    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SEO_ORIGIN}/#website`,
      url: `${SEO_ORIGIN}/`,
      name: compName,
      publisher: { '@id': `${SEO_ORIGIN}/#organization` },
      inLanguage: 'en-LK',
    };

    scriptTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [organizationSchema, websiteSchema],
    });
  }, [title, description, canonicalUrl, ogTitle, ogDescription, ogType, keywords, noIndex, siteSettings, companySettings, seoConfigs]);

  return null;
};
