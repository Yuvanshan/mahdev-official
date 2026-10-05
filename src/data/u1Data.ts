export interface U1Service {
  id: string;
  name: string;
  tagline: string;
  category: 'media' | 'portrait' | 'commercial' | 'print';
  description: string;
  detailedDescription: string;
  imageUrl: string;
  gallery: string[];
  deliverables: string[];
  duration?: string;
  startingPrice: string;
  priceNote?: string;
  badge?: string;
  gearUsed?: string;
}

export interface U1PortfolioItem {
  id: string;
  title: string;
  category: 'Weddings' | 'Portraits' | 'Commercial & Product' | 'Pre-Shoots' | 'Events & Cinema';
  client: string;
  year: string;
  location: string;
  imageUrl: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  cameraMetadata?: {
    camera: string;
    lens: string;
    focalLength?: string;
    aperture?: string;
  };
  description: string;
  tags: string[];
}

export interface U1Package {
  id: string;
  name: string;
  tier: string;
  tagline: string;
  description: string;
  duration: string;
  price: string;
  priceNote?: string;
  deliverables: string[];
  imageUrl: string;
  gallery: string[];
  popular?: boolean;
  badge?: string;
  idealFor: string;
  locationType: 'Studio & On-Location' | 'Studio Exclusive' | 'On-Location Worldwide';
}

export const U1_SERVICES: U1Service[] = [];
export const U1_PACKAGES: U1Package[] = [];
export const U1_PORTFOLIO_ITEMS: U1PortfolioItem[] = [];
