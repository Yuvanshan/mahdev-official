import React, { useEffect, useState } from 'react';
import { SEOMetaData } from '../../types';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from '../../lib/tursoFirestore';

export const SEOHead: React.FC<SEOMetaData> = ({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogType = 'website',
}) => {
  const { siteSettings, companySettings } = useFirestoreDataContext();
  const [seoVersion, setSeoVersion] = useState(0);
  const [seoConfigs, setSeoConfigs] = useState<Array<{
    route: string;
    title: string;
    description: string;
    ogImage: string;
    canonicalUrl: string;
  }>>([]);

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
    getDoc(doc(db, 'settings', 'seo'))
      .then((snapshot) => {
        if (!active || !snapshot.exists()) return;
        const configs = snapshot.data().configs;
        if (Array.isArray(configs)) setSeoConfigs(configs);
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
    let effectiveOgImage = siteSettings?.ogImageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';

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
      effectiveOgTitle = matched.title;
      effectiveOgDesc = matched.description;
    }

    // Ensure canonical URL is always fully qualified with production domain https://mahdev.lk
    const canonicalPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    if (!effectiveCanonical || !effectiveCanonical.startsWith('http')) {
      const cleanPath = effectiveCanonical ? (effectiveCanonical.startsWith('/') ? effectiveCanonical : `/${effectiveCanonical}`) : canonicalPath;
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

    const domain = companySettings?.domain || 'mahdev.lk';
    const compName = companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: compName,
      alternateName: compName,
      url: `https://${domain}`,
      logo: siteSettings?.logoUrl || companySettings?.logoUrl || `https://${domain}/logo.svg`,
      description: siteSettings?.metaDescription || companySettings?.description || 'Mahdev Pvt Ltd – Creating. Capturing. Innovating. Multi-division enterprise group.',
      email: companySettings?.email || 'info@mahdev.lk',
      telephone: [companySettings?.primaryPhone || '075 092 8078', companySettings?.secondaryPhone || '075 092 8078'].filter(Boolean),
      sameAs: [
        companySettings?.socials?.linkedin,
        companySettings?.socials?.facebook,
        companySettings?.socials?.instagram,
        companySettings?.socials?.youtube,
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

    scriptTag.textContent = JSON.stringify(schema);
  }, [title, description, canonicalUrl, ogTitle, ogDescription, ogType, siteSettings, companySettings, seoConfigs]);

  return null;
};
