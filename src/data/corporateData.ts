import {
  DivisionId,
  LeadershipMember,
  CompanyValue,
  TrustedCompany,
  PortfolioProject,
  Testimonial,
  MilestoneItem,
  LegalPolicyType,
} from '../types';
import { COMPANY_INFO } from '../config/company';

export const COMPANY_STORY = {
  headline: 'From Visionary Foundations to an Integrated Enterprise',
  subheadline: 'Crafting Moments, Capturing Memories, and Delivering Modern Innovation across Sri Lanka and Beyond.',
  paragraphs: [
    'Founded in 2018 in Colombo, Sri Lanka, Mahdev Pvt Ltd was conceived on a singular premise: that exceptional artistry and rigorous engineering should not exist in isolation. Starting as a boutique high-concept event staging and production agency (SWS Event Management), the founding team rapidly recognized that clients needed seamless continuity across media production, software technology, and logistical execution.',
    'Over eight years of disciplined organic growth, Mahdev purposefully expanded into five autonomous yet deeply synchronized business pillars. In 2020, U1 Studio was established to pioneer 8K cinematography and fine-art visual documentation. In 2022, Mahdev IT & Solutions was formed to build resilient cloud software, enterprise platforms, and automated workflow systems.',
    'By 2024, the enterprise established Mahdev Travels for bespoke luxury expeditions and Mahdev Online Mart for authenticated hardware procurement. Today, Mahdev Pvt Ltd stands as a modern holding ecosystem where corporate governance, artistic mastery, and technological precision converge under one trusted roof.'
  ],
  stats: [
    { label: 'Founded', value: '2018', subtext: '8+ Years of Growth' },
    { label: 'Autonomous Units', value: '5 Divisions', subtext: 'Unified Governance' },
    { label: 'Island-wide Reach', value: '9 Provinces', subtext: 'Sri Lanka & Global' },
    { label: 'Client Satisfaction', value: '99.4%', subtext: 'Institutional SLAs' },
  ]
};

export const MISSION_VISION = {
  mission: {
    title: 'Our Mission',
    statement: 'To craft transformative experiences, create timeless visual narratives, and engineer resilient digital solutions that empower businesses, celebrate human milestones, and drive sustainable economic progress.',
    keyPoints: [
      'Deliver institutional-grade execution across every engagement',
      'Unify artistic creativity with robust technological engineering',
      'Maintain uncompromising client trust and transparent governance',
      'Foster local talent and cultivate sustainable industry ecosystems'
    ]
  },
  vision: {
    title: 'Our Vision',
    statement: 'To be celebrated as Sri Lanka\'s benchmark multi-disciplinary enterprise—recognized regionally and internationally for creative mastery, technological innovation, and ethical leadership.',
    keyPoints: [
      'Expand cross-border technological partnerships and media productions',
      'Set the gold standard for integrated enterprise solutions in South Asia',
      'Champion carbon-conscious event staging and eco-aligned travel expeditions',
      'Provide a continuous pipeline of innovation through research and development'
    ]
  }
};

export const COMPANY_VALUES: CompanyValue[] = [
  {
    id: 'val-excellence',
    title: 'Relentless Excellence',
    tagline: 'Precision in every detail.',
    description: 'We do not compromise on caliber. Whether routing an enterprise cloud mesh or composing a single frame of cinema 8K video, we measure our output against international benchmarks.',
    iconName: 'Award',
    commitment: 'Zero-defect delivery and verified stage SLAs.'
  },
  {
    id: 'val-integrity',
    title: 'Institutional Integrity',
    tagline: 'Transparency and steadfast trust.',
    description: 'We operate with candid communication, honest pricing structures, and strict confidentiality. Our clients trust us with their most critical corporate systems and intimate family milestones.',
    iconName: 'Shield',
    commitment: 'Full financial transparency and strict client NDAs.'
  },
  {
    id: 'val-innovation',
    title: 'Applied Innovation',
    tagline: 'Forward-looking solutions that solve real challenges.',
    description: 'We embrace emerging technology not as novelty, but as a catalyst for efficiency, aesthetic beauty, and measurable business growth.',
    iconName: 'Sparkles',
    commitment: 'Continuous modernization of our tooling and tech stack.'
  },
  {
    id: 'val-synergy',
    title: 'Ecosystem Synergy',
    tagline: 'The whole is greater than the sum of its parts.',
    description: 'Our five divisions operate with seamless cross-functional cohesion. An event managed by SWS benefits directly from U1 cinematography, IT software registration, and curated guest travel.',
    iconName: 'Layers',
    commitment: 'Single-source convenience without multiple vendor overhead.'
  },
  {
    id: 'val-centricity',
    title: 'Customer Centricity',
    tagline: 'Listening first, executing with empathy.',
    description: 'Every project begins by understanding the human aspirations and business objectives behind the mandate. We adapt our systems to our clients, never the reverse.',
    iconName: 'Heart',
    commitment: 'Dedicated project directors assigned to every account.'
  }
];

