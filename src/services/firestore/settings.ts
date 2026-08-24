/**
 * Firestore Settings Repository (Company & Site Settings)
 * Phase 23 - Real Firestore Data Integration
 */

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreCompanySettings, FirestoreSiteSettings } from '../../types/firestore';
import { HomepageCmsConfig } from '../../types/cms';
import { COMPANY_INFO } from '../../config/company';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes cache

let cachedCompanySettings: { data: FirestoreCompanySettings; timestamp: number } | null = null;
let cachedSiteSettings: { data: FirestoreSiteSettings; timestamp: number } | null = null;
let cachedHomepageSettings: { data: HomepageCmsConfig; timestamp: number } | null = null;

export function getDefaultHomepageSettings(): HomepageCmsConfig {
  return {
    hero: {
      badgeText: 'CORPORATE SYNERGY • EST. 2018',
      titleLine1: 'Engineering Next-Gen',
      titleHighlight: 'Experiences & Technologies',
      titleLine2: 'Across South Asia',
      description:
        'Mahdev Pvt Ltd is an integrated parent enterprise uniting hallmark event management, high-end cinema production, cloud software engineering, bespoke luxury travel, and professional tech procurement under a singular standard of perfection.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1920&q=85',
      primaryCtaLabel: 'Explore Ecosystem',
      primaryCtaLink: '#divisions',
      secondaryCtaLabel: 'Get In Touch',
      secondaryCtaLink: '/contact',
      metrics: [
        { label: 'Business Divisions', value: '5', subtext: 'Synergized Operations' },
        { label: 'Client Satisfaction', value: '99.4%', subtext: 'Enterprise Rated' },
        { label: 'Projects Delivered', value: '1,450+', subtext: 'Island-wide & Global' },
        { label: 'Uptime & Reliability', value: '99.9%', subtext: 'Mission Critical' },
      ],
    },
    intro: {
      badge: 'THE MAHDEV ADVANTAGE',
      headline: 'A Unified Ecosystem of Specialized Excellence',
      subheadline: 'Eliminating friction across multi-vendor logistics with a single trusted corporate partner.',
      description:
        'Founded with a bold vision to elevate creative production, computational engineering, and luxury hospitality across Sri Lanka, Mahdev Pvt Ltd operates as an integrated group with five specialized divisions.',
      pillars: [
        { title: 'Turnkey Integration', desc: 'Seamless single-point coordination from stage setup to software and aerial VIP travel.', icon: 'Layers' },
        { title: 'Enterprise Rigor', desc: 'ISO-aligned quality standards, calibrated hardware fleets, and SLA guarantees.', icon: 'ShieldCheck' },
        { title: 'Bespoke Craftsmanship', desc: 'Tailored solutions whether engineering a custom wedding or building high-traffic cloud infrastructure.', icon: 'Sparkles' },
      ],
    },
    featuredServices: {
      badge: 'FLAGSHIP SOLUTIONS',
      title: 'Featured Services & Solutions',
      subtitle: 'Explore key flagship services delivered across our 5 specialized enterprise divisions.',
      selectedServiceIds: ['srv-1', 'srv-2', 'srv-3', 'srv-4', 'srv-5', 'srv-6'],
      enabled: true,
    },
    featuredProducts: {
      badge: 'HARDWARE & COMMERCE',
      title: 'Enterprise Hardware & Procurement',
      subtitle: 'Calibrated cinema cameras, high-output lighting, pro audio, and certified Ceylon goods.',
      selectedProductIds: ['prod-001', 'prod-002', 'prod-003', 'prod-004'],
      spotlightBannerText: 'Official Sony FX9, RED V-Raptor, and Sennheiser dealer in Sri Lanka.',
      enabled: true,
    },
    portfolio: {
      badge: 'FEATURED WORK',
      title: 'Signature Portfolios & Case Studies',
      subtitle: 'Explore our latest high-impact deliverables across music concerts, cinema films, and cloud software.',
      selectedProjectIds: ['proj-1', 'proj-2', 'proj-3', 'proj-4'],
      enabled: true,
    },
    milestones: {
      badge: 'OUR TRAJECTORY',
      title: 'Milestones of Excellence (2018 - Present)',
      subtitle: 'Key historical chapters shaping the expansion of Mahdev Pvt Ltd.',
      enabled: true,
    },
    companies: {
      badge: 'CORPORATE PARTNERS',
      title: 'Trusted by Sri Lanka’s Leading Brands',
      subtitle: 'Collaborating with national institutions, luxury hotel chains, and technology leaders.',
      enabled: true,
    },
    testimonials: {
      badge: 'CLIENT ENDORSEMENTS',
      title: 'What Enterprise Leaders Say',
      subtitle: 'Verified reviews from managing directors, event chairs, and technology executives.',
      enabled: true,
    },
    ctaSection: {
      badge: 'DISPATCH YOUR INQUIRY',
      headline: 'Ready to Bring Your Vision to Life?',
      subheadline: 'Connect with our group leadership and division directors for immediate consultation and customized quotes.',
      primaryButtonText: 'Schedule Consultation',
      primaryButtonLink: '/contact',
      secondaryButtonText: 'Explore Ecosystem',
      secondaryButtonLink: '#divisions',
      contactPhone: COMPANY_INFO.primaryPhone,
      contactEmail: COMPANY_INFO.email,
      corporateLocation: COMPANY_INFO.offices.colombo.fullAddress,
    },
    seo: {
      pageTitle: 'Corporate Ecosystem | Mahdev Pvt Ltd',
      metaDescription: 'Creating Moments. Capturing Memories. Delivering Innovation. Integrated enterprise spanning Event Management, Studio Cinema, IT & Cloud, Travels, and E-Commerce.',
      ogImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      canonicalUrl: 'https://mahdev.lk/',
    },
    updatedAt: new Date().toISOString(),
  };
}

