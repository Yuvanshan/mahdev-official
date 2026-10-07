import {
  AdminUser,
  AdminSession,
  AdminDashboardStats,
  InventoryAlertItem,
  AuditLogEntry,
} from '../types/admin';
import { orderService } from './orderService';
import { bookingService } from './bookingService';
import { paymentService } from './paymentService';
import { authService } from './authService';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, setDoc } from '../lib/tursoFirestore';
import { FirestoreOrder, FirestoreBooking, FirestoreProduct } from '../types/firestore';

export async function syncAdminServerSession(adminUser: AdminUser): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/auth/verify', { cache: 'no-store' });
    const result = await response.json() as { success?: boolean; user?: AdminUser };
    return Boolean(response.ok && result.success && result.user?.email === adminUser.email);
  } catch (error) {
    console.error('[AdminService] Admin server-session check failed:', error);
    return false;
  }
}

class AdminService {
  private currentSession: AdminSession | null = null;

  constructor() {}

  public async restoreSession(): Promise<AdminSession | null> {
    try {
      const response = await fetch('/api/admin/auth/verify', { cache: 'no-store' });
      if (!response.ok) return null;
      const result = await response.json() as {
        success?: boolean;
        user?: AdminUser;
        expiresAt?: string;
      };
      if (!result.success || !result.user || !result.expiresAt) return null;
      const session: AdminSession = {
        token: '',
        user: result.user,
        expiresAt: result.expiresAt,
        signature: 'server-cookie-session',
      };
      this.currentSession = session;
      return session;
    } catch (error) {
      console.error('[AdminService] Could not restore admin session:', error);
      return null;
    }
  }

