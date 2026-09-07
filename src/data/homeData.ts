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

export const FEATURED_SERVICES: FeaturedService[] = [
  {
    id: 'srv-event-decor',
    divisionId: 'sws',
    divisionName: 'SWS Event Management',
    divisionRoute: '/sws',
    title: 'Luxury Event Staging & Theme Production',
    description: 'Complete spatial transformation, intelligent acoustic lighting, thematic floral architecture, and seamless VIP hospitality management.',
    features: [
      '3D Architectural Stage Rendering',
      'Concert-Grade Acoustic Rigs & Line Arrays',
      '4K LED Screen Matrices & Live Feeds',
      'Dedicated Stage Director & Hospitality Concierge'
    ],
    iconName: 'Sparkles',
    popular: true,
    badge: 'Events & Production',
    accentColor: '#0052FF',
    turnaroundTime: 'Custom Timeline'
  },
  {
    id: 'srv-cinema-photo',
    divisionId: 'u1',
    divisionName: 'U1 Studio',
    divisionRoute: '/u1',
    title: 'Cinematography & Fine-Art Photography',
    description: 'Cinema-grade 8K video production, commercial brand storytelling, editorial fashion shoots, and luxury wedding documentation.',
    features: [
      'Cinema 8K RAW Multi-Camera Coverage',
      'Licensed 4K FPV Aerial Drone Cinematography',
      'High-End Color Grading & Dolby Audio Master',
      'Handcrafted Archival Heirloom Photo Albums'
    ],
    iconName: 'Camera',
    popular: true,
    badge: 'Media & Film',
    accentColor: '#0052FF',
    turnaroundTime: '2-3 Weeks Delivery'
  },
  {
    id: 'srv-cloud-software',
    divisionId: 'it',
    divisionName: 'IT & Solutions',
    divisionRoute: '/it',
    title: 'Enterprise Software & Cloud Platforms',
    description: 'Custom React & Node.js web platforms, native mobile applications, automated cloud infrastructure, and real-time ERP systems.',
    features: [
      'Full-Stack Modern Web & Mobile Apps',
      'Scalable Serverless & Microservices Mesh',
      'Custom ERP, CRM & Inventory Integration',
      'Enterprise Uptime & Security Hardening'
    ],
    iconName: 'Cpu',
    popular: true,
    badge: 'Tech & Engineering',
    accentColor: '#0052FF',
    turnaroundTime: 'Agile Sprints'
  },
  {
    id: 'srv-luxury-travel',
    divisionId: 'travels',
    divisionName: 'Mahdev Travels',
    divisionRoute: '/travels',
    title: 'Bespoke Island Expeditions & VIP Concierge',
    description: 'Handcrafted luxury journeys across Sri Lanka, corporate retreat management, private helicopter charters, and 5-star villa curation.',
    features: [
      'Personalized Day-by-Day Curated Itineraries',
      'Premium Chauffeur Fleet & Luxury Vehicles',
      'Exclusive Access to Heritage Estates & Resorts',
      '24/7 Dedicated On-Ground Travel Host'
    ],
    iconName: 'Plane',
    popular: false,
    badge: 'Travel & Expeditions',
    accentColor: '#0052FF',
    turnaroundTime: 'Immediate Confirmation'
  },
  {
    id: 'srv-online-commerce',
    divisionId: 'mart',
    divisionName: 'Mahdev Online Mart',
    divisionRoute: '/mart',
    title: 'Curated Decor & Tech Hardware Mart',
    description: 'Bespoke event and interior decor, ambient stage lighting fixtures, authenticated smart electronics, and creator tech gear.',
    features: [
      'Authentic Event & Stage Decor Pieces',
      'Smart Electronics & Creator Tech Gear',
      'Fast Island-wide Express Doorstep Delivery',
      'Dedicated After-Sales & Warranty Support'
    ],
    iconName: 'ShoppingBag',
    popular: false,
    badge: 'Decor & Smart Tech',
    accentColor: '#0052FF',
    turnaroundTime: '24-48h Dispatch'
  }
];

