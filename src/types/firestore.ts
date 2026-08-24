/**
 * Mahdev Cloud Firestore Database Architecture & Entity Types (Phase 22)
 * Clean TypeScript definitions for all Firestore collections and document models.
 */

export type UserRole = 'customer' | 'staff' | 'manager' | 'admin' | 'superAdmin';

export type AccountStatus = 'active' | 'suspended' | 'pending';

export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export type DivisionId = 'sws' | 'u1' | 'it' | 'travels' | 'mart';

export interface FirestoreDivision {
  id: DivisionId;
  name: string;
  shortName?: string;
  accentColor?: string;
  heroHeadline?: string;
  slug: string;
  description: string;
  logo: string;
  hero: {
    title: string;
    subtitle: string;
    badge: string;
    bgImage: string;
    ctaText?: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreService {
  id: string;
  division: DivisionId | string;
  divisionId?: DivisionId | string;
  divisionName?: string;
  name: string;
  title?: string;
  slug: string;
  description: string;
  images: string[];
  price: number;
  startingPrice?: number;
  currency?: string;
  status: 'active' | 'inactive' | 'draft';
  bookingEnabled: boolean;
  quoteEnabled: boolean;
  badge?: string;
  features?: string[];
  turnaroundTime?: string;
  popular?: boolean;
  iconName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreCategory {
  id: string;
  division: DivisionId | string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  order: number;
  status: 'active' | 'inactive';
}

export interface FirestoreProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
}

export interface FirestoreProduct {
  id: string;
  division: DivisionId | string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  stock: number;
  status: 'active' | 'draft' | 'out_of_stock' | 'archived';
  hasVariants: boolean;
  variants?: FirestoreProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreInventory {
  id: string;
  productId: string;
  variantId?: string;
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export interface FirestoreBookingLocation {
  address: string;
  city?: string;
  postalCode?: string;
  venueName?: string;
}

export interface FirestoreBookingCustomer {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  preferredContactMethod?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type BookingPaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded';

export interface FirestoreBooking {
  id: string;
  customerId: string;
  customer: FirestoreBookingCustomer;
  divisionId: DivisionId | string;
  divisionName?: string;
  serviceId: string;
  serviceName?: string;
  packageId?: string;
  packageName?: string;
  date: string;
  time: string;
  location: FirestoreBookingLocation;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  price: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreOrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  division: DivisionId | string;
  selectedVariant?: {
    id: string;
    name: string;
  };
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type OrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface FirestoreOrder {
  id: string;
  customerId: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    company?: string;
    preferredContact?: string;
  };
  items: FirestoreOrderItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  shipping?: {
    methodId?: string;
    methodName?: string;
    address?: {
      street: string;
      apartment?: string;
      city: string;
      state?: string;
      postalCode?: string;
      country: string;
    };
    specialInstructions?: string;
    estimatedDelivery?: string;
  };
  billing?: {
    sameAsShipping?: boolean;
    companyName?: string;
    taxId?: string;
  };
  appliedCouponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestorePayment {
  id: string;
  orderId?: string;
  bookingId?: string;
  gatewayId: string;
  gatewayName: string;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  verificationResult?: Record<string, unknown>;
  timestamp: string;
}

export interface FirestoreCompanySettings {
  name: string;
  legalName: string;
  registrationNumber: string;
  tagline: string;
  description: string;
  domain: string;
  website?: string;
  logoUrl?: string;
  email: string;
  primaryPhone: string;
  secondaryPhone: string;
  phone?: string;
  phones: string[];
  offices: {
    colombo: {
      name: string;
      address: string;
      city: string;
      country: string;
      isHeadquarters: boolean;
      mapQuery: string;
    };
    trincomalee: {
      name: string;
      address: string;
      city: string;
      country: string;
      isHeadquarters: boolean;
      mapQuery: string;
    };
  };
  socials: Record<string, string>;
  socialLinks?: Record<string, string>;
  workingHours: Record<string, string>;
  updatedAt: string;
}

export interface FirestoreMaintenanceSettings {
  enabled: boolean;
  title: string;
  message: string;
  imageUrl?: string;
  estimatedReturn?: string;
  contactPhone?: string;
  contactEmail?: string;
  allowedRoles?: string[];
  lastActivatedAt?: string;
  lastDeactivatedAt?: string;
}

export interface FirestoreSiteSettings {
  siteName: string;
  maintenanceMode: boolean;
  enableMaintenanceMode?: boolean;
  maintenance?: FirestoreMaintenanceSettings;
  announcement?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
  currency: string;
  defaultCurrency?: string;
  supportedCurrencies?: string[];
  taxRate: number;
  vatTaxPercentage?: number;
  bookingDepositPercent?: number;
  legalRegistrationNumber?: string;
  enableStockAlertEmails?: boolean;
  dailyBackupEnabled?: boolean;
  logoUrl?: string;
  mobileLogoUrl?: string;
  darkLogoUrl?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  metaDescription?: string;
  brandingUpdatedAt?: string;
  brandingVersion?: number;
  updatedAt: string;
}

export interface FirestoreCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumSpend: number;
  expiryDate?: string;
  usageLimit: number;
  usageCount: number;
  status: 'active' | 'expired' | 'disabled';
}

export interface FirestoreNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'order' | 'booking';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface FirestoreAuditLog {
  id: string;
  actorId?: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface FirestoreContactSubmission {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  division: string;
  subject: string;
  message: string;
  status: 'new' | 'in_review' | 'replied' | 'archived';
  createdAt: string;
}

export interface FirestoreQuoteRequest {
  id: string;
  fullName: string;
  company?: string;
  email: string;
  phone?: string;
  division: DivisionId | string;
  serviceId?: string;
  budgetRange?: string;
  timeline?: string;
  specifications: string;
  status: 'pending' | 'assessing' | 'quoted' | 'accepted' | 'declined';
  createdAt: string;
}

export interface FirestorePortfolio {
  id: string;
  division: DivisionId | string;
  divisionId?: DivisionId | string;
  divisionName?: string;
  title: string;
  client: string;
  category: string;
  description: string;
  summary?: string;
  fullDescription?: string;
  highlights?: string[];
  deliverables?: string[];
  galleryImages?: string[];
  liveUrl?: string;
  impactMetrics?: Array<{ label: string; value: string }>;
  tags?: string[];
  metric?: { label: string; value: string };
  badge?: string;
  imageUrl: string;
  featured: boolean;
  year: string;
  status: 'published' | 'draft' | 'active' | 'archived';
}

export interface FirestoreGallery {
  id: string;
  division: DivisionId | string;
  title: string;
  url: string;
  type: 'image' | 'video';
  tag?: string;
  status: 'published' | 'hidden';
}

export interface FirestoreMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
  badge?: string;
  keyOutcome?: string;
  divisionId?: string;
  imageUrl?: string;
  order: number;
  status?: 'active' | 'archived';
}

export interface FirestoreTrustedCompany {
  id: string;
  name: string;
  logoUrl: string;
  division?: string;
  tier?: string;
  industry?: string;
  partnershipType?: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface FirestoreTestimonial {
  id: string;
  author: string;
  role: string;
  company?: string;
  avatarUrl?: string;
  photoUrl?: string;
  avatarInitials?: string;
  verified?: boolean;
  quote: string;
  division: string;
  divisionId?: string;
  divisionName?: string;
  rating: number;
  status: 'approved' | 'pending' | 'archived';
}

export interface FirestorePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  seo?: {
    metaTitle: string;
    metaDescription: string;
  };
  status: 'published' | 'draft';
  updatedAt: string;
}
