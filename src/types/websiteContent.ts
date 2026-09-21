/**
 * MAHDEV Pvt Ltd — Complete Website Legal & Company Information Types
 */

export interface CoreValueItem {
  id: string;
  title: string;
  description: string;
  order: number;
  enabled: boolean;
  iconName?: string;
}

export interface AboutDivisionItem {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  services: string[];
  route: string;
  image?: string;
  order: number;
  enabled: boolean;
}

export interface TimelineMilestoneItem {
  id: string;
  year: string;
  title: string;
  description: string;
  image?: string;
  order: number;
  enabled: boolean;
}

export interface CompanyLocationItem {
  id: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  mapUrl?: string;
  order: number;
  enabled: boolean;
}

export interface AboutUsContent {
  id: string;
  hero: {
    title: string;
    subtitle: string;
    description: string;
    bgImageUrl?: string;
    buttonText: string;
    buttonRoute: string;
  };
  companyIntro: {
    heading: string;
    description: string;
  };
  vision: {
    heading: string;
    description: string;
  };
  mission: {
    heading: string;
    description: string;
  };
  values: CoreValueItem[];
  divisions: AboutDivisionItem[];
  timeline: TimelineMilestoneItem[];
  locations: CompanyLocationItem[];
  cta: {
    title: string;
    description: string;
    primaryButtonText: string;
    primaryButtonRoute: string;
    secondaryButtonText: string;
    secondaryButtonRoute: string;
  };
  status: 'published' | 'draft';
  version: number;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  updatedBy?: string;
}

export interface LegalSection {
  id: string;
  number: number;
  heading: string;
  content: string[];
  subsections?: Array<{
    title: string;
    text: string;
  }>;
  order: number;
}

export interface LegalDocument {
  id: 'termsAndConditions' | 'privacyPolicy' | string;
  slug: 'terms-and-conditions' | 'privacy-policy' | string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  effectiveDate: string;
  version: string;
  status: 'published' | 'draft';
  sections: LegalSection[];
  draftSections?: LegalSection[];
  hasUnpublishedChanges?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  updatedBy?: string;
}
