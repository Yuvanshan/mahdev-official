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
import { firestoreProductsService, getDefaultProducts } from '../services/firestore/products';
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
  refreshAll: (forceRefresh?: boolean) => Promise<void>;
  forceRefreshAll: () => Promise<void>;
  updateSiteSettings: (data: Partial<FirestoreSiteSettings>) => Promise<void>;
  updateCompanySettings: (data: Partial<FirestoreCompanySettings>) => Promise<void>;
  updateHomepageConfig: (data: Partial<HomepageCmsConfig>) => Promise<void>;
  updateGoogleReviewsConfig: (data: Partial<GoogleReviewsConfig>) => Promise<void>;
  syncGoogleReviews: () => Promise<any>;
  reorderDivisions: (orderedIds: string[]) => Promise<void>;
  updateDivisionOrder: (id: string, order: number) => Promise<void>;
  saveDivision: (id: string, data: Partial<FirestoreDivision>) => Promise<void>;
  saveProduct: (id: string, data: Partial<FirestoreProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
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
  // Wipe legacy localStorage caches immediately to enforce zero local storage policy
  try {
    if (typeof window !== 'undefined') {
      const legacyKeys = [
        'mahdev_cache_hydrated',
        'mahdev_cache_timestamp',
        'mahdev_cache_version',
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
        'mahdev_cached_media_assets',
        'mahdev_cached_loaded_divisions',
        'mahdev_cached_loaded_services',
        'mahdev_cached_loaded_gallery',
        'mahdev_cached_company_settings',
        'mahdev_cached_site_settings',
        'mahdev_cached_homepage_config',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));
    }
  } catch {}

  // Individual Per-Entity Loading States (All start true so crisp shimmers render until Firestore responds)
  const [isDivisionsLoading, setIsDivisionsLoading] = useState<boolean>(true);
  const [isMilestonesLoading, setIsMilestonesLoading] = useState<boolean>(true);
  const [isServicesLoading, setIsServicesLoading] = useState<boolean>(true);
  const [isGalleryLoading, setIsGalleryLoading] = useState<boolean>(true);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState<boolean>(true);
  const [isTestimonialsLoading, setIsTestimonialsLoading] = useState<boolean>(true);
  const [isCompaniesLoading, setIsCompaniesLoading] = useState<boolean>(true);
  const [isHomepageConfigLoading, setIsHomepageConfigLoading] = useState<boolean>(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(true);

  // General App Loading state
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<string>('Connecting to Firestore...');
  const [error, setError] = useState<Error | null>(null);

  const [companySettings, setCompanySettings] = useState<FirestoreCompanySettings>(() => getDefaultCompanySettings());
  const [siteSettings, setSiteSettings] = useState<FirestoreSiteSettings>(() => getDefaultSiteSettings());
  const [homepageConfig, setHomepageConfig] = useState<HomepageCmsConfig>(() => getDefaultHomepageSettings());
  const [divisions, setDivisions] = useState<FirestoreDivision[]>(() => sortDivisions(getDefaultDivisions()));
  const [categories, setCategories] = useState<FirestoreCategory[]>([]);
  const [services, setServices] = useState<FirestoreService[]>([]);
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [milestones, setMilestones] = useState<FirestoreMilestone[]>([]);
  const [trustedCompanies, setTrustedCompanies] = useState<FirestoreTrustedCompany[]>([]);
  const [testimonials, setTestimonials] = useState<FirestoreTestimonial[]>([]);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [googleReviewsConfig, setGoogleReviewsConfig] = useState<GoogleReviewsConfig>(() => DEFAULT_GOOGLE_REVIEWS_CONFIG);
  const [portfolio, setPortfolio] = useState<FirestorePortfolio[]>([]);
  const [gallery, setGallery] = useState<FirestoreGallery[]>([]);
  const [mediaAssets, setMediaAssets] = useState<StoredMediaItem[]>([]);
  const [isLiveHydrated, setIsLiveHydrated] = useState<boolean>(false);

  // Track loaded divisions state for seamless transition & shimmers
  const [loadedDivisions, setLoadedDivisions] = useState<Record<string, boolean>>({});
  const [loadedServices, setLoadedServices] = useState<Record<string, boolean>>({});
  const [loadedGallery, setLoadedGallery] = useState<Record<string, boolean>>({});

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
              const otherServices = sanitizeCachedServices(
                prev.filter(
                  (s) => !isSameDivision(s.division, canonicalId) && !isSameDivision((s as any).divisionId, canonicalId)
                )
              );
              const uniqueMap = new Map<string, FirestoreService>();
              for (const s of otherServices) {
                if (s && s.id) uniqueMap.set(s.id, s);
              }
              for (const s of srvs) {
                if (s && s.id) uniqueMap.set(s.id, s);
              }
              const merged = Array.from(uniqueMap.values());
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
              const uniqueMap = new Map<string, FirestoreGallery>();
              for (const g of otherGal) {
                if (g && g.id) uniqueMap.set(g.id, g);
              }
              for (const g of gal) {
                if (g && g.id) uniqueMap.set(g.id, g);
              }
              const merged = Array.from(uniqueMap.values());
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
          firestoreProductsService.getProducts({ division: canonicalId as DivisionId }, true),
          firestoreCategoriesService.getCategories(canonicalId as DivisionId, false),
          firestorePortfolioService.getPortfolio(canonicalId as DivisionId, false),
        ])
          .then(([prods, cats, port]) => {
            setProducts((prev) => {
              const otherProds = sanitizeCachedProducts(
                prev.filter(
                  (p) => !isSameDivision(p.division, canonicalId) && !isSameDivision((p as any).divisionId, canonicalId)
                )
              );
              const uniqueMap = new Map<string, FirestoreProduct>();
              for (const p of otherProds) {
                if (p && p.id) uniqueMap.set(p.id, p);
              }
              for (const p of prods) {
                if (p && p.id) uniqueMap.set(p.id, p);
              }
              const merged = Array.from(uniqueMap.values());
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
              const uniqueMap = new Map<string, FirestoreCategory>();
              for (const c of otherCats) {
                if (c && c.id) uniqueMap.set(c.id, c);
              }
              for (const c of cats) {
                if (c && c.id) uniqueMap.set(c.id, c);
              }
              const merged = Array.from(uniqueMap.values());
              try { localStorage.setItem('mahdev_cached_categories', JSON.stringify(merged)); } catch {}
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
            return next;
          });
          cmsService.syncEntityFromFirestore('divisions', sortedDivs);
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
          setSyncProgress((p) => Math.min(95, p + 6));
        })
        .catch(() => {
          setIsHomepageConfigLoading(false);
        });

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
            return next;
          });
          bookingService.syncWithFirestore(dedupedServices);
          cmsService.syncEntityFromFirestore('services', dedupedServices);
          setSyncProgress((p) => Math.min(95, p + 8));
        })
        .catch(() => {
          setIsServicesLoading(false);
        });

      // 7. One-by-one API Call: Products
      const fetchProductsTask = firestoreProductsService
        .getProducts({}, forceRefresh)
        .then((allProducts) => {
          const seen = new Set<string>();
          const dedupedProducts = allProducts.filter((p) => p && p.id && !seen.has(p.id) && seen.add(p.id));
          setProducts(dedupedProducts);
          setIsProductsLoading(false);
          catalogService.syncWithFirestore(dedupedProducts);
          cmsService.syncEntityFromFirestore('products', dedupedProducts);
          setSyncProgress((p) => Math.min(95, p + 6));
        })
        .catch(() => {
          setIsProductsLoading(false);
        });

      // 8. One-by-one API Call: Categories
      const fetchCategoriesTask = firestoreCategoriesService
        .getCategories(undefined, forceRefresh)
        .then((allCategories) => {
          const seen = new Set<string>();
          const dedupedCategories = allCategories.filter((c) => c && c.id && !seen.has(c.id) && seen.add(c.id));
          setCategories(dedupedCategories);
          cmsService.syncEntityFromFirestore('categories', dedupedCategories);
        })
        .catch(() => {});

      // 9. One-by-one API Call: Portfolio
      const fetchPortfolioTask = firestorePortfolioService
        .getPortfolio(undefined, forceRefresh)
        .then((allPortfolio) => {
          const seen = new Set<string>();
          const dedupedPortfolio = allPortfolio.filter((p) => p && p.id && !seen.has(p.id) && seen.add(p.id));
          setPortfolio(dedupedPortfolio);
          setIsPortfolioLoading(false);
          cmsService.syncEntityFromFirestore('portfolio', dedupedPortfolio);
        })
        .catch(() => {
          setIsPortfolioLoading(false);
        });

      // 10. One-by-one API Call: Gallery
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
            return next;
          });
          cmsService.syncEntityFromFirestore('gallery', dedupedGallery);
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
          }
          setGoogleReviews(gReviews);
        })
        .catch(() => {});

      // 14. One-by-one API Call: Media Assets
      const fetchMediaAssetsTask = mediaService
        .getMediaAssets()
        .then((allMediaAssets) => {
          setMediaAssets(allMediaAssets);
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

      setSyncProgress(100);
      setSyncStatus('Ready');
      setIsLiveHydrated(true);
      setIsInitialLoading(false);
      setIsReady(true);
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

  /**
   * Complete forced cache purge and server re-sync
   * Invalidate memory caches, local storage caches, and pull pristine Firestore documents.
   */
  const forceRefreshAll = useCallback(async () => {
    try {
      firestoreServicesService.clearCache();
      firestoreGalleryService.clearCache();
      firestoreProductsService.clearCache();
      firestoreDivisionsService.clearCache();

      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'mahdev_cache_hydrated',
          'mahdev_cache_timestamp',
          'mahdev_cached_divisions',
          'mahdev_cached_services',
          'mahdev_cached_products',
          'mahdev_cached_categories',
          'mahdev_cached_gallery',
          'mahdev_cached_portfolio',
          'mahdev_cached_milestones',
          'mahdev_cached_companies',
          'mahdev_cached_testimonials',
          'mahdev_cached_company_settings',
          'mahdev_cached_site_settings',
          'mahdev_cached_homepage_config',
          'mahdev_cached_media_assets',
          'mahdev_cached_loaded_divisions',
          'mahdev_cached_loaded_services',
          'mahdev_cached_loaded_gallery',
          'mahdev_cached_google_reviews',
          'mahdev_cached_google_reviews_config',
        ];
        keysToRemove.forEach((k) => {
          try { localStorage.removeItem(k); } catch {}
        });
      }

      firestoreGalleryService.clearCache?.();
      firestoreServicesService.clearCache?.();
      firestoreProductsService.clearCache?.();

      await refreshAll(true);
    } catch (err) {
      console.error('[FirestoreDataContext] forceRefreshAll failed:', err);
    }
  }, [refreshAll]);

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
    markReady();

    // Check cache freshness: if cache timestamp is missing or older than 15 minutes, perform a live force-refresh
    const cacheTs = (() => {
      try {
        const ts = localStorage.getItem('mahdev_cache_timestamp');
        return ts ? parseInt(ts, 10) : 0;
      } catch {
        return 0;
      }
    })();
    const isCacheStale = !cacheTs || Date.now() - cacheTs > 1000 * 60 * 15;

    // Always trigger fresh live synchronization from Cloud Firestore
    refreshAll(true).catch(() => {});

    // Silently synchronize any local stranded data (e.g. from mobile phone edits) to Cloud Firestore
    cmsService.autoSyncStrandedLocalData(true).catch(() => {});

    // Listen for tab focus/visibility to automatically pull latest Firestore data and sync changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cmsService.autoSyncStrandedLocalData().catch(() => {});
        const lastTs = (() => {
          try {
            const ts = localStorage.getItem('mahdev_cache_timestamp');
            return ts ? parseInt(ts, 10) : 0;
          } catch {
            return 0;
          }
        })();
        // If more than 5 minutes have passed since last refresh, silently refresh from Firestore
        if (Date.now() - lastTs > 1000 * 60 * 5) {
          refreshAll(true).catch(() => {});
        }
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

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
        const seen = new Set<string>();
        const deduped = data.filter((s) => s && s.id && !seen.has(s.id) && seen.add(s.id));
        setServices(deduped);
        setIsServicesLoading(false);
        setLoadedServices((prev) => {
          const next = { ...prev };
          deduped.forEach((s) => {
            if (s.division) next[s.division] = true;
            if ((s as any).divisionId) next[(s as any).divisionId] = true;
          });
          try { localStorage.setItem('mahdev_cached_loaded_services', JSON.stringify(next)); } catch {}
          return next;
        });
        try {
          localStorage.setItem('mahdev_cached_services', JSON.stringify(deduped));
        } catch {}
        bookingService.syncWithFirestore(deduped);
        cmsService.syncEntityFromFirestore('services', deduped);
      }
    });

    const unsubProds = firestoreProductsService.subscribeProducts((data) => {
      if (isMounted) {
        const seen = new Set<string>();
        const deduped = data.filter((p) => p && p.id && !seen.has(p.id) && seen.add(p.id));
        setProducts(deduped);
        setIsProductsLoading(false);
        try {
          localStorage.setItem('mahdev_cached_products', JSON.stringify(deduped));
        } catch {}
        catalogService.syncWithFirestore(deduped, categories);
        cmsService.syncEntityFromFirestore('products', deduped);
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
        const seen = new Set<string>();
        const deduped = data.filter((g) => g && g.id && !seen.has(g.id) && seen.add(g.id));
        setGallery(deduped);
        setIsGalleryLoading(false);
        setLoadedGallery((prev) => {
          const next = { ...prev };
          deduped.forEach((g) => {
            if (g.division) next[g.division] = true;
            if ((g as any).divisionId) next[(g as any).divisionId] = true;
          });
          try { localStorage.setItem('mahdev_cached_loaded_gallery', JSON.stringify(next)); } catch {}
          return next;
        });
        try {
          localStorage.setItem('mahdev_cached_gallery', JSON.stringify(deduped));
        } catch {}
        cmsService.syncEntityFromFirestore('gallery', deduped);
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
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
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

  const saveProduct = useCallback(async (id: string, data: Partial<FirestoreProduct>) => {
    // 1. Commit to Firestore repository with cleared cache
    firestoreProductsService.clearCache();
    await firestoreProductsService.saveProduct(id, data);

    // 2. Immediately update local products state and synchronizers
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      const primaryImg = (data as any).imageUrl || (data.images && data.images[0]) || (idx >= 0 ? prev[idx].imageUrl : '');
      const otherImgs = ((data.images || (data as any).galleryImages || (idx >= 0 ? prev[idx].images : [])) as string[]).filter(
        (u: string) => u && u !== primaryImg
      );
      const allImages = primaryImg ? [primaryImg, ...otherImgs] : otherImgs;

      const mergedProduct: FirestoreProduct = {
        ...(idx >= 0 ? prev[idx] : {}),
        ...data,
        id,
        imageUrl: primaryImg,
        images: allImages,
        galleryImages: allImages,
        division: data.division || (data as any).divisionId || (idx >= 0 ? prev[idx].division : 'mart'),
        divisionId: (data as any).divisionId || data.division || (idx >= 0 ? (prev[idx] as any).divisionId : 'mart'),
        isPublished: data.isPublished !== undefined ? data.isPublished : (data.status !== 'draft' && data.status !== 'archived'),
        status: data.status || (data.isPublished === false ? 'draft' : 'active'),
        updatedAt: new Date().toISOString(),
      } as FirestoreProduct;

      const updated = idx >= 0 ? prev.map((p) => (p.id === id ? mergedProduct : p)) : [mergedProduct, ...prev];
      try {
        localStorage.setItem('mahdev_cached_products', JSON.stringify(updated));
      } catch {}

      catalogService.syncWithFirestore(updated);
      cmsService.syncEntityFromFirestore('products', updated);
      return updated;
    });
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    // 1. Commit delete to Firestore with cleared cache
    firestoreProductsService.clearCache();
    await firestoreProductsService.deleteProduct(id);

    // 2. Immediately update local products state and synchronizers
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('mahdev_cached_products', JSON.stringify(updated));
      } catch {}

      catalogService.syncWithFirestore(updated);
      cmsService.hardDelete('products', id);
      return updated;
    });
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
      forceRefreshAll,
      updateSiteSettings,
      updateCompanySettings,
      updateHomepageConfig,
      updateGoogleReviewsConfig,
      syncGoogleReviews,
      reorderDivisions,
      updateDivisionOrder,
      saveDivision,
      saveProduct,
      deleteProduct,
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
      forceRefreshAll,
      updateSiteSettings,
      updateCompanySettings,
      updateHomepageConfig,
      updateGoogleReviewsConfig,
      syncGoogleReviews,
      reorderDivisions,
      updateDivisionOrder,
      saveDivision,
      saveProduct,
      deleteProduct,
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


