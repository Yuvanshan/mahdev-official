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
  normalizeDivisionId,
  getCanonicalDivisionId,
  isSameDivision,
} from '../services/firestore/divisions';
import { firestoreCategoriesService } from '../services/firestore/categories';
import { firestoreServicesService, getDefaultServices } from '../services/firestore/services';
import { firestoreProductsService } from '../services/firestore/products';
import { firestoreMilestonesService, DEFAULT_OFFICIAL_MILESTONES } from '../services/firestore/milestones';
import { firestoreTrustedCompaniesService } from '../services/firestore/trustedCompanies';
import { firestoreTestimonialsService } from '../services/firestore/testimonials';
import { firestoreGoogleReviewsService, DEFAULT_GOOGLE_REVIEWS_CONFIG } from '../services/firestore/googleReviews';
import { GoogleReview, GoogleReviewsConfig } from '../types/googleReviews';
import { firestorePortfolioService } from '../services/firestore/portfolio';
import { firestoreGalleryService, getDefaultGallery } from '../services/firestore/gallery';
import { cmsService } from '../services/cmsService';
import { catalogService } from '../services/catalogService';
import { bookingService } from '../services/bookingService';
import { resolveMediaUrl, preloadVideo } from '../services/firestoreMediaService';
import { mediaService, StoredMediaItem } from '../services/firestore/media';

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
  fetchingDivisions: Record<string, boolean>;
  isDivisionLoaded: (divisionId: string) => boolean;
  isDivisionServicesLoaded: (divisionId: string) => boolean;
  isDivisionGalleryLoaded: (divisionId: string) => boolean;
  isDivisionFetching: (divisionId: string) => boolean;
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

  // Check per-entity cache status
  const getCache = (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key);
        if (item) return JSON.parse(item);
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
  const [isDivisionsLoading, setIsDivisionsLoading] = useState<boolean>(false);
  const [isMilestonesLoading, setIsMilestonesLoading] = useState<boolean>(false);
  const [isServicesLoading, setIsServicesLoading] = useState<boolean>(false);
  const [isGalleryLoading, setIsGalleryLoading] = useState<boolean>(false);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(!cachedProds || !Array.isArray(cachedProds) || cachedProds.length === 0);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState<boolean>(!cachedPort || !Array.isArray(cachedPort) || cachedPort.length === 0);
  const [isTestimonialsLoading, setIsTestimonialsLoading] = useState<boolean>(!cachedTestis || !Array.isArray(cachedTestis) || cachedTestis.length === 0);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState<boolean>(!cachedComps || !Array.isArray(cachedComps) || cachedComps.length === 0);
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
    if (Array.isArray(cachedDivs) && cachedDivs.length > 0) {
      return sortDivisions(cachedDivs);
    }
    return sortDivisions(getDefaultDivisions());
  });
  const [categories, setCategories] = useState<FirestoreCategory[]>(() => {
    return Array.isArray(cachedCats) ? cachedCats : [];
  });
  const [services, setServices] = useState<FirestoreService[]>(() => {
    return Array.isArray(cachedSrvs) && cachedSrvs.length > 0 ? cachedSrvs : getDefaultServices();
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
    return getDefaultGallery();
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

  const [isLiveHydrated, setIsLiveHydrated] = useState<boolean>(true);

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

  // Track active fetching state to prevent premature shimmer disappearance on mobile networks
  const [fetchingDivisions, setFetchingDivisions] = useState<Record<string, boolean>>({});
  const inFlightDivisionLoadsRef = React.useRef<Record<string, Promise<void>>>({});

  const divisionsRef = React.useRef<FirestoreDivision[]>([]);
  divisionsRef.current = divisions;

  // Individual Division Data Loader: Fetches services, gallery, media, products, and categories concurrently.
  // CRITICAL: Holds shimmer in place until 100% of division collections have settled from Firestore!
  const loadDivisionData = useCallback(async (rawDivId: string) => {
    const canonicalId = getCanonicalDivisionId(rawDivId) || rawDivId;
    if (!canonicalId) return;

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
      try {
        // 1. Fetch Services
        const fetchServicesPromise = firestoreServicesService
          .getServices(canonicalId as DivisionId, false)
          .then((srvs) => {
            setServices((prev) => {
              const otherServices = prev.filter(
                (s) => !isSameDivision(s.division, canonicalId) && !isSameDivision((s as any).divisionId, canonicalId)
              );
              const seen = new Set(srvs.map((s) => s.id));
              const merged = [...otherServices.filter((s) => !seen.has(s.id)), ...srvs];
              try { localStorage.setItem('mahdev_cached_services', JSON.stringify(merged)); } catch {}
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
          .getGallery(canonicalId as DivisionId, false)
          .then((gal) => {
            setGallery((prev) => {
              const otherGal = prev.filter(
                (g) => !isSameDivision(g.division, canonicalId) && !isSameDivision((g as any).divisionId, canonicalId)
              );
              const seen = new Set(gal.map((g) => g.id));
              const merged = [...otherGal.filter((g) => !seen.has(g.id)), ...gal];
              try { localStorage.setItem('mahdev_cached_gallery', JSON.stringify(merged)); } catch {}
              return merged;
            });
          })
          .catch((err) => {
            console.warn(`[FirestoreDataContext] Gallery notice for ${rawDivId}:`, err);
          });

        // 3. Fetch Media Assets in parallel (critical for U1 Studio visual portfolio & media)
        const fetchMediaPromise = mediaService
          .getMediaAssets(false)
          .then((assets) => {
            setMediaAssets(assets);
            try { localStorage.setItem('mahdev_cached_media_assets', JSON.stringify(assets)); } catch {}
          })
          .catch((err) => {
            console.warn(`[FirestoreDataContext] MediaAssets notice for ${rawDivId}:`, err);
          });

        // 4. Fetch products, categories, portfolio
        const fetchOthersPromise = Promise.all([
          firestoreProductsService.getProducts({ division: canonicalId as DivisionId }, false),
          firestoreCategoriesService.getCategories(canonicalId as DivisionId, false),
          firestorePortfolioService.getPortfolio(canonicalId as DivisionId, false),
        ])
          .then(([prods, cats, port]) => {
            setProducts((prev) => {
              const otherProds = prev.filter(
                (p) => !isSameDivision(p.division, canonicalId) && !isSameDivision((p as any).divisionId, canonicalId)
              );
              const seen = new Set(prods.map((p) => p.id));
              const merged = [...otherProds.filter((p) => !seen.has(p.id)), ...prods];
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
              const seen = new Set(cats.map((c) => c.id));
              const merged = [...otherCats.filter((c) => !seen.has(c.id)), ...cats];
              try { localStorage.setItem('mahdev_cached_categories', JSON.stringify(merged)); } catch {}
              return merged;
            });

            setPortfolio((prev) => {
              const otherPort = prev.filter(
                (p) => !isSameDivision(p.division, canonicalId) && !isSameDivision((p as any).divisionId, canonicalId)
              );
              const seen = new Set(port.map((p) => p.id));
              const merged = [...otherPort.filter((p) => !seen.has(p.id)), ...port];
              try { localStorage.setItem('mahdev_cached_portfolio', JSON.stringify(merged)); } catch {}
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
          fetchMediaPromise,
          fetchOthersPromise,
        ]);
      } finally {
        // ONLY AFTER ALL QUERIES HAVE FULLY SETTLED, TOGGLE FLAGS AND RELEASE SHIMMER
        setLoadedServices((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { localStorage.setItem('mahdev_cached_loaded_services', JSON.stringify(next)); } catch {}
          return next;
        });

        setLoadedGallery((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { localStorage.setItem('mahdev_cached_loaded_gallery', JSON.stringify(next)); } catch {}
          return next;
        });

        setLoadedDivisions((prev) => {
          const next = { ...prev, [canonicalId]: true, [rawDivId]: true };
          try { localStorage.setItem('mahdev_cached_loaded_divisions', JSON.stringify(next)); } catch {}
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
  const refreshAll = useCallback(async (forceRefresh = false) => {
    setIsFetching(true);
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
            try { localStorage.setItem('mahdev_cached_loaded_divisions', JSON.stringify(next)); } catch {}
            return next;
          });
          cmsService.syncEntityFromFirestore('divisions', sortedDivs);
          try { localStorage.setItem('mahdev_cached_divisions', JSON.stringify(sortedDivs)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 8));
        })
        .catch((err) => {
          console.warn('[FirestoreDataContext] Divisions stream notice:', err);
          setIsDivisionsLoading(false);
        });

      // 2. One-by-one API Call: Milestones
      const fetchMilestonesTask = firestoreMilestonesService
        .getMilestones(forceRefresh)
        .then((allMilestones) => {
          setMilestones(allMilestones);
          setIsMilestonesLoading(false);
          cmsService.syncEntityFromFirestore('milestones', allMilestones);
          try { localStorage.setItem('mahdev_cached_milestones', JSON.stringify(allMilestones)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 8));
        })
        .catch((err) => {
          console.warn('[FirestoreDataContext] Milestones stream notice:', err);
          setIsMilestonesLoading(false);
        });

      // 3. One-by-one API Call: Company Settings
      const fetchCompanySettingsTask = firestoreSettingsService
        .getCompanySettings(forceRefresh)
        .then((company) => {
          const finalCompany = { ...company, logoUrl: company.logoUrl || '', darkLogoUrl: company.darkLogoUrl || '' };
          setCompanySettings(finalCompany);
          setIsSettingsLoading(false);
          try { localStorage.setItem('mahdev_cached_company_settings', JSON.stringify(finalCompany)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 5));
        })
        .catch(() => {
          setIsSettingsLoading(false);
        });

      // 4. One-by-one API Call: Site Settings
      const fetchSiteSettingsTask = firestoreSettingsService
        .getSiteSettings(forceRefresh)
        .then((site) => {
          const finalSite = { ...site, logoUrl: site.logoUrl || '', darkLogoUrl: site.darkLogoUrl || '' };
          setSiteSettings(finalSite);
          setIsSettingsLoading(false);
          try { localStorage.setItem('mahdev_cached_site_settings', JSON.stringify(finalSite)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 5));
        })
        .catch(() => {
          setIsSettingsLoading(false);
        });

      // 5. One-by-one API Call: Homepage CMS Config
      const fetchHomepageSettingsTask = firestoreSettingsService
        .getHomepageSettings(forceRefresh)
        .then((home) => {
          setHomepageConfig(home);
          setIsHomepageConfigLoading(false);
          cmsService.syncHomepageConfig(home);
          try { localStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(home)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 6));
        })
        .catch(() => {
          setIsHomepageConfigLoading(false);
        });

      // 6. One-by-one API Call: Services
      const fetchServicesTask = firestoreServicesService
        .getServices(undefined, forceRefresh)
        .then((allServices) => {
          setServices(allServices);
          setIsServicesLoading(false);
          setLoadedServices((prev) => {
            const next = { ...prev };
            allServices.forEach((s) => {
              if (s.division) next[s.division] = true;
              if ((s as any).divisionId) next[(s as any).divisionId] = true;
            });
            try { localStorage.setItem('mahdev_cached_loaded_services', JSON.stringify(next)); } catch {}
            return next;
          });
          bookingService.syncWithFirestore(allServices);
          cmsService.syncEntityFromFirestore('services', allServices);
          try { localStorage.setItem('mahdev_cached_services', JSON.stringify(allServices)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 8));
        })
        .catch(() => {
          setIsServicesLoading(false);
        });

      // 7. One-by-one API Call: Products
      const fetchProductsTask = firestoreProductsService
        .getProducts({}, forceRefresh)
        .then((allProducts) => {
          setProducts(allProducts);
          setIsProductsLoading(false);
          catalogService.syncWithFirestore(allProducts);
          cmsService.syncEntityFromFirestore('products', allProducts);
          try { localStorage.setItem('mahdev_cached_products', JSON.stringify(allProducts)); } catch {}
          setSyncProgress((p) => Math.min(95, p + 6));
        })
        .catch(() => {
          setIsProductsLoading(false);
        });

      // 8. One-by-one API Call: Categories
      const fetchCategoriesTask = firestoreCategoriesService
        .getCategories(undefined, forceRefresh)
        .then((allCategories) => {
          setCategories(allCategories);
          cmsService.syncEntityFromFirestore('categories', allCategories);
          try { localStorage.setItem('mahdev_cached_categories', JSON.stringify(allCategories)); } catch {}
        })
        .catch(() => {});

      // 9. One-by-one API Call: Portfolio
      const fetchPortfolioTask = firestorePortfolioService
        .getPortfolio(undefined, forceRefresh)
        .then((allPortfolio) => {
          setPortfolio(allPortfolio);
          setIsPortfolioLoading(false);
          cmsService.syncEntityFromFirestore('portfolio', allPortfolio);
          try { localStorage.setItem('mahdev_cached_portfolio', JSON.stringify(allPortfolio)); } catch {}
        })
        .catch(() => {
          setIsPortfolioLoading(false);
        });

      // 10. One-by-one API Call: Gallery
      const fetchGalleryTask = firestoreGalleryService
        .getGallery(undefined, forceRefresh)
        .then((allGallery) => {
          setGallery(allGallery);
          setIsGalleryLoading(false);
          setLoadedGallery((prev) => {
            const next = { ...prev };
            allGallery.forEach((g) => {
              if (g.division) next[g.division] = true;
              if ((g as any).divisionId) next[(g as any).divisionId] = true;
            });
            try { localStorage.setItem('mahdev_cached_loaded_gallery', JSON.stringify(next)); } catch {}
            return next;
          });
          cmsService.syncEntityFromFirestore('gallery', allGallery);
          try { localStorage.setItem('mahdev_cached_gallery', JSON.stringify(allGallery)); } catch {}
        })
        .catch(() => {
          setIsGalleryLoading(false);
        });

      // 11. One-by-one API Call: Trusted Corporate Partners
      const fetchTrustedCompaniesTask = firestoreTrustedCompaniesService
        .getTrustedCompanies(forceRefresh)
        .then((allPartners) => {
          setTrustedCompanies(allPartners);
          setIsCompaniesLoading(false);
          cmsService.syncEntityFromFirestore('companies', allPartners);
          try { localStorage.setItem('mahdev_cached_companies', JSON.stringify(allPartners)); } catch {}
        })
        .catch(() => {
          setIsCompaniesLoading(false);
        });

      // 12. One-by-one API Call: Testimonials
      const fetchTestimonialsTask = firestoreTestimonialsService
        .getTestimonials(undefined, forceRefresh)
        .then((allReviews) => {
          setTestimonials(allReviews);
          setIsTestimonialsLoading(false);
          cmsService.syncEntityFromFirestore('testimonials', allReviews);
          try { localStorage.setItem('mahdev_cached_testimonials', JSON.stringify(allReviews)); } catch {}
        })
        .catch(() => {
          setIsTestimonialsLoading(false);
        });

      // 13. One-by-one API Call: Google Reviews & Config
      const fetchGoogleReviewsTask = Promise.all([
        firestoreGoogleReviewsService.getConfig(forceRefresh).catch(() => null),
        firestoreGoogleReviewsService.getReviews().catch(() => []),
      ])
        .then(([gConfig, gReviews]) => {
          if (gConfig) {
            setGoogleReviewsConfig(gConfig);
            try { localStorage.setItem('mahdev_cached_google_reviews_config', JSON.stringify(gConfig)); } catch {}
          }
          setGoogleReviews(gReviews);
          try { localStorage.setItem('mahdev_cached_google_reviews', JSON.stringify(gReviews)); } catch {}
        })
        .catch(() => {});

      // 14. One-by-one API Call: Media Assets
      const fetchMediaAssetsTask = mediaService
        .getMediaAssets()
        .then((allMediaAssets) => {
          setMediaAssets(allMediaAssets);
          try { localStorage.setItem('mahdev_cached_media_assets', JSON.stringify(allMediaAssets)); } catch {}
        })
        .catch(() => {});

      // Await all one-by-one tasks settling to finalize sync flags
      await Promise.allSettled([
        fetchDivisionsTask,
        fetchMilestonesTask,
        fetchCompanySettingsTask,
        fetchSiteSettingsTask,
        fetchHomepageSettingsTask,
        fetchServicesTask,
        fetchProductsTask,
        fetchCategoriesTask,
        fetchPortfolioTask,
        fetchGalleryTask,
        fetchTrustedCompaniesTask,
        fetchTestimonialsTask,
        fetchGoogleReviewsTask,
        fetchMediaAssetsTask,
      ]);

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

    // Immediately mark app shell ready so page structure and per-section shimmers render instantly.
    // Realtime snapshot listeners stream data one-by-one from Firestore (or IndexedDB persistent cache)
    // and dismiss individual section shimmers the millisecond each snapshot arrives.
    markReady();

    // Trigger fresh synchronization across all collections to sync real Firestore data
    refreshAll(false).catch(() => {});

    // Emergency fail-safe timeout only in case network drops completely
    const failsafeTimer = setTimeout(() => {
      markReady();
    }, 15000);

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
        setIsHomepageConfigLoading(false);
        try {
          localStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(data));
        } catch {}
        cmsService.syncHomepageConfig(data);
      }
    });

    const unsubDivs = firestoreDivisionsService.subscribeDivisions((data) => {
      if (isMounted) {
        const sorted = sortDivisions(data);
        divisionsRef.current = sorted;
        setDivisions(sorted);
        setIsDivisionsLoading(false);
        setLoadedDivisions((prev) => {
          const next = { ...prev };
          sorted.forEach((d) => {
            next[d.id] = true;
            if (d.slug) next[d.slug] = true;
          });
          try { localStorage.setItem('mahdev_cached_loaded_divisions', JSON.stringify(next)); } catch {}
          return next;
        });
        try {
          localStorage.setItem('mahdev_cached_divisions', JSON.stringify(sorted));
        } catch {}
        cmsService.syncEntityFromFirestore('divisions', sorted);
      }
    });

    const unsubCats = firestoreCategoriesService.subscribeCategories((data) => {
      if (isMounted) {
        setCategories(data);
        try {
          localStorage.setItem('mahdev_cached_categories', JSON.stringify(data));
        } catch {}
        cmsService.syncEntityFromFirestore('categories', data);
      }
    });

    const unsubSrvs = firestoreServicesService.subscribeServices((data) => {
      if (isMounted) {
        setServices(data);
        setIsServicesLoading(false);
        setLoadedServices((prev) => {
          const next = { ...prev };
          data.forEach((s) => {
            if (s.division) next[s.division] = true;
            if ((s as any).divisionId) next[(s as any).divisionId] = true;
          });
          try { localStorage.setItem('mahdev_cached_loaded_services', JSON.stringify(next)); } catch {}
          return next;
        });
        try {
          localStorage.setItem('mahdev_cached_services', JSON.stringify(data));
        } catch {}
        bookingService.syncWithFirestore(data);
        cmsService.syncEntityFromFirestore('services', data);
      }
    });

    const unsubProds = firestoreProductsService.subscribeProducts((data) => {
      if (isMounted) {
        setProducts(data);
        setIsProductsLoading(false);
        try {
          localStorage.setItem('mahdev_cached_products', JSON.stringify(data));
        } catch {}
        catalogService.syncWithFirestore(data, categories);
        cmsService.syncEntityFromFirestore('products', data);
      }
    });

    // 2. Secondary Collections (Streamlined Snapshot Listeners)
    const unsubMs = firestoreMilestonesService.subscribeMilestones((data) => {
      if (isMounted) {
        setMilestones(data);
        setIsMilestonesLoading(false);
        try {
          localStorage.setItem('mahdev_cached_milestones', JSON.stringify(data));
        } catch {}
        cmsService.syncEntityFromFirestore('milestones', data);
      }
    });

    const unsubPartners = firestoreTrustedCompaniesService.subscribeTrustedCompanies((data) => {
      if (isMounted) {
        setTrustedCompanies(data);
        setIsCompaniesLoading(false);
        try {
          localStorage.setItem('mahdev_cached_companies', JSON.stringify(data));
        } catch {}
        cmsService.syncEntityFromFirestore('companies', data);
      }
    });

    const unsubReviews = firestoreTestimonialsService.subscribeTestimonials((data) => {
      if (isMounted) {
        setTestimonials(data);
        setIsTestimonialsLoading(false);
        try {
          localStorage.setItem('mahdev_cached_testimonials', JSON.stringify(data));
        } catch {}
        cmsService.syncEntityFromFirestore('testimonials', data);
      }
    });

    const unsubGoogleConfig = firestoreGoogleReviewsService.subscribeConfig((data) => {
      if (isMounted) {
        setGoogleReviewsConfig(data);
        try {
          localStorage.setItem('mahdev_cached_google_reviews_config', JSON.stringify(data));
        } catch {}
      }
    });

    const unsubGoogleReviews = firestoreGoogleReviewsService.subscribeReviews((data) => {
      if (isMounted) {
        setGoogleReviews(data);
        try {
          localStorage.setItem('mahdev_cached_google_reviews', JSON.stringify(data));
        } catch {}
      }
    });

    const unsubPort = firestorePortfolioService.subscribePortfolio((data) => {
      if (isMounted) {
        setPortfolio(data);
        setIsPortfolioLoading(false);
        try {
          localStorage.setItem('mahdev_cached_portfolio', JSON.stringify(data));
        } catch {}
        cmsService.syncEntityFromFirestore('portfolio', data);
      }
    });

    const unsubGal = firestoreGalleryService.subscribeGallery(undefined, (data) => {
      if (isMounted) {
        setGallery(data);
        setIsGalleryLoading(false);
        setLoadedGallery((prev) => {
          const next = { ...prev };
          data.forEach((g) => {
            if (g.division) next[g.division] = true;
            if ((g as any).divisionId) next[(g as any).divisionId] = true;
          });
          try { localStorage.setItem('mahdev_cached_loaded_gallery', JSON.stringify(next)); } catch {}
          return next;
        });
        try {
          localStorage.setItem('mahdev_cached_gallery', JSON.stringify(data));
        } catch {}
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
    const { canonicalDocId, shortId } = normalizeDivisionId(id);

    // Make sure we operate on a complete list of divisions
    const current = (divisionsRef.current && divisionsRef.current.length > 0)
      ? divisionsRef.current
      : sortDivisions(getDefaultDivisions());

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
      localStorage.setItem('mahdev_cached_divisions', JSON.stringify(finalSorted));
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


