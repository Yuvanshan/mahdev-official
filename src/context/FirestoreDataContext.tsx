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
} from '../types/firestore';
import { HomepageCmsConfig } from '../types/cms';
import {
  firestoreSettingsService,
  getDefaultCompanySettings,
  getDefaultSiteSettings,
  getDefaultHomepageSettings,
} from '../services/firestore/settings';
import { firestoreDivisionsService } from '../services/firestore/divisions';
import { firestoreCategoriesService } from '../services/firestore/categories';
import { firestoreServicesService } from '../services/firestore/services';
import { firestoreProductsService } from '../services/firestore/products';
import { firestoreMilestonesService } from '../services/firestore/milestones';
import { firestoreTrustedCompaniesService } from '../services/firestore/trustedCompanies';
import { firestoreTestimonialsService } from '../services/firestore/testimonials';
import { firestorePortfolioService } from '../services/firestore/portfolio';
import { cmsService } from '../services/cmsService';

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
  portfolio: FirestorePortfolio[];
  refreshAll: () => Promise<void>;
  updateSiteSettings: (data: Partial<FirestoreSiteSettings>) => Promise<void>;
  updateCompanySettings: (data: Partial<FirestoreCompanySettings>) => Promise<void>;
  updateHomepageConfig: (data: Partial<HomepageCmsConfig>) => Promise<void>;
}

const FirestoreDataContext = createContext<FirestoreDataContextValue | null>(null);

export const FirestoreDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const [companySettings, setCompanySettings] = useState<FirestoreCompanySettings>(getDefaultCompanySettings);
  const [siteSettings, setSiteSettings] = useState<FirestoreSiteSettings>(getDefaultSiteSettings);
  const [homepageConfig, setHomepageConfig] = useState<HomepageCmsConfig>(getDefaultHomepageSettings);
  const [divisions, setDivisions] = useState<FirestoreDivision[]>([]);
  const [categories, setCategories] = useState<FirestoreCategory[]>([]);
  const [services, setServices] = useState<FirestoreService[]>([]);
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [milestones, setMilestones] = useState<FirestoreMilestone[]>([]);
  const [trustedCompanies, setTrustedCompanies] = useState<FirestoreTrustedCompany[]>([]);
  const [testimonials, setTestimonials] = useState<FirestoreTestimonial[]>([]);
  const [portfolio, setPortfolio] = useState<FirestorePortfolio[]>([]);

  // Initial Bootstrap: load all collections concurrently from Firestore
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
        port,
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
        firestorePortfolioService.getPortfolio(undefined, true),
      ]);

      setCompanySettings(company);
      setSiteSettings(site);
      setHomepageConfig(home);
      setDivisions(divs);
      setCategories(cats);
      setServices(srvs);
      setProducts(prods);
      setMilestones(ms);
      setTrustedCompanies(partners);
      setTestimonials(reviews);
      setPortfolio(port);

      // Sync with cmsService cache
      cmsService.updateHomepageConfig(home);
    } catch (err) {
      console.error('[FirestoreDataContext] Hydration error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsInitialLoading(false);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial async fetch
    refreshAll();

    // 2. Realtime listeners for all Firestore resources
    const unsubCompany = firestoreSettingsService.subscribeCompanySettings((data) => {
      if (isMounted) setCompanySettings(data);
    });

    const unsubSite = firestoreSettingsService.subscribeSiteSettings((data) => {
      if (isMounted) setSiteSettings(data);
    });

    const unsubHome = firestoreSettingsService.subscribeHomepageSettings((data) => {
      if (isMounted) {
        setHomepageConfig(data);
        cmsService.updateHomepageConfig(data);
      }
    });

    const unsubDivs = firestoreDivisionsService.subscribeDivisions((data) => {
      if (isMounted) setDivisions(data);
    });

    const unsubCats = firestoreCategoriesService.subscribeCategories((data) => {
      if (isMounted) setCategories(data);
    });

    const unsubSrvs = firestoreServicesService.subscribeServices((data) => {
      if (isMounted) setServices(data);
    });

    const unsubProds = firestoreProductsService.subscribeProducts((data) => {
      if (isMounted) setProducts(data);
    });

    const unsubMs = firestoreMilestonesService.subscribeMilestones((data) => {
      if (isMounted) setMilestones(data);
    });

    const unsubPartners = firestoreTrustedCompaniesService.subscribeTrustedCompanies((data) => {
      if (isMounted) setTrustedCompanies(data);
    });

    const unsubReviews = firestoreTestimonialsService.subscribeTestimonials((data) => {
      if (isMounted) setTestimonials(data);
    });

    const unsubPort = firestorePortfolioService.subscribePortfolio((data) => {
      if (isMounted) setPortfolio(data);
    });

    return () => {
      isMounted = false;
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
      unsubPort();
    };
  }, [refreshAll]);

  const activeDivisions = useMemo(() => {
    return divisions.filter((d) => d.status === 'active');
  }, [divisions]);

  const updateSiteSettings = useCallback(async (data: Partial<FirestoreSiteSettings>) => {
    await firestoreSettingsService.updateSiteSettings(data);
    setSiteSettings((prev) => ({ ...prev, ...data }));
  }, []);

  const updateCompanySettings = useCallback(async (data: Partial<FirestoreCompanySettings>) => {
    await firestoreSettingsService.updateCompanySettings(data);
    setCompanySettings((prev) => ({ ...prev, ...data }));
  }, []);

  const updateHomepageConfig = useCallback(async (data: Partial<HomepageCmsConfig>) => {
    await firestoreSettingsService.updateHomepageSettings(data);
    setHomepageConfig((prev) => ({ ...prev, ...data }));
    cmsService.updateHomepageConfig(data);
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
      portfolio,
      refreshAll,
      updateSiteSettings,
      updateCompanySettings,
      updateHomepageConfig,
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
      portfolio,
      refreshAll,
      updateSiteSettings,
      updateCompanySettings,
      updateHomepageConfig,
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
