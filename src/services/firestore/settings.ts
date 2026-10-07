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
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreCompanySettings, FirestoreSiteSettings } from '../../types/firestore';
import { HomepageCmsConfig } from '../../types/cms';
import { COMPANY_INFO } from '../../config/company';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes cache

function getInitialCachedCompany(): { data: FirestoreCompanySettings; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('mahdev_cached_company_settings');
    if (raw) return { data: JSON.parse(raw), timestamp: Date.now() };
  } catch {}
  return null;
}

function getInitialCachedSite(): { data: FirestoreSiteSettings; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('mahdev_cached_site_settings');
    if (raw) return { data: JSON.parse(raw), timestamp: Date.now() };
  } catch {}
  return null;
}

let cachedCompanySettings: { data: FirestoreCompanySettings; timestamp: number } | null = getInitialCachedCompany();
let cachedSiteSettings: { data: FirestoreSiteSettings; timestamp: number } | null = getInitialCachedSite();
let cachedHomepageSettings: { data: HomepageCmsConfig; timestamp: number } | null = null;

export const DEFAULT_HOMEPAGE_SECTIONS = [
  { id: 'sec-welcome', name: 'Welcome Preloader', sectionKey: 'welcomeAnimation', enabled: true, order: 1 },
  { id: 'sec-hero', name: 'Hero Section', sectionKey: 'hero', enabled: true, order: 2 },
  { id: 'sec-divisions', name: 'Business Divisions', sectionKey: 'divisions', enabled: true, order: 3 },
  { id: 'sec-services', name: 'Featured Services', sectionKey: 'services', enabled: true, order: 4 },
  { id: 'sec-stats', name: 'Corporate Statistics', sectionKey: 'statistics', enabled: true, order: 5 },
  { id: 'sec-gallery', name: 'Projects & Portfolios', sectionKey: 'gallery', enabled: true, order: 6 },
  { id: 'sec-videos', name: 'Cinematic Video Showcase', sectionKey: 'decorationShowcase', enabled: true, order: 7 },
  { id: 'sec-testimonials', name: 'Client Testimonials', sectionKey: 'testimonials', enabled: true, order: 8 },
  { id: 'sec-milestones', name: 'Company Milestones', sectionKey: 'milestones', enabled: true, order: 9 },
  { id: 'sec-partners', name: 'Trusted Partners', sectionKey: 'trustedCompanies', enabled: true, order: 10 },
  { id: 'sec-cta', name: 'Call to Action', sectionKey: 'cta', enabled: true, order: 11 },
  { id: 'sec-contact', name: 'Corporate Contact', sectionKey: 'contact', enabled: true, order: 12 },
];