export function getDefaultCompanySettings(): FirestoreCompanySettings {
  return {
    name: COMPANY_INFO.name,
    legalName: COMPANY_INFO.legalName,
    registrationNumber: COMPANY_INFO.registrationNumber || 'PV-00289410',
    tagline: COMPANY_INFO.tagline,
    description: COMPANY_INFO.description,
    domain: COMPANY_INFO.domain,
    email: COMPANY_INFO.email,
    primaryPhone: COMPANY_INFO.primaryPhone,
    secondaryPhone: COMPANY_INFO.secondaryPhone,
    phones: COMPANY_INFO.phones,
    offices: {
      colombo: {
        name: COMPANY_INFO.offices.colombo.name,
        address: COMPANY_INFO.offices.colombo.address,
        city: COMPANY_INFO.offices.colombo.city,
        country: COMPANY_INFO.offices.colombo.country,
        isHeadquarters: COMPANY_INFO.offices.colombo.isHeadquarters,
        mapQuery: COMPANY_INFO.offices.colombo.mapQuery,
      },
      trincomalee: {
        name: COMPANY_INFO.offices.trincomalee.name,
        address: COMPANY_INFO.offices.trincomalee.address,
        city: COMPANY_INFO.offices.trincomalee.city,
        country: COMPANY_INFO.offices.trincomalee.country,
        isHeadquarters: COMPANY_INFO.offices.trincomalee.isHeadquarters,
        mapQuery: COMPANY_INFO.offices.trincomalee.mapQuery,
      },
    },
    socials: (COMPANY_INFO.socials || {}) as Record<string, string>,
    workingHours: (COMPANY_INFO.workingHours || {}) as Record<string, string>,
    updatedAt: new Date().toISOString(),
  };
}