export const LEADERSHIP_TEAM: LeadershipMember[] = [
  {
    id: 'lead-1',
    name: 'Yuvanshan S.',
    title: 'Founder & Managing Director',
    role: 'Executive Leadership & Strategic Direction',
    bio: 'Pioneered Mahdev Pvt Ltd from its inception in 2018, steering the group\'s multi-sector vision, corporate capital strategy, and high-standard operational culture across Sri Lanka.',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    divisionFocus: 'Group Executive Board',
    linkedin: 'https://linkedin.com',
    email: 'md@mahdev.lk',
    badge: 'Executive Board',
    credentials: ['Group Governance', 'Venture Strategy', 'Enterprise Operations']
  },
  {
    id: 'lead-2',
    name: 'Dinesh Perera',
    title: 'Chief Technology Officer',
    role: 'Head of IT & Digital Architecture',
    bio: 'Directs Mahdev IT & Solutions, leading full-stack engineering, cloud infrastructure, and cybersecurity initiatives for corporate and governmental clientele.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    divisionFocus: 'Mahdev IT & Solutions',
    linkedin: 'https://linkedin.com',
    email: 'tech@mahdev.lk',
    badge: 'Technology Lead',
    credentials: ['Distributed Systems', 'Cloud Security', 'Modern Web & Mobile']
  },
  {
    id: 'lead-3',
    name: 'Kavindu Senanayake',
    title: 'Head of Creative & Cinematography',
    role: 'Creative Director — U1 Studio',
    bio: 'Acclaimed visual director overseeing cinema 8K production, commercial storytelling, and editorial visual direction for landmark brands and international broadcast features.',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
    divisionFocus: 'U1 Studio',
    linkedin: 'https://linkedin.com',
    email: 'creative@mahdev.lk',
    badge: 'Creative Director',
    credentials: ['Cinema 8K Direction', 'Color Science', 'Sound Engineering']
  },
  {
    id: 'lead-4',
    name: 'Anarkali Wickramasinghe',
    title: 'Head of Event Production',
    role: 'Director of Operations — SWS Event Management',
    bio: 'Brings over a decade of luxury event architecture, VIP protocol coordination, and large-scale staging expertise for state banquets, international summits, and elite weddings.',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    divisionFocus: 'SWS Event Management',
    linkedin: 'https://linkedin.com',
    email: 'events@mahdev.lk',
    badge: 'Event Operations',
    credentials: ['Spatial Architecture', 'VIP Hospitality', 'Concert Staging']
  },
  {
    id: 'lead-5',
    name: 'Roshan Fernando',
    title: 'Head of Expeditions & Procurement',
    role: 'Director — Mahdev Travels & Online Mart',
    bio: 'Oversees island-wide luxury travel logistics, bespoke VIP itineraries, and authenticated tech hardware procurement pipelines with strict quality assurance.',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop',
    divisionFocus: 'Travels & Online Mart',
    linkedin: 'https://linkedin.com',
    email: 'expeditions@mahdev.lk',
    badge: 'Logistics & Supply',
    credentials: ['VIP Concierge', 'Supply Chain', 'Vendor Governance']
  }
];

export const VERIFIED_MILESTONES: MilestoneItem[] = [
  {
    id: 'ms-2018',
    year: '2018',
    title: 'Corporate Inception & SWS Event Management Debut',
    description: 'Mahdev established headquarters in Colombo, launching SWS Event Management with a focus on luxury wedding productions, sound engineering, and corporate galas.',
    divisionId: 'sws',
    badge: 'Inception',
    keyOutcome: 'Delivered 35+ landmark wedding and corporate stage productions in year one with 100% on-time execution.',
    highlight: false,
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'ms-2020',
    year: '2020',
    title: 'U1 Studio Establishment & 8K Cinema Wing',
    description: 'Expanded creative capabilities with a dedicated visual production wing, investing in 8K cinematography, licensed aerial drone fleets, and state-of-the-art grading suites.',
    divisionId: 'u1',
    badge: 'Creative Expansion',
    keyOutcome: 'Produced national broadcast commercials, documentary films, and award-winning cultural visual series.',
    highlight: false,
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'ms-2022',
    year: '2022',
    title: 'IT & Solutions Division Launch',
    description: 'Formed Mahdev IT & Solutions to build mission-critical enterprise software, real-time logistics portals, scalable web apps, and automated cloud infrastructure.',
    divisionId: 'it',
    badge: 'Tech Engineering',
    keyOutcome: 'Engineered high-concurrency digital platforms for leading Sri Lankan logistics and commercial enterprises.',
    highlight: true,
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'ms-2024',
    year: '2024',
    title: 'Mahdev Travels & Online Mart Expansion',
    description: 'Completed the foundational 5-division ecosystem by launching bespoke luxury island expeditions and an authenticated tech hardware commerce storefront.',
    divisionId: 'travels',
    badge: 'Ecosystem Completion',
    keyOutcome: 'Formed a unified multi-service ecosystem spanning creative lifestyle, digital engineering, and commerce.',
    highlight: false,
    imageUrl: 'https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'ms-2025',
    year: '2025 - Present',
    title: 'Unified Corporate Synergy & Digital Mesh',
    description: 'Consolidated parent governance and centralized technological architecture to deliver cross-division synergy for individuals and multinational brands alike.',
    badge: 'Synergy Era',
    keyOutcome: 'One trusted parent company providing 360-degree innovation, creative mastery, and guaranteed delivery.',
    highlight: true,
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'
  }
];

