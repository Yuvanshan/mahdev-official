/**
 * Central Cloud Firestore Data Context & Real-Time Hydration Engine
 * Phase 47: Firestore-First Data Architecture
 * 
 * Rules:
 * 1. Firestore is the single source of truth for all business and dynamic content.
 * 2. No hard-coded business data is rendered while Firestore is hydrating.
 * 3. Realtime subscriptions propagate live Firestore updates instantly across the UI.
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
  getDefaultDivisions,
  sortDivisions,
  getCanonicalDivisionId,
  isSameDivision,
} from '../services/firestore/divisions';
import { firestoreCategoriesService } from '../services/firestore/categories';
import { firestoreServicesService } from '../services/firestore/services';
import { firestoreProductsService } from '../services/firestore/products';
import { firestoreMilestonesService } from '../services/firestore/milestones';
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

export interface FirestoreDataContextValue {
  isInitialLoading: boolean;
  isReady: boolean;
  isFetching: boolean;
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
  refreshAll: () => Promise<void>;
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
  isDivisionLoaded: (divisionId: string) => boolean;
  isDivisionServicesLoaded: (divisionId: string) => boolean;
  isDivisionGalleryLoaded: (divisionId: string) => boolean;
  loadDivisionData: (divisionId: string) => Promise<void>;
  isLiveHydrated: boolean;
}

const FirestoreDataContext = createContext<FirestoreDataContextValue | null>(null);

export const FirestoreDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check if browser already has fully hydrated data from previous visit
  const hasCachedData = (() => {
    try {
      if (typeof window !== 'undefined') {
        const hydrated = localStorage.getItem('mahdev_cache_hydrated');
        const hasDivs = localStorage.getItem('mahdev_cached_divisions');
        return hydrated === 'true' && !!hasDivs;
      }
    } catch {}
    return false;
  })();

  // Show boot loader only on first-ever load; on subsequent visits / refreshes, load instantly from cache
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(!hasCachedData);
  const [isReady, setIsReady] = useState<boolean>(hasCachedData);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(hasCachedData ? 100 : 0);
  const [syncStatus, setSyncStatus] = useState<string>(hasCachedData ? 'Ready' : 'Loading details...');
  const [error, setError] = useState<Error | null>(null);

  const [companySettings, setCompanySettings] = useState<FirestoreCompanySettings>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_company_settings');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return getDefaultCompanySettings();
  });
  const [siteSettings, setSiteSettings] = useState<FirestoreSiteSettings>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_site_settings');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return getDefaultSiteSettings();
  });
  const [homepageConfig, setHomepageConfig] = useState<HomepageCmsConfig>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_homepage_config');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return getDefaultHomepageSettings();
  });
  const [divisions, setDivisions] = useState<FirestoreDivision[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_divisions');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return sortDivisions(parsed);
        }
      }
    } catch {}
    return [];
  });
  const [categories, setCategories] = useState<FirestoreCategory[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_categories');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [services, setServices] = useState<FirestoreService[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_services');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [products, setProducts] = useState<FirestoreProduct[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_products');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [milestones, setMilestones] = useState<FirestoreMilestone[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_milestones');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [trustedCompanies, setTrustedCompanies] = useState<FirestoreTrustedCompany[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_companies');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [testimonials, setTestimonials] = useState<FirestoreTestimonial[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_testimonials');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_google_reviews');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [googleReviewsConfig, setGoogleReviewsConfig] = useState<GoogleReviewsConfig>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_google_reviews_config');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return DEFAULT_GOOGLE_REVIEWS_CONFIG;
  });
  const [portfolio, setPortfolio] = useState<FirestorePortfolio[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_portfolio');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [gallery, setGallery] = useState<FirestoreGallery[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_gallery');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });
  const [mediaAssets, setMediaAssets] = useState<StoredMediaItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_media_assets');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return [];
  });

  const [isLiveHydrated, setIsLiveHydrated] = useState<boolean>(false);

  // Track loaded divisions state for seamless transition & shimmers
  const [loadedDivisions, setLoadedDivisions] = useState<Record<string, boolean>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_loaded_divisions');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return {};
  });

  const [loadedServices, setLoadedServices] = useState<Record<string, boolean>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_loaded_services');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return {};
  });

  const [loadedGallery, setLoadedGallery] = useState<Record<string, boolean>>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('mahdev_cached_loaded_gallery');
        if (cached) return JSON.parse(cached);
      }
    } catch {}
    return {};
  });

  const divisionsRef = React.useRef<FirestoreDivision[]>([]);
  divisionsRef.current = divisions;

  // Individual Division Data Loader: Fetches services first and fast, gallery concurrently, then remaining assets
  const loadDivisionData = useCallback(async (rawDivId: string) => {
    const canonicalId = getCanonicalDivisionId(rawDivId) || rawDivId;
    if (!canonicalId) return;

    // 1. Fetch Services FIRST and fast!
    const fetchServicesPromise = firestoreServicesService
      .getServices(canonicalId as DivisionId, true)
      .then((srvs) => {
        setServices((prev) => {
          const otherServices = prev.filter(
            (s) => !isSameDivision(s.division, canonicalId) && !isSameDivision((s as any).divisionId, canonicalId)
          );
          const merged = [...otherServices, ...srvs];
          try { localStorage.setItem('mahdev_cached_services', JSON.stringify(merged)); } catch {}
          return merged;
        });
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(() => bookingService.syncWithFirestore(srvs));
        } else {
          setTimeout(() => bookingService.syncWithFirestore(srvs), 0);
        }
        setLoadedServices((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { localStorage.setItem('mahdev_cached_loaded_services', JSON.stringify(next)); } catch {}
          return next;
        });
      })
      .catch((err) => {
        console.warn(`[FirestoreDataContext] Services notice for ${rawDivId}:`, err);
        setLoadedServices((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { localStorage.setItem('mahdev_cached_loaded_services', JSON.stringify(next)); } catch {}
          return next;
        });
      });

    // 2. Fetch Gallery in parallel
    const fetchGalleryPromise = firestoreGalleryService
      .getGallery(canonicalId as DivisionId, true)
      .then((gal) => {
        setGallery((prev) => {
          const otherGal = prev.filter(
            (g) => !isSameDivision(g.division, canonicalId) && !isSameDivision((g as any).divisionId, canonicalId)
          );
          const merged = [...otherGal, ...gal];
          try { localStorage.setItem('mahdev_cached_gallery', JSON.stringify(merged)); } catch {}
          return merged;
        });
        setLoadedGallery((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { localStorage.setItem('mahdev_cached_loaded_gallery', JSON.stringify(next)); } catch {}
          return next;
        });
      })
      .catch((err) => {
        console.warn(`[FirestoreDataContext] Gallery notice for ${rawDivId}:`, err);
        setLoadedGallery((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { localStorage.setItem('mahdev_cached_loaded_gallery', JSON.stringify(next)); } catch {}
          return next;
        });
      });

    // 3. Fetch products, categories, portfolio
    const fetchOthersPromise = Promise.all([
      firestoreProductsService.getProducts({ division: canonicalId as DivisionId }, true),
      firestoreCategoriesService.getCategories(canonicalId as DivisionId, true),
      firestorePortfolioService.getPortfolio(canonicalId as DivisionId, true),
    ])
      .then(([prods, cats, port]) => {
        setProducts((prev) => {
          const otherProds = prev.filter(
            (p) => !isSameDivision(p.division, canonicalId) && !isSameDivision((p as any).divisionId, canonicalId)
          );
          const merged = [...otherProds, ...prods];
          try { localStorage.setItem('mahdev_cached_products', JSON.stringify(merged)); } catch {}
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
          const merged = [...otherCats, ...cats];
          try { localStorage.setItem('mahdev_cached_categories', JSON.stringify(merged)); } catch {}
          return merged;
        });

        setPortfolio((prev) => {
          const otherPort = prev.filter(
            (p) => !isSameDivision(p.division, canonicalId) && !isSameDivision((p as any).divisionId, canonicalId)
          );
          const merged = [...otherPort, ...port];
          try { localStorage.setItem('mahdev_cached_portfolio', JSON.stringify(merged)); } catch {}
          return merged;
        });
        setLoadedDivisions((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { localStorage.setItem('mahdev_cached_loaded_divisions', JSON.stringify(next)); } catch {}
          return next;
        });
      })
      .catch((err) => {
        console.warn(`[FirestoreDataContext] Other items notice for ${rawDivId}:`, err);
        setLoadedDivisions((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { localStorage.setItem('mahdev_cached_loaded_divisions', JSON.stringify(next)); } catch {}
          return next;
        });
      });

    await Promise.allSettled([fetchServicesPromise, fetchGalleryPromise, fetchOthersPromise]);
  }, []);

  const isDivisionLoaded = useCallback(
    (divisionId: string) => {
      if (!divisionId) return true;
      const canonicalId = getCanonicalDivisionId(divisionId) || divisionId;
      return Boolean(loadedDivisions[canonicalId] || loadedDivisions[divisionId]);
    },
    [loadedDivisions]
  );

  const isDivisionServicesLoaded = useCallback(
    (divisionId: string) => {
      if (!divisionId) return true;
      const canonicalId = getCanonicalDivisionId(divisionId) || divisionId;
      return Boolean(loadedServices[canonicalId] || loadedServices[divisionId]);
    },
    [loadedServices]
  );

  const isDivisionGalleryLoaded = useCallback(
    (divisionId: string) => {
      if (!divisionId) return true;
      const canonicalId = getCanonicalDivisionId(divisionId) || divisionId;
      return Boolean(loadedGallery[canonicalId] || loadedGallery[divisionId]);
    },
    [loadedGallery]
  );

  // Ultra-Fast Parallel Hydration: Loads 100% of real Firestore collections simultaneously in ~1s
  const refreshAll = useCallback(async () => {
    setIsFetching(true);
    try {
      setError(null);
      setSyncProgress(30);
      setSyncStatus('Synchronizing...');

      const [
        company,
        site,
        home,
        divs,
        allServices,
        allGallery,
        allCategories,
        allProducts,
        allPortfolio,
        allMilestones,
        allPartners,
        allReviews,
        gConfig,
        gReviews,
        allMediaAssets,
      ] = await Promise.all([
        firestoreSettingsService.getCompanySettings(true).catch(() => getDefaultCompanySettings()),
        firestoreSettingsService.getSiteSettings(true).catch(() => getDefaultSiteSettings()),
        firestoreSettingsService.getHomepageSettings(true).catch(() => getDefaultHomepageSettings()),
        firestoreDivisionsService.getDivisions(true).catch(() => []),
        firestoreServicesService.getServices(undefined, true).catch(() => []),
        firestoreGalleryService.getGallery(undefined, true).catch(() => []),
        firestoreCategoriesService.getCategories(undefined, true).catch(() => []),
        firestoreProductsService.getProducts({}, true).catch(() => []),
        firestorePortfolioService.getPortfolio(undefined, true).catch(() => []),
        firestoreMilestonesService.getMilestones(true).catch(() => []),
        firestoreTrustedCompaniesService.getTrustedCompanies(true).catch(() => []),
        firestoreTestimonialsService.getTestimonials(undefined, true).catch(() => []),
        firestoreGoogleReviewsService.getConfig(true).catch(() => null),
        firestoreGoogleReviewsService.getReviews().catch(() => []),
        mediaService.getMediaAssets().catch(() => []),
      ]);

      setSyncProgress(75);

      // 1. Settings
      const resolvedLogo = company.logoUrl || '';
      const resolvedDark = company.darkLogoUrl || '';
      const finalCompany = { ...company, logoUrl: resolvedLogo, darkLogoUrl: resolvedDark };
      setCompanySettings(finalCompany);
      try { localStorage.setItem('mahdev_cached_company_settings', JSON.stringify(finalCompany)); } catch {}

      const siteLogo = site.logoUrl || '';
      const siteDark = site.darkLogoUrl || '';
      const finalSite = { ...site, logoUrl: siteLogo, darkLogoUrl: siteDark };
      setSiteSettings(finalSite);
      try { localStorage.setItem('mahdev_cached_site_settings', JSON.stringify(finalSite)); } catch {}

      setHomepageConfig(home);
      cmsService.syncHomepageConfig(home);
      try { localStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(home)); } catch {}

      // 2. Divisions
      const sortedDivs = sortDivisions(divs);
      divisionsRef.current = sortedDivs;
      setDivisions(sortedDivs);
      cmsService.syncEntityFromFirestore('divisions', sortedDivs);
      try { localStorage.setItem('mahdev_cached_divisions', JSON.stringify(sortedDivs)); } catch {}

      // 3. Real Services (Only what was added in Admin Portal)
      setServices(allServices);
      bookingService.syncWithFirestore(allServices);
      cmsService.syncEntityFromFirestore('services', allServices);
      try { localStorage.setItem('mahdev_cached_services', JSON.stringify(allServices)); } catch {}

      // 4. Real Gallery (Only what was added in Admin Portal)
      setGallery(allGallery);
      cmsService.syncEntityFromFirestore('gallery', allGallery);
      try { localStorage.setItem('mahdev_cached_gallery', JSON.stringify(allGallery)); } catch {}

      // 5. Real Categories & Products
      setCategories(allCategories);
      cmsService.syncEntityFromFirestore('categories', allCategories);
      try { localStorage.setItem('mahdev_cached_categories', JSON.stringify(allCategories)); } catch {}

      setProducts(allProducts);
      catalogService.syncWithFirestore(allProducts, allCategories);
      cmsService.syncEntityFromFirestore('products', allProducts);
      try { localStorage.setItem('mahdev_cached_products', JSON.stringify(allProducts)); } catch {}

      // 6. Real Portfolio & Media Assets
      setPortfolio(allPortfolio);
      cmsService.syncEntityFromFirestore('portfolio', allPortfolio);
      try { localStorage.setItem('mahdev_cached_portfolio', JSON.stringify(allPortfolio)); } catch {}

      setMediaAssets(allMediaAssets);
      try { localStorage.setItem('mahdev_cached_media_assets', JSON.stringify(allMediaAssets)); } catch {}

      // 7. Milestones, Partners, Reviews
      setMilestones(allMilestones);
      cmsService.syncEntityFromFirestore('milestones', allMilestones);
      try { localStorage.setItem('mahdev_cached_milestones', JSON.stringify(allMilestones)); } catch {}

      setTrustedCompanies(allPartners);
      cmsService.syncEntityFromFirestore('companies', allPartners);
      try { localStorage.setItem('mahdev_cached_companies', JSON.stringify(allPartners)); } catch {}

      setTestimonials(allReviews);
      cmsService.syncEntityFromFirestore('testimonials', allReviews);
      try { localStorage.setItem('mahdev_cached_testimonials', JSON.stringify(allReviews)); } catch {}

      if (gConfig) {
        setGoogleReviewsConfig(gConfig);
        try { localStorage.setItem('mahdev_cached_google_reviews_config', JSON.stringify(gConfig)); } catch {}
      }
      setGoogleReviews(gReviews);
      try { localStorage.setItem('mahdev_cached_google_reviews', JSON.stringify(gReviews)); } catch {}

      // Mark all canonical division segments loaded instantly
      const allLoadedFlags: Record<string, boolean> = {
        sws: true,
        'sws-event-management': true,
        u1: true,
        'u1-studio': true,
        it: true,
        'it-solutions': true,
        travels: true,
        'mahdev-travels': true,
        mart: true,
        'online-mart': true,
      };
      setLoadedDivisions(allLoadedFlags);
      setLoadedServices(allLoadedFlags);
      setLoadedGallery(allLoadedFlags);
      try {
        localStorage.setItem('mahdev_cached_loaded_divisions', JSON.stringify(allLoadedFlags));
        localStorage.setItem('mahdev_cached_loaded_services', JSON.stringify(allLoadedFlags));
        localStorage.setItem('mahdev_cached_loaded_gallery', JSON.stringify(allLoadedFlags));
      } catch {}

      setSyncProgress(100);
      setSyncStatus('Welcome');
      setIsLiveHydrated(true);
      setIsInitialLoading(false);
      setIsReady(true);
      try {
        localStorage.setItem('mahdev_cache_hydrated', 'true');
        localStorage.setItem('mahdev_cache_timestamp', String(Date.now()));
      } catch {}
    } catch (err) {
      console.error('[FirestoreDataContext] Refresh error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLiveHydrated(true);
      setIsInitialLoading(false);
      setIsReady(true);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // If cached data is available, instantly synchronize catalog & booking services from cache
    if (hasCachedData) {
      if (products.length > 0) catalogService.syncWithFirestore(products);
      if (services.length > 0) bookingService.syncWithFirestore(services);
      if (divisions.length > 0) cmsService.syncEntityFromFirestore('divisions', divisions);
      if (homepageConfig) cmsService.syncHomepageConfig(homepageConfig);
    }

    const markReady = () => {
      if (isMounted) {
        setSyncProgress(100);
        setSyncStatus('Welcome');
        setIsLiveHydrated(true);
        setIsInitialLoading(false);
        setIsReady(true);
        try {
          localStorage.setItem('mahdev_cache_hydrated', 'true');
        } catch {}
      }
    };

    // Initial fetch: if not cached, wait until 100% of Firestore data is synchronized before dismissing loader.
    // If already cached, run silently in background without blocking the user!
    refreshAll()
      .then(() => {
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) {
              markReady();
            }
          }, 120);
        }
      })
      .catch((err) => {
        console.warn('[FirestoreDataContext] Initial hydration warning:', err);
        if (isMounted) {
          markReady();
        }
      });

    // Emergency fail-safe timeout only in case network drops completely
    const failsafeTimer = setTimeout(() => {
      markReady();
    }, 25000);

    // 1. Core Realtime Centralized Listeners (Single Source of Truth, zero duplicate listeners)
    const unsubCompany = firestoreSettingsService.subscribeCompanySettings((data) => {
      if (isMounted) {
        setCompanySettings((prev) => {
          const logo = data.logoUrl !== undefined ? (data.logoUrl || prev.logoUrl) : prev.logoUrl;
          const darkLogo = data.darkLogoUrl !== undefined ? (data.darkLogoUrl || prev.darkLogoUrl) : prev.darkLogoUrl;
          const merged = {
            ...prev,
            ...data,
            logoUrl: logo,
            darkLogoUrl: darkLogo,
          };
          try {
            localStorage.setItem('mahdev_cached_company_settings', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });

    const unsubSite = firestoreSettingsService.subscribeSiteSettings((data) => {
      if (isMounted) {
        setSiteSettings((prev) => {
          const logo = data.logoUrl !== undefined ? (data.logoUrl || prev.logoUrl) : prev.logoUrl;
          const darkLogo = data.darkLogoUrl !== undefined ? (data.darkLogoUrl || prev.darkLogoUrl) : prev.darkLogoUrl;
          const merged = {
            ...prev,
            ...data,
            logoUrl: logo,
            darkLogoUrl: darkLogo,
          };
          try {
            localStorage.setItem('mahdev_cached_site_settings', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });

    const unsubHome = firestoreSettingsService.subscribeHomepageSettings((data) => {
      if (isMounted) {
        setHomepageConfig(data);
        try {
          localStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(data));
        } catch {}
        cmsService.syncHomepageConfig(data);
      }
    });

    const unsubDivs = firestoreDivisionsService.subscribeDivisions((data) => {
      if (isMounted) {
        const sorted = sortDivisions(data);
        setDivisions(sorted);
        try {
          localStorage.setItem('mahdev_cached_divisions', JSON.stringify(sorted));
        } catch {}
        cmsService.syncEntityFromFirestore('divisions', sorted);
      }
    });

    const unsubCats = firestoreCategoriesService.subscribeCategories((data) => {
      if (isMounted) {
        setCategories(data);
        cmsService.syncEntityFromFirestore('categories', data);
      }
    });

    const unsubSrvs = firestoreServicesService.subscribeServices((data) => {
      if (isMounted) {
        setServices(data);
        bookingService.syncWithFirestore(data);
        cmsService.syncEntityFromFirestore('services', data);
      }
    });

    const unsubProds = firestoreProductsService.subscribeProducts((data) => {
      if (isMounted) {
        setProducts(data);
        catalogService.syncWithFirestore(data, categories);
        cmsService.syncEntityFromFirestore('products', data);
      }
    });

    // 2. Secondary Collections (Streamlined Snapshot Listeners)
    const unsubMs = firestoreMilestonesService.subscribeMilestones((data) => {
      if (isMounted) {
        setMilestones(data);
        cmsService.syncEntityFromFirestore('milestones', data);
      }
    });

    const unsubPartners = firestoreTrustedCompaniesService.subscribeTrustedCompanies((data) => {
      if (isMounted) {
        setTrustedCompanies(data);
        cmsService.syncEntityFromFirestore('companies', data);
      }
    });

    const unsubReviews = firestoreTestimonialsService.subscribeTestimonials((data) => {
      if (isMounted) {
        setTestimonials(data);
        cmsService.syncEntityFromFirestore('testimonials', data);
      }
    });

    const unsubGoogleConfig = firestoreGoogleReviewsService.subscribeConfig((data) => {
      if (isMounted) setGoogleReviewsConfig(data);
    });

    const unsubGoogleReviews = firestoreGoogleReviewsService.subscribeReviews((data) => {
      if (isMounted) setGoogleReviews(data);
    });

    const unsubPort = firestorePortfolioService.subscribePortfolio((data) => {
      if (isMounted) {
        setPortfolio(data);
        cmsService.syncEntityFromFirestore('portfolio', data);
      }
    });

    const unsubGal = firestoreGalleryService.subscribeGallery(undefined, (data) => {
      if (isMounted) {
        setGallery(data);
        cmsService.syncEntityFromFirestore('gallery', data);
      }
    });

    const unsubMedia = mediaService.subscribeToMediaAssets((data) => {
      if (isMounted) {
        setMediaAssets(data);
        try {
          localStorage.setItem('mahdev_cached_media_assets', JSON.stringify(data));
        } catch {}
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(failsafeTimer);
      unsubCompany();
      unsubSite();
      unsubHome();
      unsubDivs();
      unsubCats();
      unsubSrvs();
      unsubProds();
      unsubMs();
      unsubPartners();
      unsubReviews();
      unsubGoogleConfig();
      unsubGoogleReviews();
      unsubPort();
      unsubGal();
      unsubMedia();
    };
  }, []);

  const activeDivisions = useMemo(() => {
    return divisions.filter((d) => d.status === 'active');
  }, [divisions]);

  const updateSiteSettings = useCallback(async (data: Partial<FirestoreSiteSettings>) => {
    await firestoreSettingsService.updateSiteSettings(data);
    setSiteSettings((prev) => {
      const merged = { ...prev, ...data };
      try {
        localStorage.setItem('mahdev_cached_site_settings', JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, []);

  const updateCompanySettings = useCallback(async (data: Partial<FirestoreCompanySettings>) => {
    await firestoreSettingsService.updateCompanySettings(data);
    setCompanySettings((prev) => {
      const merged = { ...prev, ...data };
      try {
        localStorage.setItem('mahdev_cached_company_settings', JSON.stringify(merged));
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
      localStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(merged));
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
    const canonicalId =
      id === 'u1' || id === 'u1-studio'
        ? 'u1-studio'
        : id === 'it' || id === 'it-solutions'
        ? 'it-solutions'
        : id === 'mart' || id === 'online-mart'
        ? 'online-mart'
        : id === 'sws' || id === 'sws-event-management'
        ? 'sws'
        : id === 'travels' || id === 'mahdev-travels'
        ? 'travels'
        : id;

    const current = divisionsRef.current || [];
    const updated = current.map((d) => {
      const dCanonical =
        d.id === 'u1' || d.id === 'u1-studio'
          ? 'u1-studio'
          : d.id === 'it' || d.id === 'it-solutions'
          ? 'it-solutions'
          : d.id === 'mart' || d.id === 'online-mart'
          ? 'online-mart'
          : d.id === 'sws' || d.id === 'sws-event-management'
          ? 'sws'
          : d.id === 'travels' || d.id === 'mahdev-travels'
          ? 'travels'
          : d.id;

      if (d.id === id || d.id === canonicalId || d.slug === id || d.slug === canonicalId || dCanonical === canonicalId) {
        return { ...d, ...data, id: d.id };
      }
      return d;
    });

    divisionsRef.current = updated;
    setDivisions(updated);

    try {
      localStorage.setItem('mahdev_cached_divisions', JSON.stringify(updated));
    } catch {}

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        cmsService.syncEntityFromFirestore('divisions', updated);
      });
    } else {
      setTimeout(() => {
        cmsService.syncEntityFromFirestore('divisions', updated);
      }, 0);
    }
  }, []);

  const value = useMemo<FirestoreDataContextValue>(
    () => ({
      isInitialLoading,
      isReady,
      isFetching,
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
      isDivisionLoaded,
      isDivisionServicesLoaded,
      isDivisionGalleryLoaded,
      loadDivisionData,
      isLiveHydrated,
    }),
    [
      isInitialLoading,
      isReady,
      isFetching,
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
      isDivisionLoaded,
      isDivisionServicesLoaded,
      isDivisionGalleryLoaded,
      loadDivisionData,
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


