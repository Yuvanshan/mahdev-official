export interface TravelDestination {
  id: string;
  name: string;
  region: string;
  tagline: string;
  description: string;
  imageUrl: string;
  gallery: string[];
  bestTimeToVisit: string;
  highlights: string[];
  recommendedDays: string;
}

export interface TravelPackage {
  id: string;
  title: string;
  destination: string;
  duration: string;
  tagline: string;
  description: string;
  heroImage: string;
  gallery: string[];
  highlights: string[];
  price: string;
  pricePerPerson: number;
  priceNote: string;
  availability: string;
  difficulty: 'Easy' | 'Moderate' | 'Active';
  tourType: 'Private Tour' | 'Small Group' | 'Luxury Expedition';
  badge?: string;
  overview: string;
  itinerary: {
    day: number;
    title: string;
    location: string;
    description: string;
    meals: string;
    stay: string;
  }[];
  included: string[];
  excluded: string[];
  pricingTiers: {
    tier: string;
    price: string;
    description: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export interface DayTour {
  id: string;
  title: string;
  location: string;
  duration: string;
  imageUrl: string;
  description: string;
  highlights: string[];
  price: string;
  included: string[];
}

export interface Vehicle {
  id: string;
  name: string;
  category: 'Luxury Sedan' | 'VIP Van' | '4x4 Expedition' | 'Executive Coach';
  capacity: string;
  luggage: string;
  imageUrl: string;
  features: string[];
  dailyRate: string;
}

export interface TravelStory {
  id: string;
  title: string;
  traveler: string;
  origin: string;
  packageTaken: string;
  quote: string;
  rating: number;
  date: string;
  image: string;
}

export const TRAVEL_DESTINATIONS: TravelDestination[] = [];
export const TRAVEL_PACKAGES: TravelPackage[] = [];
export const DAY_TOURS: DayTour[] = [];
export const VEHICLES: Vehicle[] = [];
export const TRAVEL_STORIES: TravelStory[] = [];