export function getDefaultHomepageSettings(): HomepageCmsConfig {
  return {
    welcomeAnimation: {
      enabled: true,
      welcomeText: 'Welcome to Mahdev Pvt Ltd',
      duration: 3,
    },
    sectionsOrder: DEFAULT_HOMEPAGE_SECTIONS,
    hero: {
      badgeText: 'MAHDEV GROUP',
      titleLine1: 'One group.',
      titleHighlight: 'More ways forward.',
      titleLine2: '',
      description: 'Products and services for the moments, work and ideas that move life forward.',
      mediaType: 'video',
      mediaUrl: '/assets/hero_main.mp4',
      imageUrl: '',
      defaultImageUrl: '',
      videoUrl: '/assets/hero_main.mp4',
      primaryCtaLabel: 'Explore Ecosystem',
      primaryCtaLink: '#divisions',
      secondaryCtaLabel: 'Get In Touch',
      secondaryCtaLink: '/contact',
      metrics: [],
    },
    intro: {
      badge: 'THE MAHDEV ADVANTAGE',
      headline: 'A Unified Ecosystem of Specialized Excellence',
      subheadline: 'Eliminating friction across multi-vendor logistics with a single trusted corporate partner.',
      description:
        'Founded with a bold vision to elevate creative event decorations, photographic mastery, IT engineering, and luxury hospitality across Sri Lanka, Mahdev Pvt Ltd operates as an integrated group with five specialized divisions.',
      pillars: [
        { title: 'Turnkey Integration', desc: 'Seamless single-point coordination from event decor to photography, software systems, and luxury travel.', icon: 'Layers' },
        { title: 'Enterprise Rigor', desc: 'ISO-aligned quality standards, calibrated camera and stage gear, and enterprise SLA guarantees.', icon: 'ShieldCheck' },
        { title: 'Bespoke Craftsmanship', desc: 'Tailored solutions whether styling an opulent wedding decor, capturing 8K cinema, or engineering cloud IT infrastructure.', icon: 'Sparkles' },
      ],
    },
    aboutPage: {
      enabled: true,
      badge: 'About Mahdev Pvt Ltd',
      title: 'Pioneering Creative Artistry & Modern Technology',
      description: 'Mahdev Pvt Ltd is an integrated parent enterprise governing five autonomous business divisions—harmonizing event production, cinema media, cloud computing, luxury travel expeditions, and professional hardware procurement under a unified standard of excellence.',
      story: [
        'Founded in 2022 in Colombo, Sri Lanka, Mahdev Pvt Ltd was conceived on a singular premise: that exceptional event decoration artistry, photographic mastery, and rigorous IT solutions should unite seamlessly under one trusted parent company.',
        'Across four years of disciplined high-velocity growth, Mahdev purposefully expanded into five autonomous yet deeply synchronized business divisions. Today, Mahdev Pvt Ltd stands as a premier holding ecosystem where creative mastery and technological innovation converge under one trusted roof.'
      ],
    },
    divisionsSection: {
      badge: 'OUR DIVISIONS',
      title: 'Five Pillars of Industry Mastery',
      subtitle: 'Specialized corporate subsidiaries delivering end-to-end excellence across hospitality, media, technology, travel, and commerce.',
      enabled: true,
    },
    whyMahdev: {
      badge: 'THE MAHDEV DIFFERENCE',
      title: 'Why Leading Brands Trust Mahdev',
      subtitle: 'Uncompromising standard of perfection, calibrated equipment, and enterprise SLA guarantees.',
      enabled: true,
    },
    legalPages: {
      privacy: {
        title: 'Privacy Policy',
        subtitle: 'How Mahdev Pvt Ltd collects, safeguards, and handles your data across all divisions.',
        effectiveDate: 'January 1, 2024',
        lastUpdated: 'February 15, 2026',
        sections: [{ heading: 'Institutional Commitment to Privacy', content: ['Your privacy matters to us.'] }],
      },
      terms: {
        title: 'Terms & Conditions',
        subtitle: 'Standard engagement terms and service provisions.',
        effectiveDate: 'January 1, 2024',
        lastUpdated: 'February 15, 2026',
        sections: [{ heading: 'Agreement to Terms', content: ['These terms govern all engagements.'] }],
      },
      refund: {
        title: 'Refund & Cancellation',
        subtitle: 'Guidelines on deposits, cancellations, and reimbursements.',
        effectiveDate: 'January 1, 2024',
        lastUpdated: 'February 15, 2026',
        sections: [{ heading: 'Refund Eligibility', content: ['Cancellation terms vary by service type.'] }],
      },
      shipping: {
        title: 'Shipping & Delivery',
        subtitle: 'Island-wide logistics and delivery standards.',
        effectiveDate: 'January 1, 2024',
        lastUpdated: 'February 15, 2026',
        sections: [{ heading: 'Delivery Windows', content: ['We deliver nationwide via tracked courier networks.'] }],
      },
      cookie: {
        title: 'Cookie Policy',
        subtitle: 'Information regarding cookies and local storage on our digital platforms.',
        effectiveDate: 'January 1, 2024',
        lastUpdated: 'February 15, 2026',
        sections: [{ heading: 'What Are Cookies?', content: ['Cookies help optimize navigation and security.'] }],
      },
    },
    leadership: {
      enabled: true,
      title: 'Executive Leadership',
      subtitle: 'Guided by experienced sector directors, creative visionaries, and cloud architects committed to institutional governance and client success.',
      members: [],
    },
    statistics: {
      badge: 'PROVEN IMPACT',
      title: 'Excellence In Numbers',
      subtitle: 'Real-time performance metrics delivered across Sri Lanka and global clients.',
      enabled: true,
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
      subtitle: 'Calibrated cinema cameras, high-output lighting, pro audio, and certified electronics.',
      selectedProductIds: ['prod-001', 'prod-002', 'prod-003', 'prod-004'],
      spotlightBannerText: 'Official Sony FX9, RED V-Raptor, and Sennheiser dealer in Sri Lanka.',
      enabled: true,
    },
    portfolio: {
      badge: 'FEATURED WORK',
      title: 'Signature Portfolios & Case Studies',
      subtitle: 'Explore our latest high-impact deliverables across luxury event decor, cinema photography, and scalable IT solutions.',
      selectedProjectIds: ['proj-1', 'proj-2', 'proj-3', 'proj-4'],
      enabled: true,
    },
    milestones: {
      badge: 'OUR TRAJECTORY',
      title: 'Milestones of Excellence (2022 - Present)',
      subtitle: 'Key historical chapters shaping the expansion of Mahdev Pvt Ltd.',
      enabled: true,
      achievementsTitle: 'Key Verified Achievements',
      achievementsSubtitle: 'Tangible deliverables, certified quality benchmarks, and nationwide enterprise footprint.',
      achievements: [],
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
      pageTitle: 'Mahdev (Pvt) Ltd - Creating Moments | Capturing Memories | Delivering Innovation',
      metaDescription: 'Creating Moments... Capturing Memories... & Delivering Innovation... Integrated enterprise spanning Event Decorations & Management, Photography & Studio Cinema, IT Solutions & Software, Travels, and Online Mart.',
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
    logoUrl: '',
    darkLogoUrl: '',
    faviconUrl: '',
    currencyCode: 'LKR',
    currencySymbol: 'Rs. ',
    phoneNumbers: [COMPANY_INFO.primaryPhone || '075 092 8078'].filter(Boolean),
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
      contactPhone: COMPANY_INFO.primaryPhone || '075 092 8078',
      contactEmail: COMPANY_INFO.email || 'info@mahdev.lk',
      allowedRoles: ['admin', 'superAdmin'],
    },
    announcement: {
      enabled: true,
      text: 'Universal Enterprise Ecosystem Active • Colombo & Trincomalee Hotlines Online',
      link: '/contact',
    },
    currency: 'LKR',
    defaultCurrency: 'LKR',
    supportedCurrencies: ['LKR', 'USD', 'EUR', 'GBP'],
    taxRate: 0,
    vatTaxPercentage: 0,
    bookingDepositPercent: 30,
    legalRegistrationNumber: COMPANY_INFO.registrationNumber || 'PV-00289410',
    enableStockAlertEmails: true,
    enableSmsAlerts: true,
    smsAlertsEnabled: true,
    dailyBackupEnabled: true,
  };
}

