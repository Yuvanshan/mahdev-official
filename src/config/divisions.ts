import { DivisionConfig, DivisionId } from '../types';
import { COMPANY_INFO } from './company';

export const DIVISIONS: Record<DivisionId, DivisionConfig> = {
  sws: {
    id: 'sws',
    name: 'SWS Event Management',
    shortName: 'SWS Events',
    tagline: 'Creating Unforgettable Moments',
    description:
      'Premier end-to-end event planning, audio-visual production, luxury weddings, corporate summits, and concert staging executed with bespoke creative direction.',
    badge: 'Events & Experiences',
    route: '/sws',
    domainUrl: 'https://mahdev.lk/sws',
    accentColor: '#0052FF',
    gradient: 'from-blue-600 to-indigo-700',
    heroHeadline: 'Immersive Event Productions That Captivate',
    heroSubheadline:
      'From international congresses and luxury gala celebrations to high-energy concert stages, SWS orchestrates flawless experiences tailored to perfection.',
    iconName: 'Sparkles',
    contactEmail: COMPANY_INFO.email,
    coreServices: [
      {
        title: 'Corporate Galas & Conferences',
        description: 'Comprehensive planning, keynote staging, translation booths, and high-impact executive hospitality.',
        iconName: 'Building2',
      },
      {
        title: 'Luxury Wedding & Private Curation',
        description: 'Custom theme design, artisanal lighting, floral architecture, and seamless guest concierges.',
        iconName: 'Heart',
      },
      {
        title: 'Audio, Visual & Stage Engineering',
        description: 'Concert-grade acoustics, intelligent lighting rigs, 4K LED volume matrices, and live broadcasting.',
        iconName: 'Volume2',
      },
      {
        title: 'Brand Activations & Expos',
        description: 'Interactive experiential booths, spatial design, and engaging attendee measurement.',
        iconName: 'Target',
      },
    ],
    stats: [
      { label: 'Events Curated', value: '450+' },
      { label: 'Attendees Hosted', value: '120k+' },
      { label: 'Production Satisfaction', value: '99.4%' },
    ],
  },
  u1: {
    id: 'u1',
    name: 'U1 Studio',
    shortName: 'U1 Studio',
    tagline: 'Capturing Timeless Memories',
    description:
      'State-of-the-art photography, cinematic videography, fashion studio production, aerial cinematography, and high-end post-production mastering.',
    badge: 'Media & Production',
    route: '/u1',
    domainUrl: 'https://mahdev.lk/u1',
    accentColor: '#0052FF',
    gradient: 'from-blue-600 to-sky-600',
    heroHeadline: 'Cinematic Storytelling & Visual Artistry',
    heroSubheadline:
      'Mastering the delicate harmony between natural light, fine-art composition, and cutting-edge cinema gear to immortalize your milestones.',
    iconName: 'Camera',
    contactEmail: COMPANY_INFO.email,
    coreServices: [
      {
        title: 'Commercial & Brand Cinematography',
        description: '4K/8K cinema-grade commercial adverts, product reels, and documentary storytelling.',
        iconName: 'Film',
      },
      {
        title: 'Luxury Wedding Photography',
        description: 'Editorial-grade portraits, candid photojournalism, and handcrafted fine-art keepsake albums.',
        iconName: 'Camera',
      },
      {
        title: 'Studio Portraiture & Fashion',
        description: 'Controlled high-end studio lighting, fashion editorials, and executive headshot mastery.',
        iconName: 'UserCheck',
      },
      {
        title: 'Aerial FPV & Drone Filming',
        description: 'Licensed aerial surveying, sweeping landscape perspectives, and dynamic tracking shots.',
        iconName: 'Compass',
      },
    ],
    stats: [
      { label: 'Stories Captured', value: '850+' },
      { label: 'Cinematic Awards', value: '18' },
      { label: 'Deliverable Fidelity', value: '8K HDR' },
    ],
  },
  it: {
    id: 'it',
    name: 'IT & Solutions',
    shortName: 'Mahdev IT',
    tagline: 'Delivering Digital Innovation',
    description:
      'Enterprise software engineering, modern cloud architecture, scalable web and mobile ecosystems, intelligent automation, and cybersecurity assurance.',
    badge: 'Tech & Engineering',
    route: '/it',
    domainUrl: 'https://mahdev.lk/it',
    accentColor: '#0052FF',
    gradient: 'from-blue-600 to-cyan-600',
    heroHeadline: 'Engineering Scalable Digital Ecosystems',
    heroSubheadline:
      'We architect mission-critical software, intuitive web platforms, and automated cloud workflows that empower modern enterprises to scale without limits.',
    iconName: 'Cpu',
    contactEmail: COMPANY_INFO.email,
    coreServices: [
      {
        title: 'Custom Web & Mobile Applications',
        description: 'High-performance React, Next.js, and native mobile development engineered with type-safe precision.',
        iconName: 'Code',
      },
      {
        title: 'Cloud Infrastructure & DevOps',
        description: 'Automated CI/CD pipelines, container orchestration, multi-region failover, and microservice mesh.',
        iconName: 'Cloud',
      },
      {
        title: 'Enterprise ERP & Systems Integration',
        description: 'Unified business operations, custom ERP connectors, CRM pipelines, and real-time inventory systems.',
        iconName: 'Layers',
      },
      {
        title: 'Cybersecurity & Infrastructure Audits',
        description: 'Penetration testing, compliance standards verification, and 24/7 proactive security monitoring.',
        iconName: 'ShieldCheck',
      },
    ],
    stats: [
      { label: 'Projects Deployed', value: '140+' },
      { label: 'Uptime Reliability', value: '99.99%' },
      { label: 'Code Quality Benchmark', value: 'A+' },
    ],
  },
  travels: {
    id: 'travels',
    name: 'Mahdev Travels',
    shortName: 'Mahdev Travels',
    tagline: 'Curating World-Class Journeys',
    description:
      'Bespoke travel curation, VIP corporate retreats, luxury island expeditions, chauffeur services, and personalized global holiday itineraries.',
    badge: 'Travel & Expeditions',
    route: '/travels',
    domainUrl: 'https://mahdev.lk/travels',
    accentColor: '#0052FF',
    gradient: 'from-blue-600 to-teal-600',
    heroHeadline: 'Tailored Journeys Across Extraordinary Horizons',
    heroSubheadline:
      'Experience unmatched hospitality, handpicked heritage villas, private charters, and guided expeditions designed with flawless logistics.',
    iconName: 'Plane',
    contactEmail: COMPANY_INFO.email,
    coreServices: [
      {
        title: 'Bespoke Island & Heritage Tours',
        description: 'Handcrafted itineraries revealing Sri Lanka and global gems with private historian guides.',
        iconName: 'MapPin',
      },
      {
        title: 'Corporate Retreats & VIP Transport',
        description: 'Executive fleet logistics, discreet luxury shuttles, and curated company offsite venues.',
        iconName: 'Car',
      },
      {
        title: 'Luxury Villa & Resort Reservations',
        description: 'Exclusive access to premier private estates, beachfront chalets, and 5-star mountain sanctuaries.',
        iconName: 'Home',
      },
      {
        title: 'Adventure & Eco Expeditions',
        description: 'Ethical wildlife safaris, scenic helicopter transfers, and deep blue catamaran sailing.',
        iconName: 'Compass',
      },
    ],
    stats: [
      { label: 'Bespoke Itineraries', value: '1,200+' },
      { label: 'Destinations Covered', value: '35+' },
      { label: 'Client Satisfaction', value: '99.8%' },
    ],
  },
  mart: {
    id: 'mart',
    name: 'Mahdev Online Mart',
    shortName: 'Mahdev Mart',
    tagline: 'Premium Lifestyle & Tech Commerce',
    description:
      'Curated e-commerce storefront delivering verified electronics, studio accessories, smart lifestyle essentials, and enterprise equipment.',
    badge: 'Commerce & Retail',
    route: '/mart',
    domainUrl: 'https://mahdev.lk/mart',
    accentColor: '#0052FF',
    gradient: 'from-blue-600 to-indigo-600',
    heroHeadline: 'Curated Excellence Delivered To Your Doorstep',
    heroSubheadline:
      'Explore authenticated tech hardware, professional media equipment, lifestyle essentials, and seamless nationwide logistics.',
    iconName: 'ShoppingBag',
    contactEmail: COMPANY_INFO.email,
    coreServices: [
      {
        title: 'Professional Tech & Hardware',
        description: 'Genuine camera gear, computing accessories, audio interfaces, and authorized warranties.',
        iconName: 'Laptop',
      },
      {
        title: 'Express Nationwide Delivery',
        description: 'Real-time parcel tracking, secure packaging, and same-day priority dispatch in metro hubs.',
        iconName: 'Truck',
      },
      {
        title: 'Corporate Procurement Solutions',
        description: 'Bulk enterprise orders, customized billing, tax invoices, and dedicated account reps.',
        iconName: 'Briefcase',
      },
      {
        title: 'Guaranteed Buyer Protection',
        description: 'Hassle-free 7-day return policy, verified authentic product batches, and local service support.',
        iconName: 'CheckCircle2',
      },
    ],
    stats: [
      { label: 'Products Curated', value: '2,500+' },
      { label: 'Orders Dispatched', value: '45k+' },
      { label: 'Authenticity Guarantee', value: '100%' },
    ],
  },
};

export const DIVISION_LIST: DivisionConfig[] = Object.values(DIVISIONS);
