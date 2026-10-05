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
  subheadline: 'Creating Moments... Capturing Memories... & Delivering Innovation... across Sri Lanka and Beyond.',
  paragraphs: [
    'Founded in 2022 in Colombo, Sri Lanka, Mahdev Pvt Ltd was conceived on a singular premise: that exceptional event decoration artistry, photographic mastery, and rigorous IT solutions should unite seamlessly under one trusted parent company. Starting with core pillars in luxury event management, stage decorations, fine-art cinema photography, and software engineering, our leadership established an uncompromising benchmark of quality.',
    'Across four years of disciplined high-velocity growth, Mahdev purposefully expanded into five autonomous yet deeply synchronized business divisions. SWS Event Management elevated luxury wedding stage decor and floral spatial design; U1 Studio pioneered 8K cinematography and timeless photojournalism; Mahdev IT Solutions engineered mission-critical cloud software and enterprise platforms.',
    'Complementing these foundational services, Mahdev Travels curates bespoke luxury island expeditions, and Mahdev Online Mart supplies verified cinema equipment and tech hardware. Today, Mahdev Pvt Ltd stands as a premier holding ecosystem where creative mastery and technological innovation converge under one trusted roof.'
  ],
  stats: [
    { label: 'Founded', value: '2022', subtext: '4+ Years of Growth' },
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
    description: 'We operate with candid communication, honest pricing structures, and strict confidentiality. Our clients trust us with their most critical enterprise systems and intimate family milestones.',
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
    bio: 'Pioneered Mahdev Pvt Ltd from its inception in 2022, steering the group\'s multi-sector vision, strategic capital growth, and high-standard operational culture across Sri Lanka.',
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
    bio: 'Directs Mahdev IT & Solutions, leading full-stack engineering, cloud infrastructure, and cybersecurity initiatives for commercial and enterprise clientele.',
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

export const VERIFIED_MILESTONES: MilestoneItem[] = [];

export const TRUSTED_COMPANIES_DATA: TrustedCompany[] = [];

export const PORTFOLIO_PROJECTS_DATA: PortfolioProject[] = [];

export const TESTIMONIALS_DATA: Testimonial[] = [];

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
          'Direct Inquiries & Bookings: Full name, email address, contact telephone number, postal address, company organization, and specific service specifications provided through forms or direct engagement.',
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
          'To comply with Sri Lankan commercial law, tax filing mandates, and international commercial regulations.'
        ]
      },
      {
        heading: '4. Non-Disclosure & Security Safeguards',
        content: [
          'We do not sell, rent, trade, or monetize your personal or client data under any circumstances.',
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
    subtitle: 'Standard engagement terms, intellectual property rules, and service provisions.',
    effectiveDate: 'January 1, 2024',
    lastUpdated: 'February 15, 2026',
    sections: [
      {
        heading: '1. Agreement to Terms',
        content: [
          'By accessing this website (mahdev.lk), engaging any Mahdev Pvt Ltd division (SWS Event Management, U1 Studio, Mahdev IT & Solutions, Mahdev Travels, Mahdev Online Mart), or executing a Statement of Work (SOW), you agree to be bound by these Terms & Conditions.',
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
          'Standard commercial payment terms are net 14 or net 30 as specified in individual contract schedules.',
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
          'International equipment orders and enterprise bulk procurement consignments are shipped via DHL Express / FedEx with door-to-door customs clearance assistance.',
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
