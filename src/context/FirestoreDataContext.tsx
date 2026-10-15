/**
 * Central Turso data context and client-side public content cache.
 * 
 * Rules:
 * 1. Turso is the source of truth for business and dynamic content.
 * 2. Public content is cached across reloads and reused during client-side navigation.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  FirestoreCompanySettings,
  FirestoreSiteSettings,
  FirestoreDivision,
  FirestoreService,
  FirestoreProduct,
  FirestoreCategory,
  FirestoreMilestone,
  FirestoreTrustedCompany,
  FirestoreTestimonial,
  FirestorePortfolio,
  FirestoreGallery,
  DivisionId,
} from '../types/firestore';
import { HomepageCmsConfig } from '../types/cms';
import {
  firestoreSettingsService,
  getDefaultCompanySettings,
  getDefaultSiteSettings,
  getDefaultHomepageSettings,
} from '../services/firestore/settings';
import {
  firestoreDivisionsService,
  sortDivisions,
  normalizeDivisionId,
  getCanonicalDivisionId,
  isSameDivision,
  canonicalizeDivisionRoute,
} from '../services/firestore/divisions';
import { firestoreCategoriesService } from '../services/firestore/categories';
import { firestoreServicesService } from '../services/firestore/services';
import { firestoreProductsService } from '../services/firestore/products';
import { firestoreMilestonesService, DEFAULT_OFFICIAL_MILESTONES } from '../services/firestore/milestones';
import { firestoreTrustedCompaniesService } from '../services/firestore/trustedCompanies';
import { firestoreTestimonialsService } from '../services/firestore/testimonials';
import { firestoreGoogleReviewsService, DEFAULT_GOOGLE_REVIEWS_CONFIG } from '../services/firestore/googleReviews';
import { GoogleReview, GoogleReviewsConfig } from '../types/googleReviews';
import { firestorePortfolioService } from '../services/firestore/portfolio';
import { firestoreGalleryService } from '../services/firestore/gallery';
import { cmsService } from '../services/cmsService';
import { catalogService } from '../services/catalogService';
import { bookingService } from '../services/bookingService';
import { resolveMediaUrl, preloadVideo } from '../services/firestoreMediaService';
import { mediaService, StoredMediaItem } from '../services/firestore/media';
import { getPublishedCareerOpenings } from '../services/careerService';

const DEVICE_CACHE_REQUIRED_KEYS = [
  'mahdev_cached_company_settings',
  'mahdev_cached_site_settings',
  'mahdev_cached_homepage_config',
  'mahdev_cached_divisions',
  'mahdev_cached_categories',
  'mahdev_cached_services',
  'mahdev_cached_products',
  'mahdev_cached_milestones',
  'mahdev_cached_companies',
  'mahdev_cached_testimonials',
  'mahdev_cached_google_reviews',
  'mahdev_cached_google_reviews_config',
  'mahdev_cached_portfolio',
  'mahdev_cached_gallery',
];
const DEVICE_CACHE_VERSION_KEY = 'mahdev_public_data_cache_version';
const DEVICE_CACHE_VERSION = '3';
const DEVICE_CACHE_NONEMPTY_ARRAY_KEYS = new Set([
  'mahdev_cached_divisions',
  'mahdev_cached_services',
]);
const REQUIRED_CACHED_DIVISION_IDS = [
  'sws',
  'sws-event-management',
  'u1',
  'u1-studio',
  'it',
  'it-solutions',
  'travels',
  'mahdev-travels',
  'mart',
  'online-mart',
];
const FULLY_LOADED_DIVISION_FLAGS = Object.fromEntries(
  REQUIRED_CACHED_DIVISION_IDS.map((id) => [id, true])
);
const PRIVATE_SETTINGS_CACHE_FIELDS = new Set([
  'superAdminEmail',
  'superAdminName',
  'testTimestamp',
  'testWrite',
  'dailyBackupEnabled',
  'enableStockAlertEmails',
]);
const PUBLIC_SETTINGS_CACHE_KEYS = new Set([
  'mahdev_cached_company_settings',
  'mahdev_cached_site_settings',
  'mahdev_cached_homepage_config',
]);
const DEVICE_CACHE_ARRAY_KEYS = new Set([
  'mahdev_cached_divisions',
  'mahdev_cached_categories',
  'mahdev_cached_services',
  'mahdev_cached_products',
  'mahdev_cached_milestones',
  'mahdev_cached_companies',
  'mahdev_cached_testimonials',
  'mahdev_cached_google_reviews',
  'mahdev_cached_portfolio',
  'mahdev_cached_gallery',
]);

function getDeviceCacheItem(key: string): string | null {
  try {
    const cached = localStorage.getItem(key);
    if (cached !== null) return cached;

    const legacyCached = sessionStorage.getItem(key);
    if (legacyCached !== null) {
      setDeviceCacheItem(key, legacyCached);
      return legacyCached;
    }
  } catch {}
  return null;
}

function hasValidDeviceCacheItem(key: string): boolean {
  const cached = getDeviceCacheItem(key);
  if (cached === null) return false;
  try {
    const parsed: unknown = JSON.parse(cached);
    if (DEVICE_CACHE_ARRAY_KEYS.has(key)) {
      return Array.isArray(parsed) && (
        !DEVICE_CACHE_NONEMPTY_ARRAY_KEYS.has(key) || parsed.length > 0
      );
    }
    return Boolean(parsed && typeof parsed === 'object' && !Array.isArray(parsed));
  } catch {
    return false;
  }
}

function setDeviceCacheItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[FirestoreDataContext] Could not persist device cache "${key}":`, error);
  }
}

function ensureDeviceCacheVersion(): void {
  try {
    if (localStorage.getItem(DEVICE_CACHE_VERSION_KEY) === DEVICE_CACHE_VERSION) return;

    for (const storage of [localStorage, sessionStorage]) {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (key?.startsWith('mahdev_cached_')) storage.removeItem(key);
      }
    }
    localStorage.setItem(DEVICE_CACHE_VERSION_KEY, DEVICE_CACHE_VERSION);
  } catch (error) {
    console.warn('[FirestoreDataContext] Could not invalidate legacy device cache:', error);
  }
}

function prepareDeviceCache(): boolean {
  ensureDeviceCacheVersion();
  return hasCompleteDeviceCache();
}

function isHardReloadNavigation(): boolean {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return navigation?.type === 'reload';
  } catch (error) {
    console.warn('[FirestoreDataContext] Could not inspect navigation type:', error);
    return false;
  }
}

function getCurrentRoutePath(): string {
  if (typeof window === 'undefined') return '/';
  const hashRoute = window.location.hash.startsWith('#/')
    ? window.location.hash.slice(1).split('?')[0]
    : '';
  return canonicalizeDivisionRoute(hashRoute || window.location.pathname);
}

function sanitizeCachedSettings(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeCachedSettings);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !PRIVATE_SETTINGS_CACHE_FIELDS.has(key))
      .map(([key, nestedValue]) => [key, sanitizeCachedSettings(nestedValue)])
  );
}

function hasCompleteDeviceCache(): boolean {
  ensureDeviceCacheVersion();
  return DEVICE_CACHE_REQUIRED_KEYS.every((key) => {
    const cached = getDeviceCacheItem(key);
    if (cached === null) return false;
    try {
      const parsed: unknown = JSON.parse(cached);
      if (DEVICE_CACHE_ARRAY_KEYS.has(key)) {
        if (!Array.isArray(parsed)) return false;
        if (DEVICE_CACHE_NONEMPTY_ARRAY_KEYS.has(key) && parsed.length === 0) return false;
      } else if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return false;
      }
    } catch {
      return false;
    }
    return true;
  });
}

export interface FirestoreDataContextValue {
  isInitialLoading: boolean;
  isReady: boolean;
  isFetching: boolean;
  isDivisionsLoading: boolean;
  isMilestonesLoading: boolean;
  isServicesLoading: boolean;
  isGalleryLoading: boolean;
  isProductsLoading: boolean;
  isPortfolioLoading: boolean;
  isTestimonialsLoading: boolean;
  isCompaniesLoading: boolean;
  isHomepageConfigLoading: boolean;
  isSettingsLoading: boolean;
  syncProgress: number;
  syncStatus: string;
  error: Error | null;
  companySettings: FirestoreCompanySettings;
  siteSettings: FirestoreSiteSettings;
  homepageConfig: HomepageCmsConfig;
  divisions: FirestoreDivision[];
  activeDivisions: FirestoreDivision[];
  categories: FirestoreCategory[];
  services: FirestoreService[];
  products: FirestoreProduct[];
  milestones: FirestoreMilestone[];
  trustedCompanies: FirestoreTrustedCompany[];
  testimonials: FirestoreTestimonial[];
  googleReviews: GoogleReview[];
  googleReviewsConfig: GoogleReviewsConfig;
  portfolio: FirestorePortfolio[];
  gallery: FirestoreGallery[];
  mediaAssets: StoredMediaItem[];
  refreshAll: (forceRefresh?: boolean) => Promise<void>;
  updateSiteSettings: (data: Partial<FirestoreSiteSettings>) => Promise<void>;
  updateCompanySettings: (data: Partial<FirestoreCompanySettings>) => Promise<void>;
  updateHomepageConfig: (data: Partial<HomepageCmsConfig>) => Promise<void>;
  updateGoogleReviewsConfig: (data: Partial<GoogleReviewsConfig>) => Promise<void>;
  syncGoogleReviews: () => Promise<any>;
  reorderDivisions: (orderedIds: string[]) => Promise<void>;
  updateDivisionOrder: (id: string, order: number) => Promise<void>;
  saveDivision: (id: string, data: Partial<FirestoreDivision>) => Promise<void>;
  loadedDivisions: Record<string, boolean>;
  loadedServices: Record<string, boolean>;
  loadedGallery: Record<string, boolean>;
  fetchingDivisions: Record<string, boolean>;
  isDivisionLoaded: (divisionId: string) => boolean;
  isDivisionServicesLoaded: (divisionId: string) => boolean;
  isDivisionGalleryLoaded: (divisionId: string) => boolean;
  isDivisionFetching: (divisionId: string) => boolean;
  loadDivisionData: (divisionId: string, forceRefresh?: boolean) => Promise<void>;
  loadRouteData: (route: string, forceRefresh?: boolean) => Promise<void>;
  loadMediaAssets: () => Promise<void>;
  isLiveHydrated: boolean;
}

const FirestoreDataContext = createContext<FirestoreDataContextValue | null>(null);

export const FirestoreDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hasCachedData = useMemo(prepareDeviceCache, []);

  // Check per-entity cache status
  const getCache = (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        const item = getDeviceCacheItem(key);
        if (item) {
          let parsed = JSON.parse(item);
          if (key === 'mahdev_cached_company_settings' && parsed && typeof parsed === 'object') {
            const company = parsed as FirestoreCompanySettings;
            const defaults = getDefaultCompanySettings();
            const socials = { ...defaults.socials, ...(company.socials || {}) };
            const legacySocialUrls: Record<string, string[]> = {
              linkedin: ['https://linkedin.com/company/mahdev'],
              instagram: [
                'https://instagram.com/mahdev',
                'https://www.instagram.com/sws_event_management',
              ],
            };
            Object.entries(legacySocialUrls).forEach(([platform, legacyUrls]) => {
              const currentUrl = socials[platform]?.replace(/\/+$/, '').toLowerCase();
              if (legacyUrls.some((url) => currentUrl === url.replace(/\/+$/, '').toLowerCase())) {
                socials[platform] = defaults.socials[platform];
              }
            });
            parsed = { ...company, socials };
          }
          if (PUBLIC_SETTINGS_CACHE_KEYS.has(key)) {
            const sanitized = sanitizeCachedSettings(parsed);
            const serialized = JSON.stringify(sanitized);
            if (serialized !== item) setDeviceCacheItem(key, serialized);
            return sanitized;
          }
          return parsed;
        }
      }
    } catch {}
    return null;
  };

  const cachedCompany = getCache('mahdev_cached_company_settings');
  const cachedSite = getCache('mahdev_cached_site_settings');
  const cachedHome = getCache('mahdev_cached_homepage_config');
  const cachedDivs = getCache('mahdev_cached_divisions');
  const cachedCats = getCache('mahdev_cached_categories');
  const cachedSrvs = getCache('mahdev_cached_services');
  const cachedProds = getCache('mahdev_cached_products');
  const cachedMs = getCache('mahdev_cached_milestones');
  const cachedComps = getCache('mahdev_cached_companies');
  const cachedTestis = getCache('mahdev_cached_testimonials');
  const cachedGReviews = getCache('mahdev_cached_google_reviews');
  const cachedGConfig = getCache('mahdev_cached_google_reviews_config');
  const cachedPort = getCache('mahdev_cached_portfolio');
  const cachedGal = getCache('mahdev_cached_gallery');
  const cachedMedia = getCache('mahdev_cached_media_assets');

  // Individual Per-Entity Loading States (All core corporate entities pre-seeded for 0ms instant rendering!)
  const [isDivisionsLoading, setIsDivisionsLoading] = useState<boolean>(!Array.isArray(cachedDivs));
  const [isMilestonesLoading, setIsMilestonesLoading] = useState<boolean>(false);
  const [isServicesLoading, setIsServicesLoading] = useState<boolean>(!Array.isArray(cachedSrvs));
  const [isGalleryLoading, setIsGalleryLoading] = useState<boolean>(!Array.isArray(cachedGal));
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(!Array.isArray(cachedProds));
  const [isPortfolioLoading, setIsPortfolioLoading] = useState<boolean>(!Array.isArray(cachedPort));
  const [isTestimonialsLoading, setIsTestimonialsLoading] = useState<boolean>(!Array.isArray(cachedTestis));
  const [isCompaniesLoading, setIsCompaniesLoading] = useState<boolean>(!Array.isArray(cachedComps));
  const [isHomepageConfigLoading, setIsHomepageConfigLoading] = useState<boolean>(!cachedHome);
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(!cachedCompany || !cachedSite);

  // General App Loading state
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(100);
  const [syncStatus, setSyncStatus] = useState<string>('Ready');
  const [error, setError] = useState<Error | null>(null);

  const [companySettings, setCompanySettings] = useState<FirestoreCompanySettings>(() => {
    return cachedCompany || getDefaultCompanySettings();
  });
  const [siteSettings, setSiteSettings] = useState<FirestoreSiteSettings>(() => {
    return cachedSite || getDefaultSiteSettings();
  });
  const [homepageConfig, setHomepageConfig] = useState<HomepageCmsConfig>(() => {
    return cachedHome || getDefaultHomepageSettings();
  });
  const [divisions, setDivisions] = useState<FirestoreDivision[]>(() => {
    return Array.isArray(cachedDivs) ? sortDivisions(cachedDivs) : [];
  });
  const [categories, setCategories] = useState<FirestoreCategory[]>(() => {
    return Array.isArray(cachedCats) ? cachedCats : [];
  });
  const [services, setServices] = useState<FirestoreService[]>(() => {
    return Array.isArray(cachedSrvs) ? cachedSrvs : [];
  });
  const [products, setProducts] = useState<FirestoreProduct[]>(() => {
    return Array.isArray(cachedProds) ? cachedProds : [];
  });
  const [milestones, setMilestones] = useState<FirestoreMilestone[]>(() => {
    if (Array.isArray(cachedMs) && cachedMs.length > 0) return cachedMs;
    return [];
  });
  const [trustedCompanies, setTrustedCompanies] = useState<FirestoreTrustedCompany[]>(() => {
    return Array.isArray(cachedComps) ? cachedComps : [];
  });
  const [testimonials, setTestimonials] = useState<FirestoreTestimonial[]>(() => {
    return Array.isArray(cachedTestis) ? cachedTestis : [];
  });
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = getDeviceCacheItem('mahdev_cached_google_reviews');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [googleReviewsConfig, setGoogleReviewsConfig] = useState<GoogleReviewsConfig>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = getDeviceCacheItem('mahdev_cached_google_reviews_config');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return DEFAULT_GOOGLE_REVIEWS_CONFIG;
  });
  const [portfolio, setPortfolio] = useState<FirestorePortfolio[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = getDeviceCacheItem('mahdev_cached_portfolio');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [gallery, setGallery] = useState<FirestoreGallery[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = getDeviceCacheItem('mahdev_cached_gallery');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [mediaAssets, setMediaAssets] = useState<StoredMediaItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = getDeviceCacheItem('mahdev_cached_media_assets');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [mediaAssetsLoaded, setMediaAssetsLoaded] = useState<boolean>(() => Array.isArray(cachedMedia));
  const mediaAssetsRequestRef = React.useRef<Promise<void> | null>(null);

  const [isLiveHydrated, setIsLiveHydrated] = useState<boolean>(true);

  // Track loaded divisions state for seamless transition & shimmers
  const [loadedDivisions, setLoadedDivisions] = useState<Record<string, boolean>>(() => {
    if (hasCachedData) return { ...FULLY_LOADED_DIVISION_FLAGS };
    try {
      if (typeof window !== 'undefined') {
        const cached = getDeviceCacheItem('mahdev_cached_loaded_divisions');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return {};
  });

  const [loadedServices, setLoadedServices] = useState<Record<string, boolean>>(() => {
    if (hasCachedData) return { ...FULLY_LOADED_DIVISION_FLAGS };
    try {
      if (typeof window !== 'undefined') {
        const cached = getDeviceCacheItem('mahdev_cached_loaded_services');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return {};
  });

  const [loadedGallery, setLoadedGallery] = useState<Record<string, boolean>>(() => {
    if (hasCachedData) return { ...FULLY_LOADED_DIVISION_FLAGS };
    try {
      if (typeof window !== 'undefined') {
        const cached = getDeviceCacheItem('mahdev_cached_loaded_gallery');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return {};
  });

  // Track active fetching state to prevent premature shimmer disappearance on mobile networks
  const [fetchingDivisions, setFetchingDivisions] = useState<Record<string, boolean>>({});
  const inFlightDivisionLoadsRef = React.useRef<Record<string, Promise<void> | undefined>>({});
  const publicDataLoadedRef = React.useRef(hasCachedData);
  const refreshRequestRef = React.useRef<Promise<void> | null>(null);
  const bootLoadStartedRef = React.useRef(false);
  const cacheBootHandledRef = React.useRef(false);

  const divisionsRef = React.useRef<FirestoreDivision[]>([]);
  divisionsRef.current = divisions;

  const loadMediaAssets = useCallback(async () => {
    if (mediaAssetsLoaded) return;
    if (mediaAssetsRequestRef.current) return mediaAssetsRequestRef.current;

    const request = (async () => {
      const cached = getDeviceCacheItem('mahdev_cached_media_assets');
      if (cached !== null) {
        try {
          const parsed: unknown = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setMediaAssets(parsed);
            setMediaAssetsLoaded(true);
            return;
          }
        } catch {}
      }

      const assets = await mediaService.getMediaAssets();
      setMediaAssets(assets);
      setMediaAssetsLoaded(true);
      setDeviceCacheItem('mahdev_cached_media_assets', JSON.stringify(assets));
    })();
    mediaAssetsRequestRef.current = request;
    try {
      await request;
    } finally {
      mediaAssetsRequestRef.current = null;
    }
  }, [mediaAssetsLoaded]);

  // Individual Division Data Loader: Fetches services, gallery, media, products, and categories concurrently.
  // CRITICAL: Holds shimmer in place until 100% of division collections have settled from Firestore!
  const loadDivisionData = useCallback(async (rawDivId: string, forceRefresh = false) => {
    const canonicalId = getCanonicalDivisionId(rawDivId) || rawDivId;
    if (!canonicalId) return;
    const hasDivisionCache = () => {
      try {
        const services = JSON.parse(getDeviceCacheItem('mahdev_cached_loaded_services') || '{}');
        const gallery = JSON.parse(getDeviceCacheItem('mahdev_cached_loaded_gallery') || '{}');
        return Boolean(
          services[canonicalId] &&
          gallery[canonicalId] &&
          hasValidDeviceCacheItem('mahdev_cached_services') &&
          hasValidDeviceCacheItem('mahdev_cached_gallery') &&
          hasValidDeviceCacheItem('mahdev_cached_products') &&
          hasValidDeviceCacheItem('mahdev_cached_categories')
        );
      } catch {
        return false;
      }
    };
    if (!forceRefresh && hasDivisionCache()) return;
    if (refreshRequestRef.current) {
      await refreshRequestRef.current;
      if (!forceRefresh && hasDivisionCache()) return;
    }

    // Deduplicate in-flight requests for the exact same division
    if (inFlightDivisionLoadsRef.current[canonicalId]) {
      return inFlightDivisionLoadsRef.current[canonicalId];
    }

    setFetchingDivisions((prev) => ({
      ...prev,
      [canonicalId]: true,
      [rawDivId]: true,
    }));

    const loadPromise = (async () => {
      let servicesLoadedSuccessfully = false;
      let galleryLoadedSuccessfully = false;
      try {
        // 1. Fetch Services
        const fetchServicesPromise = firestoreServicesService
          .getServices(canonicalId as DivisionId, forceRefresh)
          .then((srvs) => {
            servicesLoadedSuccessfully = true;
            setServices((prev) => {
              const otherServices = prev.filter(
                (s) => !isSameDivision(s.division, canonicalId) && !isSameDivision((s as any).divisionId, canonicalId)
              );
              const uniqueMap = new Map<string, FirestoreService>();
              for (const s of otherServices) {
                if (s && s.id) uniqueMap.set(s.id, s);
              }
              for (const s of srvs) {
                if (s && s.id) uniqueMap.set(s.id, s);
              }
              const merged = Array.from(uniqueMap.values());
              try { setDeviceCacheItem('mahdev_cached_services', JSON.stringify(merged)); } catch {}
              return merged;
            });
            if (typeof queueMicrotask === 'function') {
              queueMicrotask(() => bookingService.syncWithFirestore(srvs));
            } else {
              setTimeout(() => bookingService.syncWithFirestore(srvs), 0);
            }
          })
          .catch((err) => {
            console.warn(`[FirestoreDataContext] Services notice for ${rawDivId}:`, err);
          });

        // 2. Fetch Gallery in parallel
        const fetchGalleryPromise = firestoreGalleryService
          .getGallery(canonicalId as DivisionId, forceRefresh)
          .then((gal) => {
            galleryLoadedSuccessfully = true;
            setGallery((prev) => {
              const otherGal = prev.filter(
                (g) => !isSameDivision(g.division, canonicalId) && !isSameDivision((g as any).divisionId, canonicalId)
              );
              const uniqueMap = new Map<string, FirestoreGallery>();
              for (const g of otherGal) {
                if (g && g.id) uniqueMap.set(g.id, g);
              }
              for (const g of gal) {
                if (g && g.id) uniqueMap.set(g.id, g);
              }
              const merged = Array.from(uniqueMap.values());
              try { setDeviceCacheItem('mahdev_cached_gallery', JSON.stringify(merged)); } catch {}
              return merged;
            });
          })
          .catch((err) => {
            console.warn(`[FirestoreDataContext] Gallery notice for ${rawDivId}:`, err);
          });

        // 3. Fetch products, categories, portfolio
        const fetchOthersPromise = Promise.all([
          firestoreProductsService.getProducts({ division: canonicalId as DivisionId }, forceRefresh),
          firestoreCategoriesService.getCategories(canonicalId as DivisionId, forceRefresh),
          firestorePortfolioService.getPortfolio(canonicalId as DivisionId, forceRefresh),
        ])
          .then(([prods, cats, port]) => {
            setProducts((prev) => {
              const otherProds = prev.filter(
                (p) => !isSameDivision(p.division, canonicalId) && !isSameDivision((p as any).divisionId, canonicalId)
              );
              const uniqueMap = new Map<string, FirestoreProduct>();
              for (const p of otherProds) {
                if (p && p.id) uniqueMap.set(p.id, p);
              }
              for (const p of prods) {
                if (p && p.id) uniqueMap.set(p.id, p);
              }
              const merged = Array.from(uniqueMap.values());
              try { setDeviceCacheItem('mahdev_cached_products', JSON.stringify(merged)); } catch {}
              return merged;
            });
            if (typeof queueMicrotask === 'function') {
              queueMicrotask(() => catalogService.syncWithFirestore(prods));
            } else {
              setTimeout(() => catalogService.syncWithFirestore(prods), 0);
            }

            setCategories((prev) => {
              const otherCats = prev.filter(
                (c) => !isSameDivision(c.division, canonicalId) && !isSameDivision((c as any).divisionId, canonicalId)
              );
              const uniqueMap = new Map<string, FirestoreCategory>();
              for (const c of otherCats) {
                if (c && c.id) uniqueMap.set(c.id, c);
              }
              for (const c of cats) {
                if (c && c.id) uniqueMap.set(c.id, c);
              }
              const merged = Array.from(uniqueMap.values());
              try { setDeviceCacheItem('mahdev_cached_categories', JSON.stringify(merged)); } catch {}
              return merged;
            });

            setPortfolio((prev) => {
              const otherPort = prev.filter(
                (p) => !isSameDivision(p.division, canonicalId) && !isSameDivision((p as any).divisionId, canonicalId)
              );
              const uniqueMap = new Map<string, FirestorePortfolio>();
              for (const p of otherPort) {
                if (p && p.id) uniqueMap.set(p.id, p);
              }
              for (const p of port) {
                if (p && p.id) uniqueMap.set(p.id, p);
              }
              const merged = Array.from(uniqueMap.values());
              try { setDeviceCacheItem('mahdev_cached_portfolio', JSON.stringify(merged)); } catch {}
              return merged;
            });
          })
          .catch((err) => {
            console.warn(`[FirestoreDataContext] Other items notice for ${rawDivId}:`, err);
          });

        // CRITICAL: Await all parallel collections simultaneously.
        // The shimmer MUST persist until this entire promise has settled!
        await Promise.allSettled([
          fetchServicesPromise,
          fetchGalleryPromise,
          fetchOthersPromise,
        ]);
      } finally {
        // ONLY AFTER ALL QUERIES HAVE FULLY SETTLED, TOGGLE FLAGS AND RELEASE SHIMMER
        if (servicesLoadedSuccessfully) setLoadedServices((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { setDeviceCacheItem('mahdev_cached_loaded_services', JSON.stringify(next)); } catch {}
          return next;
        });

        if (galleryLoadedSuccessfully) setLoadedGallery((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { setDeviceCacheItem('mahdev_cached_loaded_gallery', JSON.stringify(next)); } catch {}
          return next;
        });

        if (servicesLoadedSuccessfully && galleryLoadedSuccessfully) setLoadedDivisions((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { setDeviceCacheItem('mahdev_cached_loaded_divisions', JSON.stringify(next)); } catch {}
          return next;
        });

        setFetchingDivisions((prev) => ({
          ...prev,
          [canonicalId]: false,
          [rawDivId]: false,
        }));

        delete inFlightDivisionLoadsRef.current[canonicalId];
      }
    })();

    inFlightDivisionLoadsRef.current[canonicalId] = loadPromise;
    await loadPromise;
  }, []);

  const refreshCurrentPageData = useCallback(async (routePath: string, forceRefresh = false) => {
    const route = routePath.replace(/\/+$/, '') || '/';
    const routeAliases: Record<string, string> = {
      '/about-us': '/about',
      '/company': '/about',
      '/promotions': '/promotion',
      '/featured-services': '/services',
      '/media': '/gallery',
      '/work': '/portfolio',
      '/projects': '/portfolio',
      '/journey': '/milestones',
      '/reviews': '/testimonials',
      '/jobs': '/careers',
      '/partners': '/clients',
      '/companies': '/clients',
      '/sws-events': '/sws',
      '/sws-event-management': '/sws',
      '/u1-studio': '/u1',
      '/u1-cinema': '/u1',
      '/it-solutions': '/it',
      '/mahdev-it': '/it',
      '/mahdev-travels': '/travels',
    };
    const normalizedRoute = canonicalizeDivisionRoute(routeAliases[route] || route);

    const refreshServices = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_services')) return;
      setIsServicesLoading(true);
      try {
        const fresh = await firestoreServicesService.getServices(undefined, forceRefresh);
        const unique = fresh.filter((item, index) => fresh.findIndex((candidate) => candidate.id === item.id) === index);
        setServices(unique);
        bookingService.syncWithFirestore(unique);
        cmsService.syncEntityFromFirestore('services', unique);
        setDeviceCacheItem('mahdev_cached_services', JSON.stringify(unique));
      } finally {
        setIsServicesLoading(false);
      }
    };
    const refreshGallery = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_gallery')) return;
      setIsGalleryLoading(true);
      try {
        const fresh = await firestoreGalleryService.getGallery(undefined, forceRefresh);
        setGallery(fresh);
        cmsService.syncEntityFromFirestore('gallery', fresh);
        setDeviceCacheItem('mahdev_cached_gallery', JSON.stringify(fresh));
      } finally {
        setIsGalleryLoading(false);
      }
    };
    const refreshProducts = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_products')) return;
      setIsProductsLoading(true);
      try {
        const fresh = await firestoreProductsService.getProducts({}, forceRefresh);
        setProducts(fresh);
        catalogService.syncWithFirestore(fresh);
        cmsService.syncEntityFromFirestore('products', fresh);
        setDeviceCacheItem('mahdev_cached_products', JSON.stringify(fresh));
      } finally {
        setIsProductsLoading(false);
      }
    };
    const refreshCategories = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_categories')) return;
      const fresh = await firestoreCategoriesService.getCategories(undefined, forceRefresh);
      setCategories(fresh);
      cmsService.syncEntityFromFirestore('categories', fresh);
      setDeviceCacheItem('mahdev_cached_categories', JSON.stringify(fresh));
    };
    const refreshDivisions = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_divisions')) return;
      const fresh = sortDivisions(await firestoreDivisionsService.getDivisions(forceRefresh));
      divisionsRef.current = fresh;
      setDivisions(fresh);
      cmsService.syncEntityFromFirestore('divisions', fresh);
      setDeviceCacheItem('mahdev_cached_divisions', JSON.stringify(fresh));
    };
    const refreshHomepageSettings = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_homepage_config')) return;
      const fresh = await firestoreSettingsService.getHomepageSettings(forceRefresh);
      setHomepageConfig(fresh);
      cmsService.syncHomepageConfig(fresh);
      setDeviceCacheItem('mahdev_cached_homepage_config', JSON.stringify(fresh));
    };
    const refreshPortfolio = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_portfolio')) return;
      const fresh = await firestorePortfolioService.getPortfolio(undefined, forceRefresh);
      setPortfolio(fresh);
      setDeviceCacheItem('mahdev_cached_portfolio', JSON.stringify(fresh));
    };
    const refreshMilestones = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_milestones')) return;
      const fresh = await firestoreMilestonesService.getMilestones(forceRefresh);
      setMilestones(fresh);
      setDeviceCacheItem('mahdev_cached_milestones', JSON.stringify(fresh));
    };
    const refreshCompanies = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_companies')) return;
      const fresh = await firestoreTrustedCompaniesService.getTrustedCompanies(forceRefresh);
      setTrustedCompanies(fresh);
      setDeviceCacheItem('mahdev_cached_companies', JSON.stringify(fresh));
    };
    const refreshTestimonials = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_testimonials')) return;
      const fresh = await firestoreTestimonialsService.getTestimonials(undefined, forceRefresh);
      setTestimonials(fresh);
      setDeviceCacheItem('mahdev_cached_testimonials', JSON.stringify(fresh));
    };
    const refreshCompanySettings = async () => {
      if (!forceRefresh && hasValidDeviceCacheItem('mahdev_cached_company_settings')) return;
      const fresh = await firestoreSettingsService.getCompanySettings(forceRefresh);
      setCompanySettings(fresh);
      setDeviceCacheItem('mahdev_cached_company_settings', JSON.stringify(fresh));
    };

    try {
      if (
        normalizedRoute === '/services' ||
        normalizedRoute === '/featured-services' ||
        normalizedRoute.startsWith('/services/') ||
        normalizedRoute.startsWith('/service/') ||
        normalizedRoute === '/promotion'
      ) {
        await refreshServices();
        await refreshGallery();
        await refreshProducts();
        await refreshCategories();
        if (normalizedRoute === '/promotion') {
          await cmsService.loadPublicCollections(forceRefresh);
        }
        return;
      }

      const divisionRoute = normalizedRoute.match(/^\/(?:divisions|division\/)?(sws|u1|it|travels)$/);
      if (divisionRoute) {
        await loadDivisionData(divisionRoute[1], forceRefresh);
        return;
      }

      if (normalizedRoute === '/divisions') {
        await refreshDivisions();
        await refreshHomepageSettings();
        return;
      }

      if (normalizedRoute === '/gallery' || normalizedRoute.startsWith('/gallery/')) {
        await refreshServices();
        await refreshGallery();
        await refreshProducts();
        await refreshCategories();
        return;
      }

      if (normalizedRoute === '/about') {
        await refreshCompanySettings();
        await refreshDivisions();
        const [milestoneData, companies, reviews] = await Promise.all([
          hasValidDeviceCacheItem('mahdev_cached_milestones') && !forceRefresh
            ? Promise.resolve(milestones)
            : firestoreMilestonesService.getMilestones(forceRefresh),
          hasValidDeviceCacheItem('mahdev_cached_companies') && !forceRefresh
            ? Promise.resolve(trustedCompanies)
            : firestoreTrustedCompaniesService.getTrustedCompanies(forceRefresh),
          hasValidDeviceCacheItem('mahdev_cached_testimonials') && !forceRefresh
            ? Promise.resolve(testimonials)
            : firestoreTestimonialsService.getTestimonials(undefined, forceRefresh),
        ]);
        setMilestones(milestoneData);
        setTrustedCompanies(companies);
        setTestimonials(reviews);
        setDeviceCacheItem('mahdev_cached_milestones', JSON.stringify(milestoneData));
        setDeviceCacheItem('mahdev_cached_companies', JSON.stringify(companies));
        setDeviceCacheItem('mahdev_cached_testimonials', JSON.stringify(reviews));
        return;
      }

      if (normalizedRoute === '/careers') {
        await getPublishedCareerOpenings(forceRefresh);
        return;
      }

      if (normalizedRoute === '/portfolio') {
        await refreshPortfolio();
        return;
      }

      if (normalizedRoute === '/milestones') {
        await refreshMilestones();
        return;
      }

      if (normalizedRoute === '/testimonials') {
        await refreshTestimonials();
        return;
      }

      if (normalizedRoute === '/clients') {
        await refreshCompanies();
        return;
      }

      if (normalizedRoute === '/contact') {
        const tasks: Promise<unknown>[] = [refreshCompanySettings()];
        if (forceRefresh || !hasValidDeviceCacheItem('mahdev_cached_site_settings')) {
          tasks.push(firestoreSettingsService.getSiteSettings(forceRefresh).then((fresh) => {
            setSiteSettings(fresh);
            setDeviceCacheItem('mahdev_cached_site_settings', JSON.stringify(fresh));
          }));
        }
        await Promise.all(tasks);
        return;
      }

      if (normalizedRoute === '/insights') {
        await cmsService.loadPublicCollections(forceRefresh);
        return;
      }

      if (
        /^\/(?:mart|shop|store|online-mart|mahdev-mart)(?:\/|$)/.test(normalizedRoute) ||
        normalizedRoute === '/divisions/mart' ||
        normalizedRoute === '/division/mart'
      ) {
        await refreshProducts();
        await refreshCategories();
        return;
      }

      if (normalizedRoute === '/') {
        if (!forceRefresh && hasCompleteDeviceCache()) return;
        await refreshServices();
        await refreshGallery();
        await refreshProducts();
        const [
          divisionData,
          milestoneData,
          companyData,
          siteData,
          homepageData,
          categoryData,
          portfolioData,
          companies,
          reviews,
          googleReviewConfig,
          googleReviewData,
        ] = await Promise.all([
          firestoreDivisionsService.getDivisions(forceRefresh),
          firestoreMilestonesService.getMilestones(forceRefresh),
          firestoreSettingsService.getCompanySettings(forceRefresh),
          firestoreSettingsService.getSiteSettings(forceRefresh),
          firestoreSettingsService.getHomepageSettings(forceRefresh),
          firestoreCategoriesService.getCategories(undefined, forceRefresh),
          firestorePortfolioService.getPortfolio(undefined, forceRefresh),
          firestoreTrustedCompaniesService.getTrustedCompanies(forceRefresh),
          firestoreTestimonialsService.getTestimonials(undefined, forceRefresh),
          firestoreGoogleReviewsService.getConfig(forceRefresh),
          firestoreGoogleReviewsService.getReviews(undefined),
        ]);
        const sortedDivisions = sortDivisions(divisionData);
        divisionsRef.current = sortedDivisions;
        setDivisions(sortedDivisions);
        setMilestones(milestoneData);
        setCompanySettings(companyData);
        setSiteSettings(siteData);
        setHomepageConfig(homepageData);
        setCategories(categoryData);
        setPortfolio(portfolioData);
        setTrustedCompanies(companies);
        setTestimonials(reviews);
        setGoogleReviewsConfig(googleReviewConfig);
        setGoogleReviews(googleReviewData);
        setDeviceCacheItem('mahdev_cached_divisions', JSON.stringify(sortedDivisions));
        setDeviceCacheItem('mahdev_cached_milestones', JSON.stringify(milestoneData));
        setDeviceCacheItem('mahdev_cached_company_settings', JSON.stringify(companyData));
        setDeviceCacheItem('mahdev_cached_site_settings', JSON.stringify(siteData));
        setDeviceCacheItem('mahdev_cached_homepage_config', JSON.stringify(homepageData));
        setDeviceCacheItem('mahdev_cached_categories', JSON.stringify(categoryData));
        setDeviceCacheItem('mahdev_cached_portfolio', JSON.stringify(portfolioData));
        setDeviceCacheItem('mahdev_cached_companies', JSON.stringify(companies));
        setDeviceCacheItem('mahdev_cached_testimonials', JSON.stringify(reviews));
        setDeviceCacheItem('mahdev_cached_google_reviews_config', JSON.stringify(googleReviewConfig));
        setDeviceCacheItem('mahdev_cached_google_reviews', JSON.stringify(googleReviewData));
        await Promise.all([
          cmsService.loadPublicCollections(forceRefresh).catch((cmsError: unknown) => {
            console.error('[FirestoreDataContext] Could not refresh public CMS collections:', cmsError);
          }),
          getPublishedCareerOpenings(forceRefresh).catch((careerError: unknown) => {
            console.error('[FirestoreDataContext] Could not refresh published career openings:', careerError);
          }),
        ]);
        return;
      }
    } catch (cause) {
      const refreshError = cause instanceof Error ? cause : new Error(String(cause));
      console.error(`[FirestoreDataContext] Could not refresh data for ${normalizedRoute}:`, refreshError);
      setError(refreshError);
      throw refreshError;
    }
  }, [loadDivisionData, milestones, trustedCompanies, testimonials]);

  const loadRouteData = useCallback(
    (route: string, forceRefresh = false) => refreshCurrentPageData(route, forceRefresh),
    [refreshCurrentPageData]
  );

  const isDivisionFetching = useCallback(
    (divisionId: string) => {
      if (!divisionId) return false;
      const canonicalId = getCanonicalDivisionId(divisionId) || divisionId;
      return Boolean(fetchingDivisions[canonicalId] || fetchingDivisions[divisionId]);
    },
    [fetchingDivisions]
  );

  const isDivisionLoaded = useCallback(
    (divisionId: string) => {
      if (!divisionId) return true;
      const canonicalId = getCanonicalDivisionId(divisionId) || divisionId;
      // 1. If currently fetching, it is NEVER loaded — shimmer MUST remain visible in the body part
      if (fetchingDivisions[canonicalId] || fetchingDivisions[divisionId]) {
        return false;
      }
      // 2. If app is performing initial boot load, shimmer remains visible
      if (isInitialLoading) {
        return false;
      }
      // 3. Must be flagged in loadedDivisions
      const isDivFlagged = Boolean(loadedDivisions[canonicalId] || loadedDivisions[divisionId]);
      if (!isDivFlagged) return false;

      // 4. Must also confirm loadedServices and loadedGallery are complete
      const srvLoaded = Boolean(loadedServices[canonicalId] || loadedServices[divisionId]);
      const galLoaded = Boolean(loadedGallery[canonicalId] || loadedGallery[divisionId]);
      return srvLoaded && galLoaded;
    },
    [isInitialLoading, loadedDivisions, loadedServices, loadedGallery, fetchingDivisions]
  );

  const isDivisionServicesLoaded = useCallback(
    (divisionId: string) => {
      if (!divisionId) return true;
      const canonicalId = getCanonicalDivisionId(divisionId) || divisionId;
      if (fetchingDivisions[canonicalId] || fetchingDivisions[divisionId]) return false;
      if (isInitialLoading) return false;
      return Boolean(loadedServices[canonicalId] || loadedServices[divisionId]);
    },
    [isInitialLoading, loadedServices, fetchingDivisions]
  );

  const isDivisionGalleryLoaded = useCallback(
    (divisionId: string) => {
      if (!divisionId) return true;
      const canonicalId = getCanonicalDivisionId(divisionId) || divisionId;
      if (fetchingDivisions[canonicalId] || fetchingDivisions[divisionId]) return false;
      if (isInitialLoading) return false;
      return Boolean(loadedGallery[canonicalId] || loadedGallery[divisionId]);
    },
    [isInitialLoading, loadedGallery, fetchingDivisions]
  );

  // Progressive One-by-One Data Hydration:
  // Each Firestore resource executes its own independent API call and immediately reflects in the UI
  // the moment it resolves. Eliminates blocking Promise.all so mobile connections stream data one-by-one!
  const refreshAll = useCallback((forceRefresh = false): Promise<void> => {
    if (refreshRequestRef.current) return refreshRequestRef.current;

    publicDataLoadedRef.current = false;
    const refreshRequest = (async () => {
      setIsFetching(true);
      const reportRefreshError = (resource: string, cause: unknown) => {
      const refreshError = cause instanceof Error ? cause : new Error(String(cause));
      console.error(`[TursoDataContext] Failed to refresh ${resource}:`, refreshError);
      setError((currentError) => currentError || refreshError);
      };
      const publicCmsTask = cmsService.loadPublicCollections(forceRefresh).catch((err) => {
        reportRefreshError('public CMS content', err);
      });
      try {
      setError(null);
      setSyncProgress(20);
      setSyncStatus('Streaming data one-by-one...');

      // Immediately unblock UI so mobile users never see a blank/frozen screen
      setIsInitialLoading(false);
      setIsReady(true);

      // 1. One-by-one API Call: Divisions
      const fetchDivisionsTask = firestoreDivisionsService
        .getDivisions(forceRefresh)
        .then((divs) => {
          const sortedDivs = sortDivisions(divs);
          divisionsRef.current = sortedDivs;
          setDivisions(sortedDivs);
          setIsDivisionsLoading(false);
          setLoadedDivisions((prev) => {
            const next = { ...prev };
            sortedDivs.forEach((d) => {
              next[d.id] = true;
              if (d.slug) next[d.slug] = true;
            });
            try { setDeviceCacheItem('mahdev_cached_loaded_divisions', JSON.stringify(next)); } catch {}
            return next;
          });
          cmsService.syncEntityFromFirestore('divisions', sortedDivs);
          try { setDeviceCacheItem('mahdev_cached_divisions', JSON.stringify(sortedDivs)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 8));
        })
        .catch((err) => {
          reportRefreshError('divisions', err);
          setIsDivisionsLoading(false);
        });
      await fetchDivisionsTask;

      // 2. One-by-one API Call: Milestones
      const fetchMilestonesTask = firestoreMilestonesService
        .getMilestones(forceRefresh)
        .then((allMilestones) => {
          setMilestones(allMilestones);
          setIsMilestonesLoading(false);
          cmsService.syncEntityFromFirestore('milestones', allMilestones);
          try { setDeviceCacheItem('mahdev_cached_milestones', JSON.stringify(allMilestones)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 8));
        })
        .catch((err) => {
          reportRefreshError('milestones', err);
          setIsMilestonesLoading(false);
        });
      await fetchMilestonesTask;

      // 3. One-by-one API Call: Company Settings
      const fetchCompanySettingsTask = firestoreSettingsService
        .getCompanySettings(forceRefresh)
        .then((company) => {
          const finalCompany = { ...company, logoUrl: company.logoUrl || '', darkLogoUrl: company.darkLogoUrl || '' };
          setCompanySettings(finalCompany);
          setIsSettingsLoading(false);
          try { setDeviceCacheItem('mahdev_cached_company_settings', JSON.stringify(finalCompany)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 5));
        })
        .catch((err) => {
          reportRefreshError('company settings', err);
          setIsSettingsLoading(false);
        });
      await fetchCompanySettingsTask;

      // 4. One-by-one API Call: Site Settings
      const fetchSiteSettingsTask = firestoreSettingsService
        .getSiteSettings(forceRefresh)
        .then((site) => {
          const finalSite = { ...site, logoUrl: site.logoUrl || '', darkLogoUrl: site.darkLogoUrl || '' };
          setSiteSettings(finalSite);
          setIsSettingsLoading(false);
          try { setDeviceCacheItem('mahdev_cached_site_settings', JSON.stringify(finalSite)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 5));
        })
        .catch((err) => {
          reportRefreshError('site settings', err);
          setIsSettingsLoading(false);
        });
      await fetchSiteSettingsTask;

      // 5. One-by-one API Call: Homepage CMS Config
      const fetchHomepageSettingsTask = firestoreSettingsService
        .getHomepageSettings(forceRefresh)
        .then((home) => {
          setHomepageConfig(home);
          setIsHomepageConfigLoading(false);
          cmsService.syncHomepageConfig(home);
          try { setDeviceCacheItem('mahdev_cached_homepage_config', JSON.stringify(home)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 6));
        })
        .catch((err) => {
          reportRefreshError('homepage settings', err);
          setIsHomepageConfigLoading(false);
        });
      await fetchHomepageSettingsTask;

      // 6. One-by-one API Call: Services
      const fetchServicesTask = firestoreServicesService
        .getServices(undefined, forceRefresh)
        .then((allServices) => {
          const seen = new Set<string>();
          const dedupedServices = allServices.filter((s) => s && s.id && !seen.has(s.id) && seen.add(s.id));
          setServices(dedupedServices);
          setIsServicesLoading(false);
          setLoadedServices((prev) => {
            const next = { ...prev };
            dedupedServices.forEach((s) => {
              if (s.division) next[s.division] = true;
              if ((s as any).divisionId) next[(s as any).divisionId] = true;
            });
            try { setDeviceCacheItem('mahdev_cached_loaded_services', JSON.stringify(next)); } catch {}
            return next;
          });
          bookingService.syncWithFirestore(dedupedServices);
          cmsService.syncEntityFromFirestore('services', dedupedServices);
          try { setDeviceCacheItem('mahdev_cached_services', JSON.stringify(dedupedServices)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 8));
        })
        .catch((err) => {
          reportRefreshError('services', err);
          setIsServicesLoading(false);
        });
      await fetchServicesTask;

      // 7. One-by-one API Call: Gallery
      const fetchGalleryTask = firestoreGalleryService
        .getGallery(undefined, forceRefresh)
        .then((allGallery) => {
          const seen = new Set<string>();
          const dedupedGallery = allGallery.filter((g) => g && g.id && !seen.has(g.id) && seen.add(g.id));
          setGallery(dedupedGallery);
          setIsGalleryLoading(false);
          setLoadedGallery((prev) => {
            const next = { ...prev };
            dedupedGallery.forEach((g) => {
              if (g.division) next[g.division] = true;
              if ((g as any).divisionId) next[(g as any).divisionId] = true;
            });
            try { setDeviceCacheItem('mahdev_cached_loaded_gallery', JSON.stringify(next)); } catch {}
            return next;
          });
          cmsService.syncEntityFromFirestore('gallery', dedupedGallery);
          try { setDeviceCacheItem('mahdev_cached_gallery', JSON.stringify(dedupedGallery)); } catch {}
        })
        .catch((err) => {
          reportRefreshError('gallery', err);
          setIsGalleryLoading(false);
        });
      await fetchGalleryTask;

      // 8. One-by-one API Call: Products
      const fetchProductsTask = firestoreProductsService
        .getProducts({}, forceRefresh)
        .then((allProducts) => {
          const seen = new Set<string>();
          const dedupedProducts = allProducts.filter((p) => p && p.id && !seen.has(p.id) && seen.add(p.id));
          setProducts(dedupedProducts);
          setIsProductsLoading(false);
          catalogService.syncWithFirestore(dedupedProducts);
          cmsService.syncEntityFromFirestore('products', dedupedProducts);
          try { setDeviceCacheItem('mahdev_cached_products', JSON.stringify(dedupedProducts)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 6));
        })
        .catch((err) => {
          reportRefreshError('products', err);
          setIsProductsLoading(false);
        });
      await fetchProductsTask;

      // 9. One-by-one API Call: Categories
      const fetchCategoriesTask = firestoreCategoriesService
        .getCategories(undefined, forceRefresh)
        .then((allCategories) => {
          const seen = new Set<string>();
          const dedupedCategories = allCategories.filter((c) => c && c.id && !seen.has(c.id) && seen.add(c.id));
          setCategories(dedupedCategories);
          cmsService.syncEntityFromFirestore('categories', dedupedCategories);
          try { setDeviceCacheItem('mahdev_cached_categories', JSON.stringify(dedupedCategories)); } catch {}
        })
        .catch((err) => {
          reportRefreshError('categories', err);
        });
      await fetchCategoriesTask;

      // 10. One-by-one API Call: Portfolio
      const fetchPortfolioTask = firestorePortfolioService
        .getPortfolio(undefined, forceRefresh)
        .then((allPortfolio) => {
          const seen = new Set<string>();
          const dedupedPortfolio = allPortfolio.filter((p) => p && p.id && !seen.has(p.id) && seen.add(p.id));
          setPortfolio(dedupedPortfolio);
          setIsPortfolioLoading(false);
          cmsService.syncEntityFromFirestore('portfolio', dedupedPortfolio);
          try { setDeviceCacheItem('mahdev_cached_portfolio', JSON.stringify(dedupedPortfolio)); } catch {}
        })
        .catch((err) => {
          reportRefreshError('portfolio', err);
          setIsPortfolioLoading(false);
        });
      await fetchPortfolioTask;

      // 11. One-by-one API Call: Trusted Corporate Partners
      const fetchTrustedCompaniesTask = firestoreTrustedCompaniesService
        .getTrustedCompanies(forceRefresh)
        .then((allPartners) => {
          setTrustedCompanies(allPartners);
          setIsCompaniesLoading(false);
          cmsService.syncEntityFromFirestore('companies', allPartners);
          try { setDeviceCacheItem('mahdev_cached_companies', JSON.stringify(allPartners)); } catch {}
        })
        .catch((err) => {
          reportRefreshError('trusted companies', err);
          setIsCompaniesLoading(false);
        });
      await fetchTrustedCompaniesTask;

      // 12. One-by-one API Call: Testimonials
      let googleReviewSourceDocuments: Array<Record<string, any>> | undefined;
      const fetchTestimonialsTask = firestoreTestimonialsService
        .getTestimonials(undefined, forceRefresh)
        .then((allReviews) => {
          googleReviewSourceDocuments = allReviews.map((review) => ({ ...review }));
          setTestimonials(allReviews);
          setIsTestimonialsLoading(false);
          cmsService.syncEntityFromFirestore('testimonials', allReviews);
          try { setDeviceCacheItem('mahdev_cached_testimonials', JSON.stringify(allReviews)); } catch {}
        })
        .catch((err) => {
          reportRefreshError('testimonials', err);
          setIsTestimonialsLoading(false);
        });
      await fetchTestimonialsTask;

      // 13. One-by-one API Call: Google Reviews & Config
      const fetchGoogleReviewsTask = (async () => {
        const gConfig = await firestoreGoogleReviewsService.getConfig(forceRefresh).catch((err) => {
          reportRefreshError('Google review settings', err);
          return null;
        });
        const gReviews = await firestoreGoogleReviewsService
          .getReviews(undefined, googleReviewSourceDocuments)
          .catch((err) => {
          reportRefreshError('Google reviews', err);
          return [];
          });
        if (gConfig) {
          setGoogleReviewsConfig(gConfig);
          try { setDeviceCacheItem('mahdev_cached_google_reviews_config', JSON.stringify(gConfig)); } catch {}
        }
        setGoogleReviews(gReviews);
        try { setDeviceCacheItem('mahdev_cached_google_reviews', JSON.stringify(gReviews)); } catch {}
      })();
      await fetchGoogleReviewsTask;

      // 14. One-by-One API Call: Media Assets
      const fetchMediaAssetsTask = mediaService
        .getMediaAssets(forceRefresh)
        .then((allMediaAssets) => {
          setMediaAssets(allMediaAssets);
          setMediaAssetsLoaded(true);
          try { setDeviceCacheItem('mahdev_cached_media_assets', JSON.stringify(allMediaAssets)); } catch {}
        })
        .catch((err) => {
          reportRefreshError('media assets', err);
        });
      await fetchMediaAssetsTask;

      await publicCmsTask;
      try {
        await getPublishedCareerOpenings(forceRefresh);
      } catch (err) {
        reportRefreshError('published career openings', err);
      }

      const servicesCached = hasValidDeviceCacheItem('mahdev_cached_services');
      const galleryCached = hasValidDeviceCacheItem('mahdev_cached_gallery');
      if (servicesCached) {
        setLoadedServices({ ...FULLY_LOADED_DIVISION_FLAGS });
        setDeviceCacheItem('mahdev_cached_loaded_services', JSON.stringify(FULLY_LOADED_DIVISION_FLAGS));
      }
      if (galleryCached) {
        setLoadedGallery({ ...FULLY_LOADED_DIVISION_FLAGS });
        setDeviceCacheItem('mahdev_cached_loaded_gallery', JSON.stringify(FULLY_LOADED_DIVISION_FLAGS));
      }
      if (servicesCached && galleryCached) {
        setLoadedDivisions({ ...FULLY_LOADED_DIVISION_FLAGS });
        setDeviceCacheItem('mahdev_cached_loaded_divisions', JSON.stringify(FULLY_LOADED_DIVISION_FLAGS));
      }

      setSyncProgress(100);
      setSyncStatus('Welcome');
      setIsLiveHydrated(true);
      try {
        const cacheIsComplete = hasCompleteDeviceCache();
        setDeviceCacheItem('mahdev_cache_hydrated', String(cacheIsComplete));
        if (cacheIsComplete) {
          setDeviceCacheItem('mahdev_cache_timestamp', String(Date.now()));
        } else {
          console.warn('[FirestoreDataContext] Public cache remains incomplete; missing or empty required data will be fetched on the next load.');
        }
      } catch {}
    } catch (err) {
      console.error('[FirestoreDataContext] Refresh error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLiveHydrated(true);
      setIsInitialLoading(false);
      setIsReady(true);
      } finally {
        publicDataLoadedRef.current = true;
        setIsFetching(false);
      }
    })();
    refreshRequestRef.current = refreshRequest;
    void refreshRequest.then(
      () => {
        if (refreshRequestRef.current === refreshRequest) refreshRequestRef.current = null;
      },
      () => {
        if (refreshRequestRef.current === refreshRequest) refreshRequestRef.current = null;
      }
    );
    return refreshRequest;
  }, []);

  useEffect(() => {
    if (cacheBootHandledRef.current) return;
    cacheBootHandledRef.current = true;

    if (hasCachedData) {
      if (products.length > 0) catalogService.syncWithFirestore(products);
      if (services.length > 0) bookingService.syncWithFirestore(services);
      if (divisions.length > 0) cmsService.syncEntityFromFirestore('divisions', divisions);
      if (homepageConfig) cmsService.syncHomepageConfig(homepageConfig);
      if (isHardReloadNavigation()) {
        void loadRouteData(getCurrentRoutePath(), true).catch((error: unknown) => {
          console.error('[FirestoreDataContext] Route refresh failed:', error);
        });
      }
      return;
    }

    if (!bootLoadStartedRef.current) {
      bootLoadStartedRef.current = true;
      const route = getCurrentRoutePath();
      const divisionRoute = /^\/(?:sws|u1|it|travels|mart)$/.test(route);
      if (isHardReloadNavigation()) {
        void loadRouteData(route, true).catch((error: unknown) => {
          console.error('[FirestoreDataContext] Route refresh failed:', error);
        });
      } else if (route === '/' || route === '/divisions' || divisionRoute) {
        void refreshAll(true);
      } else {
        void loadRouteData(route).catch((error: unknown) => {
          console.error('[FirestoreDataContext] Initial route data load failed:', error);
        });
      }
    }
  }, [hasCachedData, products, services, divisions, homepageConfig, refreshAll, loadRouteData]);

  const activeDivisions = useMemo(() => {
    return divisions.filter((d) => d.status === 'active');
  }, [divisions]);

  const updateSiteSettings = useCallback(async (data: Partial<FirestoreSiteSettings>) => {
    await firestoreSettingsService.updateSiteSettings(data);
    setSiteSettings((prev) => {
      const merged = { ...prev, ...data };
      try {
        setDeviceCacheItem('mahdev_cached_site_settings', JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, []);

  const updateCompanySettings = useCallback(async (data: Partial<FirestoreCompanySettings>) => {
    await firestoreSettingsService.updateCompanySettings(data);
    setCompanySettings((prev) => {
      const merged = { ...prev, ...data };
      try {
        setDeviceCacheItem('mahdev_cached_company_settings', JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, []);

  const updateHomepageConfig = useCallback(async (data: Partial<HomepageCmsConfig>) => {
    await firestoreSettingsService.updateHomepageSettings(data);
    setHomepageConfig((prev) => {
      const merged = {
        ...prev,
        ...data,
        hero: { ...prev.hero, ...data.hero },
        intro: { ...prev.intro, ...data.intro },
        featuredServices: { ...prev.featuredServices, ...data.featuredServices },
        featuredProducts: { ...prev.featuredProducts, ...data.featuredProducts },
        portfolio: { ...prev.portfolio, ...data.portfolio },
        milestones: { ...prev.milestones, ...data.milestones },
        companies: { ...prev.companies, ...data.companies },
        testimonials: { ...prev.testimonials, ...data.testimonials },
        ctaSection: { ...prev.ctaSection, ...data.ctaSection },
        seo: { ...prev.seo, ...data.seo },
        whyMahdev: { ...prev.whyMahdev, ...data.whyMahdev },
        leadership: { ...prev.leadership, ...data.leadership },
      } as HomepageCmsConfig;
      return merged;
    });
    try {
      const merged = { ...(homepageConfig || {}), ...data } as HomepageCmsConfig;
      setDeviceCacheItem('mahdev_cached_homepage_config', JSON.stringify(merged));
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => cmsService.syncHomepageConfig(merged));
      } else {
        setTimeout(() => cmsService.syncHomepageConfig(merged), 0);
      }
    } catch {}
  }, [homepageConfig]);

  const updateGoogleReviewsConfig = useCallback(async (data: Partial<GoogleReviewsConfig>) => {
    await firestoreGoogleReviewsService.saveConfig(data);
    setGoogleReviewsConfig((prev) => ({ ...prev, ...data }));
  }, []);

  const syncGoogleReviews = useCallback(async () => {
    const res = await firestoreGoogleReviewsService.syncGoogleReviews();
    if (res.success) {
      const updatedReviews = await firestoreGoogleReviewsService.getReviews();
      setGoogleReviews(updatedReviews);
      const updatedConfig = await firestoreGoogleReviewsService.getConfig(true);
      setGoogleReviewsConfig(updatedConfig);
    }
    return res;
  }, []);

  const reorderDivisions = useCallback(async (orderedIds: string[]) => {
    await firestoreDivisionsService.reorderDivisions(orderedIds);
    await cmsService.reorderDivisions(orderedIds);
    const fresh = await firestoreDivisionsService.getDivisions(true);
    setDivisions(fresh);
  }, []);

  const updateDivisionOrder = useCallback(async (id: string, order: number) => {
    await firestoreDivisionsService.updateDivisionOrder(id, order);
    const fresh = await firestoreDivisionsService.getDivisions(true);
    setDivisions(fresh);
  }, []);

  const saveDivision = useCallback(async (id: string, data: Partial<FirestoreDivision>) => {
    await firestoreDivisionsService.saveDivision(id, data);
    const { canonicalDocId, shortId } = normalizeDivisionId(id);

    // Make sure we operate on a complete list of divisions
    const current = divisionsRef.current || [];

    let found = false;
    const effectiveLogo = data.logoUrl || (data as any).logo || '';
    const effectiveImg = (data as any).defaultImageUrl || (data as any).fallbackImageUrl || data.heroImageUrl || data.imageUrl || '';

    const updated = current.map((d) => {
      const dCanonical = normalizeDivisionId(d.id || d.slug || '').shortId;
      if (d.id === id || d.id === canonicalDocId || d.slug === id || d.slug === canonicalDocId || dCanonical === shortId) {
        found = true;
        return {
          ...d,
          ...data,
          id: d.id || canonicalDocId,
          slug: d.slug || shortId,
          logoUrl: effectiveLogo || d.logoUrl || (d as any).logo || '',
          logo: effectiveLogo || d.logoUrl || (d as any).logo || '',
          defaultImageUrl: effectiveImg || d.defaultImageUrl || d.heroImageUrl || d.imageUrl || '',
          fallbackImageUrl: effectiveImg || (d as any).fallbackImageUrl || d.defaultImageUrl || d.heroImageUrl || '',
          heroImageUrl: effectiveImg || d.heroImageUrl || d.defaultImageUrl || d.imageUrl || '',
          imageUrl: effectiveImg || d.imageUrl || d.heroImageUrl || d.defaultImageUrl || '',
        };
      }
      return d;
    });

    if (!found) {
      updated.push({
        id: canonicalDocId,
        slug: shortId,
        divisionKey: shortId,
        name: data.name || shortId,
        shortName: data.shortName || data.name || shortId,
        description: data.description || '',
        tagline: data.tagline || '',
        badge: data.badge || '',
        route: data.route || `/${shortId}`,
        logoUrl: effectiveLogo,
        logo: effectiveLogo,
        defaultImageUrl: effectiveImg,
        fallbackImageUrl: effectiveImg,
        heroImageUrl: effectiveImg,
        imageUrl: effectiveImg,
        order: typeof data.order === 'number' ? data.order : updated.length + 1,
        ...data,
      } as FirestoreDivision);
    }

    const finalSorted = sortDivisions(updated);
    divisionsRef.current = finalSorted;
    setDivisions(finalSorted);

    try {
      setDeviceCacheItem('mahdev_cached_divisions', JSON.stringify(finalSorted));
    } catch {}

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        cmsService.syncEntityFromFirestore('divisions', finalSorted);
      });
    } else {
      setTimeout(() => {
        cmsService.syncEntityFromFirestore('divisions', finalSorted);
      }, 0);
    }
  }, []);

  const value = useMemo<FirestoreDataContextValue>(
    () => ({
      isInitialLoading,
      isReady,
      isFetching,
      isDivisionsLoading,
      isMilestonesLoading,
      isServicesLoading,
      isGalleryLoading,
      isProductsLoading,
      isPortfolioLoading,
      isTestimonialsLoading,
      isCompaniesLoading,
      isHomepageConfigLoading,
      isSettingsLoading,
      syncProgress,
      syncStatus,
      error,
      companySettings,
      siteSettings,
      homepageConfig,
      divisions,
      activeDivisions,
      categories,
      services,
      products,
      milestones,
      trustedCompanies,
      testimonials,
      googleReviews,
      googleReviewsConfig,
      portfolio,
      gallery,
      mediaAssets,
      refreshAll,
      updateSiteSettings,
      updateCompanySettings,
      updateHomepageConfig,
      updateGoogleReviewsConfig,
      syncGoogleReviews,
      reorderDivisions,
      updateDivisionOrder,
      saveDivision,
      loadedDivisions,
      loadedServices,
      loadedGallery,
      fetchingDivisions,
      isDivisionLoaded,
      isDivisionServicesLoaded,
      isDivisionGalleryLoaded,
      isDivisionFetching,
      loadDivisionData,
      loadRouteData,
      loadMediaAssets,
      isLiveHydrated,
    }),
    [
      isInitialLoading,
      isReady,
      isFetching,
      isDivisionsLoading,
      isMilestonesLoading,
      isServicesLoading,
      isGalleryLoading,
      isProductsLoading,
      isPortfolioLoading,
      isTestimonialsLoading,
      isCompaniesLoading,
      isHomepageConfigLoading,
      isSettingsLoading,
      syncProgress,
      syncStatus,
      error,
      companySettings,
      siteSettings,
      homepageConfig,
      divisions,
      activeDivisions,
      categories,
      services,
      products,
      milestones,
      trustedCompanies,
      testimonials,
      googleReviews,
      googleReviewsConfig,
      portfolio,
      gallery,
      mediaAssets,
      refreshAll,
      updateSiteSettings,
      updateCompanySettings,
      updateHomepageConfig,
      updateGoogleReviewsConfig,
      syncGoogleReviews,
      reorderDivisions,
      updateDivisionOrder,
      saveDivision,
      loadedDivisions,
      loadedServices,
      loadedGallery,
      fetchingDivisions,
      isDivisionLoaded,
      isDivisionServicesLoaded,
      isDivisionGalleryLoaded,
      isDivisionFetching,
      loadDivisionData,
      loadRouteData,
      loadMediaAssets,
      isLiveHydrated,
    ]
  );

  return <FirestoreDataContext.Provider value={value}>{children}</FirestoreDataContext.Provider>;
};

export const useFirestoreDataContext = (): FirestoreDataContextValue => {
  const context = useContext(FirestoreDataContext);
  if (!context) {
    throw new Error('useFirestoreDataContext must be used within a FirestoreDataProvider');
  }
  return context;
};

// Aliases for convenience
export const useAppFirestore = useFirestoreDataContext;

// ==========================================
// MODULAR DOMAIN-SPECIFIC HOOKS (PHASE 49)
// ==========================================

export function useSiteSettings() {
  const { siteSettings, updateSiteSettings, companySettings, updateCompanySettings, isInitialLoading, isReady } = useFirestoreDataContext();
  return {
    siteSettings,
    updateSiteSettings,
    companySettings,
    updateCompanySettings,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useMaintenanceMode() {
  const { siteSettings, updateSiteSettings, companySettings, isInitialLoading, isReady } = useFirestoreDataContext();
  const isMaintenanceActive = Boolean(
    siteSettings.maintenance?.enabled ??
    siteSettings.maintenanceMode ??
    siteSettings.enableMaintenanceMode
  );

  const maintenanceData = useMemo(() => {
    return {
      enabled: isMaintenanceActive,
      title: siteSettings.maintenance?.title || 'Systems Upgrade in Progress',
      message:
        siteSettings.maintenance?.message ||
        'Our digital platforms, client portals, and division infrastructure are undergoing planned architectural maintenance to ensure maximum reliability, security, and performance.',
      imageUrl: siteSettings.maintenance?.imageUrl || '',
      estimatedReturn: siteSettings.maintenance?.estimatedReturn || 'Within 2 hours',
      contactPhone: siteSettings.maintenance?.contactPhone || companySettings.primaryPhone || '075 092 8078',
      contactEmail: siteSettings.maintenance?.contactEmail || companySettings.email || 'info@mahdev.lk',
      allowedRoles: siteSettings.maintenance?.allowedRoles || ['admin', 'superAdmin'],
      lastActivatedAt: siteSettings.maintenance?.lastActivatedAt,
      lastDeactivatedAt: siteSettings.maintenance?.lastDeactivatedAt,
    };
  }, [siteSettings.maintenance, isMaintenanceActive, companySettings]);

  const toggleMaintenance = useCallback(
    async (enable?: boolean) => {
      const targetState = typeof enable === 'boolean' ? enable : !isMaintenanceActive;
      const now = new Date().toISOString();
      await updateSiteSettings({
        maintenanceMode: targetState,
        enableMaintenanceMode: targetState,
        maintenance: {
          ...maintenanceData,
          enabled: targetState,
          ...(targetState ? { lastActivatedAt: now } : { lastDeactivatedAt: now }),
        },
      });
    },
    [isMaintenanceActive, maintenanceData, updateSiteSettings]
  );

  const saveMaintenanceConfig = useCallback(
    async (config: Partial<typeof maintenanceData>) => {
      const merged = {
        ...maintenanceData,
        ...config,
      };
      await updateSiteSettings({
        maintenanceMode: merged.enabled,
        enableMaintenanceMode: merged.enabled,
        maintenance: merged,
      });
    },
    [maintenanceData, updateSiteSettings]
  );

  return {
    isMaintenanceActive,
    maintenance: maintenanceData,
    toggleMaintenance,
    saveMaintenanceConfig,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useCompanySettings() {
  const { companySettings, updateCompanySettings, isInitialLoading, isReady } = useFirestoreDataContext();
  return {
    companySettings,
    updateCompanySettings,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useHomepageConfig() {
  const { homepageConfig, updateHomepageConfig, isInitialLoading, isReady } = useFirestoreDataContext();
  return {
    homepageConfig,
    updateHomepageConfig,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useDivisions() {
  const { divisions, activeDivisions, isInitialLoading, isReady } = useFirestoreDataContext();
  const getDivisionById = useCallback(
    (id: string | DivisionId) => {
      const cleanId = String(id).replace('div-', '');
      const canonical = getCanonicalDivisionId(cleanId);
      return divisions.find(
        (d) =>
          d.id === id ||
          d.id === canonical ||
          d.id === `div-${cleanId}` ||
          d.id === cleanId ||
          d.slug === id ||
          d.slug === canonical
      );
    },
    [divisions]
  );
  return {
    divisions,
    activeDivisions,
    getDivisionById,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useDivision(divisionId: DivisionId | string) {
  const { divisions } = useFirestoreDataContext();
  return useMemo(() => {
    const cleanId = String(divisionId).replace('div-', '');
    const canonical = getCanonicalDivisionId(cleanId);
    return (
      divisions.find(
        (d) =>
          d.id === divisionId ||
          d.id === canonical ||
          d.id === `div-${cleanId}` ||
          d.id === cleanId ||
          d.slug === divisionId ||
          d.slug === canonical
      ) || null
    );
  }, [divisions, divisionId]);
}

export function useServices(divisionId?: DivisionId) {
  const { services, isInitialLoading, isReady } = useFirestoreDataContext();
  const filtered = useMemo(() => {
    if (!divisionId) return services;
    return services.filter((s) => s.division === divisionId);
  }, [services, divisionId]);

  const getServiceById = useCallback(
    (id: string) => services.find((s) => s.id === id),
    [services]
  );

  return {
    services: filtered,
    allServices: services,
    getServiceById,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useService(serviceId: string) {
  const { services } = useFirestoreDataContext();
  return useMemo(() => services.find((s) => s.id === serviceId) || null, [services, serviceId]);
}

export function useProducts(divisionId?: DivisionId) {
  const { products, isInitialLoading, isReady } = useFirestoreDataContext();
  const filtered = useMemo(() => {
    if (!divisionId) return products;
    return products.filter((p) => p.division === divisionId);
  }, [products, divisionId]);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  return {
    products: filtered,
    allProducts: products,
    getProductById,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useProduct(productId: string) {
  const { products } = useFirestoreDataContext();
  return useMemo(() => products.find((p) => p.id === productId) || null, [products, productId]);
}

export function useCategories(divisionId?: DivisionId) {
  const { categories, isInitialLoading, isReady } = useFirestoreDataContext();
  const filtered = useMemo(() => {
    if (!divisionId) return categories;
    return categories.filter((c) => c.division === divisionId);
  }, [categories, divisionId]);

  return {
    categories: filtered,
    allCategories: categories,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function usePortfolio(divisionId?: DivisionId) {
  const { portfolio, isInitialLoading, isReady } = useFirestoreDataContext();
  const filtered = useMemo(() => {
    if (!divisionId) return portfolio;
    return portfolio.filter((p) => p.division === divisionId);
  }, [portfolio, divisionId]);

  return {
    portfolio: filtered,
    allPortfolio: portfolio,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useGallery(divisionId?: DivisionId) {
  const { gallery, isInitialLoading, isReady } = useFirestoreDataContext();
  const filtered = useMemo(() => {
    if (!divisionId) return gallery;
    return gallery.filter((g) => g.division === divisionId);
  }, [gallery, divisionId]);

  return {
    gallery: filtered,
    allGallery: gallery,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useMilestones() {
  const { milestones, isInitialLoading, isReady } = useFirestoreDataContext();
  return {
    milestones,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useTrustedCompanies() {
  const { trustedCompanies, isInitialLoading, isReady } = useFirestoreDataContext();
  return {
    trustedCompanies,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useTestimonials(divisionId?: DivisionId) {
  const { testimonials, isInitialLoading, isReady } = useFirestoreDataContext();
  const filtered = useMemo(() => {
    if (!divisionId) return testimonials;
    return testimonials.filter((t) => t.division === divisionId);
  }, [testimonials, divisionId]);

  return {
    testimonials: filtered,
    allTestimonials: testimonials,
    isLoading: isInitialLoading,
    isReady,
  };
}

export function useGoogleReviews(divisionId?: DivisionId | 'all') {
  const {
    googleReviews,
    googleReviewsConfig,
    syncGoogleReviews,
    updateGoogleReviewsConfig,
    isInitialLoading,
    isReady,
  } = useFirestoreDataContext();

  // Curated list for public website display
  const publicReviews = useMemo(() => {
    return googleReviews.filter((r) => {
      if (r.isHidden) return false;
      if (googleReviewsConfig.featuredOnly && !r.isFeatured) return false;
      if (googleReviewsConfig.minStarRating && r.rating < googleReviewsConfig.minStarRating) return false;
      if (divisionId && divisionId !== 'all' && r.divisionId !== 'all' && r.divisionId !== divisionId) {
        return false;
      }
      return true;
    });
  }, [googleReviews, googleReviewsConfig, divisionId]);

  return {
    reviews: publicReviews,
    allReviews: googleReviews,
    config: googleReviewsConfig,
    sync: syncGoogleReviews,
    updateConfig: updateGoogleReviewsConfig,
    isLoading: isInitialLoading,
    isReady,
  };
}

// Modular Sub-Providers for composable architecture
export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const DivisionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export function useDivisionHydration(divisionId?: string) {
  const { isDivisionLoaded, loadDivisionData } = useFirestoreDataContext();
  const isLoaded = divisionId ? isDivisionLoaded(divisionId) : true;

  useEffect(() => {
    if (divisionId && !isLoaded) {
      loadDivisionData(divisionId);
    }
  }, [divisionId, isLoaded, loadDivisionData]);

  return { isLoaded };
}