// Real-time multi-device and multi-tab synchronization channels
const SETTINGS_BROADCAST_CHANNEL = 'mahdev_settings_channel_v1';
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(SETTINGS_BROADCAST_CHANNEL);
  }
} catch {
  broadcastChannel = null;
}

function broadcastUpdate(type: 'company' | 'site' | 'homepage', data: any) {
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(`mahdev_${type}_settings_updated`, { detail: data })
      );
    }
  } catch (err) {
    console.warn('[Firestore Settings] Broadcast notification warning:', err);
  }
}

async function syncToServerApi(endpoint: string, payload: any): Promise<void> {
  try {
    await fetch(`/api/settings/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Non-blocking server sync
    console.warn(`[Firestore Settings] Server API sync notice (${endpoint}):`, err);
  }
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

      if (snap && typeof snap.exists === 'function' && snap.exists()) {
        const data = snap.data() as FirestoreCompanySettings;
        const merged = { ...getDefaultCompanySettings(), ...(cachedCompanySettings?.data || {}), ...data };
        cachedCompanySettings = { data: merged, timestamp: now };
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('mahdev_cached_company_settings', JSON.stringify(merged));
          } catch {}
        }
        return merged;
      }

      // Check sessionStorage backup before defaulting
      if (typeof window !== 'undefined') {
        const local = sessionStorage.getItem('mahdev_cached_company_settings');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed && (parsed.logoUrl || parsed.name)) {
              cachedCompanySettings = { data: parsed, timestamp: now };
              return parsed;
            }
          } catch {}
        }
      }

      const defaultSettings = cachedCompanySettings?.data || getDefaultCompanySettings();
      cachedCompanySettings = { data: defaultSettings, timestamp: now };
      return defaultSettings;
    } catch (err) {
      console.warn('[Firestore Settings] getCompanySettings fallback to local defaults:', err);
      return cachedCompanySettings?.data || getDefaultCompanySettings();
    }
  },

  /**
   * Update company settings in Firestore and propagate instantly across all devices
   */
  async updateCompanySettings(data: Partial<FirestoreCompanySettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'company');
    const existing = cachedCompanySettings?.data || getDefaultCompanySettings();
    const merged: FirestoreCompanySettings = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    const payload = sanitizeForFirestore(merged);

    // 1. Instant local and in-memory cache update
    cachedCompanySettings = { data: payload, timestamp: Date.now() };
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('mahdev_cached_company_settings', JSON.stringify(payload));
      } catch {}
    }

    // 2. Broadcast across tabs and window context immediately
    broadcastUpdate('company', payload);

    // 3. Sync to authoritative server endpoint
    syncToServerApi('company', payload);

    // 4. Commit to Firestore with a 5000ms safety race to prevent UI freeze
    try {
      const writePromise = setDoc(docRef, payload, { merge: true });
      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 5000));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (err) {
      console.warn('[Firestore Settings] updateCompanySettings remote write notice:', err);
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

    // BroadcastChannel listener
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === 'company' && event.data?.data) {
        cachedCompanySettings = { data: event.data.data, timestamp: Date.now() };
        onData(event.data.data);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<FirestoreCompanySettings>;
      if (customEvent.detail) {
        cachedCompanySettings = { data: customEvent.detail, timestamp: Date.now() };
        onData(customEvent.detail);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('mahdev_company_settings_updated', handleCustomEvent);
    }

    const firestoreUnsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreCompanySettings;
          cachedCompanySettings = { data, timestamp: Date.now() };
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('mahdev_cached_company_settings', JSON.stringify(data));
            } catch {}
          }
          onData(data);
        } else {
          onData(cachedCompanySettings?.data || getDefaultCompanySettings());
        }
      },
      (err) => {
        console.warn('[Firestore Settings] Realtime listener notice:', err);
        if (onError) onError(err);
        onData(cachedCompanySettings?.data || getDefaultCompanySettings());
      }
    );

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('mahdev_company_settings_updated', handleCustomEvent);
      }
      firestoreUnsub();
    };
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

      if (snap && typeof snap.exists === 'function' && snap.exists()) {
        const data = snap.data() as FirestoreSiteSettings;
        const merged = { ...getDefaultSiteSettings(), ...(cachedSiteSettings?.data || {}), ...data };
        cachedSiteSettings = { data: merged, timestamp: now };
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('mahdev_cached_site_settings', JSON.stringify(merged));
          } catch {}
        }
        return merged;
      }

      // Check sessionStorage backup before defaulting
      if (typeof window !== 'undefined') {
        const local = sessionStorage.getItem('mahdev_cached_site_settings');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed && (parsed.logoUrl || parsed.siteName || parsed.currency)) {
              cachedSiteSettings = { data: parsed, timestamp: now };
              return parsed;
            }
          } catch {}
        }
      }

      const defaultSite = cachedSiteSettings?.data || getDefaultSiteSettings();
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
    const existing = cachedSiteSettings?.data || getDefaultSiteSettings();
    const merged: FirestoreSiteSettings = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    const payload = sanitizeForFirestore(merged);

    // 1. Local cache update
    cachedSiteSettings = { data: payload, timestamp: Date.now() };
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('mahdev_cached_site_settings', JSON.stringify(payload));
      } catch {}
    }

    // 2. Broadcast across all active tabs
    broadcastUpdate('site', payload);

    // 3. Sync to authoritative server endpoint
    syncToServerApi('site', payload);

    // 4. Commit to Firestore with a 5000ms safety race to prevent UI freeze
    try {
      const writePromise = setDoc(docRef, payload, { merge: true });
      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 5000));
      await Promise.race([writePromise, timeoutPromise]);
    } catch (err) {
      console.warn('[Firestore Settings] updateSiteSettings remote write notice:', err);
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

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === 'site' && event.data?.data) {
        cachedSiteSettings = { data: event.data.data, timestamp: Date.now() };
        onData(event.data.data);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<FirestoreSiteSettings>;
      if (customEvent.detail) {
        cachedSiteSettings = { data: customEvent.detail, timestamp: Date.now() };
        onData(customEvent.detail);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('mahdev_site_settings_updated', handleCustomEvent);
    }

    const firestoreUnsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreSiteSettings;
          cachedSiteSettings = { data, timestamp: Date.now() };
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('mahdev_cached_site_settings', JSON.stringify(data));
            } catch {}
          }
          onData(data);
        } else {
          onData(cachedSiteSettings?.data || getDefaultSiteSettings());
        }
      },
      (err) => {
        console.warn('[Firestore Settings] Site settings listener notice:', err);
        if (onError) onError(err);
        onData(cachedSiteSettings?.data || getDefaultSiteSettings());
      }
    );

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('mahdev_site_settings_updated', handleCustomEvent);
      }
      firestoreUnsub();
    };
  },

  /**
   * Fetch Homepage CMS settings with caching
   */
  async getHomepageSettings(forceRefresh = false): Promise<HomepageCmsConfig> {
    const now = Date.now();

    // 1. Memory cache check
    if (!forceRefresh && cachedHomepageSettings && now - cachedHomepageSettings.timestamp < CACHE_TTL_MS) {
      return cachedHomepageSettings.data;
    }

    // 2. Check LocalStorage fallback before anything else
    let localSaved: HomepageCmsConfig | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('mahdev_cached_homepage_config');
        if (stored) {
          localSaved = JSON.parse(stored);
        }
      } catch {}
    }

    try {
      const docRef = doc(db, 'settings', 'homepage');
      const snap = await getDoc(docRef);

      if (snap && typeof snap.exists === 'function' && snap.exists()) {
        const rawData = snap.data() as HomepageCmsConfig;
        const def = getDefaultHomepageSettings();

        // Ensure video and media URLs from Firestore take absolute precedence
        const rawHero: any = rawData?.hero || {};
        let firestoreVideo = (rawHero.videoUrl || (rawHero as any).heroVideoUrl || '').trim();
        let firestoreMedia = (rawHero.mediaUrl || '').trim();

        if (firestoreVideo.includes('assets.mixkit.co')) {
          firestoreVideo = 'firestore://media_blobs/vid_corporate_hero_v1';
        }
        if (firestoreMedia.includes('assets.mixkit.co')) {
          firestoreMedia = 'firestore://media_blobs/vid_corporate_hero_v1';
        }

        const effectiveVideo = firestoreVideo || (rawHero.mediaType === 'video' ? firestoreMedia : '') || firestoreMedia || def.hero.videoUrl;

        const data: HomepageCmsConfig = {
          ...def,
          ...rawData,
          hero: {
            ...def.hero,
            ...rawHero,
            videoUrl: effectiveVideo,
            mediaUrl: firestoreMedia || effectiveVideo || def.hero.mediaUrl,
            mediaType: rawHero.mediaType === 'image' ? 'image' : 'video',
          },
          milestones: {
            ...def.milestones,
            ...(rawData?.milestones || {}),
            achievementsTitle: rawData?.milestones?.achievementsTitle || def.milestones.achievementsTitle,
            achievementsSubtitle: rawData?.milestones?.achievementsSubtitle || def.milestones.achievementsSubtitle,
            achievements:
              Array.isArray(rawData?.milestones?.achievements)
                ? rawData.milestones.achievements
                : [],
          },
        };
        cachedHomepageSettings = { data, timestamp: now };
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(data));
          } catch {}
        }
        return data;
      }

      const defaultHome = localSaved || cachedHomepageSettings?.data || getDefaultHomepageSettings();
      cachedHomepageSettings = { data: defaultHome, timestamp: now };
      return defaultHome;
    } catch (err) {
      console.warn('[Firestore Settings] getHomepageSettings fallback:', err);
      return localSaved || cachedHomepageSettings?.data || getDefaultHomepageSettings();
    }
  },

  /**
   * Update Homepage CMS settings
   */
  async updateHomepageSettings(data: Partial<HomepageCmsConfig>): Promise<void> {
    const docRef = doc(db, 'settings', 'homepage');
    const existing = cachedHomepageSettings?.data || getDefaultHomepageSettings();

    // Harmonize hero video and media properties
    const heroUpdates = data.hero ? { ...data.hero } : undefined;
    if (heroUpdates && heroUpdates.mediaType !== 'image') {
      const v = (heroUpdates.videoUrl || (heroUpdates as any).heroVideoUrl || '').trim();
      const effectiveVideo = v || heroUpdates.mediaUrl || existing.hero.videoUrl || '/assets/hero_main.mp4';
      heroUpdates.videoUrl = effectiveVideo;
      heroUpdates.mediaUrl = effectiveVideo;
      heroUpdates.mediaType = 'video';
    }

    const merged = {
      ...existing,
      ...data,
      ...(heroUpdates ? { hero: { ...existing.hero, ...heroUpdates } } : {}),
      updatedAt: new Date().toISOString(),
    };

    // Deeply preserve explicit milestones achievements array deletions/updates
    if (data.milestones) {
      merged.milestones = {
        ...(existing.milestones || {}),
        ...data.milestones,
        achievements: Array.isArray(data.milestones.achievements)
          ? data.milestones.achievements
          : (existing.milestones?.achievements || []),
      };
    }

    const payload = sanitizeForFirestore(merged);

    try {
      await setDoc(docRef, payload);
    } catch (err) {
      console.error('[Turso Settings] Homepage update failed:', err);
      throw err;
    }

    cachedHomepageSettings = { data: payload, timestamp: Date.now() };
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(payload));
      } catch {}
    }
    broadcastUpdate('homepage', payload);
    syncToServerApi('homepage', payload);
  },

  /**
   * Realtime listener for Homepage CMS settings
   */
  subscribeHomepageSettings(
    onData: (data: HomepageCmsConfig) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = doc(db, 'settings', 'homepage');

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === 'homepage' && event.data?.data) {
        cachedHomepageSettings = { data: event.data.data, timestamp: Date.now() };
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(event.data.data));
          } catch {}
        }
        onData(event.data.data);
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<HomepageCmsConfig>;
      if (customEvent.detail) {
        cachedHomepageSettings = { data: customEvent.detail, timestamp: Date.now() };
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(customEvent.detail));
          } catch {}
        }
        onData(customEvent.detail);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('mahdev_homepage_settings_updated', handleCustomEvent);
    }

    const firestoreUnsub = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const rawData = snap.data() as HomepageCmsConfig;
          const def = getDefaultHomepageSettings();
          const rawHero: any = rawData?.hero || {};
          let firestoreVideo = (rawHero.videoUrl || (rawHero as any).heroVideoUrl || '').trim();
          let firestoreMedia = (rawHero.mediaUrl || '').trim();

          if (firestoreVideo.includes('assets.mixkit.co')) {
            firestoreVideo = 'firestore://media_blobs/vid_corporate_hero_v1';
          }
          if (firestoreMedia.includes('assets.mixkit.co')) {
            firestoreMedia = 'firestore://media_blobs/vid_corporate_hero_v1';
          }

          const effectiveVideo = firestoreVideo || (rawHero.mediaType === 'video' ? firestoreMedia : '') || firestoreMedia || def.hero.videoUrl;

          const data: HomepageCmsConfig = {
            ...def,
            ...rawData,
            hero: {
              ...def.hero,
              ...rawHero,
              videoUrl: effectiveVideo,
              mediaUrl: firestoreMedia || effectiveVideo || def.hero.mediaUrl,
              mediaType: rawHero.mediaType || (effectiveVideo ? 'video' : 'image'),
            },
            milestones: {
              ...def.milestones,
              ...(rawData?.milestones || {}),
              achievementsTitle: rawData?.milestones?.achievementsTitle || def.milestones.achievementsTitle,
              achievementsSubtitle: rawData?.milestones?.achievementsSubtitle || def.milestones.achievementsSubtitle,
              achievements:
                Array.isArray(rawData?.milestones?.achievements)
                  ? rawData.milestones.achievements
                  : [],
            },
          };
          cachedHomepageSettings = { data, timestamp: Date.now() };
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(data));
            } catch {}
          }
          onData(data);
        } else {
          onData(cachedHomepageSettings?.data || getDefaultHomepageSettings());
        }
      },
      (err) => {
        console.warn('[Firestore Settings] Homepage settings listener notice:', err);
        if (onError) onError(err);
        onData(cachedHomepageSettings?.data || getDefaultHomepageSettings());
      }
    );

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('mahdev_homepage_settings_updated', handleCustomEvent);
      }
      firestoreUnsub();
    };
  },
};
