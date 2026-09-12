import { BookableServiceItem } from '../types/booking';

export const MASTER_BOOKABLE_SERVICES: BookableServiceItem[] = [
  // ==========================================
  // 1. SWS EVENT MANAGEMENT (Events)
  // ==========================================
  {
    id: 'sws-royal-mandap-decor',
    sku: 'BK-SWS-MND01',
    name: 'SWS Luxury Mandap & Ceremonial Stage Production',
    bookingType: 'event',
    divisionId: 'sws',
    divisionName: 'SWS Event Management',
    description: 'Bespoke traditional and contemporary mandap setups featuring carved pillars, floral canopies, and intelligent ambient lighting.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: 'venue',
    leadTimeDays: 7,
    maxBookingsPerDay: 2,
    availableTimeSlots: [
      'Morning Setup (06:00 AM - 12:00 PM)',
      'Afternoon Setup (12:00 PM - 06:00 PM)',
      'Full Day Production (08:00 AM - 11:00 PM)',
    ],
    packages: [
      {
        id: 'pkg-mandap-silver',
        name: 'Heritage Classic Mandap',
        description: 'Traditional 24ft carved stage with fresh jasmine & marigold floral accents.',
        duration: '1 Day Event',
        price: 1800,
        currency: 'USD',
        features: [
          '24ft Traditional Carved Mandap Stage',
          'Fresh Botanical Floral Accents',
          'Ambient LED Uplighting Truss',
          'Bridal & Groom Throne Chairs',
          'Setup and Teardown Logistics Crew',
        ],
      },
      {
        id: 'pkg-mandap-gold',
        name: 'Imperial Grand Palace Mandap',
        description: 'Expansive 40ft thematic floral stage with moving head lights and low fog dry-ice effects.',
        duration: 'Full Day & Evening',
        price: 3200,
        currency: 'USD',
        features: [
          '40ft Custom Thematic Palace Mandap',
          'Imported Dutch Orchid & White Lily Installations',
          '16 Intelligent Moving Beam Fixtures + Low Fog FX',
          'Chiavari Seating Setup for 250 Guests',
          'Dedicated On-Site Production Director',
        ],
      },
    ],
  },
  {
    id: 'sws-corporate-gala-production',
    sku: 'BK-SWS-GLA01',
    name: 'Enterprise Summit, Banquet & Annual Gala Setup',
    bookingType: 'event',
    divisionId: 'sws',
    divisionName: 'SWS Event Management',
    description: 'High-impact enterprise stage, LED wall backdrop integration, line-array acoustics, and keynote logistics.',
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: 'venue',
    leadTimeDays: 5,
    maxBookingsPerDay: 3,
    availableTimeSlots: [
      'Day Conference (08:00 AM - 05:00 PM)',
      'Evening Banquet Gala (04:00 PM - 11:30 PM)',
      'Full 2-Day Multi-Session Summit',
    ],
    packages: [
      {
        id: 'pkg-corp-executive',
        name: 'Executive Summit Tier',
        description: 'P3 Ultra HD LED Wall, podium, line array audio, and live streaming switchers.',
        duration: 'Single Day',
        price: 2400,
        currency: 'USD',
        features: [
          '20ft x 10ft P3 Ultra HD Seamless LED Wall',
          'Yamaha Digital Audio & Wireless Shure Mic System',
          'Multi-Camera 4K Live Broadcast Switching',
          'Executive Stage & Branded Backdrops',
        ],
      },
    ],
  },

  // ==========================================
  // 2. U1 STUDIO (Photography & Cinema)
  // ==========================================
  {
    id: 'u1-pre-wedding-cinematic-session',
    sku: 'BK-U1-CIN01',
    name: 'U1 Cinema Pre-Wedding Scenic Love-Story Shoot',
    bookingType: 'photography',
    divisionId: 'u1',
    divisionName: 'U1 Studio',
    description: 'Multi-location cinematic story filmed with RED Cinema cameras, FPV drone sweeps, and Hollywood-grade color grading.',
    imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: 'travel_destination',
    leadTimeDays: 3,
    maxBookingsPerDay: 2,
    availableTimeSlots: [
      'Sunrise Golden Hour (05:30 AM - 11:30 AM)',
      'Sunset & Twilight (02:00 PM - 07:30 PM)',
      'Full Day Multi-Terrain Shoot (05:30 AM - 07:00 PM)',
    ],
    packages: [
      {
        id: 'pkg-u1-pre-classic',
        name: 'Artisan Story Session (1 Day / 2 Locations)',
        description: 'Single day shoot covering mountain vistas or coastline with 4K teaser output.',
        duration: '8 Hours',
        price: 850,
        currency: 'USD',
        features: [
          'Lead Film Director + Drone Cinematographer',
          '3-Minute 4K Master Teaser Video',
          '60 Retouched Hi-Res Artistic Photographs',
          'Licensed Cinematic Soundtrack & Audio Engineering',
        ],
      },
      {
        id: 'pkg-u1-pre-signature',
        name: 'Signature Odyssey (2 Days / Mountain & Coast)',
        description: 'Comprehensive 2-day expedition across Nuwara Eliya tea hills and southern beaches.',
        duration: '2 Full Days',
        price: 1450,
        currency: 'USD',
        features: [
          'Full Cinema Crew + MUA Stylist Assistant',
          '5-Minute 4K Mini-Feature Cinema Film',
          '150 Retouched Photographs & Leatherbound Hardcover Album',
          'Drone 4K Sweeps & RAW Footage Delivery',
        ],
      },
    ],
  },
  {
    id: 'u1-commercial-fashion-shoot',
    sku: 'BK-U1-FSH01',
    name: 'Commercial Fashion, Lookbook & Studio Portraiture',
    bookingType: 'photography',
    divisionId: 'u1',
    divisionName: 'U1 Studio',
    description: 'High-end studio and editorial commercial photography with Profoto lighting rigs and retouchers.',
    imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: 'studio',
    leadTimeDays: 2,
    maxBookingsPerDay: 4,
    availableTimeSlots: [
      'Morning Studio Session (09:00 AM - 01:00 PM)',
      'Afternoon Studio Session (02:00 PM - 06:00 PM)',
      'Full-Day Lookbook Campaign (09:00 AM - 06:00 PM)',
    ],
    packages: [
      {
        id: 'pkg-u1-studio-half',
        name: 'Studio Half-Day Editorial',
        description: '4 hours studio time with Profoto light setups, cyclorama wall, and 20 retouched masters.',
        duration: '4 Hours',
        price: 450,
        currency: 'USD',
        features: [
          'Infinite White Cyclorama & Color Backdrops',
          'Profoto AirTTL Strobes & Softboxes',
          '20 High-End Retouched Commercial Photos',
          'Commercial Usage Rights License',
        ],
      },
    ],
  },

  // ==========================================
  // 3. MAHDEV TRAVELS (Travel & Safaris)
  // ==========================================
  {
    id: 'travels-yala-vip-safari',
    sku: 'BK-TRV-SAF01',
    name: 'Yala National Park VIP Private Leopard Safari',
    bookingType: 'travel',
    divisionId: 'travels',
    divisionName: 'Mahdev Travels',
    description: 'Exclusive 4x4 customized safari with senior Department of Wildlife naturalist, breakfast basket, and tracking telemetry.',
    imageUrl: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: 'travel_destination',
    leadTimeDays: 1,
    maxBookingsPerDay: 4,
    availableTimeSlots: [
      'Dawn Leopard Tracking Drive (05:30 AM - 11:30 AM)',
      'Dusk Elephant Gathering Drive (02:30 PM - 06:30 PM)',
      'Full-Day Deep Wilderness Safari (05:30 AM - 06:00 PM)',
    ],
    packages: [
      {
        id: 'pkg-trv-safari-half',
        name: 'Dawn Predator Drive (Up to 6 Guests)',
        description: 'Morning private 4x4 drive during prime leopard and sloth bear roaming hours.',
        duration: '6 Hours',
        price: 195,
        currency: 'USD',
        features: [
          'Custom Modified Toyota Hilux 4x4 Safari Jeep',
          'Licensed Wildlife Naturalist Tracker',
          'Picnic Breakfast & Cold Tropical Juices',
          'All Park Entrance Permits & Conservation Levies Included',
        ],
      },
      {
        id: 'pkg-trv-safari-full',
        name: 'Full Day Wilderness Immersion',
        description: 'All-day access to Block 1 & 5 with riverside lunch at Kumbukkan Oya.',
        duration: '12 Hours',
        price: 305,
        currency: 'USD',
        features: [
          'All-Day Deep Sector Jeep Access',
          'Gourmet Bush Lunch & Chilled Beverages',
          'Nikon Pro Binoculars Provided for All Guests',
          'VIP Hotel Pick-up & Drop-off in Yala / Tissamaharama',
        ],
      },
    ],
  },
  {
    id: 'travels-grand-ceylon-expedition',
    sku: 'BK-TRV-EXP01',
    name: 'Grand Ceylon 8-Day Curated Luxury Expedition',
    bookingType: 'travel',
    divisionId: 'travels',
    divisionName: 'Mahdev Travels',
    description: 'Chauffeur-guided Mercedes-Benz V-Class itinerary through Colombo, Sigiriya, Kandy, tea estates, and Galle Fort.',
    imageUrl: 'https://images.unsplash.com/photo-1588258524675-c63519d08434?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: 'travel_destination',
    leadTimeDays: 5,
    maxBookingsPerDay: 2,
    availableTimeSlots: [
      'Standard Departure Date (08:00 AM Colombo Start)',
      'Airport Meet & Greet Direct Transfer',
    ],
    packages: [
      {
        id: 'pkg-trv-exp-luxury',
        name: '5-Star Heritage & Tea Retreats',
        description: '7 nights accommodation in luxury boutique hotels, daily dining, private transport, and monument passes.',
        duration: '8 Days / 7 Nights',
        price: 1850,
        currency: 'USD',
        features: [
          '7 Nights 5-Star Boutique & Bungalow Stays',
          'Dedicated Private Luxury Mercedes V-Class with Chauffeur',
          'VIP Sigiriya, Temple of Tooth & Galle Fort Fast-Track',
          'Private Tea Tasting Session at Nuwara Eliya Estate',
        ],
      },
    ],
  },

  // ==========================================
  // 4. MAHDEV IT & SOLUTIONS (IT Services)
  // ==========================================
  {
    id: 'it-cloudpos-enterprise-setup',
    sku: 'BK-IT-POS01',
    name: 'CloudPOS Retail & Hospitality On-Site Deployment',
    bookingType: 'it_service',
    divisionId: 'it',
    divisionName: 'Mahdev IT & Solutions',
    description: 'Turnkey POS hardware integration, thermal printer routing, cloud inventory synchronization, and staff training.',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572240?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: 'client_premises',
    leadTimeDays: 2,
    maxBookingsPerDay: 3,
    availableTimeSlots: [
      'Morning Deployment Window (09:00 AM - 01:00 PM)',
      'Afternoon Deployment Window (02:00 PM - 06:00 PM)',
      'Weekend Overnight Maintenance Shift',
    ],
    packages: [
      {
        id: 'pkg-it-pos-standard',
        name: 'Single Branch Turnkey Setup (Up to 3 Terminals)',
        description: 'Hardware configuration, barcode database import, and employee training session.',
        duration: '1 Full Day',
        price: 350,
        currency: 'USD',
        features: [
          'Up to 3 Cashier / Kitchen Terminal Configs',
          'Epson / Sunmi Printer & Barcode Scanner Integration',
          'Inventory Master CSV Bulk Upload & Tax Rule Engine',
          '30-Day Priority Remote Helpdesk Support',
        ],
      },
    ],
  },
  {
    id: 'it-architecture-consulting-sprint',
    sku: 'BK-IT-ARC01',
    name: 'Enterprise Cloud Architecture & Security Audit Sprint',
    bookingType: 'it_service',
    divisionId: 'it',
    divisionName: 'Mahdev IT & Solutions',
    description: 'Deep-dive architectural review of cloud infrastructure, PostgreSQL/Firestore data schemas, and cybersecurity posture.',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: 'remote_online',
    leadTimeDays: 1,
    maxBookingsPerDay: 4,
    availableTimeSlots: [
      'Morning Strategic Sprint (10:00 AM - 12:30 PM)',
      'Afternoon Strategic Sprint (02:30 PM - 05:00 PM)',
      'Full Day Deep Dive Workshop (10:00 AM - 05:00 PM)',
    ],
    packages: [
      {
        id: 'pkg-it-audit-sprint',
        name: 'Rapid Architecture Audit & Roadmap',
        description: '2.5-hour live review session followed by full written architecture diagram and security report.',
        duration: '2.5 Hours + Report',
        price: 600,
        currency: 'USD',
        features: [
          'Live Video Workshop with Principal Cloud Architect',
          'Database Query & Indexing Performance Optimization Report',
          'Cloud Run / Kubernetes Infrastructure Scaling Blueprint',
          'Executive Summary Deck for Leadership Team',
        ],
      },
    ],
  },

  // ==========================================
  // 5. OTHER MAHDEV SERVICES (Consulting & Export)
  // ==========================================
  {
    id: 'consulting-gem-mineral-advisory',
    sku: 'BK-CON-GEM01',
    name: 'Ceylon Gemology & Mineral Export Trade Advisory',
    bookingType: 'other',
    divisionId: 'consulting',
    divisionName: 'Mahdev Holdings & Consulting',
    description: 'Private advisory on sourcing certified Ceylon sapphires, graphite mineral concessions, and export customs compliance.',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: 'remote_online',
    leadTimeDays: 2,
    maxBookingsPerDay: 3,
    availableTimeSlots: [
      'Morning Consultation (10:00 AM - 11:30 AM)',
      'Afternoon Consultation (03:00 PM - 04:30 PM)',
      'In-Person Head Office Briefing (Colombo 03)',
    ],
    packages: [
      {
        id: 'pkg-con-trade-brief',
        name: 'Standard Mineral & Trade Consultation',
        description: '90-minute strategic briefing with Senior Trade Specialist and market report.',
        duration: '90 Minutes',
        price: 300,
        currency: 'USD',
        features: [
          'One-on-One Session with Senior Export Director',
          'Ceylon Sapphire Verification & GIA Certification Guidance',
          'Sri Lanka Customs & Free Trade Protocol Briefing',
        ],
      },
    ],
  },
];
