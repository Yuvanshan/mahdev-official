import { DivisionId, MilestoneItem, PortfolioProject, ServiceItem, TrustedCompany } from '../types';

export interface FeaturedService extends ServiceItem {
  divisionName: string;
  divisionRoute: string;
  accentColor: string;
  badge: string;
  turnaroundTime?: string;
}

export interface FeaturedWorkItem extends PortfolioProject {
  divisionName: string;
  divisionRoute: string;
  badge: string;
  imageUrl: string;
  accentColor: string;
  metric: {
    label: string;
    value: string;
  };
}

export interface DifferentiatorItem {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  badge: string;
  highlightPoints: string[];
}

export const FEATURED_SERVICES: FeaturedService[] = [];

export const FEATURED_WORK: FeaturedWorkItem[] = [];

export const COMPANY_MILESTONES: (MilestoneItem & { id: string; badge: string; keyOutcome: string })[] = [];

export const TRUSTED_COMPANIES: TrustedCompany[] = [];

export const WHY_MAHDEV_DIFFERENTIATORS: DifferentiatorItem[] = [
  {
    id: 'diff-ecosystem',
    title: 'Unified Ecosystem',
    shortDescription: 'A single reliable partner managing events, media, tech, and travel without fragmented vendor coordination.',
    fullDescription: 'Instead of dealing with multiple disjointed agencies, clients benefit from a single partner with unified standards of quality and execution.',
    iconName: 'Layers',
    badge: 'Unified Synergy',
    highlightPoints: [
      'Single point of accountability across 5 divisions',
      'Synchronized timelines and cross-functional teams',
      'Consolidated invoicing and dedicated account lead'
    ]
  },
  {
    id: 'diff-creative',
    title: 'Creative Artistry',
    shortDescription: 'Cinema-grade visual fidelity, spatial aesthetics, and bespoke storytelling across every production.',
    fullDescription: 'From high-impact conference staging to editorial photojournalism and brand commercials, our creative teams deliver refined artistic execution.',
    iconName: 'Sparkles',
    badge: 'Creative Mastery',
    highlightPoints: [
      'Cinema 8K production rigs and fine-art composition',
      'Artisanal stage design and custom lighting architecture',
      'Award-winning visual directors and media specialists'
    ]
  },
  {
    id: 'diff-tech',
    title: 'Engineered Systems',
    shortDescription: 'Modern cloud architectures, automated workflows, and enterprise platforms built for scale.',
    fullDescription: 'Our IT division engineers robust, type-safe software platforms and automated systems that power modern enterprise efficiency.',
    iconName: 'Cpu',
    badge: 'Engineered Precision',
    highlightPoints: [
      'High-performance React, TypeScript & cloud architectures',
      'High uptime guarantees on enterprise systems',
      'Proactive cybersecurity and strict code quality standards'
    ]
  },
  {
    id: 'diff-customer',
    title: 'Dedicated Support',
    shortDescription: 'Direct project managers, transparent milestone tracking, and rapid response across all engagements.',
    fullDescription: 'We treat every engagement with dedicated care, prompt responses, and proactive communication.',
    iconName: 'Heart',
    badge: 'Client Focus',
    highlightPoints: [
      'Dedicated project leads for every client engagement',
      'Transparent milestone tracking and proactive updates',
      'Tailored solutions designed around your exact needs'
    ]
  },
  {
    id: 'diff-growth',
    title: 'Islandwide Reach',
    shortDescription: 'Operational capacity and dedicated crews deploying across all 9 provinces in Sri Lanka.',
    fullDescription: 'With strong local roots and nationwide operational capacity, Mahdev delivers consistent quality across the island.',
    iconName: 'Globe',
    badge: 'Nationwide Delivery',
    highlightPoints: [
      'Island-wide logistics and on-ground deployment teams',
      'Strong local network of certified vendors and venues',
      'Global traveler concierge and international client support'
    ]
  }
];