  private async validateRestoredSession(session: AdminSession): Promise<void> {
    try {
      await auth.authStateReady();
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.emailVerified) {
        throw new Error('A verified Firebase session is required.');
      }
      const tokenResult = await currentUser.getIdTokenResult();
      const response = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenResult.token}` },
      });
      const result = await response.json() as { success?: boolean; user?: AdminUser };
      if (!response.ok || !result.success || !result.user) {
        throw new Error('The Firebase account is no longer authorized for admin access.');
      }

      const refreshedSession: AdminSession = {
        ...session,
        token: '',
        user: result.user,
        expiresAt: tokenResult.expirationTime,
      };
      this.currentSession = refreshedSession;
    } catch (error) {
      console.warn('[AdminService] Stored admin session validation failed:', error);
      if (this.currentSession === session) this.currentSession = null;
      await signOut(auth);
    }
  }

  public getCurrentSession(): AdminSession | null {
    return this.currentSession;
  }

  public getCurrentAdmin(): AdminUser | null {
    return this.currentSession ? this.currentSession.user : null;
  }

  public isAuthenticated(): boolean {
    if (!this.currentSession) return false;
    return new Date(this.currentSession.expiresAt).getTime() > Date.now();
  }

  public async login(
    email: string,
    password?: string,
    _pin?: string
  ): Promise<{ success: boolean; session?: AdminSession; error?: string }> {
    if (!password) {
      return { success: false, error: 'Enter your administrator password.' };
    }

    try {
      {
        const response = await fetch('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const result = await response.json() as {
          success?: boolean;
          user?: AdminUser;
          expiresAt?: string;
          error?: string;
        };
        if (!response.ok || !result.success || !result.user || !result.expiresAt) {
          return { success: false, error: result.error || 'Admin sign-in was rejected.' };
        }
        const session: AdminSession = {
          token: '',
          user: result.user,
          expiresAt: result.expiresAt,
          signature: 'server-cookie-session',
        };
        this.currentSession = session;
        await this.logAudit({
          action: 'ADMIN_PORTAL_SIGNIN',
          entityType: 'Authentication',
          entityId: result.user.id,
          details: `Server-authenticated admin sign-in for ${result.user.name}.`,
          status: 'success',
        });
        return { success: true, session };
      }

      /* Legacy Firebase sign-in is unreachable; admin identity is server-session based. */
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!credential.user.emailVerified) {
        await signOut(auth);
        return { success: false, error: 'Verify your email address before signing in to the admin portal.' };
      }

      const tokenResult = await credential.user.getIdTokenResult(true);
      const response = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenResult.token}` },
      });
      const result = await response.json() as {
        success?: boolean;
        user?: AdminUser;
        error?: string;
      };
      if (!response.ok || !result.success || !result.user) {
        await signOut(auth);
        return {
          success: false,
          error: result.error || 'This account is not authorized for admin access.',
        };
      }

      const session: AdminSession = {
        token: '',
        user: result.user,
        expiresAt: tokenResult.expirationTime,
        signature: 'firebase-id-token-verified',
      };
      this.currentSession = session;
      await this.logAudit({
        action: 'ADMIN_PORTAL_SIGNIN',
        entityType: 'Authentication',
        entityId: result.user.id,
        details: `Server-authenticated admin sign-in for ${result.user.name}.`,
        status: 'success',
      });
      return { success: true, session };
    } catch (error) {
      console.error('[AdminService] Firebase admin sign-in failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Firebase admin sign-in failed.',
      };
    }
  }

  public async logout(): Promise<void> {
    this.currentSession = null;
    try {
      const response = await fetch('/api/admin/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('The server could not terminate the admin session.');
      return;

      /* Legacy Firebase sign-out is unreachable; admin identity is server-session based. */
      await signOut(auth);
    } catch (error) {
      console.error('[AdminService] Server sign-out failed:', error);
      throw error;
    }
  }

  public async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const [ordersSnap, bookingsSnap, productsSnap, allUsers] = await Promise.all([
        getDocs(collection(db, 'orders')).catch(() => ({ docs: [] as any[] })),
        getDocs(collection(db, 'bookings')).catch(() => ({ docs: [] as any[] })),
        getDocs(collection(db, 'products')).catch(() => ({ docs: [] as any[] })),
        authService.getAllCustomers(),
      ]);

      const allOrders: FirestoreOrder[] = ordersSnap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
      const allBookings: FirestoreBooking[] = bookingsSnap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
      const allProducts: FirestoreProduct[] = productsSnap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      // 1. Calculate Revenue genuinely
      const paidOrders = allOrders.filter(
        (o) => (o.paymentStatus as string) === 'paid' || (o.status as string) === 'completed' || (o.status as string) === 'delivered'
      );
      const paidBookings = allBookings.filter(
        (b) => (b.paymentStatus as string) === 'paid' || (b.paymentStatus as string) === 'deposit_paid' || (b.status as string) === 'completed'
      );

      const martRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const bookingRevenue = paidBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
      const totalRevenue = martRevenue + bookingRevenue;

      // Real today revenue
      const todayOrdersRevenue = paidOrders
        .filter((o) => new Date(o.createdAt || 0).getTime() >= startOfToday)
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const todayBookingsRevenue = paidBookings
        .filter((b) => new Date(b.createdAt || 0).getTime() >= startOfToday)
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
      const todayRevenue = todayOrdersRevenue + todayBookingsRevenue;

      // Real this month revenue
      const monthOrdersRevenue = paidOrders
        .filter((o) => new Date(o.createdAt || 0).getTime() >= startOfMonth)
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const monthBookingsRevenue = paidBookings
        .filter((b) => new Date(b.createdAt || 0).getTime() >= startOfMonth)
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
      const thisMonthRevenue = monthOrdersRevenue + monthBookingsRevenue;

      // 2. Orders breakdown
      const pendingOrders = allOrders.filter(
        (o) => (o.paymentStatus as string) === 'pending' || (o.paymentStatus as string) === 'unpaid' || (o.status as string) === 'pending' || (o.status as string) === 'pending_payment'
      );
      const dispatchedOrders = allOrders.filter(
        (o) => (o.status as string) === 'shipped' || (o.status as string) === 'dispatched' || (o.status as string) === 'out_for_delivery'
      );
      const completedOrders = allOrders.filter(
        (o) => (o.status as string) === 'delivered' || (o.status as string) === 'completed'
      );

      // 3. Bookings breakdown
      const pendingApprovalBookings = allBookings.filter(
        (b) => (b.status as string) === 'pending' || (b.paymentStatus as string) === 'unpaid' || (b.paymentStatus as string) === 'pending'
      );
      const scheduledBookings = allBookings.filter(
        (b) => (b.status as string) === 'confirmed' || (b.status as string) === 'scheduled'
      );
      const inProgressBookings = allBookings.filter(
        (b) => (b.status as string) === 'in_progress'
      );
      const completedBookings = allBookings.filter(
        (b) => (b.status as string) === 'completed'
      );

      // 4. Customers breakdown
      const corporateCustomers = allUsers.filter(
        (u) => (u as any).accountType === 'corporate' || (u as any).corporateDetails != null
      ).length;
      const individualCustomers = allUsers.length - corporateCustomers;

      // 5. Products & Inventory breakdown
      const inStock = allProducts.filter((p) => (p.stock || 0) > 10).length;
      const lowStock = allProducts.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
      const outOfStock = allProducts.filter((p) => (p.stock || 0) === 0).length;

      // 6. Pending Payments
      const pendingPaymentsCount = pendingOrders.length + pendingApprovalBookings.length;
      const pendingPaymentsTotal =
        pendingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) +
        pendingApprovalBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

      // 7. Inventory Alerts
      const inventoryAlerts: InventoryAlertItem[] = allProducts
        .filter((p) => (p.stock || 0) <= 10)
        .map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || p.id,
          divisionId: String(p.division || 'mart'),
          divisionName: String(p.division || 'mart').toUpperCase(),
          currentStock: p.stock || 0,
          threshold: 10,
          unitPrice: p.price || 0,
          status: (p.stock || 0) === 0 ? 'out_of_stock' : 'low_stock',
        }));

      return {
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          thisMonth: thisMonthRevenue,
          currency: 'LKR',
          growthPercent: 0,
        },
        orders: {
          total: allOrders.length,
          pending: pendingOrders.length,
          paid: paidOrders.length,
          dispatched: dispatchedOrders.length,
          completed: completedOrders.length,
        },
        bookings: {
          total: allBookings.length,
          pendingApproval: pendingApprovalBookings.length,
          scheduled: scheduledBookings.length,
          inProgress: inProgressBookings.length,
          completed: completedBookings.length,
        },
        customers: {
          total: allUsers.length,
          corporate: corporateCustomers,
          individual: Math.max(0, individualCustomers),
        },
        products: {
          total: allProducts.length,
          inStock,
          lowStock,
          outOfStock,
        },
        pendingPayments: {
          count: pendingPaymentsCount,
          totalAmount: pendingPaymentsTotal,
        },
        pendingBookings: {
          count: pendingApprovalBookings.length,
          services: pendingApprovalBookings.map((b) => b.serviceName || b.serviceId || 'Service Booking'),
        },
        inventoryAlerts,
      };
    } catch (err) {
      console.warn('[AdminService] getDashboardStats error:', err);
      return {
        revenue: { total: 0, today: 0, thisMonth: 0, currency: 'LKR', growthPercent: 0 },
        orders: { total: 0, pending: 0, paid: 0, dispatched: 0, completed: 0 },
        bookings: { total: 0, pendingApproval: 0, scheduled: 0, inProgress: 0, completed: 0 },
        customers: { total: 0, corporate: 0, individual: 0 },
        products: { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 },
        pendingPayments: { count: 0, totalAmount: 0 },
        pendingBookings: { count: 0, services: [] },
        inventoryAlerts: [],
      };
    }
  }

  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const snapshot = await getDocs(query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      ));
      return snapshot.docs.map((document) => ({
        ...document.data(),
        id: document.id,
      })) as AuditLogEntry[];
    } catch (error) {
      console.error('[AdminService] Turso audit-log read failed:', error);
      throw error;
    }
  }

  public async logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'adminEmail' | 'adminName'>): Promise<boolean> {
    const currentAdmin = this.getCurrentAdmin();
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now()}-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      adminEmail: currentAdmin?.email || 'unknown',
      adminName: currentAdmin?.name || 'Unknown administrator',
      ...entry,
    };

    try {
      await setDoc(doc(db, 'auditLogs', newEntry.id), newEntry);
      return true;
    } catch (error) {
      console.error('[AdminService] Failed to persist audit log in Turso:', error);
      return false;
    }
  }

  // Admin User Management
  public async getAdminUsers(): Promise<AdminUser[]> {
    const snapshot = await getDocs(collection(db, 'admins'));
    return snapshot.docs.map((document) => ({
      ...document.data(),
      id: document.id,
    })) as AdminUser[];
  }

  public async createAdminUser(data: Partial<AdminUser>): Promise<AdminUser> {
    const list = await this.getAdminUsers();
    const email = data.email?.trim().toLowerCase() || '';
    if (list.some((user) => user.email.toLowerCase() === email)) {
      throw new Error('An administrator with this email already exists.');
    }
    const newUser: AdminUser = {
      id: `ADM-USR-${Date.now().toString(36).toUpperCase()}`,
      username: data.username || `user_${Date.now().toString(36)}`,
      name: data.name || 'Staff Administrator',
      email: data.email || 'staff@mahdev.lk',
      role: data.role || 'editor',
      department: data.department || 'Enterprise Systems',
      divisionAccess: data.divisionScope ? [data.divisionScope] : ['all'],
      divisionScope: data.divisionScope || 'all',
      isActive: data.isActive !== undefined ? data.isActive : true,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'admins', newUser.id), newUser);

    this.logAudit({
      action: 'ADMIN_USER_PROVISIONED',
      entityType: 'UserAccount',
      entityId: newUser.id,
      details: `Provisioned console access for ${newUser.name} (${newUser.role}).`,
      status: 'success',
    });

    return newUser;
  }

  public async updateAdminUser(id: string, data: Partial<AdminUser>): Promise<AdminUser | null> {
    const list = await this.getAdminUsers();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...data,
    };

    await setDoc(doc(db, 'admins', id), updated);

    this.logAudit({
      action: 'ADMIN_USER_MODIFIED',
      entityType: 'UserAccount',
      entityId: id,
      details: `Updated console permissions for ${updated.name}.`,
      status: 'success',
    });

    return updated;
  }

  public async deleteAdminUser(id: string): Promise<boolean> {
    await deleteDoc(doc(db, 'admins', id));

    this.logAudit({
      action: 'ADMIN_USER_REVOKED',
      entityType: 'UserAccount',
      entityId: id,
      details: `Revoked administrative credentials for user ${id}.`,
      status: 'warning',
    });

    return true;
  }
}

export const adminService = new AdminService();