export const TRUSTED_COMPANIES_DATA: TrustedCompany[] = [
  {
    id: 'co-ceylon-enterprises',
    name: 'Ceylon Enterprises Group',
    industry: 'Conglomerate & Trade',
    partnershipType: 'Enterprise IT & Corporate Events',
    website: 'https://example.com/ceylon-enterprises',
    description: 'Collaborating on annual nationwide shareholder summits, custom internal ERP integrations, and executive media productions.',
    featured: true
  },
  {
    id: 'co-horizon-ventures',
    name: 'Horizon Ventures',
    industry: 'Private Equity & Capital',
    partnershipType: 'Media Production & Brand Films',
    website: 'https://example.com/horizon-ventures',
    description: 'Delivering cinematic investor pitch documentaries, high-resolution executive portraits, and private portfolio retreats.',
    featured: true
  },
  {
    id: 'co-vanguard-media',
    name: 'Vanguard Media House',
    industry: 'Broadcasting & Media',
    partnershipType: 'Studio Gear & Audio Engineering',
    website: 'https://example.com/vanguard-media',
    description: 'Long-term procurement partner for professional studio camera bodies, wireless audio transmitters, and live concert matrices.',
    featured: true
  },
  {
    id: 'co-lanka-tech',
    name: 'Lanka Tech Labs',
    industry: 'Software & Fintech',
    partnershipType: 'Cloud Infrastructure & DevOps',
    website: 'https://example.com/lanka-tech',
    description: 'Engineering resilient microservices mesh architectures, automated CI/CD pipelines, and high-frequency data portals.',
    featured: true
  },
  {
    id: 'co-apex-logistics',
    name: 'Apex Global Logistics',
    industry: 'Maritime & Freight',
    partnershipType: 'Custom ERP & Fleet Portals',
    website: 'https://example.com/apex-logistics',
    description: 'Modernized legacy supply-chain workflows with real-time GPS fleet tracking and cross-platform mobile companion software.',
    featured: true
  },
  {
    id: 'co-serendib-heritage',
    name: 'Serendib Heritage Resorts',
    industry: 'Hospitality & Luxury Tourism',
    partnershipType: 'VIP Travel Curation & Photojournalism',
    website: 'https://example.com/serendib-heritage',
    description: 'Joint luxury travel itineraries for international delegations, villa content capture, and high-end culinary showcases.',
    featured: true
  },
  {
    id: 'co-premier-bank',
    name: 'Premier Commercial Bank',
    industry: 'Banking & Financial Services',
    partnershipType: 'VIP Gala Staging & Live Broadcast',
    website: 'https://example.com/premier-bank',
    description: 'Managed 50th-anniversary milestone celebration with 1,800 guests, simultaneous multi-hall 4K feeds, and live translation.',
    featured: false
  },
  {
    id: 'co-aurora-innovations',
    name: 'Aurora Health Innovations',
    industry: 'Healthcare & Biotech',
    partnershipType: 'Cloud Web App & Medical Media',
    website: 'https://example.com/aurora-health',
    description: 'Engineered HIPAA-aligned patient telemetry visualizer and created documentary medical education videos.',
    featured: false
  }
];