export const FEATURED_WORK: FeaturedWorkItem[] = [
  {
    id: 'work-1',
    divisionId: 'sws',
    divisionName: 'SWS Event Management',
    divisionRoute: '/sws',
    title: 'South Asia Economic Forum & Gala',
    category: 'Corporate Summit & VIP Gala',
    client: 'International Trade Chamber',
    year: '2025',
    summary: 'A 3-day high-security summit hosting 2,200 foreign delegates with real-time interpretation, immersive LED tunnel entryways, and banquet staging.',
    highlights: [
      'Custom 40-meter curved 4K LED backdrop',
      'Zero audio-latency live transmission',
      'VIP protocol and security coordination'
    ],
    badge: 'Event Production',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop',
    accentColor: '#0052FF',
    metric: {
      label: 'Delegates Hosted',
      value: '2,200+'
    }
  },
  {
    id: 'work-2',
    divisionId: 'u1',
    divisionName: 'U1 Studio',
    divisionRoute: '/u1',
    title: 'Ceylon Heritage — Cinematic Docuseries',
    category: 'Commercial & Cultural Cinematography',
    client: 'National Tourism Board',
    year: '2025',
    summary: 'An award-winning 6-part mini docuseries filmed in 8K across misty central highlands, ancient kingdoms, and pristine coastal reefs.',
    highlights: [
      '8K HDR cinema production with anamorphic primes',
      'FPV cinematic aerial tracking shots',
      'Original orchestral score sound design'
    ],
    badge: 'Cinematography',
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop',
    accentColor: '#0052FF',
    metric: {
      label: 'Global Viewership',
      value: '1.4M+'
    }
  },
  {
    id: 'work-3',
    divisionId: 'it',
    divisionName: 'IT & Solutions',
    divisionRoute: '/it',
    title: 'OmniTrade Real-time Logistics Platform',
    category: 'Cloud Architecture & Enterprise Web',
    client: 'Apex Global Logistics',
    year: '2024',
    summary: 'Modernized legacy supply-chain workflows with a cloud-native real-time portal handling fleet tracking, dynamic routing, and automated invoicing.',
    highlights: [
      'Sub-50ms sync latency across 14 distribution centers',
      'Offline-capable driver mobile companion app',
      '99.99% measured service uptime'
    ],
    badge: 'Enterprise Software',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
    accentColor: '#0052FF',
    metric: {
      label: 'Efficiency Boost',
      value: '+42%'
    }
  },
  {
    id: 'work-4',
    divisionId: 'travels',
    divisionName: 'Mahdev Travels',
    divisionRoute: '/travels',
    title: 'Royal Ceylon Highland Retreat',
    category: 'VIP Bespoke Expedition',
    client: 'Global Executive Delegation',
    year: '2024',
    summary: 'A 10-day private retreat encompassing helicopter transfers, private colonial tea bungalow stays, and exclusive culinary dining experiences.',
    highlights: [
      'Private helicopter transfers between 5 destinations',
      'Curated tea estate masterclasses and biodiversity walks',
      'Dedicated 24/7 multilingual travel concierges'
    ],
    badge: 'Luxury Travel',
    imageUrl: 'https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=1200&auto=format&fit=crop',
    accentColor: '#0052FF',
    metric: {
      label: 'Guest Rating',
      value: '5.0 / 5'
    }
  },
  {
    id: 'work-5',
    divisionId: 'mart',
    divisionName: 'Mahdev Online Mart',
    divisionRoute: '/mart',
    title: 'Broadcast Media Equipment Overhaul',
    category: 'Enterprise Hardware Procurement',
    client: 'Vanguard Media House',
    year: '2025',
    summary: 'Full-cycle procurement, testing, configuration, and warranty setup for 45 studio camera bodies, wireless transmission kits, and lighting matrices.',
    highlights: [
      'Direct authorized manufacturer sourcing',
      'Pre-calibrated color profiles and stress testing',
      'Delivered 4 days ahead of scheduled air date'
    ],
    badge: 'Procurement',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop',
    accentColor: '#0052FF',
    metric: {
      label: 'Units Deployed',
      value: '120+ Units'
    }
  }
];

