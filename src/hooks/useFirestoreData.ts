/**
 * React Hooks for Firestore Data Access (Phase 23)
 * Provides Loading, Error, Empty, and Success state management with caching and realtime sync.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  firestoreSettingsService,
  firestoreDivisionsService,
  firestoreServicesService,
  firestoreProductsService,
  firestoreCategoriesService,
  firestorePortfolioService,
  firestoreGalleryService,
  firestoreMilestonesService,
  firestoreTrustedCompaniesService,
  firestoreTestimonialsService,
  ProductQueryOptions,
} from '../services/firestore';
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

/**
 * Hook for Company Settings (with realtime updates)
 */
export function useCompanySettings(): AsyncState<FirestoreCompanySettings> {
  const [data, setData] = useState<FirestoreCompanySettings>(() =>
    firestoreSettingsService.getCompanySettings ? firestoreSettingsService.getCompanySettings.length > 0 ? {} as any : {} as any : {} as any
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestoreSettingsService.getCompanySettings(true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = firestoreSettingsService.subscribeCompanySettings(
      (newSettings) => {
        setData(newSettings);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return {
    data,
    loading,
    error,
    isEmpty: !data || !data.name,
    refresh,
  };
}

/**
 * Hook for Site Settings (with realtime announcement bar)
 */
export function useSiteSettings(): AsyncState<FirestoreSiteSettings> {
  const [data, setData] = useState<FirestoreSiteSettings>({} as any);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestoreSettingsService.getSiteSettings(true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = firestoreSettingsService.subscribeSiteSettings(
      (newSettings) => {
        setData(newSettings);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return {
    data,
    loading,
    error,
    isEmpty: !data || !data.siteName,
    refresh,
  };
}

/**
 * Hook for Divisions
 */
export function useDivisions(): AsyncState<FirestoreDivision[]> {
  const [data, setData] = useState<FirestoreDivision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestoreDivisionsService.getDivisions(true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    firestoreDivisionsService
      .getDivisions()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0,
    refresh,
  };
}

/**
 * Hook for Services
 */
export function useServices(divisionId?: DivisionId): AsyncState<FirestoreService[]> {
  const [data, setData] = useState<FirestoreService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestoreServicesService.getServices(divisionId, true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [divisionId]);

  useEffect(() => {
    let isMounted = true;
    firestoreServicesService
      .getServices(divisionId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [divisionId]);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0,
    refresh,
  };
}

/**
 * Hook for Products with filtering and pagination
 */
export function useProducts(options?: ProductQueryOptions): AsyncState<FirestoreProduct[]> {
  const [data, setData] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const optionsKey = JSON.stringify(options || {});

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestoreProductsService.getProducts(options, true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [optionsKey]);

  useEffect(() => {
    let isMounted = true;
    firestoreProductsService
      .getProducts(options)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [optionsKey]);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0,
    refresh,
  };
}

/**
 * Hook for Categories
 */
export function useCategories(divisionId?: DivisionId): AsyncState<FirestoreCategory[]> {
  const [data, setData] = useState<FirestoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestoreCategoriesService.getCategories(divisionId, true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [divisionId]);

  useEffect(() => {
    let isMounted = true;
    firestoreCategoriesService
      .getCategories(divisionId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [divisionId]);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0,
    refresh,
  };
}

/**
 * Hook for Portfolio
 */
export function usePortfolio(divisionId?: DivisionId): AsyncState<FirestorePortfolio[]> {
  const [data, setData] = useState<FirestorePortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestorePortfolioService.getPortfolio(divisionId, true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [divisionId]);

  useEffect(() => {
    let isMounted = true;
    firestorePortfolioService
      .getPortfolio(divisionId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [divisionId]);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0,
    refresh,
  };
}

/**
 * Hook for Milestones
 */
export function useMilestones(): AsyncState<FirestoreMilestone[]> {
  const [data, setData] = useState<FirestoreMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestoreMilestonesService.getMilestones(true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    firestoreMilestonesService
      .getMilestones()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0,
    refresh,
  };
}

/**
 * Hook for Trusted Companies
 */
export function useTrustedCompanies(): AsyncState<FirestoreTrustedCompany[]> {
  const [data, setData] = useState<FirestoreTrustedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestoreTrustedCompaniesService.getTrustedCompanies(true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    firestoreTrustedCompaniesService
      .getTrustedCompanies()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0,
    refresh,
  };
}

/**
 * Hook for Testimonials
 */
export function useTestimonials(divisionId?: DivisionId | 'all'): AsyncState<FirestoreTestimonial[]> {
  const [data, setData] = useState<FirestoreTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await firestoreTestimonialsService.getTestimonials(divisionId, true);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [divisionId]);

  useEffect(() => {
    let isMounted = true;
    firestoreTestimonialsService
      .getTestimonials(divisionId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [divisionId]);

  return {
    data,
    loading,
    error,
    isEmpty: data.length === 0,
    refresh,
  };
}
