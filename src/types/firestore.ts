/**
 * Mahdev Cloud Firestore Database Architecture & Entity Types (Phase 22)
 * Clean TypeScript definitions for all Firestore collections and document models.
 */

export type UserRole = 'customer' | 'staff' | 'manager' | 'admin' | 'superAdmin';

export type AccountStatus = 'active' | 'suspended' | 'pending';

export interface FirestoreUser {
  uid: string;
  displayName?: string;
  name?: string; // backwards compatibility
  email: string;
  phone?: string;
  photoUrl?: string;
  photoURL?: string; // backwards compatibility
  role: UserRole | string;
  status: AccountStatus | string;
  createdAt: string;
  updatedAt: string;
}

export type DivisionId = 'sws' | 'u1-studio' | 'it-solutions' | 'travels' | 'online-mart' | 'u1' | 'it' | 'mart';

export interface FirestoreDivision {
  id: DivisionId | string;
  divisionKey?: string;
  canonicalDocId?: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  imageUrl?: string;
  heroImageUrl?: string;
  defaultImageUrl?: string;
  heroVideoUrl?: string;
  videoUrl?: string;
  heroMediaType?: 'image' | 'video';
  logoUrl?: string;
  logo?: string; // backwards compatibility
  route?: string;
  isPublished?: boolean;
  order?: number;
  shortName?: string;
  accentColor?: string;
  gradient?: string;
  iconName?: string;
  badge?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  tagline?: string;
  hero?: {
    title: string;
    subtitle: string;
    badge: string;
    bgImage: string;
    imageUrl?: string;
    defaultImageUrl?: string;
    videoUrl?: string;
    mediaType?: 'image' | 'video';
    ctaText?: string;
    secondaryCtaText?: string;
  };
  contactPhone?: string;
  contactNumber?: string;
  contactEmail?: string;
  aboutHeading?: string;
  aboutText?: string;
  mission?: string;
  vision?: string;
  stats?: Array<{ label: string; value: string }>;
  features?: string[];
  coreServices?: Array<{ title: string; description: string; iconName?: string }>;
  cardHighlight?: string;
  isComingSoon?: boolean;
  comingSoon?: boolean;
  comingSoonTitle?: string;
  comingSoonMessage?: string;
  comingSoonExpectedLaunch?: string;
  rentalAssetCount?: string;
  status?: 'active' | 'inactive' | 'maintenance' | 'coming_soon';
  seo?: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage?: string;
    canonicalUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreService {
  id: string;
  name: string;
  slug: string;
  divisionId: DivisionId | string;
  division?: DivisionId | string; // backwards compatibility
  divisionName?: string;
  category?: string;
  categoryId?: string;
  title?: string;
  description: string;
  imageUrl?: string;
  images?: string[]; // backwards compatibility
  price: number;
  startingPrice?: number;
  currency?: string;
  bookingEnabled: boolean;
  quoteEnabled?: boolean;
  isPublished?: boolean;
  order?: number;
  status?: 'active' | 'inactive' | 'draft';
  badge?: string;
  features?: string[];
  sku?: string;
  turnaroundTime?: string;
  popular?: boolean;
  iconName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isPublished?: boolean;
  order: number;
  division?: DivisionId | string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
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
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  currency?: string;
  discountPrice?: number;
  compareAtPrice?: number;
  images: string[];
  categoryId: string;
  stock: number;
  sku: string;
  isAvailable?: boolean;
  isPublished?: boolean;
  division?: DivisionId | string;
  status?: 'active' | 'draft' | 'out_of_stock' | 'archived';
  hasVariants?: boolean;
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
  serviceId: string;
  divisionId: DivisionId | string;
  bookingDate?: string;
  bookingTime?: string;
  date?: string; // backwards compatibility
  time?: string; // backwards compatibility
  status: BookingStatus | string;
  notes?: string;
  amount?: number;
  price?: number; // backwards compatibility
  currency: string;
  paymentStatus: BookingPaymentStatus | string;
  customer?: FirestoreBookingCustomer;
  divisionName?: string;
  serviceName?: string;
  packageId?: string;
  packageName?: string;
  location?: FirestoreBookingLocation;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreOrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  name?: string; // backwards compatibility alias for productName
  sku: string;
  quantity: number;
  unitPrice: number;
  price?: number; // backwards compatibility alias for unitPrice
  lineTotal: number;
  division?: DivisionId | string;
  divisionId?: DivisionId | string;
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
  items: FirestoreOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  paymentStatus: OrderPaymentStatus | string;
  orderStatus?: OrderStatus | string;
  status?: OrderStatus | string; // backwards compatibility
  shippingAddress?: Record<string, unknown> | string;
  customer?: {
    fullName: string;
    email: string;
    phone: string;
    company?: string;
    preferredContact?: string;
  };
  totalQuantity?: number;
  shippingFee?: number;
  tax?: number;
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
  customerId?: string;
  amount: number;
  currency: string;
  gateway?: string;
  gatewayId?: string; // backwards compatibility
  gatewayName?: string;
  transactionId?: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'; // backwards compatibility
  verificationResult?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
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
  darkLogoUrl?: string;
  faviconUrl?: string;
  establishedYear?: string;
  mission?: string;
  vision?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
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
  rentalAssetCount?: string;
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
  // Phase 57 Site Settings Fields
  companyName?: string;
  legalName?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  currencyCode?: string;
  currencySymbol?: string;
  phoneNumbers?: string[] | string;
  email?: string;
  addresses?: Array<{ name: string; address: string; city: string; country?: string }> | Record<string, unknown>;
  rentalAssetCount?: string;
  maintenanceMode: boolean;
  maintenanceTitle?: string;
  maintenanceMessage?: string;
  maintenanceImageUrl?: string;
  updatedAt: string;
  version?: string | number;

  // Backwards compatibility fields
  siteName?: string;
  enableMaintenanceMode?: boolean;
  maintenance?: FirestoreMaintenanceSettings;
  announcement?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
  currency?: string;
  defaultCurrency?: string;
  supportedCurrencies?: string[];
  taxRate?: number;
  vatTaxPercentage?: number;
  bookingDepositPercent?: number;
  legalRegistrationNumber?: string;
  enableStockAlertEmails?: boolean;
  enableSmsAlerts?: boolean;
  smsAlertsEnabled?: boolean;
  dailyBackupEnabled?: boolean;
  mobileLogoUrl?: string;
  darkLogoUrl?: string;
  ogImageUrl?: string;
  metaDescription?: string;
  brandingUpdatedAt?: string;
  brandingVersion?: number;
}

export interface FirestoreAnnouncement {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  link?: string;
  order?: number;
  type: 'info' | 'warning' | 'promotion' | 'update' | string;
  isPublished: boolean;
  startAt?: string;
  endAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  status: 'active' | 'expired' | 'disabled';
  createdAt?: string;
  updatedAt?: string;
}

export interface FirestoreNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  type?: string;
  createdAt: string;
}