export const COMPANY_MILESTONES: (MilestoneItem & { id: string; badge: string; keyOutcome: string })[] = [
  {
    id: 'ms-2022',
    year: '2022',
    title: 'Founding & Core Trilateral Launch',
    description: 'Mahdev established corporate headquarters in Colombo, launching SWS Event Management & Decorations, U1 Studio Photography & Cinema, and Mahdev IT Solutions as foundational pillars.',
    divisionId: 'sws',
    badge: 'Inception',
    keyOutcome: 'Delivered 80+ luxury wedding decors, 8K photo/cinema projects, and enterprise cloud portals in year one.',
    highlight: true
  },
  {
    id: 'ms-2023',
    year: '2023',
    title: '8K Cinema Rigs, Enterprise Software & Grand Stage Scale',
    description: 'Expanded creative and engineering wings with licensed aerial drone fleets, studio color suites, and scalable enterprise SaaS portals.',
    divisionId: 'u1',
    badge: 'Creative & Tech Expansion',
    keyOutcome: 'Produced national brand campaigns, high-scale wedding documentaries, and high-concurrency enterprise logistics software.',
    highlight: false
  },
  {
    id: 'ms-2024',
    year: '2024',
    title: 'Mahdev Travels & Online Mart Launch',
    description: 'Completed the foundational 5-division ecosystem by launching bespoke luxury island expeditions and an authenticated tech hardware commerce storefront.',
    divisionId: 'travels',
    badge: 'Ecosystem Completion',
    keyOutcome: 'Formed a unified multi-service ecosystem spanning creative decorations, photography, digital engineering, luxury travel, and verified commerce.',
    highlight: false
  },
  {
    id: 'ms-2025',
    year: '2025 - Present',
    title: 'Unified Corporate Synergy & Digital Mesh',
    description: 'Consolidated parent governance and centralized technological architecture to deliver cross-division synergy for individuals and multinational brands alike.',
    badge: 'Synergy Era',
    keyOutcome: 'One trusted parent company providing 360-degree innovation and creative mastery.',
    highlight: true
  }
];

export const TRUSTED_COMPANIES: TrustedCompany[] = [
  {
    id: 'co-1',
    name: 'Ceylon Enterprises Group',
    industry: 'Conglomerate & Trade',
    partnershipType: 'Enterprise IT & Corporate Events'
  },
  {
    id: 'co-2',
    name: 'Horizon Ventures',
    industry: 'Private Equity & Capital',
    partnershipType: 'Media Production & Brand Films'
  },
  {
    id: 'co-3',
    name: 'Vanguard Media House',
    industry: 'Broadcasting & Telecommunications',
    partnershipType: 'Studio Gear & Audio Engineering'
  },
  {
    id: 'co-4',
    name: 'Lanka Tech Labs',
    industry: 'Software & Fintech',
    partnershipType: 'Cloud Infrastructure & DevOps'
  },
  {
    id: 'co-5',
    name: 'Apex Global Logistics',
    industry: 'Maritime & Freight',
    partnershipType: 'Custom ERP & Fleet Portals'
  },
  {
    id: 'co-6',
    name: 'Serendib Heritage Resorts',
    industry: 'Hospitality & Tourism',
    partnershipType: 'VIP Travel Curation & Photojournalism'
  }
];

export const WHY_MAHDEV_DIFFERENTIATORS: DifferentiatorItem[] = [
  {
    id: 'diff-ecosystem',
    title: 'Unified Ecosystem',
    shortDescription: 'A single corporate partner managing events, media, tech, and travel without fragmented vendor coordination.',
    fullDescription: 'Instead of dealing with multiple disjointed agencies, clients benefit from a single corporate partner with unified standards of quality and execution.',
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
