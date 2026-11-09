/**
 * React Hooks for Firestore Data Access (Phase 52 Single Source of Truth)
 * Consumes the central FirestoreDataContext to provide unified realtime sync,
 * single socket/listener management, and zero duplicate fetches.
 */

import { useMemo } from 'react';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import {
  FirestoreCompanySettings,
  FirestoreSiteSettings,
  FirestoreDivision,
  FirestoreService,
  FirestoreProduct,
  FirestoreCategory,
  FirestorePortfolio,
  FirestoreGallery,
  FirestoreMilestone,
  FirestoreTrustedCompany,
  FirestoreTestimonial,
  DivisionId,
} from '../types/firestore';

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  isEmpty: boolean;
  refresh: () => Promise<void>;
}

export interface ProductQueryOptions {
  division?: string;
  category?: string;
  categoryId?: string;
  isFeatured?: boolean;
}

/**
 * Hook for Company Settings (Realtime from central context)
 */
export function useCompanySettings(): AsyncState<FirestoreCompanySettings> {
  const { companySettings, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  return {
    data: (companySettings || {}) as FirestoreCompanySettings,
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: !companySettings || !companySettings.name,
    refresh: refreshAll,
  };
}

/**
 * Hook for Site Settings (Realtime from central context)
 */
export function useSiteSettings(): AsyncState<FirestoreSiteSettings> {
  const { siteSettings, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  return {
    data: (siteSettings || {}) as FirestoreSiteSettings,
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: !siteSettings || !siteSettings.siteName,
    refresh: refreshAll,
  };
}

/**
 * Hook for Divisions (Realtime from central context)
 */
export function useDivisions(): AsyncState<FirestoreDivision[]> {
  const { divisions, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  return {
    data: divisions || [],
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: !divisions || divisions.length === 0,
    refresh: refreshAll,
  };
}

/**
 * Hook for Services (Realtime from central context, optional division filter)
 */
export function useServices(divisionId?: DivisionId | 'all'): AsyncState<FirestoreService[]> {
  const { services, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  const filtered = useMemo(() => {
    if (!services) return [];
    if (!divisionId || divisionId === 'all') return services;
    return services.filter((s) => s.division === divisionId);
  }, [services, divisionId]);

  return {
    data: filtered,
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: filtered.length === 0,
    refresh: refreshAll,
  };
}

/**
 * Hook for Products (Realtime from central context, optional query options)
 */
export function useProducts(options?: ProductQueryOptions): AsyncState<FirestoreProduct[]> {
  const { products, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      if (options?.division && p.division !== options.division) return false;
      const targetCategory = options?.categoryId || options?.category;
      if (targetCategory && p.categoryId !== targetCategory) return false;
      return true;
    });
  }, [products, options?.division, options?.category, options?.categoryId]);

  return {
    data: filtered,
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: filtered.length === 0,
    refresh: refreshAll,
  };
}

/**
 * Hook for Categories (Realtime from central context, optional division filter)
 */
export function useCategories(divisionId?: DivisionId | 'all'): AsyncState<FirestoreCategory[]> {
  const { categories, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  const filtered = useMemo(() => {
    if (!categories) return [];
    if (!divisionId || divisionId === 'all') return categories;
    return categories.filter((c) => c.division === divisionId);
  }, [categories, divisionId]);

  return {
    data: filtered,
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: filtered.length === 0,
    refresh: refreshAll,
  };
}

/**
 * Hook for Portfolio Projects (Realtime from central context, optional division filter)
 */
export function usePortfolio(divisionId?: DivisionId | 'all'): AsyncState<FirestorePortfolio[]> {
  const { portfolio, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  const filtered = useMemo(() => {
    if (!portfolio) return [];
    if (!divisionId || divisionId === 'all') return portfolio;
    return portfolio.filter((p) => p.division === divisionId);
  }, [portfolio, divisionId]);

  return {
    data: filtered,
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: filtered.length === 0,
    refresh: refreshAll,
  };
}

/**
 * Hook for Gallery Items (Realtime from central context, optional division filter)
 */
export function useGallery(divisionId?: DivisionId | 'all'): AsyncState<FirestoreGallery[]> {
  const { gallery, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  const filtered = useMemo(() => {
    if (!gallery) return [];
    if (!divisionId || divisionId === 'all') return gallery;
    return gallery.filter((g) => g.division === divisionId);
  }, [gallery, divisionId]);

  return {
    data: filtered,
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: filtered.length === 0,
    refresh: refreshAll,
  };
}

/**
 * Hook for Milestones (Realtime from central context)
 */
export function useMilestones(): AsyncState<FirestoreMilestone[]> {
  const { milestones, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  return {
    data: milestones || [],
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: !milestones || milestones.length === 0,
    refresh: refreshAll,
  };
}

/**
 * Hook for Trusted Enterprise Companies (Realtime from central context)
 */
export function useTrustedCompanies(): AsyncState<FirestoreTrustedCompany[]> {
  const { trustedCompanies, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  return {
    data: trustedCompanies || [],
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: !trustedCompanies || trustedCompanies.length === 0,
    refresh: refreshAll,
  };
}

/**
 * Hook for Testimonials (Realtime from central context, optional division filter)
 */
export function useTestimonials(divisionId?: DivisionId | 'all'): AsyncState<FirestoreTestimonial[]> {
  const { testimonials, isInitialLoading, error, refreshAll } = useFirestoreDataContext();

  const filtered = useMemo(() => {
    if (!testimonials) return [];
    if (!divisionId || divisionId === 'all') return testimonials;
    return testimonials.filter((t) => t.division === divisionId);
  }, [testimonials, divisionId]);

  return {
    data: filtered,
    loading: isInitialLoading,
    error: error ? (error instanceof Error ? error : new Error(String(error))) : null,
    isEmpty: filtered.length === 0,
    refresh: refreshAll,
  };
}