export interface FirestoreAuditLog {
  id: string;
  userId?: string;
  actorId?: string; // backwards compatibility
  actorName?: string;
  action: string;
  collection?: string;
  resourceType?: string; // backwards compatibility
  documentId?: string;
  resourceId?: string; // backwards compatibility
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  details?: Record<string, unknown>;
  createdAt?: string;
  timestamp?: string;
}

export interface FirestoreContactSubmission {
  id: string;
  name?: string;
  fullName?: string; // backwards compatibility
  email: string;
  phone?: string;
  subject: string;
  message: string;
  division?: string;
  status: 'new' | 'in_review' | 'replied' | 'archived' | string;
  createdAt: string;
  updatedAt?: string;
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
  updatedAt?: string;
}

export interface FirestorePortfolio {
  id: string;
  title: string;
  slug: string;
  description: string;
  divisionId: DivisionId | string;
  division?: DivisionId | string; // backwards compatibility
  divisionName?: string;
  sku?: string;
  images?: string[];
  category: string;
  location?: string;
  date?: string;
  isPublished?: boolean;
  client?: string;
  summary?: string;
  shortIntroduction?: string;
  challenge?: string;
  solution?: string;
  result?: string;
  fullDescription?: string;
  highlights?: string[];
  deliverables?: string[];
  galleryImages?: string[];
  videoUrl?: string;
  liveUrl?: string;
  impactMetrics?: Array<{ label: string; value: string }>;
  tags?: string[];
  metric?: { label: string; value: string };
  badge?: string;
  imageUrl: string;
  featured?: boolean;
  year?: string;
  status?: 'published' | 'draft' | 'active' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface FirestoreGallery {
  id: string;
  division: DivisionId | string;
  title: string;
  url: string;
  mediaUrl?: string;
  images?: string[];
  type: 'image' | 'video';
  tag?: string;
  category?: string;
  thumbnailUrl?: string;
  caption?: string;
  aspectRatio?: string;
  tags?: string[];
  order?: number;
  sku?: string;
  status: 'published' | 'hidden';
  createdAt?: string;
  updatedAt?: string;
}

export interface FirestoreMilestone {
  id: string;
  year: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  icon?: string;
  iconName?: string;
  order: number;
  isPublished?: boolean;
  date?: string;
  badge?: string;
  keyOutcome?: string;
  metric?: string;
  divisionId?: string;
  status?: 'active' | 'published' | 'draft' | 'archived';
  highlight?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FirestoreTrustedCompany {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
  description?: string;
  order?: number;
  isPublished?: boolean;
  division?: string;
  tier?: string;
  industry?: string;
  partnershipType?: string;
  status?: 'active' | 'inactive' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FirestoreTestimonial {
  id: string;
  customerName?: string;
  author?: string; // backwards compatibility
  authorName?: string;
  role?: string;
  company?: string;
  message?: string;
  quote?: string; // backwards compatibility
  text?: string;
  rating: number;
  imageUrl?: string;
  avatarUrl?: string; // backwards compatibility
  photoUrl?: string;
  authorPhotoUrl?: string;
  authorUrl?: string;
  avatarInitials?: string;
  verified?: boolean;
  division?: string;
  divisionId?: string;
  divisionName?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  isHidden?: boolean; // admin hide toggle without altering Google review
  order?: number;
  status?: 'approved' | 'pending' | 'archived' | string;
  
  // Google Reviews specific attributes
  source?: 'google' | 'direct' | 'verified_partner';
  sourceBadge?: string;
  googleReviewId?: string;
  placeId?: string;
  relativePublishTimeDescription?: string;
  publishTime?: string;
  date?: string;

  createdAt?: string;
  updatedAt?: string;
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
