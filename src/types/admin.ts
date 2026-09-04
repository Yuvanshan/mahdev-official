export type AdminRole =
  | 'super_admin'
  | 'operations_admin'
  | 'operations_manager'
  | 'finance_admin'
  | 'finance_manager'
  | 'booking_coordinator'
  | 'division_manager'
  | 'editor'
  | 'auditor';

export interface AdminUser {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
  department?: string;
  divisionAccess?: string[];
  divisionScope?: string;
  isActive?: boolean;
  lastLogin?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminSession {
  token: string;
  user: AdminUser;
  expiresAt: string;
  signature: string;
}

export interface InventoryAlertItem {
  id: string;
  name: string;
  sku: string;
  divisionId: string;
  divisionName: string;
  currentStock: number;
  threshold: number;
  unitPrice: number;
  status: 'low_stock' | 'out_of_stock';
}

export interface AdminDashboardStats {
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    currency: string;
    growthPercent: number;
  };
  orders: {
    total: number;
    pending: number;
    paid: number;
    dispatched: number;
    completed: number;
  };
  bookings: {
    total: number;
    pendingApproval: number;
    scheduled: number;
    inProgress: number;
    completed: number;
  };
  customers: {
    total: number;
    corporate: number;
    individual: number;
  };
  products: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  pendingPayments: {
    count: number;
    totalAmount: number;
  };
  pendingBookings: {
    count: number;
    services: string[];
  };
  inventoryAlerts: InventoryAlertItem[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  status: 'success' | 'warning' | 'error';
}

export type AdminSectionId =
  | 'dashboard'
  | 'analytics'
  | 'homepage'
  | 'divisions'
  | 'services'
  | 'products'
  | 'categories'
  | 'packages'
  | 'portfolio'
  | 'gallery'
  | 'milestones'
  | 'companies'
  | 'testimonials'
  | 'pages'
  | 'banners'
  | 'coupons'
  | 'enquiries'
  | 'orders'
  | 'bookings'
  | 'customers'
  | 'inventory'
  | 'media'
  | 'seo'
  | 'settings'
  | 'users'
  | 'audit-logs';
