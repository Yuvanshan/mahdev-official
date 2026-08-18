import { catalogService } from '../services/catalogService';
import { CatalogProduct, CatalogCategory, ProductVariantOption, ProductSpecification as BaseProductSpecification } from '../types/catalog';

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  priceModifier?: number;
  inStock: boolean;
  stockCount: number;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryName: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewsCount: number;
  shortDescription: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  inStock: boolean;
  stockCount: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  brand: string;
  sku: string;
  variants?: {
    type: string;
    options: ProductVariant[];
  };
  specifications: ProductSpecification[];
  tags: string[];
  reviews?: ProductReview[];
}

export interface MartCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  itemCount: number;
  imageUrl: string;
}

export interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  itemTotal: number;
}

// Convert unified CatalogCategory to MartCategory
export const MART_CATEGORIES: MartCategory[] = catalogService
  .getCategories('mart')
  .map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    iconName: c.iconName,
    itemCount: c.itemCount,
    imageUrl: c.imageUrl,
  }));

// Convert unified CatalogProduct to Product interface for zero data duplication
export const MART_PRODUCTS: Product[] = catalogService
  .queryProducts({ divisionId: 'mart' })
  .map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.categoryId,
    categoryName: p.categoryName,
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercent: p.discountPercent,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    shortDescription: p.shortDescription,
    description: p.description,
    imageUrl: p.imageUrl,
    gallery: p.gallery,
    inStock: p.stockStatus === 'in_stock' || p.stockStatus === 'low_stock' || p.stockStatus === 'unlimited',
    stockCount: p.stockQuantity,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isTrending: p.isTrending,
    brand: p.brand,
    sku: p.sku,
    variants: p.variants
      ? {
          type: p.variants.type,
          options: p.variants.options.map((opt) => ({
            id: opt.id,
            name: opt.name,
            sku: opt.sku,
            priceModifier: opt.priceModifier,
            inStock: opt.inStock,
            stockCount: opt.stockQuantity,
          })),
        }
      : undefined,
    specifications: p.specifications.map((s) => ({ label: s.label, value: s.value })),
    tags: p.tags,
    reviews: p.reviews?.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      date: r.date,
      comment: r.comment,
    })),
  }));
