/**
 * Mahdev Pvt Ltd — Core Architecture & Data Models
 * Centralized TypeScript type definitions for the digital ecosystem.
 */

export type DivisionId = 'sws' | 'u1' | 'it' | 'travels' | 'mart';

export interface DivisionStat {
  label: string;
  value: string;
  subtext?: string;
}

export interface CoreServiceFeature {
  title: string;
  description: string;
  iconName?: string;
}

export interface DivisionConfig {
  id: DivisionId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  badge: string;
  isPrimary?: boolean;
  route: string;
  domainUrl?: string;
  accentColor: string;
  gradient: string;
  image?: string;
  imageUrl?: string;
  heroHeadline: string;
  heroSubheadline: string;
  coreServices: CoreServiceFeature[];
  stats: DivisionStat[];
  contactEmail: string;
  contactPhone?: string;
  aboutHeading?: string;
  aboutText?: string;
  mission?: string;
  vision?: string;
  iconName: string;
}

export interface BrandConfig {
  name: string;
  legalName: string;
  tagline: string;
  domain: string;
  establishedYear: number;
  headquarters: string;
  contactEmail: string;
  contactPhone: string;
  socials: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

export interface ServiceItem {
  id: string;
  divisionId: DivisionId;
  title: string;
  description: string;
  features: string[];
  iconName: string;
  popular?: boolean;
  sku?: string;
}

export interface ProductItem {
  id: string;
  divisionId: DivisionId;
  title: string;
  price: number;
  currency: string;
  category: string;
  rating: number;
  image?: string;
  inStock: boolean;
  sku?: string;
}

export interface Category {
  id: string;
  divisionId: DivisionId;
  name: string;
  slug: string;
  description?: string;
}

export interface BookingRequest {
  id: string;
  divisionId: DivisionId;
  serviceId?: string;
  customerName: string;
  email: string;
  phone: string;
  date?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Order {
  id: string;
  divisionId: DivisionId;
  customerId: string;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  divisionId?: DivisionId;
  divisionName?: string;
  avatarInitials: string;
  photoUrl?: string;
  date?: string;
  verified?: boolean;
}

export interface PortfolioProject {
  id: string;
  divisionId: DivisionId;
  title: string;
  category: string;
  client: string;
  year: string;
  summary: string;
  fullDescription?: string;
  highlights: string[];
  deliverables?: string[];
  imageUrl: string;
  galleryImages?: string[];
  liveUrl?: string;
  impactMetrics?: {
    label: string;
    value: string;
  }[];
  tags?: string[];
  sku?: string;
}

export interface MilestoneItem {
  id?: string;
  year: string;
  title: string;
  description: string;
  divisionId?: DivisionId;
  badge?: string;
  keyOutcome?: string;
  highlight?: boolean;
  imageUrl?: string;
}

export interface TrustedCompany {
  id: string;
  name: string;
  industry: string;
  partnershipType: string;
  logo?: string;
  website?: string;
  description?: string;
  featured?: boolean;
}

export interface LeadershipMember {
  id: string;
  name: string;
  title: string;
  role: string;
  bio: string;
  photoUrl: string;
  divisionFocus?: string;
  linkedin?: string;
  email?: string;
  badge?: string;
  credentials?: string[];
}

export interface CompanyValue {
  id: string;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  commitment: string;
}

export type LegalPolicyType = 'privacy' | 'terms' | 'refund' | 'shipping' | 'cookie';

export interface SEOMetaData {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: 'website' | 'article' | 'profile';
  keywords?: string[];
  noIndex?: boolean;
}

export interface NavigationLink {
  id: string;
  label: string;
  href: string;
  badge?: string;
  description?: string;
  iconName?: string;
  children?: NavigationLink[];
}

export interface FooterLink {
  label: string;
  href: string;
  badge?: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}
