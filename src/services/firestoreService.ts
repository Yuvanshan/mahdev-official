/**
 * Mahdev Cloud Firestore Database Repository Service (Phase 22)
 * High-level typed data operations connecting all core entity collections to Cloud Firestore.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
} from '../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../lib/firebase';
import {
  FirestoreUser,
  FirestoreDivision,
  FirestoreService,
  FirestoreProduct,
  FirestoreCategory,
  FirestoreBooking,
  FirestoreOrder,
  FirestorePayment,
  FirestoreCompanySettings,
  FirestoreSiteSettings,
  FirestoreCoupon,
  FirestoreNotification,
  FirestoreAuditLog,
  FirestoreContactSubmission,
  FirestoreQuoteRequest,
  DivisionId,
} from '../types/firestore';
import { COMPANY_INFO } from '../config/company';

export const COLLECTIONS = {
  USERS: 'users',
  ROLES: 'roles',
  DIVISIONS: 'divisions',
  SERVICES: 'services',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  PRODUCT_VARIANTS: 'productVariants',
  INVENTORY: 'inventory',
  BOOKINGS: 'bookings',
  ORDERS: 'orders',
  ORDER_ITEMS: 'orderItems',
  PAYMENTS: 'payments',
  PORTFOLIO: 'portfolio',
  GALLERY: 'gallery',
  MILESTONES: 'milestones',
  TRUSTED_COMPANIES: 'trustedCompanies',
  TESTIMONIALS: 'testimonials',
  PAGES: 'pages',
  SETTINGS: 'settings',
  COUPONS: 'coupons',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'auditLogs',
  CONTACT_SUBMISSIONS: 'contactSubmissions',
  QUOTE_REQUESTS: 'quoteRequests',
} as const;

class FirestoreServiceRepository {
  // ==========================================
  // USERS
  // ==========================================
  async getUser(uid: string): Promise<FirestoreUser | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      return snap.exists() ? (snap.data() as FirestoreUser) : null;
    } catch (err) {
      console.warn('[Firestore] getUser error:', err);
      return null;
    }
  }

  async setUser(uid: string, user: Partial<FirestoreUser>): Promise<void> {
    const ref = doc(db, COLLECTIONS.USERS, uid);
    const existing = await this.getUser(uid);
    const now = new Date().toISOString();
    const payload: FirestoreUser = sanitizeForFirestore({
      uid,
      name: user.name || existing?.name || 'Mahdev User',
      email: user.email || existing?.email || '',
      phone: user.phone || existing?.phone || '',
      photoURL: user.photoURL || existing?.photoURL || '',
      role: user.role || existing?.role || 'customer',
      status: user.status || existing?.status || 'active',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    });
    await setDoc(ref, payload, { merge: true });
  }

  // ==========================================
  // DIVISIONS
  // ==========================================
  async getDivisions(): Promise<FirestoreDivision[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.DIVISIONS));
      if (snap.empty) {
        return this.getDefaultDivisions();
      }
      return snap.docs.map((d) => d.data() as FirestoreDivision);
    } catch (err) {
      console.warn('[Firestore] getDivisions error:', err);
      return this.getDefaultDivisions();
    }
  }

  async getDivision(id: DivisionId): Promise<FirestoreDivision | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.DIVISIONS, id));
      if (snap.exists()) {
        return snap.data() as FirestoreDivision;
      }
      return this.getDefaultDivisions().find((d) => d.id === id) || null;
    } catch (err) {
      console.warn('[Firestore] getDivision error:', err);
      return this.getDefaultDivisions().find((d) => d.id === id) || null;
    }
  }

  async setDivision(id: DivisionId, data: Partial<FirestoreDivision>): Promise<void> {
    const ref = doc(db, COLLECTIONS.DIVISIONS, id);
    const now = new Date().toISOString();
    await setDoc(ref, sanitizeForFirestore({ ...data, id, updatedAt: now }), { merge: true });
  }

  // ==========================================
  // SERVICES
  // ==========================================
  async getServices(division?: DivisionId): Promise<FirestoreService[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (division) {
        constraints.push(where('division', '==', division));
      }
      const q = query(collection(db, COLLECTIONS.SERVICES), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreService));
    } catch (err) {
      console.warn('[Firestore] getServices error:', err);
      return [];
    }
  }

  async saveService(service: FirestoreService): Promise<void> {
    const ref = doc(db, COLLECTIONS.SERVICES, service.id);
    const now = new Date().toISOString();
    await setDoc(ref, sanitizeForFirestore({ ...service, updatedAt: now }), { merge: true });
  }

  // ==========================================
  // PRODUCTS & CATEGORIES
  // ==========================================
  async getProducts(division?: DivisionId): Promise<FirestoreProduct[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (division) {
        constraints.push(where('division', '==', division));
      }
      const q = query(collection(db, COLLECTIONS.PRODUCTS), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreProduct));
    } catch (err) {
      console.warn('[Firestore] getProducts error:', err);
      return [];
    }
  }

  async saveProduct(product: FirestoreProduct): Promise<void> {
    const ref = doc(db, COLLECTIONS.PRODUCTS, product.id);
    const now = new Date().toISOString();
    await setDoc(ref, sanitizeForFirestore({ ...product, updatedAt: now }), { merge: true });
  }

  async getCategories(division?: DivisionId): Promise<FirestoreCategory[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (division) {
        constraints.push(where('division', '==', division));
      }
      const q = query(collection(db, COLLECTIONS.CATEGORIES), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreCategory));
    } catch (err) {
      console.warn('[Firestore] getCategories error:', err);
      return [];
    }
  }

  async saveCategory(category: FirestoreCategory): Promise<void> {
    const ref = doc(db, COLLECTIONS.CATEGORIES, category.id);
    await setDoc(ref, sanitizeForFirestore(category), { merge: true });
  }

  // ==========================================
  // BOOKINGS
  // ==========================================
  async getBookings(customerId?: string): Promise<FirestoreBooking[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (customerId) {
        constraints.push(where('customerId', '==', customerId));
      }
      const q = query(collection(db, COLLECTIONS.BOOKINGS), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreBooking));
    } catch (err) {
      console.warn('[Firestore] getBookings error:', err);
      return [];
    }
  }

  async getBooking(id: string): Promise<FirestoreBooking | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.BOOKINGS, id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreBooking) : null;
    } catch (err) {
      console.warn('[Firestore] getBooking error:', err);
      return null;
    }
  }

  async createBooking(booking: FirestoreBooking): Promise<void> {
    const ref = doc(db, COLLECTIONS.BOOKINGS, booking.id);
    const now = new Date().toISOString();
    await setDoc(ref, sanitizeForFirestore({
      ...booking,
      createdAt: booking.createdAt || now,
      updatedAt: now,
    }));
  }

  async updateBooking(id: string, updates: Partial<FirestoreBooking>): Promise<void> {
    const ref = doc(db, COLLECTIONS.BOOKINGS, id);
    const now = new Date().toISOString();
    await updateDoc(ref, sanitizeForFirestore({ ...updates, updatedAt: now }));
  }

  // ==========================================
  // ORDERS
  // ==========================================
  async getOrders(customerId?: string): Promise<FirestoreOrder[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (customerId) {
        constraints.push(where('customerId', '==', customerId));
      }
      const q = query(collection(db, COLLECTIONS.ORDERS), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
    } catch (err) {
      console.warn('[Firestore] getOrders error:', err);
      return [];
    }
  }

  async getOrder(id: string): Promise<FirestoreOrder | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.ORDERS, id));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreOrder) : null;
    } catch (err) {
      console.warn('[Firestore] getOrder error:', err);
      return null;
    }
  }

  async createOrder(order: FirestoreOrder): Promise<void> {
    const ref = doc(db, COLLECTIONS.ORDERS, order.id);
    const now = new Date().toISOString();
    await setDoc(ref, sanitizeForFirestore({
      ...order,
      createdAt: order.createdAt || now,
      updatedAt: now,
    }));
  }

  async updateOrder(id: string, updates: Partial<FirestoreOrder>): Promise<void> {
    const ref = doc(db, COLLECTIONS.ORDERS, id);
    const now = new Date().toISOString();
    await updateDoc(ref, sanitizeForFirestore({ ...updates, updatedAt: now }));
  }

  // ==========================================
  // SETTINGS (CENTRALIZED)
  // ==========================================
  async getCompanySettings(): Promise<FirestoreCompanySettings> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'company'));
      if (snap.exists()) {
        return snap.data() as FirestoreCompanySettings;
      }
    } catch (err) {
      console.warn('[Firestore] getCompanySettings error, using defaults:', err);
    }
    // Fallback to Phase 21 official single source of truth
    return {
      name: COMPANY_INFO.name,
      legalName: COMPANY_INFO.legalName,
      registrationNumber: COMPANY_INFO.registrationNumber || 'PV-00289410',
      tagline: COMPANY_INFO.tagline,
      description: COMPANY_INFO.description,
      domain: COMPANY_INFO.domain,
      email: COMPANY_INFO.email,
      primaryPhone: COMPANY_INFO.primaryPhone,
      secondaryPhone: COMPANY_INFO.secondaryPhone,
      phones: COMPANY_INFO.phones,
      offices: {
        colombo: {
          name: COMPANY_INFO.offices.colombo.name,
          address: COMPANY_INFO.offices.colombo.address,
          city: COMPANY_INFO.offices.colombo.city,
          country: COMPANY_INFO.offices.colombo.country,
          isHeadquarters: COMPANY_INFO.offices.colombo.isHeadquarters,
          mapQuery: COMPANY_INFO.offices.colombo.mapQuery,
        },
        trincomalee: {
          name: COMPANY_INFO.offices.trincomalee.name,
          address: COMPANY_INFO.offices.trincomalee.address,
          city: COMPANY_INFO.offices.trincomalee.city,
          country: COMPANY_INFO.offices.trincomalee.country,
          isHeadquarters: COMPANY_INFO.offices.trincomalee.isHeadquarters,
          mapQuery: COMPANY_INFO.offices.trincomalee.mapQuery,
        },
      },
      socials: COMPANY_INFO.socials as Record<string, string>,
      workingHours: COMPANY_INFO.workingHours as Record<string, string>,
      updatedAt: new Date().toISOString(),
    };
  }

  async setCompanySettings(data: Partial<FirestoreCompanySettings>): Promise<void> {
    const ref = doc(db, COLLECTIONS.SETTINGS, 'company');
    const now = new Date().toISOString();
    await setDoc(ref, sanitizeForFirestore({ ...data, updatedAt: now }), { merge: true });
  }

  async getSiteSettings(): Promise<FirestoreSiteSettings> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'site'));
      if (snap.exists()) {
        return snap.data() as FirestoreSiteSettings;
      }
    } catch (err) {
      console.warn('[Firestore] getSiteSettings error:', err);
    }
    return {
      siteName: 'Mahdev Pvt Ltd',
      maintenanceMode: false,
      currency: 'USD',
      taxRate: 0,
      announcement: {
        enabled: true,
        text: 'Universal Enterprise Ecosystem Active • Colombo & Trincomalee Hotlines Online',
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async setSiteSettings(data: Partial<FirestoreSiteSettings>): Promise<void> {
    const ref = doc(db, COLLECTIONS.SETTINGS, 'site');
    const now = new Date().toISOString();
    await setDoc(ref, sanitizeForFirestore({ ...data, updatedAt: now }), { merge: true });
  }

  // ==========================================
  // INQUIRIES & SUBMISSIONS
  // ==========================================
  async submitContact(inquiry: Omit<FirestoreContactSubmission, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const id = `INQ-${Date.now()}`;
    const ref = doc(db, COLLECTIONS.CONTACT_SUBMISSIONS, id);
    const payload: FirestoreContactSubmission = sanitizeForFirestore({
      id,
      ...inquiry,
      status: 'new',
      createdAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return id;
  }

  async submitQuoteRequest(quote: Omit<FirestoreQuoteRequest, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const id = `QTE-${Date.now()}`;
    const ref = doc(db, COLLECTIONS.QUOTE_REQUESTS, id);
    const payload: FirestoreQuoteRequest = sanitizeForFirestore({
      id,
      ...quote,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    await setDoc(ref, payload);
    return id;
  }

  async logAudit(log: Omit<FirestoreAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const id = `LOG-${Date.now()}`;
      const ref = doc(db, COLLECTIONS.AUDIT_LOGS, id);
      await setDoc(ref, sanitizeForFirestore({
        id,
        ...log,
        timestamp: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('[Firestore] logAudit non-fatal error:', err);
    }
  }

  // ==========================================
  // INITIAL SEEDING HELPER
  // ==========================================
  async seedInitialFirestoreData(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Seed Company Settings
      const companyRef = doc(db, COLLECTIONS.SETTINGS, 'company');
      const companySnap = await getDoc(companyRef);
      if (!companySnap.exists()) {
        const companySettings = await this.getCompanySettings();
        await setDoc(companyRef, sanitizeForFirestore(companySettings));
      }

      // 2. Seed Site Settings
      const siteRef = doc(db, COLLECTIONS.SETTINGS, 'site');
      const siteSnap = await getDoc(siteRef);
      if (!siteSnap.exists()) {
        const siteSettings = await this.getSiteSettings();
        await setDoc(siteRef, sanitizeForFirestore(siteSettings));
      }

      // 3. Seed Divisions
      for (const division of this.getDefaultDivisions()) {
        const divRef = doc(db, COLLECTIONS.DIVISIONS, division.id);
        const divSnap = await getDoc(divRef);
        if (!divSnap.exists()) {
          await setDoc(divRef, sanitizeForFirestore(division));
        }
      }

      return { success: true, message: 'Firestore baseline seeded successfully.' };
    } catch (err) {
      console.error('[Firestore] Seeding error:', err);
      return { success: false, message: String(err) };
    }
  }

  private getDefaultDivisions(): FirestoreDivision[] {
    return [
      {
        id: 'sws',
        name: 'SWS Event Management',
        slug: 'sws',
        route: '/sws',
        description: 'Elite corporate summits, theatrical galas, luxury weddings, and 360° technical staging.',
        logo: '/assets/images/sws_logo.png',
        hero: {
          title: 'Orchestrating Extraordinary Experiences',
          subtitle: 'Comprehensive Event Planning, Sound, Lighting & Stage Architecture',
          badge: 'Division 01 • SWS Event Management',
          bgImage: '/assets/images/hero_sws.jpg',
          ctaText: 'Explore Productions & Booking',
        },
        status: 'active',
        seo: {
          metaTitle: 'SWS Event Management | Mahdev Pvt Ltd',
          metaDescription: 'Leading event production, concert audio, lighting, and wedding planning in Sri Lanka.',
          keywords: ['events', 'weddings', 'lighting', 'audio staging', 'colombo'],
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'u1',
        name: 'U1 Studio',
        slug: 'u1',
        route: '/u1',
        description: 'Cinema-grade cinematography, high-fashion photography, aerial drone capture, and post-production.',
        logo: '/assets/images/u1_logo.png',
        hero: {
          title: 'Visual Storytelling at Cinematic Scale',
          subtitle: 'RED & ARRI Capture, Studio Portraits, Commercial Ads & Color Grading',
          badge: 'Division 02 • U1 Studio',
          bgImage: '/assets/images/hero_u1.jpg',
          ctaText: 'View Portfolio & Book Shoots',
        },
        status: 'active',
        seo: {
          metaTitle: 'U1 Studio | Mahdev Pvt Ltd',
          metaDescription: 'High-end photography, cinema production, and creative media studio.',
          keywords: ['photography', 'cinematography', 'commercial video', 'studio'],
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'it',
        name: 'Mahdev IT & Solutions',
        slug: 'it',
        route: '/it',
        description: 'Enterprise full-stack architectures, high-performance web systems, cloud DevOps, and AI software.',
        logo: '/assets/images/it_logo.png',
        hero: {
          title: 'Engineering Digital Transformation',
          subtitle: 'Custom Software, Secure Cloud Infrastructure, AI & Mobile Apps',
          badge: 'Division 03 • Mahdev IT & Solutions',
          bgImage: '/assets/images/hero_it.jpg',
          ctaText: 'Deploy Enterprise Systems',
        },
        status: 'active',
        seo: {
          metaTitle: 'Mahdev IT & Solutions | Enterprise Software Engineering',
          metaDescription: 'Cutting-edge web apps, mobile solutions, cloud architecture, and cybersecurity.',
          keywords: ['software development', 'cloud', 'ai', 'devops', 'web apps'],
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'travels',
        name: 'Mahdev Travels',
        slug: 'travels',
        route: '/travels',
        description: 'Curated luxury expeditions, private chauffeur fleets, Ceylon cultural tours, and VIP safari retreats.',
        logo: '/assets/images/travels_logo.png',
        hero: {
          title: 'Unrivaled Expeditions Across Sri Lanka',
          subtitle: 'Luxury Transport, VIP Wild Safaris, Heritage Journeys & Bespoke Itineraries',
          badge: 'Division 04 • Mahdev Travels',
          bgImage: '/assets/images/hero_travels.jpg',
          ctaText: 'Browse Tours & Reserve Transport',
        },
        status: 'active',
        seo: {
          metaTitle: 'Mahdev Travels | Luxury Sri Lanka Tours & Safaris',
          metaDescription: 'Private chauffeur tours, luxury wildlife safaris, and bespoke Ceylon holidays.',
          keywords: ['travel', 'sri lanka tours', 'luxury safaris', 'chauffeur'],
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'mart',
        name: 'Mahdev Online Mart',
        slug: 'online-mart',
        description: 'Premium curated merchandise, event tech gear, Ceylon artisanal goods, and organic wellness products.',
        logo: '/assets/images/mart_logo.png',
        hero: {
          title: 'Premium Goods Delivered to Your Door',
          subtitle: 'Islandwide Logistics, Pro Equipment & Handcrafted Curations',
          badge: 'Division 05 • Mahdev Online Mart',
          bgImage: '/assets/images/hero_mart.jpg',
          ctaText: 'Shop All Mart Categories',
        },
        status: 'active',
        seo: {
          metaTitle: 'Mahdev Online Mart | Curated Enterprise & Lifestyle Commerce',
          metaDescription: 'Shop pro gear, event items, and artisanal Ceylon lifestyle products.',
          keywords: ['online shopping', 'ecommerce', 'pro audio gear', 'colombo delivery'],
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];
  }
}

export const firestoreService = new FirestoreServiceRepository();