export const PORTFOLIO_PROJECTS_DATA: PortfolioProject[] = [
  // SWS Event Management
  {
    id: 'proj-sws-1',
    divisionId: 'sws',
    title: 'South Asia Economic Forum & VIP Gala',
    category: 'Corporate Summit & Gala',
    client: 'International Trade Chamber',
    year: '2025',
    summary: 'A 3-day high-security diplomatic summit hosting 2,200 foreign delegates with real-time interpretation, 40m curved 4K LED backdrops, and banquet staging.',
    fullDescription: 'SWS Event Management orchestrated every facet of this high-stakes summit held at the BMICH. Our team engineered custom 3D architectural staging, managed multi-tier VIP protocol, and deployed concert-grade line arrays with zero acoustic feedback.',
    highlights: [
      'Custom 40-meter curved 4K LED backdrop with dynamic backdrop scenes',
      'Zero audio-latency multi-channel live simultaneous interpretation',
      'Full VIP protocol, security clearance, and 5-star culinary coordination'
    ],
    deliverables: [
      '3D Architectural Stage Design',
      'Acoustic Rigging & Intelligent Lighting',
      'Simultaneous Interpretation Rigs',
      'Live Multi-Camera Switchboard'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop'
    ],
    impactMetrics: [
      { label: 'Delegates Hosted', value: '2,200+' },
      { label: 'Countries Represented', value: '28' },
      { label: 'Uptime & SLA', value: '100%' }
    ],
    tags: ['Events', 'Staging', 'Corporate', 'LED Matrix', 'VIP Protocol']
  },
  {
    id: 'proj-sws-2',
    divisionId: 'sws',
    title: 'Royal Ceylon Destination Wedding',
    category: 'Luxury Wedding Production',
    client: 'Private High-Net-Worth Family',
    year: '2024',
    summary: 'A 4-day bespoke wedding celebration in Bentota with glass-top oceanfront stage, 10,000 imported floral stems, and kinetic lighting choreography.',
    fullDescription: 'Transforming a pristine coastal estate into a royal wonderland, SWS designed an illuminated ocean platform, synchronized pyrotechnics, and custom acoustic zoning for over 800 international guests.',
    highlights: [
      'Glass-top cantilevered stage over oceanfront sands',
      'Custom acoustic zoning preserving natural ocean ambiance',
      'Orchestrated drone light show and choreographed pyrotechnics'
    ],
    deliverables: [
      'Complete Spatial Floral Architecture',
      'Sound & Lighting Engineering',
      'Guest Concierge & Transportation',
      'Stage Production & Direction'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop'
    ],
    impactMetrics: [
      { label: 'Guests Catered', value: '850' },
      { label: 'Event Days', value: '4 Days' },
      { label: 'Satisfaction', value: '5.0 / 5' }
    ],
    tags: ['Wedding', 'Luxury', 'Oceanfront', 'Lighting', 'Floral']
  },

  // U1 Studio Media
  {
    id: 'proj-u1-1',
    divisionId: 'u1',
    title: 'Ceylon Heritage — Cinematic Docuseries',
    category: 'Commercial & Cultural Docuseries',
    client: 'National Tourism Promotion Bureau',
    year: '2025',
    summary: 'An award-winning 6-part mini docuseries filmed in cinema 8K RAW across misty central highlands, ancient kingdoms, and coastal marine sanctuaries.',
    fullDescription: 'U1 Studio spent 45 days in production across 9 provinces with high-frame-rate anamorphic lenses, FPV cinematic drones, and custom Dolby Atmos audio mastering to showcase Sri Lanka\'s cultural biodiversity.',
    highlights: [
      '8K HDR cinema production with anamorphic primes',
      'FPV cinematic aerial tracking over mist-shrouded peak sanctuaries',
      'Original live orchestral score recorded and mastered in Dolby Atmos'
    ],
    deliverables: [
      '6 x 22-minute 8K Broadcast Episodes',
      '4K Social Media Short Cuts',
      'Archival Hardcover Photography Book',
      'Global Distribution Master Package'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop'
    ],
    impactMetrics: [
      { label: 'Global Viewership', value: '1.4M+' },
      { label: 'Film Festival Accolades', value: '4 Awards' },
      { label: 'Master Resolution', value: '8K RAW' }
    ],
    tags: ['Docuseries', 'Cinema 8K', 'Dolby Atmos', 'Aerial FPV', 'Tourism']
  },
  {
    id: 'proj-u1-2',
    divisionId: 'u1',
    title: 'Aura Haute Couture Commercial Campaign',
    category: 'Fashion & Editorial Brand Film',
    client: 'Aura Luxury Apparel',
    year: '2024',
    summary: 'A high-concept visual campaign blending modernist architectural backdrops in Colombo with handcrafted silk couture.',
    fullDescription: 'Delivered dynamic lookbooks, 60-second broadcast TVCs, and high-fashion editorial stills with specialized studio lighting and fine-art color grading.',
    highlights: [
      'High-speed Phantom 1000fps fabric flow capture',
      'Editorial color grading calibrated for luxury print and digital',
      'Full campaign rollout across digital billboards and print'
    ],
    deliverables: [
      '3 Broadcast TVCs (60s, 30s, 15s)',
      '120 High-Res Editorial Stills',
      'Social Video Assets & Reels'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop'
    ],
    impactMetrics: [
      { label: 'Campaign Reach', value: '3.2M' },
      { label: 'Brand Lift', value: '+38%' }
    ],
    tags: ['Fashion', 'Editorial', 'TVC', 'High-Speed', 'Studio']
  },

  // IT & Solutions
  {
    id: 'proj-it-1',
    divisionId: 'it',
    title: 'OmniTrade Real-time Logistics Platform',
    category: 'Cloud Architecture & Enterprise Web',
    client: 'Apex Global Logistics',
    year: '2024',
    summary: 'Modernized legacy supply-chain workflows with a cloud-native real-time portal handling fleet tracking, dynamic routing, and automated invoicing.',
    fullDescription: 'Mahdev IT engineered a reactive microservices mesh on Google Cloud and React, integrating real-time telemetry from over 250 freight vehicles and synchronizing distribution hub inventories across 14 depots.',
    highlights: [
      'Sub-50ms sync latency across 14 distribution centers',
      'Offline-capable driver mobile companion app (iOS & Android)',
      '99.99% measured service uptime over 18 continuous months'
    ],
    deliverables: [
      'Enterprise React Dashboard with Live Maps',
      'React Native Driver Companion App',
      'Automated Invoicing & Tax Engine',
      'Multi-tenant Role-Based Access Control'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=800&auto=format&fit=crop'
    ],
    impactMetrics: [
      { label: 'Efficiency Boost', value: '+42%' },
      { label: 'Fleet Synchronized', value: '250+ Trucks' },
      { label: 'Uptime SLA', value: '99.99%' }
    ],
    tags: ['Cloud', 'React', 'Mobile App', 'Logistics', 'Enterprise']
  },
  {
    id: 'proj-it-2',
    divisionId: 'it',
    title: 'LankaPay Unified Merchant Gateway',
    category: 'Fintech & Transaction Engine',
    client: 'Ceylon Fintech Alliance',
    year: '2025',
    summary: 'High-throughput payment gateway orchestrating multi-bank QR payments, automated merchant reconciliation, and fraud telemetry.',
    fullDescription: 'Built with resilient TypeScript serverless architectures, ISO20022 compliant message parsing, and bank-grade end-to-end encryption.',
    highlights: [
      'Processes 10,000+ transactions per minute at peak hours',
      'Sub-second settlement confirmation and push notifications',
      'Bank-grade AES-256 GCM encryption and audit logging'
    ],
    deliverables: [
      'Merchant Dashboard & SDKs',
      'Payment Gateway Microservice',
      'Fraud Telemetry & Alerts',
      'PCI-DSS Architecture Audit'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop'
    ],
    impactMetrics: [
      { label: 'Txn Volume / Day', value: 'Rs. 180M+' },
      { label: 'Latency', value: '< 200ms' }
    ],
    tags: ['Fintech', 'Payments', 'Security', 'Serverless', 'TypeScript']
  },

  // Mahdev Travels
  {
    id: 'proj-travels-1',
    divisionId: 'travels',
    title: 'Royal Ceylon Highland Retreat',
    category: 'VIP Bespoke Expedition',
    client: 'Global Executive Delegation',
    year: '2024',
    summary: 'A 10-day private retreat encompassing helicopter transfers, colonial tea bungalow stays, and exclusive wildlife sanctuaries.',
    fullDescription: 'Mahdev Travels designed a seamless coast-to-cloud-forest itinerary with chartered helicopter transfers, private naturalist guides, and 5-star culinary dining curated by Sri Lanka\'s leading executive chefs.',
    highlights: [
      'Private helicopter transfers between 5 exclusive destinations',
      'Curated tea estate masterclasses and private biodiversity walks',
      'Dedicated 24/7 multilingual travel concierges and armed security escort'
    ],
    deliverables: [
      'Bespoke Day-by-Day Itinerary Book',
      'Helicopter & Luxury Fleet Logistics',
      'VIP Airport Fast-Track Protocol',
      'Dedicated On-Ground Travel Host'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1546708973-b339540b5162?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800&auto=format&fit=crop'
    ],
    impactMetrics: [
      { label: 'Guest Rating', value: '5.0 / 5' },
      { label: 'Destinations', value: '5 Regions' },
      { label: 'Charter Flights', value: '6 Flights' }
    ],
    tags: ['Travel', 'Luxury', 'Helicopter', 'Ceylon', 'VIP Concierge']
  },

  // Mahdev Online Mart / Other Mahdev Projects
  {
    id: 'proj-mart-1',
    divisionId: 'mart',
    title: 'Broadcast Studio Hardware Overhaul',
    category: 'Enterprise Hardware Procurement',
    client: 'Vanguard Media House',
    year: '2025',
    summary: 'Full-cycle procurement, testing, configuration, and warranty setup for 45 studio camera bodies, wireless transmitters, and LED lighting matrices.',
    fullDescription: 'Mahdev Online Mart managed direct manufacturer sourcing, tax-compliant enterprise invoicing, stress testing, and delivery 4 days ahead of scheduled broadcast air date.',
    highlights: [
      'Direct authorized manufacturer sourcing with international warranty',
      'Pre-calibrated color profiles and temperature stress testing',
      'Delivered 4 days ahead of scheduled nationwide air date'
    ],
    deliverables: [
      '45 Cinema Camera Packages',
      '20 Wireless Video Transmission Links',
      'Full On-site Deployment & Calibration',
      '3-Year Enterprise Extended Warranty'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop',
    galleryImages: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop'
    ],
    impactMetrics: [
      { label: 'Units Deployed', value: '120+ Units' },
      { label: 'Savings Delivered', value: '18%' },
      { label: 'Delivery Time', value: '4 Days Early' }
    ],
    tags: ['Procurement', 'Hardware', 'Cinema Gear', 'Broadcasting', 'Warranty']
  }
];

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: 'test-1',
    author: 'Malik Jayawardena',
    role: 'Executive Director',
    company: 'Ceylon Enterprises Group',
    quote: 'Mahdev Pvt Ltd represents a new breed of enterprise partner in Sri Lanka. They managed both our 2,000-person corporate summit and built our internal digital portal. The seamless synergy saved us hundreds of coordination hours.',
    rating: 5,
    divisionId: 'sws',
    divisionName: 'SWS Event Management & IT',
    avatarInitials: 'MJ',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    date: 'January 2026',
    verified: true
  },
  {
    id: 'test-2',
    author: 'Nirmala Wickramasinghe',
    role: 'Head of Brand Marketing',
    company: 'Serendib Heritage Resorts',
    quote: 'The visual storytelling produced by U1 Studio was transcendent. Their 8K docuseries captured the soul of our property like no other agency could. The international viewership numbers surpassed all our marketing projections.',
    rating: 5,
    divisionId: 'u1',
    divisionName: 'U1 Studio',
    avatarInitials: 'NW',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    date: 'November 2025',
    verified: true
  },
  {
    id: 'test-3',
    author: 'Sunil De Silva',
    role: 'Chief Operating Officer',
    company: 'Apex Global Logistics',
    quote: 'Mahdev IT engineered our fleet management portal with impeccable reliability. We saw a 42% efficiency jump within 90 days. Their engineering team is responsive, deeply technical, and committed to zero-downtime SLAs.',
    rating: 5,
    divisionId: 'it',
    divisionName: 'Mahdev IT & Solutions',
    avatarInitials: 'SS',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    date: 'December 2025',
    verified: true
  },
  {
    id: 'test-4',
    author: 'Elena Rostova',
    role: 'Head of Global Delegations',
    company: 'International Trade Chamber',
    quote: 'Our European delegation spent 10 days traversing Sri Lanka under Mahdev Travels\' concierge. Every helicopter transfer, private bungalow, and security protocol was executed with Swiss precision and genuine Ceylon warmth.',
    rating: 5,
    divisionId: 'travels',
    divisionName: 'Mahdev Travels',
    avatarInitials: 'ER',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    date: 'February 2026',
    verified: true
  },
  {
    id: 'test-5',
    author: 'Ravi Kumarasinghe',
    role: 'Chief Technical Director',
    company: 'Vanguard Media House',
    quote: 'Procuring 45 cinema camera bodies for our nationwide broadcasting overhaul was handled with utmost transparency by Mahdev Online Mart. Genuine authorized warranty, calibrated gear, and fast delivery.',
    rating: 5,
    divisionId: 'mart',
    divisionName: 'Mahdev Online Mart',
    avatarInitials: 'RK',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop',
    date: 'March 2026',
    verified: true
  }
];

