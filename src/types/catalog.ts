/**
 * Unified Catalog & Product Data Model for Mahdev Ecosystem
 * Designed for Firestore / PostgreSQL / Microservice Persistence
 */

export type ProductType =
  | 'physical'
  | 'digital'
  | 'service'
  | 'package'
  | 'bookable_service';

export type ProductStatus = 'active' | 'draft' | 'archived' | 'out_of_stock';

export type StockStatus =
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'pre_order'
  | 'made_to_order'
  | 'unlimited';

export interface ProductVariantOption {
  id: string;
  sku: string;
  name: string;
  priceModifier?: number; // e.g., +$15.00
  weight?: string;
  color?: string;
  dimensions?: string;
  stockQuantity: number;
  inStock: boolean;
}

export interface ProductVariantGroup {
  type: string; // e.g., 'Weight', 'Size', 'Package Tier', 'Color', 'License'
  options: ProductVariantOption[];
}

export interface ProductSpecification {
  label: string;
  value: string;
  group?: string; // e.g., 'General', 'Technical', 'Origin'
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  verifiedPurchase: boolean;
  comment: string;
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  productType: ProductType;
  divisionId: 'mart' | 'sws' | 'u1' | 'it' | 'travels' | 'minerals' | 'consulting' | 'holdings';
  divisionName: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;

  // Descriptions & Media
  shortDescription: string;
  description: string;
  imageUrl: string;
  gallery: string[];

  // Pricing
  price: number;
  originalPrice?: number;
  currency: string;
  discountPercent?: number;

  // Inventory & Fulfillment
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  stockStatus: StockStatus;
  leadTimeDays?: number;

  // Variants & Technical Attributes
  variants?: ProductVariantGroup;
  specifications: ProductSpecification[];
  tags: string[];

  // Performance & Badges
  rating: number;
  reviewsCount: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  brand: string;

  // Operational Timestamps & Status
  status: ProductStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Type-Specific Extension Metadata
  metadata?: {
    digitalDownloadUrl?: string;
    fileSizeBytes?: number;
    bookingDurationMinutes?: number;
    maxGuestsPerBooking?: number;
    deliverablesList?: string[];
    slaResponseHours?: number;
    destinationRegion?: string;
  };

  reviews?: ProductReview[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  divisionId: 'mart' | 'sws' | 'u1' | 'it' | 'travels' | 'minerals' | 'consulting' | 'holdings';
  iconName: string;
  itemCount: number;
  status: 'active' | 'inactive';
  sortOrder?: number;
  parentCategoryId?: string;
}

export interface CatalogFilterOptions {
  divisionId?: string;
  productType?: ProductType | 'all';
  categoryId?: string;
  searchQuery?: string;
  stockStatus?: StockStatus | 'all';
  minPrice?: number;
  maxPrice?: number;
  onlyFeatured?: boolean;
  onlyInStock?: boolean;
  brand?: string;
  tags?: string[];
}

export type CatalogSortOption =
  | 'featured'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'newest'
  | 'name_asc';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}
