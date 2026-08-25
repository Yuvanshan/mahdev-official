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
import { firestoreDivisionsService } from '../services/firestore/divisions';
import { firestoreCategoriesService } from '../services/firestore/categories';
import { firestoreServicesService } from '../services/firestore/services';
import { firestoreProductsService } from '../services/firestore/products';
import { firestoreMilestonesService } from '../services/firestore/milestones';
import { firestoreTrustedCompaniesService } from '../services/firestore/trustedCompanies';
import { firestoreTestimonialsService } from '../services/firestore/testimonials';
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
  portfolio: FirestorePortfolio[];
  gallery: FirestoreGallery[];
  refreshAll: () => Promise<void>;
  updateSiteSettings: (data: Partial<FirestoreSiteSettings>) => Promise<void>;
  updateCompanySettings: (data: Partial<FirestoreCompanySettings>) => Promise<void>;
  updateHomepageConfig: (data: Partial<HomepageCmsConfig>) => Promise<void>;
}

const FirestoreDataContext = createContext<FirestoreDataContextValue | null>(null);

export const FirestoreDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
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
  const [gallery, setGallery] = useState<FirestoreGallery[]>([]);

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
        firestorePortfolioService.getPortfolio(undefined, true),
        firestoreGalleryService.getGallery(undefined, true),
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
      setGallery(gal);

      // Sync with catalogService, bookingService, and cmsService cache
      catalogService.syncWithFirestore(prods, cats);
      bookingService.syncWithFirestore(srvs);
      cmsService.updateHomepageConfig(home);
    } catch (err) {
      console.error('[FirestoreDataContext] Refresh error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsInitialLoading(false);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let initialCount = 0;
    const requiredSources = 7; // core collections needed for initial readiness

    const checkInitialReady = () => {
      initialCount++;
      if (initialCount >= requiredSources && isMounted) {
        setIsInitialLoading(false);
        setIsReady(true);
      }
    };

    // 1. Core Realtime Centralized Listeners (Single Source of Truth, zero duplicate listeners)
    const unsubCompany = firestoreSettingsService.subscribeCompanySettings((data) => {
      if (isMounted) {
        setCompanySettings(data);
        cmsService.updateCompanyInfo(data as any);
        checkInitialReady();
      }
    });

    const unsubSite = firestoreSettingsService.subscribeSiteSettings((data) => {
      if (isMounted) {
        setSiteSettings(data);
        checkInitialReady();
      }
    });

    const unsubHome = firestoreSettingsService.subscribeHomepageSettings((data) => {
      if (isMounted) {
        setHomepageConfig(data);
        cmsService.updateHomepageConfig(data);
        checkInitialReady();
      }
    });

    const unsubDivs = firestoreDivisionsService.subscribeDivisions((data) => {
      if (isMounted) {
        setDivisions(data);
        if (data.length > 0) {
          const cmsDivs = data.map((d) => ({
            id: `div-${d.id}`,
            divisionKey: d.id,
            name: d.name,
            shortName: d.shortName || d.name,
            tagline: d.hero?.subtitle || '',
            description: d.description || '',
            badge: d.hero?.badge || '',
            route: d.route || `/${d.slug || d.id}`,
            logoUrl: d.logoUrl || '',
            accentColor: d.accentColor || '#0052FF',
            gradient: 'from-blue-600 to-indigo-700',
            heroHeadline: d.hero?.title || d.name,
            heroSubheadline: d.hero?.subtitle || '',
            heroImageUrl: d.imageUrl || d.hero?.bgImage || '',
            contactEmail: (d as any).contactEmail || 'contact@mahdev.lk',
            iconName: 'Building',
            isActive: d.status === 'active',
            isDeleted: false,
            seo: d.seo,
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString(),
          }));
          cmsService.syncFromFirestore('divisions', cmsDivs);
        }
        checkInitialReady();
      }
    });

    const unsubCats = firestoreCategoriesService.subscribeCategories((data) => {
      if (isMounted) {
        setCategories(data);
        if (data.length > 0) {
          const cmsCats = data.map((c) => ({
            id: c.id,
            divisionId: c.division || 'mart',
            name: c.name,
            slug: c.slug || c.id,
            description: c.description || '',
            imageUrl: c.imageUrl || '',
            order: c.order || 0,
            status: c.status || 'active',
            isActive: c.status === 'active',
            isDeleted: false,
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: c.updatedAt || new Date().toISOString(),
          }));
          cmsService.syncFromFirestore('categories', cmsCats);
        }
        setProducts((currentProds) => {
          catalogService.syncWithFirestore(currentProds, data);
          return currentProds;
        });
        checkInitialReady();
      }
    });

    const unsubSrvs = firestoreServicesService.subscribeServices((data) => {
      if (isMounted) {
        setServices(data);
        if (data.length > 0) {
          const cmsSrvs = data.map((s) => ({
            id: s.id,
            divisionId: s.division || (s as any).divisionId || 'sws',
            title: s.name,
            name: s.name,
            slug: s.slug || s.id,
            description: s.description,
            imageUrl: s.images && s.images[0] ? s.images[0] : '',
            images: s.images || [],
            startingPrice: s.price,
            price: s.price,
            currency: s.currency || 'USD',
            isActive: s.status === 'active',
            isDeleted: s.status === 'draft' ? false : false,
            bookingEnabled: s.bookingEnabled !== false,
            quoteEnabled: s.quoteEnabled !== false,
            features: s.features || [],
            badge: s.badge || '',
            turnaroundTime: (s as any).leadTime || '',
            createdAt: s.createdAt || new Date().toISOString(),
            updatedAt: s.updatedAt || new Date().toISOString(),
          }));
          cmsService.syncFromFirestore('services', cmsSrvs);
        }
        bookingService.syncWithFirestore(data);
        checkInitialReady();
      }
    });

    const unsubProds = firestoreProductsService.subscribeProducts((data) => {
      if (isMounted) {
        setProducts(data);
        if (data.length > 0) {
          const cmsProds = data.map((p) => ({
            id: p.id,
            divisionId: p.division || 'mart',
            name: p.name,
            slug: p.slug || p.id,
            sku: p.sku || p.id,
            categoryId: p.categoryId || '',
            categoryName: (p as any).categoryName || '',
            description: p.description,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            imageUrl: p.images && p.images[0] ? p.images[0] : '',
            galleryImages: p.images || [],
            stockQuantity: p.stock ?? 100,
            stockStatus: (p.stock ?? 100) > 10 ? 'in_stock' : (p.stock ?? 100) > 0 ? 'low_stock' : 'out_of_stock',
            isActive: p.status === 'active',
            isDeleted: false,
            isFeatured: (p as any).isFeatured || false,
            rating: (p as any).rating || 5,
            reviewsCount: (p as any).reviewsCount || 0,
            tags: (p as any).tags || [],
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString(),
          }));
          cmsService.syncFromFirestore('products', cmsProds);
        }
        setCategories((currentCats) => {
          catalogService.syncWithFirestore(data, currentCats);
          return currentCats;
        });
        checkInitialReady();
      }
    });

    // 2. Secondary Collections (Streamlined Snapshot Listeners)
    const unsubMs = firestoreMilestonesService.subscribeMilestones((data) => {
      if (isMounted) {
        setMilestones(data);
        if (data.length > 0) cmsService.syncFromFirestore('milestones', data);
      }
    });

    const unsubPartners = firestoreTrustedCompaniesService.subscribeTrustedCompanies((data) => {
      if (isMounted) {
        setTrustedCompanies(data);
        if (data.length > 0) cmsService.syncFromFirestore('companies', data);
      }
    });

    const unsubReviews = firestoreTestimonialsService.subscribeTestimonials((data) => {
      if (isMounted) {
        setTestimonials(data);
        if (data.length > 0) cmsService.syncFromFirestore('testimonials', data);
      }
    });

    const unsubPort = firestorePortfolioService.subscribePortfolio((data) => {
      if (isMounted) {
        setPortfolio(data);
        if (data.length > 0) cmsService.syncFromFirestore('portfolio', data);
      }
    });

    const unsubGal = firestoreGalleryService.subscribeGallery(undefined, (data) => {
      if (isMounted) {
        setGallery(data);
        if (data.length > 0) cmsService.syncFromFirestore('gallery', data);
      }
    });

    // 3. Central Local Sync Listener (Immediate UI response when Admin saves via CMS Service)
    const entitiesToListen: Array<{
      type: import('../types/cms').CmsEntityType;
      updater: () => void;
    }> = [
      {
        type: 'divisions',
        updater: () => {
          const cmsDivs = cmsService.getAll<import('../types/cms').CmsDivision>('divisions');
          if (isMounted) {
            const mapped: FirestoreDivision[] = cmsDivs.map((d, idx) => ({
              id: d.id.replace('div-', ''),
              name: d.name,
              shortName: d.shortName,
              slug: d.route?.replace('/', '') || d.id,
              description: d.description,
              status: (d.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
              route: d.route,
              logoUrl: d.logoUrl,
              imageUrl: d.heroImageUrl,
              accentColor: d.accentColor,
              contactEmail: d.contactEmail,
              order: (d as any).order || idx + 1,
              hero: {
                title: d.heroHeadline || d.name,
                subtitle: d.heroSubheadline || d.tagline,
                badge: d.badge || 'Division Excellence',
                bgImage: d.heroImageUrl || '',
              },
              seo: {
                metaTitle: d.seo?.metaTitle || d.name,
                metaDescription: d.seo?.metaDescription || d.description,
                keywords: (d.seo as any)?.keywords || ['Mahdev', d.name],
              },
              createdAt: (d as any).createdAt || new Date().toISOString(),
              updatedAt: (d as any).updatedAt || new Date().toISOString(),
            }));
            setDivisions(mapped);
          }
        },
      },
      {
        type: 'services',
        updater: () => {
          const cmsSrvs = cmsService.getAll<import('../types/cms').CmsService>('services');
          if (isMounted) {
            const mapped: FirestoreService[] = cmsSrvs.map((s) => ({
              id: s.id,
              division: s.divisionId as any,
              divisionId: s.divisionId as any,
              name: s.title || (s as any).name,
              slug: (s as any).slug || s.id,
              description: s.description || (s as any).shortDescription,
              detailedDescription: (s as any).detailedDescription,
              images: (s as any).imageUrl ? [(s as any).imageUrl] : (s as any).images || [],
              price: s.startingPrice || (s as any).price || 0,
              currency: 'USD',
              status: (s.isActive ? 'active' : 'draft') as 'active' | 'draft',
              bookingEnabled: (s as any).bookingEnabled !== false,
              quoteEnabled: (s as any).quoteEnabled !== false,
              features: s.features || [],
              badge: s.badge,
              leadTime: (s as any).turnaroundTime || (s as any).leadTime,
              createdAt: (s as any).createdAt || new Date().toISOString(),
              updatedAt: (s as any).updatedAt || new Date().toISOString(),
            }));
            setServices(mapped);
            bookingService.syncWithFirestore(mapped);
          }
        },
      },
      {
        type: 'products',
        updater: () => {
          const cmsProds = cmsService.getAll<import('../types/cms').CmsProduct>('products');
          if (isMounted) {
            const mapped: FirestoreProduct[] = cmsProds.map((p) => ({
              id: p.id,
              division: p.divisionId as any,
              name: p.name,
              slug: p.slug || p.id,
              sku: p.sku,
              categoryId: p.categoryId,
              categoryName: p.categoryName,
              description: p.description,
              price: p.price,
              compareAtPrice: (p as any).compareAtPrice || (p as any).originalPrice,
              images: (p as any).galleryImages && (p as any).galleryImages.length > 0 ? (p as any).galleryImages : (p as any).imageUrl ? [(p as any).imageUrl] : [],
              stock: p.stockQuantity,
              status: (p.isActive ? 'active' : 'draft') as 'active' | 'draft',
              hasVariants: Boolean((p as any).variants?.options?.length),
              variants: (p as any).variants?.options,
              rating: (p as any).rating || 5,
              reviewsCount: (p as any).reviewsCount || 0,
              tags: p.tags,
              createdAt: (p as any).createdAt || new Date().toISOString(),
              updatedAt: (p as any).updatedAt || new Date().toISOString(),
            }));
            setProducts(mapped);
            setCategories((currentCats) => {
              catalogService.syncWithFirestore(mapped, currentCats);
              return currentCats;
            });
          }
        },
      },
      {
        type: 'categories',
        updater: () => {
          const cmsCats = cmsService.getAll<import('../types/cms').CmsCategory>('categories');
          if (isMounted) {
            const mapped: FirestoreCategory[] = cmsCats.map((c) => ({
              id: c.id,
              division: c.divisionId as any,
              name: c.name,
              slug: c.slug || c.id,
              description: c.description,
              imageUrl: (c as any).imageUrl || '',
              order: (c as any).order || (c as any).sortOrder || 0,
              status: (c.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
              createdAt: (c as any).createdAt || new Date().toISOString(),
              updatedAt: (c as any).updatedAt || new Date().toISOString(),
            }));
            setCategories(mapped);
          }
        },
      },
      {
        type: 'portfolio',
        updater: () => {
          const cmsPort = cmsService.getAll<import('../types/cms').CmsPortfolioProject>('portfolio');
          if (isMounted) setPortfolio(cmsPort as any);
        },
      },
      {
        type: 'gallery',
        updater: () => {
          const cmsGal = cmsService.getAll<import('../types/cms').CmsGalleryItem>('gallery');
          if (isMounted) setGallery(cmsGal as any);
        },
      },
      {
        type: 'milestones',
        updater: () => {
          const cmsMs = cmsService.getAll<import('../types/cms').CmsMilestone>('milestones');
          if (isMounted) setMilestones(cmsMs as any);
        },
      },
      {
        type: 'companies',
        updater: () => {
          const cmsCompanies = cmsService.getAll<import('../types/cms').CmsTrustedCompany>('companies');
          if (isMounted) setTrustedCompanies(cmsCompanies as any);
        },
      },
      {
        type: 'testimonials',
        updater: () => {
          const cmsReviews = cmsService.getAll<import('../types/cms').CmsTestimonial>('testimonials');
          if (isMounted) setTestimonials(cmsReviews as any);
        },
      },
    ];

    const cmsUnsubscribers = entitiesToListen.map(({ type, updater }) =>
      cmsService.subscribe(type, updater)
    );

    // Fallback safety timer: ensure loader never hangs if network is slow
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsInitialLoading(false);
        setIsReady(true);
      }
    }, 2000);

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
      unsubPort();
      unsubGal();
      cmsUnsubscribers.forEach((u) => u());
    };
  }, []);

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
      gallery,
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
      gallery,
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
      contactPhone: siteSettings.maintenance?.contactPhone || companySettings.primaryPhone || '+94 77 000 0000',
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
      const cleanId = id.replace('div-', '');
      return divisions.find((d) => d.id === id || d.id === `div-${cleanId}` || d.id === cleanId);
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
    const cleanId = divisionId.replace('div-', '');
    return divisions.find((d) => d.id === divisionId || d.id === `div-${cleanId}` || d.id === cleanId) || null;
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

// Modular Sub-Providers for composable architecture
export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const DivisionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