export const CORPORATE_CONTACT_DETAILS = {
  headquarters: {
    addressLine1: COMPANY_INFO.offices.colombo.street,
    addressLine2: COMPANY_INFO.offices.colombo.area,
    city: COMPANY_INFO.offices.colombo.city,
    country: COMPANY_INFO.offices.colombo.country,
    fullAddress: COMPANY_INFO.offices.colombo.fullAddress,
    mapQuery: COMPANY_INFO.offices.colombo.mapQuery,
  },
  trincomalee: {
    addressLine1: COMPANY_INFO.offices.trincomalee.street,
    addressLine2: COMPANY_INFO.offices.trincomalee.area,
    city: COMPANY_INFO.offices.trincomalee.city,
    country: COMPANY_INFO.offices.trincomalee.country,
    fullAddress: COMPANY_INFO.offices.trincomalee.fullAddress,
    mapQuery: COMPANY_INFO.offices.trincomalee.mapQuery,
  },
  phones: {
    primary: COMPANY_INFO.primaryPhone,
    secondary: COMPANY_INFO.secondaryPhone,
    generalHQ: COMPANY_INFO.primaryPhone,
    directHotline: COMPANY_INFO.secondaryPhone,
    intlCall: COMPANY_INFO.primaryPhone,
  },
  emails: {
    generalInquiries: COMPANY_INFO.email,
    corporateHQ: COMPANY_INFO.email,
    executiveOffice: COMPANY_INFO.email,
    careers: COMPANY_INFO.email,
  },
  whatsapp: {
    number: COMPANY_INFO.primaryPhone,
    url: `https://wa.me/94750928078?text=${encodeURIComponent('Hello Mahdev Pvt Ltd, I would like to inquire about your services.')}`,
  },
  workingHours: {
    weekdays: COMPANY_INFO.workingHours.weekdays,
    saturdays: COMPANY_INFO.workingHours.weekends,
    emergency: COMPANY_INFO.workingHours.support,
  },
  socials: [
    { name: 'LinkedIn', url: COMPANY_INFO.socials.linkedin || 'https://linkedin.com/company/mahdev', handle: '@mahdev-pvt-ltd' },
    { name: 'Facebook', url: COMPANY_INFO.socials.facebook || 'https://facebook.com/mahdev', handle: '@mahdev.lk' },
    { name: 'Instagram', url: COMPANY_INFO.socials.instagram || 'https://instagram.com/mahdev', handle: '@mahdev.lk' },
    { name: 'YouTube', url: COMPANY_INFO.socials.youtube || 'https://youtube.com/@mahdev', handle: 'Mahdev Official' },
  ],
};