export function getDefaultSiteSettings(): FirestoreSiteSettings {
  const now = new Date().toISOString();
  return {
    // Phase 57 Site Settings Fields
    companyName: COMPANY_INFO.name || 'Mahdev Pvt Ltd',
    legalName: COMPANY_INFO.legalName || 'Mahdev Private Limited',
    tagline: COMPANY_INFO.tagline || 'Excellence Across Every Horizon',
    description: COMPANY_INFO.description || 'Premier South Asian enterprise uniting 5 specialized business divisions.',
    logoUrl: '/assets/images/logo.png',
    faviconUrl: '/favicon.ico',
    currencyCode: 'USD',
    currencySymbol: '$',
    phoneNumbers: [COMPANY_INFO.primaryPhone || '+94 77 000 0000', COMPANY_INFO.secondaryPhone || '+94 11 200 0000'].filter(Boolean),
    email: COMPANY_INFO.email || 'info@mahdev.lk',
    addresses: [
      {
        name: COMPANY_INFO.offices.colombo.name,
        address: COMPANY_INFO.offices.colombo.address,
        city: COMPANY_INFO.offices.colombo.city,
        country: COMPANY_INFO.offices.colombo.country,
      },
      {
        name: COMPANY_INFO.offices.trincomalee.name,
        address: COMPANY_INFO.offices.trincomalee.address,
        city: COMPANY_INFO.offices.trincomalee.city,
        country: COMPANY_INFO.offices.trincomalee.country,
      },
    ],
    maintenanceMode: false,
    maintenanceTitle: 'Systems Upgrade in Progress',
    maintenanceMessage:
      'Our digital platforms, client portals, and division infrastructure are undergoing planned architectural maintenance to ensure maximum reliability, security, and performance.',
    maintenanceImageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    updatedAt: now,
    version: '1.0.0',

    // Backwards compatibility fields
    siteName: 'Mahdev Pvt Ltd',
    enableMaintenanceMode: false,
    maintenance: {
      enabled: false,
      title: 'Systems Upgrade in Progress',
      message:
        'Our digital platforms, client portals, and division infrastructure are undergoing planned architectural maintenance to ensure maximum reliability, security, and performance.',
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      estimatedReturn: 'Within 2 hours',
      contactPhone: COMPANY_INFO.primaryPhone || '+94 77 000 0000',
      contactEmail: COMPANY_INFO.email || 'info@mahdev.lk',
      allowedRoles: ['admin', 'superAdmin'],
    },
    announcement: {
      enabled: true,
      text: 'Universal Enterprise Ecosystem Active • Colombo & Trincomalee Hotlines Online',
      link: '/contact',
    },
    currency: 'USD',
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD', 'LKR', 'EUR', 'GBP'],
    taxRate: 0,
    vatTaxPercentage: 0,
    bookingDepositPercent: 30,
    legalRegistrationNumber: COMPANY_INFO.registrationNumber || 'PV-00289410',
    enableStockAlertEmails: true,
    dailyBackupEnabled: true,
  };
}

