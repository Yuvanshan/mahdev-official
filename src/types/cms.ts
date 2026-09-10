import { DivisionId } from './index';

export type CmsEntityType =
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
  | 'coupons';

export interface BaseCmsEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

// 1. Division Entity
export interface CmsDivision extends BaseCmsEntity {
  divisionKey: DivisionId;
  name: string;
  shortName: string;
  order?: number;
  tagline: string;
  description: string;
  badge: string;
  route: string;
  accentColor: string;
  gradient: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl?: string;
  logoUrl?: string;
  contactEmail: string;
  iconName: string;
  stats: { label: string; value: string; subtext?: string }[];
  galleryImages?: { url: string; title: string; caption?: string }[];
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
    ogImage: string;
    canonicalUrl: string;
  };
  isActive: boolean;
}

// 2. Service Entity
export interface CmsService extends BaseCmsEntity {
  divisionId: DivisionId;
  divisionName: string;
  category?: string;
  categoryId?: string;
  title: string;
  description: string;
  imageUrl?: string;
  images?: string[];
  features: string[];
  iconName: string;
  popular: boolean;
  badge: string;
  startingPrice: number;
  price?: number;
  order?: number;
  currency: string;
  sku?: string;
  turnaroundTime: string;
  isActive: boolean;
}

// 3. Product Entity
export interface CmsProduct extends BaseCmsEntity {
  sku: string;
  name: string;
  slug: string;
  divisionId: DivisionId;
  divisionName: string;
  categoryId: string;
  categoryName: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  galleryImages: string[];
  stockQuantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder';
  lowStockThreshold: number;
  isFeatured: boolean;
  tags: string[];
  specifications: Record<string, string>;
  warrantyInfo?: string;
  isActive: boolean;
}

// 4. Category Entity
export interface CmsCategory extends BaseCmsEntity {
  slug: string;
  name: string;
  divisionId: DivisionId;
  description: string;
  iconName?: string;
  bannerUrl?: string;
  itemCount: number;
  displayOrder: number;
  isActive: boolean;
}

// 5. Package Entity
export interface CmsPackage extends BaseCmsEntity {
  serviceId: string;
  serviceTitle: string;
  divisionId: DivisionId;
  name: string;
  sku?: string;
  tagline?: string;
  price: number;
  currency: string;
  duration?: string;
  billingCycle?: string;
  badge?: string;
  ctaText?: string;
  features: string[];
  popular: boolean;
  isCustomQuote: boolean;
  isActive: boolean;
}

// 6. Portfolio Entity
export interface CmsPortfolioProject extends BaseCmsEntity {
  divisionId: DivisionId;
  title: string;
  category: string;
  sku?: string;
  client: string;
  year: string;
  summary: string;
  fullDescription: string;
  highlights: string[];
  deliverables: string[];
  imageUrl: string;
  galleryImages: string[];
  liveUrl?: string;
  impactMetrics: { label: string; value: string }[];
  tags: string[];
  isFeatured: boolean;
  isActive?: boolean;
}

export type CmsPortfolioItem = CmsPortfolioProject;

// 7. Gallery Entity
export interface CmsGalleryItem extends BaseCmsEntity {
  divisionId: DivisionId;
  title: string;
  sku?: string;
  category?: string;
  mediaType?: 'image' | 'video';
  type?: 'image' | 'video';
  url?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption: string;
  aspectRatio?: string;
  tags: string[];
  sortOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  location?: string;
}

// 8. Milestone Entity
export interface CmsMilestone extends BaseCmsEntity {
  year: string;
  title: string;
  description: string;
  divisionId?: DivisionId;
  badge?: string;
  metric?: string;
  iconName?: string;
  keyOutcome?: string;
  highlight?: boolean;
  imageUrl?: string;
  order?: number;
  sortOrder?: number;
  isActive?: boolean;
}

// 9. Trusted Company Entity
export interface CmsTrustedCompany extends BaseCmsEntity {
  name: string;
  industry: string;
  partnershipType: string;
  logoUrl?: string;
  website?: string;
  description: string;
  featured: boolean;
  order: number;
}

// 10. Testimonial Entity
export interface CmsTestimonial extends BaseCmsEntity {
  author: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  divisionId?: DivisionId;
  divisionName?: string;
  avatarInitials: string;
  photoUrl?: string;
  date: string;
  verified: boolean;
  isFeatured: boolean;
}

// 11. Custom Page Entity
export interface CmsPage extends BaseCmsEntity {
  slug: string;
  title: string;
  category: 'legal' | 'corporate' | 'landing' | 'custom';
  metaDescription: string;
  heroHeading: string;
  heroSubheading?: string;
  content: string; // rich markdown / html
  sections: {
    heading: string;
    body: string;
    imageUrl?: string;
  }[];
  isPublished: boolean;
  publishedAt?: string;
}

// 12. Banner Entity
export interface CmsBanner extends BaseCmsEntity {
  title: string;
  subtitle: string;
  placement: 'home_hero' | 'announcement_bar' | 'division_banner' | 'mart_sale';
  divisionId?: DivisionId | 'all';
  targetUrl: string;
  buttonText: string;
  imageUrl?: string;
  bgGradient?: string;
  badgeText?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  priority: number;
}