export const LEGAL_POLICIES_CONTENT: Record<
  LegalPolicyType,
  {
    title: string;
    subtitle: string;
    effectiveDate: string;
    lastUpdated: string;
    sections: { heading: string; content: string[] }[];
  }
> = {
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How Mahdev Pvt Ltd collects, safeguards, and handles your data across all divisions.',
    effectiveDate: 'January 1, 2024',
    lastUpdated: 'February 15, 2026',
    sections: [
      {
        heading: '1. Institutional Commitment to Privacy',
        content: [
          'Mahdev Pvt Ltd ("Mahdev", "we", "us", or "our") respects the privacy and confidentiality of our clients, partners, event attendees, digital platform users, and travelers.',
          'This Privacy Policy applies to all services, digital software platforms, e-commerce storefronts, and communications operated under Mahdev Pvt Ltd and its subsidiaries: SWS Event Management, U1 Studio, Mahdev IT & Solutions, Mahdev Travels, and Mahdev Online Mart.'
        ]
      },
      {
        heading: '2. Information We Collect',
        content: [
          'Direct Inquiries & Bookings: Full name, corporate email address, contact telephone number, postal address, company organization, and specific service specifications provided through forms or direct engagement.',
          'Event & Media Records: Photography, visual recordings, and guest rosters captured during contracted events with explicit prior authorization.',
          'Digital & Technical Data: IP addresses, browser types, session timestamps, and functional cookies necessary for portal navigation and security authentication.',
          'Commercial & Transactional Data: Invoicing records, billing addresses, and payment transaction identifiers processed through verified, encrypted merchant gateways.'
        ]
      },
      {
        heading: '3. Lawful Purpose of Data Processing',
        content: [
          'To prepare accurate service proposals, schedule milestone deliverables, and execute contracted division agreements.',
          'To ensure uninterrupted cloud software availability, customer technical support, and critical service notices.',
          'To coordinate travel arrangements, hotel reservations, helicopter charters, and VIP concierge logistics with verified hospitality providers.',
          'To comply with Sri Lankan corporate law, tax filing mandates, and international commercial regulations.'
        ]
      },
      {
        heading: '4. Non-Disclosure & Security Safeguards',
        content: [
          'We do not sell, rent, trade, or monetize your personal or corporate data under any circumstances.',
          'All digital records are protected using industry-standard TLS 1.3 encryption in transit and AES-256 encryption at rest within secure cloud environments.',
          'Access to client records is strictly restricted to authorized division leads and personnel bound by confidentiality agreements.'
        ]
      },
      {
        heading: '5. Your Rights & Data Inquiries',
        content: [
          'You retain the right to request access to your personal data, request corrections, or request deletion of non-essential records.',
          `For any privacy inquiries or formal data access requests, please contact our Data Protection Officer at ${COMPANY_INFO.email} or write to ${COMPANY_INFO.offices.colombo.fullAddress}.`
        ]
      },
      {
        heading: '6. Privacy-Preserving Analytics & Telemetry (Phase 36 Standard)',
        content: [
          'First-Party Processing: Mahdev operates a strictly in-house, privacy-safe analytics engine. We do not load external third-party tracking scripts, advertising beacons, or cross-site fingerprinting services.',
          'PII Sanitization: All client telemetry data is automatically sanitized before transmission. Passwords, credit card numbers, personal phone numbers, and physical residential addresses are stripped from telemetry payloads.',
          'Do-Not-Track (DNT) Respect: Our analytics architecture automatically honors browser Do-Not-Track (DNT: 1) signals and Global Privacy Control (GPC) headers, suppressing session recording when requested.',
          'Non-Blocking Performance: Telemetry events use asynchronous browser idle scheduling (requestIdleCallback / navigator.sendBeacon) ensuring 0ms page rendering delay and zero website speed degradation.'
        ]
      }
    ]
  },
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Standard corporate engagement terms, intellectual property rules, and service provisions.',
    effectiveDate: 'January 1, 2024',
    lastUpdated: 'February 15, 2026',
    sections: [
      {
        heading: '1. Agreement to Terms',
        content: [
          'By accessing this website (mahdev.lk), engaging any Mahdev Pvt Ltd division (SWS Event Management, U1 Studio, Mahdev IT & Solutions, Mahdev Travels, Mahdev Online Mart), or executing a Statement of Work (SOW), you agree to be bound by these Corporate Terms & Conditions.',
          'If you are entering into this agreement on behalf of a company or legal entity, you represent that you possess the authority to bind such entity to these provisions.'
        ]
      },
      {
        heading: '2. Division Engagements & Service Orders',
        content: [
          'Every client project is governed by a formal Service Agreement or Statement of Work detailing scope, milestones, deliverables, and payment terms.',
          'Any modifications, additions, or scope changes requested after contract signing will be documented via a formal Change Request and may adjust project pricing and delivery schedules accordingly.'
        ]
      },
      {
        heading: '3. Intellectual Property Rights',
        content: [
          'Custom Software & Systems: Ownership of bespoke software code, database structures, and documentation developed by Mahdev IT & Solutions is transferred to the client upon full payment of the final project milestone, excluding proprietary foundational libraries and pre-existing IP.',
          'Cinematography & Media: U1 Studio grants perpetual, worldwide commercial usage rights for all finalized media assets upon full settlement. Raw project files and master camera archives remain the archival property of Mahdev unless explicitly transferred.',
          'Brand Identity: "Mahdev", division logomarks, typography, and website content are protected trademarks of Mahdev Pvt Ltd.'
        ]
      },
      {
        heading: '4. Invoicing, Payments & Taxes',
        content: [
          'Standard corporate payment terms are net 14 or net 30 as specified in individual contract schedules.',
          'All invoices are denominated in Sri Lankan Rupees (LKR) or United States Dollars (USD) as agreed, and are subject to applicable government VAT/SVAT taxes in accordance with Sri Lankan law.'
        ]
      },
      {
        heading: '5. Limitation of Liability & Dispute Jurisdiction',
        content: [
          'In no event shall Mahdev Pvt Ltd be liable for indirect, incidental, or consequential damages arising from unforeseen force majeure events, weather disruptions during outdoor staging, or third-party telecommunications outages.',
          'These terms are governed by the laws of the Democratic Socialist Republic of Sri Lanka. Any disputes shall be resolved through amicable executive consultation or through competent courts in Colombo.'
        ]
      }
    ]
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    subtitle: 'Guidelines on deposits, service cancellations, milestone retainers, and product returns.',
    effectiveDate: 'January 1, 2024',
    lastUpdated: 'February 15, 2026',
    sections: [
      {
        heading: '1. Event Management & Staging (SWS)',
        content: [
          'Retainer Deposits: Initial booking retainers secure event calendar dates, venue reservations, and custom equipment allocation. Retainer deposits are non-refundable if cancellation occurs within 30 days of the scheduled event date.',
          'Rescheduling: In the event of unforeseen circumstances or extreme weather, clients may reschedule their event without financial penalty up to 14 days prior, subject to venue and production calendar availability.',
          'Completed Phases: Any bespoke floral fabrication, 3D staging carpentry, or custom printed backdrops completed prior to cancellation remain chargeable at actual incurred costs.'
        ]
      },
      {
        heading: '2. Visual Media & Cinematography (U1 Studio)',
        content: [
          'Shoot Dates & Crew Reservation: Shoot deposits cover crew booking and multi-camera gear reservation. Rescheduling with at least 7 days\' written notice incurs no penalty.',
          'Post-Production Deliverables: U1 Studio provides up to 3 rounds of post-production editing revisions to ensure complete satisfaction. Once final 8K masters are approved and delivered, production fees are non-refundable.'
        ]
      },
      {
        heading: '3. IT & Cloud Solutions',
        content: [
          'Milestone-Based Billing: IT development is billed according to mutually signed milestone deliverables (e.g., Discovery & Architecture, Sprint Delivery, User Acceptance Testing, Production Deployment).',
          'Refund Eligibility: If a milestone deliverable does not meet documented acceptance criteria, Mahdev IT will rectify the issue within 14 business days. In the rare case where resolution is unattainable, the uncommenced balance of that milestone is eligible for refund.'
        ]
      },
      {
        heading: '4. Bespoke Expeditions & Luxury Travel',
        content: [
          'Cancellations made 45 days or more prior to departure: 90% refund of the total package price (less third-party non-refundable deposits such as chartered helicopter fees and boutique villa holds).',
          'Cancellations made 15 to 44 days prior to departure: 50% refund.',
          'Cancellations made within 14 days of departure: Non-refundable due to pre-committed concierge and charter resources.'
        ]
      },
      {
        heading: '5. E-Commerce Storefront (Mahdev Online Mart)',
        content: [
          'Hardware Products: Products purchased via Mahdev Online Mart may be returned within 7 calendar days of delivery if unopened, in original packaging with intact seals, and accompanied by the original tax invoice.',
          'Defective Units: If an item is received with a verified manufacturing defect, Mahdev will issue an immediate replacement or full refund within 3 to 5 business days.'
        ]
      }
    ]
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    subtitle: 'Island-wide logistics, turnaround timelines, courier tracking, and freight protocols.',
    effectiveDate: 'January 1, 2024',
    lastUpdated: 'February 15, 2026',
    sections: [
      {
        heading: '1. Island-Wide Delivery Zones & Timelines',
        content: [
          'Western Province (Colombo, Gampaha, Kalutara): 24 to 48 hours from order verification.',
          'Major Provincial Cities (Kandy, Galle, Matara, Kurunegala, Jaffna): 48 to 72 hours.',
          'Remote & Outstation Destinations: 3 to 5 business days via tracked secure courier.'
        ]
      },
      {
        heading: '2. Express & VIP White-Glove Dispatch',
        content: [
          'Same-day express dispatch is available within the Colombo metropolitan area for critical studio equipment, replacement gear, and urgent event hardware requests placed before 11:00 AM.',
          'White-glove delivery includes on-site unboxing, calibration verification, and warranty registration by a certified Mahdev technical representative.'
        ]
      },
      {
        heading: '3. Order Tracking & Real-Time Telemetry',
        content: [
          'Upon order dispatch from our Colombo distribution center, a tracking ID and direct SMS notification with a real-time courier link are sent to the registered recipient.',
          'Clients can track parcel status directly via the Mahdev Online Mart tracking portal or by contacting dispatch@mahdev.lk.'
        ]
      },
      {
        heading: '4. Packaging Integrity & Insurance',
        content: [
          'All cinema cameras, optics, computer hardware, and delicate electronics are packed in shock-absorbent, tamper-evident sealed packaging.',
          'High-value enterprise consignments exceeding Rs. 500,000 are fully insured in transit until signed acknowledgment of delivery is completed.'
        ]
      },
      {
        heading: '5. International Freight & Special Consignments',
        content: [
          'International equipment orders and corporate bulk procurement consignments are shipped via DHL Express / FedEx with door-to-door customs clearance assistance.',
          'Import duties and tariffs outside Sri Lanka are the responsibility of the consignee unless agreed under DDP (Delivered Duty Paid) contract terms.'
        ]
      }
    ]
  },
  cookie: {
    title: 'Cookie Policy',
    subtitle: 'Information regarding the use of cookies and local storage on Mahdev digital platforms.',
    effectiveDate: 'January 1, 2024',
    lastUpdated: 'February 15, 2026',
    sections: [
      {
        heading: '1. What Are Cookies?',
        content: [
          'Cookies are small text files placed on your computer, tablet, or mobile device when you visit our websites. They allow our platform to recognize your preferences and deliver smooth navigation.'
        ]
      },
      {
        heading: '2. Categories of Cookies We Use',
        content: [
          'Essential & Security Cookies: Necessary for basic website functions, session continuity, secure CSRF protection, and division routing.',
          'Preference Cookies: Remember your chosen visual layout, currency preference, and contact modal states.',
          'Analytics & Performance Cookies: Collect anonymous statistical data regarding visitor numbers, page interactions, and load times to help us optimize system responsiveness. We do not track individual identity through analytics.'
        ]
      },
      {
        heading: '3. Third-Party Cookies',
        content: [
          'Our platform may include embedded video players (YouTube/Vimeo) and interactive map displays (Google Maps) to showcase division portfolios and office locations. These services may place their own functional cookies in accordance with their respective privacy policies.'
        ]
      },
      {
        heading: '4. Managing Your Cookie Preferences',
        content: [
          'You can modify your browser settings at any time to decline non-essential cookies, clear existing cookies, or notify you when a cookie is being sent.',
          'Please note that disabling essential cookies may impact certain interactive capabilities such as booking forms or live division explorers.'
        ]
      }
    ]
  }
};
