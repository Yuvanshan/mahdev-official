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

export interface FirestoreDataContextValue {
  isInitialLoading: boolean;
  isReady: boolean;
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
  refreshAll: () => Promise<void>;
  updateSiteSettings: (data: Partial<FirestoreSiteSettings>) => Promise<void>;
  updateCompanySettings: (data: Partial<FirestoreCompanySettings>) => Promise<void>;
  updateHomepageConfig: (data: Partial<HomepageCmsConfig>) => Promise<void>;
  updateGoogleReviewsConfig: (data: Partial<GoogleReviewsConfig>) => Promise<void>;
  syncGoogleReviews: () => Promise<any>;
  reorderDivisions: (orderedIds: string[]) => Promise<void>;
  updateDivisionOrder: (id: string, order: number) => Promise<void>;
  saveDivision: (id: string, data: Partial<FirestoreDivision>) => Promise<void>;
}

const FirestoreDataContext = createContext<FirestoreDataContextValue | null>(null);

export const FirestoreDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
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
        if (cached) return sortDivisions(JSON.parse(cached));
      }
    } catch {}
    return sortDivisions(getDefaultDivisions());
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

  // Explicit Manual Refresh: loads all collections concurrently from Firestore
  const refreshAll = useCallback(async () => {
    try {
      setError(null);
      const [
        company,
        site,
        home,
        divs,
        cats,
        srvs,
        prods,
        ms,
        partners,
        reviews,
        gConfig,
        gReviews,
        port,
        gal,
      ] = await Promise.all([
        firestoreSettingsService.getCompanySettings(true),
        firestoreSettingsService.getSiteSettings(true),
        firestoreSettingsService.getHomepageSettings(true),
        firestoreDivisionsService.getDivisions(true),
        firestoreCategoriesService.getCategories(undefined, true),
        firestoreServicesService.getServices(undefined, true),
        firestoreProductsService.getProducts(undefined, true),
        firestoreMilestonesService.getMilestones(true),
        firestoreTrustedCompaniesService.getTrustedCompanies(true),
        firestoreTestimonialsService.getTestimonials(undefined, true),
        firestoreGoogleReviewsService.getConfig(true),
        firestoreGoogleReviewsService.getReviews(),
        firestorePortfolioService.getPortfolio(undefined, true),
        firestoreGalleryService.getGallery(undefined, true),
      ]);

      let resolvedCompanyLogo = company.logoUrl || site.logoUrl || '';
      let resolvedSiteLogo = site.logoUrl || company.logoUrl || '';
      let resolvedDarkLogo = site.darkLogoUrl || company.darkLogoUrl || '';

      setCompanySettings((prev) => {
        const logo = resolvedCompanyLogo || prev.logoUrl || '';
        const darkLogo = resolvedDarkLogo || prev.darkLogoUrl || '';
        const merged = {
          ...prev,
          ...company,
          logoUrl: logo,
          darkLogoUrl: darkLogo,
        };
        try {
          localStorage.setItem('mahdev_cached_company_settings', JSON.stringify(merged));
        } catch {}
        return merged;
      });

      setSiteSettings((prev) => {
        const logo = resolvedSiteLogo || prev.logoUrl || '';
        const darkLogo = resolvedDarkLogo || prev.darkLogoUrl || '';
        const merged = {
          ...prev,
          ...site,
          logoUrl: logo,
          darkLogoUrl: darkLogo,
        };
        try {
          localStorage.setItem('mahdev_cached_site_settings', JSON.stringify(merged));
        } catch {}
        return merged;
      });
      setHomepageConfig(home);
      setDivisions(sortDivisions(divs));
      setCategories(cats);
      setServices(srvs);
      setProducts(prods);
      setMilestones(ms);
      setTrustedCompanies(partners);
      setTestimonials(reviews);
      setGoogleReviewsConfig(gConfig);
      setGoogleReviews(gReviews);
      setPortfolio(port);
      setGallery(gal);

      // Persist hydrated snapshots to localStorage cache
      try {
        const finalCompanyCache = {
          ...company,
          logoUrl: resolvedCompanyLogo,
          darkLogoUrl: resolvedDarkLogo,
        };
        const finalSiteCache = {
          ...site,
          logoUrl: resolvedSiteLogo,
          darkLogoUrl: resolvedDarkLogo,
        };
        localStorage.setItem('mahdev_cached_company_settings', JSON.stringify(finalCompanyCache));
        localStorage.setItem('mahdev_cached_site_settings', JSON.stringify(finalSiteCache));
        localStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(home));
        localStorage.setItem('mahdev_cached_divisions', JSON.stringify(divs));
        localStorage.setItem('mahdev_cached_categories', JSON.stringify(cats));
        localStorage.setItem('mahdev_cached_services', JSON.stringify(srvs));
        localStorage.setItem('mahdev_cached_products', JSON.stringify(prods));
        localStorage.setItem('mahdev_cached_milestones', JSON.stringify(ms));
        localStorage.setItem('mahdev_cached_companies', JSON.stringify(partners));
        localStorage.setItem('mahdev_cached_testimonials', JSON.stringify(reviews));
        localStorage.setItem('mahdev_cached_google_reviews_config', JSON.stringify(gConfig));
        localStorage.setItem('mahdev_cached_google_reviews', JSON.stringify(gReviews));
        localStorage.setItem('mahdev_cached_portfolio', JSON.stringify(port));
        localStorage.setItem('mahdev_cached_gallery', JSON.stringify(gal));
      } catch {}

      // Sync with catalogService, bookingService, and cmsService cache
      catalogService.syncWithFirestore(prods, cats);
      bookingService.syncWithFirestore(srvs);
      cmsService.syncHomepageConfig(home);
      cmsService.syncEntityFromFirestore('divisions', divs);
      cmsService.syncEntityFromFirestore('categories', cats);
      cmsService.syncEntityFromFirestore('services', srvs);
      cmsService.syncEntityFromFirestore('products', prods);
      cmsService.syncEntityFromFirestore('milestones', ms);
      cmsService.syncEntityFromFirestore('companies', partners);
      cmsService.syncEntityFromFirestore('testimonials', reviews);
      cmsService.syncEntityFromFirestore('portfolio', port);
      cmsService.syncEntityFromFirestore('gallery', gal);
    } catch (err) {
      console.error('[FirestoreDataContext] Refresh error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let initialCount = 0;
    const requiredSources = 4; // company, site, home, divisions

    const markReady = () => {
      if (isMounted) {
        setIsInitialLoading(false);
        setIsReady(true);
      }
    };

    const checkInitialReady = () => {
      initialCount++;
      if (initialCount >= requiredSources) {
        markReady();
      }
    };

    // Initial fetch: wait for real Firestore data to hydrate before dismissing loader to prevent visual glitch
    refreshAll()
      .then(() => {
        if (isMounted) {
          markReady();
        }
      })
      .catch((err) => {
        console.warn('[FirestoreDataContext] Initial hydration warning:', err);
        if (isMounted) {
          markReady();
        }
      });

    // Fallback timeout: only used if network is unreachable or blocked, generous enough to avoid prematurely flashing defaults
    const safetyTimer = setTimeout(() => {
      markReady();
    }, 4500);

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
        checkInitialReady();
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
        checkInitialReady();
      }
    });

    const unsubHome = firestoreSettingsService.subscribeHomepageSettings((data) => {
      if (isMounted) {
        setHomepageConfig(data);
        try {
          localStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(data));
        } catch {}
        cmsService.syncHomepageConfig(data);
        checkInitialReady();
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
        checkInitialReady();
      }
    });

    const unsubCats = firestoreCategoriesService.subscribeCategories((data) => {
      if (isMounted) {
        setCategories(data);
        cmsService.syncEntityFromFirestore('categories', data);
        checkInitialReady();
      }
    });

    const unsubSrvs = firestoreServicesService.subscribeServices((data) => {
      if (isMounted) {
        setServices(data);
        bookingService.syncWithFirestore(data);
        cmsService.syncEntityFromFirestore('services', data);
        checkInitialReady();
      }
    });

    const unsubProds = firestoreProductsService.subscribeProducts((data) => {
      if (isMounted) {
        setProducts(data);
        catalogService.syncWithFirestore(data, categories);
        cmsService.syncEntityFromFirestore('products', data);
        checkInitialReady();
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

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
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
      const merged = { ...prev, ...data };
      try {
        localStorage.setItem('mahdev_cached_homepage_config', JSON.stringify(merged));
      } catch {}
      cmsService.syncHomepageConfig(merged);
      return merged;
    });
  }, []);

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
    const canonicalId = id === 'u1' ? 'u1-studio' : id === 'it' ? 'it-solutions' : id === 'mart' ? 'online-mart' : id;
    setDivisions((prev) => {
      const updated = prev.map((d) => {
        if (d.id === id || d.id === canonicalId || d.slug === id || d.slug === canonicalId) {
          return { ...d, ...data, id: d.id };
        }
        return d;
      });
      try {
        localStorage.setItem('mahdev_cached_divisions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const value = useMemo<FirestoreDataContextValue>(
    () => ({
      isInitialLoading,
      isReady,
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
      refreshAll,
      updateSiteSettings,
      updateCompanySettings,
      updateHomepageConfig,
      updateGoogleReviewsConfig,
      syncGoogleReviews,
      reorderDivisions,
      updateDivisionOrder,
      saveDivision,
    }),
    [
      isInitialLoading,
      isReady,
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
      refreshAll,
      updateSiteSettings,
      updateCompanySettings,
      updateHomepageConfig,
      updateGoogleReviewsConfig,
      syncGoogleReviews,
      reorderDivisions,
      updateDivisionOrder,
      saveDivision,
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

