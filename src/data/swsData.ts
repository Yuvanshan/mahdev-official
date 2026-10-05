export interface SWSService {
  id: string;
  name: string;
  category: 'decor' | 'production' | 'media' | 'hospitality' | 'rentals' | 'packages';
  tagline: string;
  description: string;
  detailedDescription: string;
  startingPrice: string;
  priceNote?: string;
  imageUrl: string;
  gallery: string[];
  features: string[];
  specs?: { label: string; value: string }[];
  badge?: string;
  leadTime?: string;
  capacity?: string;
  iconName?: string;
}

export type RentalCategory =
  | 'seating'
  | 'tables-linens'
  | 'stage-truss'
  | 'audio-sound'
  | 'lighting-fx'
  | 'led-displays'
  | 'tents-canopies'
  | 'catering-ware'
  | 'power-climate';

export interface SWSRentalItem {
  id: string;
  name: string;
  category: RentalCategory;
  categoryLabel: string;
  tagline: string;
  description: string;
  dailyRate: string;
  unit: string;
  minOrderQuantity: number;
  availableStock: number;
  imageUrl: string;
  specs: { label: string; value: string }[];
  features: string[];
  popular?: boolean;
  badge?: string;
}

export interface SWSPackage {
  id: string;
  name: string;
  tier: string;
  tagline: string;
  description: string;
  includedServices: string[];
  price: string;
  priceSubtext: string;
  images: string[];
  availability: string;
  badge?: string;
  popular?: boolean;
  idealFor: string;
  guestEstimate: string;
}

export interface SWSGalleryItem {
  id: string;
  title: string;
  category: 'Weddings' | 'Conferences' | 'Corporate' | 'Birthdays & Socials' | 'Stage & Lighting' | 'Dining & Decor';
  imageUrl: string;
  images?: string[];
  location: string;
  year: string;
  description: string;
  tags: string[];
}

export interface SWSPortfolioItem {
  id: string;
  title: string;
  client: string;
  eventType: string;
  date: string;
  location: string;
  guestCount: string;
  summary: string;
  detailedCase: string;
  imageUrl: string;
  gallery: string[];
  highlights: string[];
  servicesDelivered: string[];
  testimonial?: {
    quote: string;
    author: string;
    designation: string;
  };
}

export const SWS_SERVICES: SWSService[] = [];
export const SWS_PACKAGES: SWSPackage[] = [];
export const SWS_GALLERY_ITEMS: SWSGalleryItem[] = [];
export const SWS_PORTFOLIO_ITEMS: SWSPortfolioItem[] = [];
export const SWS_RENTAL_INVENTORY: SWSRentalItem[] = [];