export const firestoreSettingsService = {
  /**
   * Fetch company settings with in-memory caching and offline fallback
   */
  async getCompanySettings(forceRefresh = false): Promise<FirestoreCompanySettings> {
    const now = Date.now();
    if (!forceRefresh && cachedCompanySettings && now - cachedCompanySettings.timestamp < CACHE_TTL_MS) {
      return cachedCompanySettings.data;
    }

    try {
      const docRef = doc(db, 'settings', 'company');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as FirestoreCompanySettings;
        cachedCompanySettings = { data, timestamp: now };
        return data;
      }
      // If not present in Firestore yet, return standard defaults safely without executing write mutations
      const defaultSettings = getDefaultCompanySettings();
      cachedCompanySettings = { data: defaultSettings, timestamp: now };
      return defaultSettings;
    } catch (err) {
      console.warn('[Firestore Settings] getCompanySettings fallback to local defaults:', err);
      return cachedCompanySettings?.data || getDefaultCompanySettings();
    }
  },

  /**
   * Update company settings in Firestore
   */
  async updateCompanySettings(data: Partial<FirestoreCompanySettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'company');
    const payload = sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload, { merge: true });
    if (cachedCompanySettings) {
      cachedCompanySettings.data = { ...cachedCompanySettings.data, ...payload };
      cachedCompanySettings.timestamp = Date.now();
    }
  },

  /**
   * Realtime listener for live company settings changes
   */
  subscribeCompanySettings(
    onData: (data: FirestoreCompanySettings) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = doc(db, 'settings', 'company');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreCompanySettings;
          cachedCompanySettings = { data, timestamp: Date.now() };
          onData(data);
        } else {
          onData(getDefaultCompanySettings());
        }
      },
      (err) => {
        console.warn('[Firestore Settings] Realtime listener error:', err);
        if (onError) onError(err);
        onData(cachedCompanySettings?.data || getDefaultCompanySettings());
      }
    );
  },

  /**
   * Fetch site settings with caching
   */
  async getSiteSettings(forceRefresh = false): Promise<FirestoreSiteSettings> {
    const now = Date.now();
    if (!forceRefresh && cachedSiteSettings && now - cachedSiteSettings.timestamp < CACHE_TTL_MS) {
      return cachedSiteSettings.data;
    }

    try {
      const docRef = doc(db, 'settings', 'site');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as FirestoreSiteSettings;
        cachedSiteSettings = { data, timestamp: now };
        return data;
      }
      const defaultSite = getDefaultSiteSettings();
      cachedSiteSettings = { data: defaultSite, timestamp: now };
      return defaultSite;
    } catch (err) {
      console.warn('[Firestore Settings] getSiteSettings fallback:', err);
      return cachedSiteSettings?.data || getDefaultSiteSettings();
    }
  },

  /**
   * Update site settings
   */
  async updateSiteSettings(data: Partial<FirestoreSiteSettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'site');
    const payload = sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload, { merge: true });
    if (cachedSiteSettings) {
      cachedSiteSettings.data = { ...cachedSiteSettings.data, ...payload };
      cachedSiteSettings.timestamp = Date.now();
    }
  },

  /**
   * Realtime listener for site settings & announcements
   */
  subscribeSiteSettings(
    onData: (data: FirestoreSiteSettings) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = doc(db, 'settings', 'site');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreSiteSettings;
          cachedSiteSettings = { data, timestamp: Date.now() };
          onData(data);
        } else {
          onData(getDefaultSiteSettings());
        }
      },
      (err) => {
        console.warn('[Firestore Settings] Site settings listener error:', err);
        if (onError) onError(err);
        onData(cachedSiteSettings?.data || getDefaultSiteSettings());
      }
    );
  },

  /**
   * Fetch Homepage CMS settings with caching
   */
  async getHomepageSettings(forceRefresh = false): Promise<HomepageCmsConfig> {
    const now = Date.now();
    if (!forceRefresh && cachedHomepageSettings && now - cachedHomepageSettings.timestamp < CACHE_TTL_MS) {
      return cachedHomepageSettings.data;
    }

    try {
      const docRef = doc(db, 'settings', 'homepage');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as HomepageCmsConfig;
        cachedHomepageSettings = { data, timestamp: now };
        return data;
      }
      const defaultHome = getDefaultHomepageSettings();
      cachedHomepageSettings = { data: defaultHome, timestamp: now };
      return defaultHome;
    } catch (err) {
      console.warn('[Firestore Settings] getHomepageSettings fallback:', err);
      return cachedHomepageSettings?.data || getDefaultHomepageSettings();
    }
  },

  /**
   * Update Homepage CMS settings
   */
  async updateHomepageSettings(data: Partial<HomepageCmsConfig>): Promise<void> {
    const docRef = doc(db, 'settings', 'homepage');
    const payload = sanitizeForFirestore({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload, { merge: true });
    if (cachedHomepageSettings) {
      cachedHomepageSettings.data = { ...cachedHomepageSettings.data, ...payload };
      cachedHomepageSettings.timestamp = Date.now();
    }
  },

  /**
   * Realtime listener for Homepage CMS settings
   */
  subscribeHomepageSettings(
    onData: (data: HomepageCmsConfig) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = doc(db, 'settings', 'homepage');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as HomepageCmsConfig;
          cachedHomepageSettings = { data, timestamp: Date.now() };
          onData(data);
        } else {
          onData(getDefaultHomepageSettings());
        }
      },
      (err) => {
        console.warn('[Firestore Settings] Homepage settings listener error:', err);
        if (onError) onError(err);
        onData(cachedHomepageSettings?.data || getDefaultHomepageSettings());
      }
    );
  },
};
