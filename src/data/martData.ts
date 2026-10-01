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

export function mapFirestoreProductToMart(p: any, categories: any[] = []): Product {
  const cat = categories.find((c) => c.id === p.categoryId || c.slug === p.categoryId);
  const price = Number(p.price) || 0;
  const originalPrice = p.compareAtPrice !== undefined ? Number(p.compareAtPrice) : price;
  const discountPercent =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const img = (p as any).imageUrl || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '');
  const gallery = Array.isArray(p.images) && p.images.length > 0
    ? (img && !p.images.includes(img) ? [img, ...p.images] : p.images)
    : (p.gallery || (img ? [img] : []));
  const stock = typeof p.stock === 'number' ? p.stock : (typeof p.stockQuantity === 'number' ? p.stockQuantity : 100);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug || p.id,
    category: p.categoryId || (cat ? cat.id : 'general'),
    categoryName: p.categoryName || (cat ? cat.name : 'General Merchandise'),
    price,
    originalPrice,
    discountPercent,
    rating: Number(p.rating) || 5.0,
    reviewsCount: Number(p.reviewsCount) || 0,
    shortDescription: p.shortDescription || p.description?.slice(0, 150) || '',
    description: p.description || '',
    imageUrl: img,
    gallery,
    inStock: stock > 0 && p.stockStatus !== 'out_of_stock',
    stockCount: stock,
    isFeatured: p.isFeatured ?? true,
    isBestSeller: p.isBestSeller,
    isTrending: p.isTrending,
    brand: p.brand || 'Mahdev',
    sku: p.sku || `MD-${p.id?.toUpperCase().slice(0, 8) || '001'}`,
    variants: p.variants
      ? {
          type: p.variants.type || 'Variant',
          options: (p.variants.options || []).map((opt: any) => ({
            id: opt.id,
            name: opt.name,
            sku: opt.sku || '',
            priceModifier: opt.priceModifier || 0,
            inStock: opt.inStock ?? true,
            stockCount: opt.stockQuantity ?? opt.stockCount ?? 10,
          })),
        }
      : undefined,
    specifications: Array.isArray(p.specifications) ? p.specifications : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    reviews: Array.isArray(p.reviews) ? p.reviews : [],
  };
}

export function mapFirestoreCategoryToMart(c: any): MartCategory {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug || c.id,
    description: c.description || '',
    iconName: c.iconName || 'Package',
    itemCount: c.itemCount || c.productCount || 0,
    imageUrl: c.imageUrl || '',
  };
}

// Convert unified CatalogCategory to MartCategory (fallback)
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

// Convert unified CatalogProduct to Product interface for zero data duplication (fallback)
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
    specifications: Array.isArray(p.specifications) ? p.specifications.map((s) => ({ label: s.label, value: s.value })) : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    reviews: p.reviews?.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      date: r.date,
      comment: r.comment,
    })),
  }));