// 13. Coupon Entity
export interface CmsCoupon extends BaseCmsEntity {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  currency: string;
  minSpend?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usageCount: number;
  divisionRestriction?: DivisionId | 'all';
  isActive: boolean;
}

// 14. Achievement & Decoration Showcase Sub-types
export interface AchievementItem {
  id: string;
  metric: string;
  label: string;
  description: string;
  badge: string;
  iconName?: string;
  highlight?: boolean;
  order?: number;
}

export interface DecorationShowcaseVideo {
  id: string;
  title: string;
  category: 'Weddings' | 'Floral & Canopy' | 'Lighting & Truss' | 'Corporate Galas' | string;
  location: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  venueType: string;
  divisionName: string;
  highlights: string[];
}

// 14b. Universal Section & Widget Models
export type WidgetType =
  | 'text'
  | 'heading'
  | 'image'
  | 'video'
  | 'gallery'
  | 'slider'
  | 'banner'
  | 'cards'
  | 'services'
  | 'products'
  | 'testimonials'
  | 'statistics'
  | 'timeline'
  | 'faq'
  | 'pricing'
  | 'team'
  | 'contact'
  | 'map'
  | 'socialLinks'
  | 'cta'
  | 'buttons'
  | 'booking'
  | 'customHtml';

export interface DynamicWidget {
  id: string;
  type: WidgetType;
  title?: string;
  subtitle?: string;
  badge?: string;
  content?: string;
  enabled: boolean;
  order: number;
  desktopVisible: boolean;
  mobileVisible: boolean;
  align?: 'left' | 'center' | 'right';
  styleTheme?: 'default' | 'card' | 'gradient' | 'minimal' | 'luxury';
  data?: Record<string, any>;
}

export interface DynamicSectionItem {
  id: string;
  name: string;
  sectionKey: string;
  enabled: boolean;
  order: number;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
  title?: string;
  subtitle?: string;
  badge?: string;
  widgets?: DynamicWidget[];
}

export interface HeroShowcaseSlideItem {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  highlight: string;
  image: string;
  route: string;
}

export interface EnterpriseStandardGuarantee {
  id?: string;
  title: string;
  description: string;
  tag: string;
  iconName?: string;
}

// 15. Homepage CMS Configuration
export interface HomepageCmsConfig {
  welcomeAnimation?: {
    enabled: boolean;
    welcomeText?: string;
    duration?: number;
    logoUrl?: string;
  };
  sectionsOrder?: DynamicSectionItem[];
  hero: {
    badgeText: string;
    titleLine1: string;
    titleHighlight: string;
    titleLine2: string;
    description: string;
    mediaType: 'image' | 'video' | 'gradient';
    mediaUrl: string;
    videoEmbedUrl?: string;
    primaryCtaLabel: string;
    primaryCtaLink: string;
    secondaryCtaLabel: string;
    secondaryCtaLink: string;
    metrics: { label: string; value: string; subtext?: string }[];
    showcaseItems?: HeroShowcaseSlideItem[];
  };
  intro: {
    badge: string;
    headline: string;
    subheadline: string;
    description: string;
    pillars: { title: string; desc: string; icon: string }[];
  };
  divisionsSection?: {
    badge?: string;
    title?: string;
    subtitle?: string;
    enabled?: boolean;
  };
  whyMahdev?: {
    badge?: string;
    title?: string;
    subtitle?: string;
    enabled?: boolean;
    guarantees?: EnterpriseStandardGuarantee[];
  };
  statistics?: {
    badge?: string;
    title?: string;
    subtitle?: string;
    enabled?: boolean;
  };
  featuredServices: {
    badge: string;
    title: string;
    subtitle: string;
    selectedServiceIds: string[];
    enabled: boolean;
  };
  featuredProducts: {
    badge: string;
    title: string;
    subtitle: string;
    selectedProductIds: string[];
    spotlightBannerText?: string;
    enabled: boolean;
  };
  portfolio: {
    badge: string;
    title: string;
    subtitle: string;
    selectedProjectIds: string[];
    enabled: boolean;
  };
  decorationShowcase?: {
    badge: string;
    title: string;
    subtitle: string;
    enabled: boolean;
    videos: DecorationShowcaseVideo[];
  };
  milestones: {
    badge: string;
    title: string;
    subtitle: string;
    enabled: boolean;
    achievementsTitle?: string;
    achievementsSubtitle?: string;
    achievements?: AchievementItem[];
  };
  companies: {
    badge: string;
    title: string;
    subtitle: string;
    enabled: boolean;
  };
  testimonials: {
    badge: string;
    title: string;
    subtitle: string;
    enabled: boolean;
  };
  ctaSection: {
    badge: string;
    headline: string;
    subheadline: string;
    primaryButtonText: string;
    primaryButtonLink: string;
    secondaryButtonText: string;
    secondaryButtonLink: string;
    contactPhone: string;
    contactEmail: string;
    corporateLocation: string;
  };
  seo: {
    pageTitle: string;
    metaDescription: string;
    ogImage: string;
    canonicalUrl: string;
  };
  updatedAt?: string;
}
