/**
 * Real-Time Firestore Dashboard Hook (Phase 55)
 * Subscribes to live Firestore collections and provides strictly real computed metrics.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FirestoreOrder,
  FirestoreBooking,
  FirestoreProduct,
  FirestoreService,
  FirestoreUser,
  FirestoreDivision,
  FirestoreContactSubmission,
  FirestoreTestimonial,
  FirestoreCompanySettings,
} from '../types/firestore';
import { firestoreOrdersService } from '../services/firestore/orders';
import { firestoreBookingsService } from '../services/firestore/bookings';
import { firestoreProductsService } from '../services/firestore/products';
import { firestoreServicesService } from '../services/firestore/services';
import { firestoreUsersService } from '../services/firestore/users';
import { firestoreDivisionsService } from '../services/firestore/divisions';
import { firestoreContactsService } from '../services/firestore/contacts';
import { firestoreTestimonialsService } from '../services/firestore/testimonials';
import { firestoreSettingsService } from '../services/firestore/settings';
import {
  DashboardDateFilter,
  RealFirestoreDashboardTelemetry,
  computeDashboardTelemetry,
} from '../services/firestore/dashboard';

export interface UseFirestoreDashboardResult {
  telemetry: RealFirestoreDashboardTelemetry;
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  filter: DashboardDateFilter;
  setFilter: (f: DashboardDateFilter) => void;
  customStartDate: string;
  setCustomStartDate: (d: string) => void;
  customEndDate: string;
  setCustomEndDate: (d: string) => void;
  refresh: () => Promise<void>;
  rawCollections: {
    orders: FirestoreOrder[];
    bookings: FirestoreBooking[];
    products: FirestoreProduct[];
    services: FirestoreService[];
    users: FirestoreUser[];
    divisions: FirestoreDivision[];
    contacts: FirestoreContactSubmission[];
    testimonials: FirestoreTestimonial[];
  };
}

export function useFirestoreDashboard(
  initialFilter: DashboardDateFilter = 'all_time'
): UseFirestoreDashboardResult {
  const [filter, setFilter] = useState<DashboardDateFilter>(initialFilter);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Raw Firestore document sets
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [bookings, setBookings] = useState<FirestoreBooking[]>([]);
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [services, setServices] = useState<FirestoreService[]>([]);
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [divisions, setDivisions] = useState<FirestoreDivision[]>([]);
  const [contacts, setContacts] = useState<FirestoreContactSubmission[]>([]);
  const [testimonials, setTestimonials] = useState<FirestoreTestimonial[]>([]);
  const [companySettings, setCompanySettings] = useState<FirestoreCompanySettings | null>(null);

  // Manual one-time refresh / fetch
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [
        allOrders,
        allBookings,
        allProducts,
        allServices,
        allUsers,
        allDivisions,
        allContacts,
        allTestimonials,
        settings,
      ] = await Promise.all([
        firestoreOrdersService.getAllOrders(),
        firestoreBookingsService.getAllBookings(),
        firestoreProductsService.getProducts(undefined, true),
        firestoreServicesService.getServices(undefined, true),
        firestoreUsersService.getAllUsers(),
        firestoreDivisionsService.getDivisions(true),
        firestoreContactsService.getContacts(),
        firestoreTestimonialsService.getTestimonials(undefined, true),
        firestoreSettingsService.getCompanySettings(true),
      ]);

      setOrders(allOrders);
      setBookings(allBookings);
      setProducts(allProducts);
      setServices(allServices);
      setUsers(allUsers);
      setDivisions(allDivisions);
      setContacts(allContacts);
      setTestimonials(allTestimonials);
      setCompanySettings(settings);
    } catch (err) {
      console.error('[useFirestoreDashboard] Refresh error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, []);

  // Realtime Subscriptions
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const handleError = (err: Error) => {
      console.warn('[useFirestoreDashboard] Subscription notice:', err);
      if (isMounted) {
        setError(err);
        setIsLoading(false);
      }
    };

    // 1. Initial snapshot fetch
    refresh();

    // 2. Real-time listeners
    const unsubOrders = firestoreOrdersService.subscribeAllOrders((data) => {
      if (isMounted) {
        setOrders(data);
        setIsLoading(false);
        setIsReady(true);
      }
    }, handleError);

    const unsubBookings = firestoreBookingsService.subscribeAllBookings((data) => {
      if (isMounted) {
        setBookings(data);
      }
    }, handleError);

    const unsubProducts = firestoreProductsService.subscribeProducts((data) => {
      if (isMounted) {
        setProducts(data);
      }
    });

    const unsubServices = firestoreServicesService.subscribeServices((data) => {
      if (isMounted) {
        setServices(data);
      }
    });

    const unsubUsers = firestoreUsersService.subscribeUsers((data) => {
      if (isMounted) {
        setUsers(data);
      }
    }, handleError);

    const unsubDivisions = firestoreDivisionsService.subscribeDivisions((data) => {
      if (isMounted) {
        setDivisions(data);
      }
    });

    const unsubContacts = firestoreContactsService.subscribeContacts((data) => {
      if (isMounted) {
        setContacts(data);
      }
    }, handleError);

    const unsubTestimonials = firestoreTestimonialsService.subscribeTestimonials((data) => {
      if (isMounted) {
        setTestimonials(data);
      }
    });

    const unsubSettings = firestoreSettingsService.subscribeCompanySettings((data) => {
      if (isMounted) {
        setCompanySettings(data);
      }
    });

    return () => {
      isMounted = false;
      unsubOrders();
      unsubBookings();
      unsubProducts();
      unsubServices();
      unsubUsers();
      unsubDivisions();
      unsubContacts();
      unsubTestimonials();
      unsubSettings();
    };
  }, [refresh]);

  // Purely computed telemetry
  const telemetry = useMemo<RealFirestoreDashboardTelemetry>(() => {
    return computeDashboardTelemetry(
      orders,
      bookings,
      products,
      services,
      users,
      divisions,
      contacts,
      testimonials,
      companySettings,
      filter,
      filter === 'custom' ? { start: customStartDate, end: customEndDate } : undefined
    );
  }, [
    orders,
    bookings,
    products,
    services,
    users,
    divisions,
    contacts,
    testimonials,
    companySettings,
    filter,
    customStartDate,
    customEndDate,
  ]);

  return {
    telemetry,
    isLoading: isLoading && !isReady,
    isReady,
    error,
    filter,
    setFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    refresh,
    rawCollections: {
      orders,
      bookings,
      products,
      services,
      users,
      divisions,
      contacts,
      testimonials,
    },
  };
}
