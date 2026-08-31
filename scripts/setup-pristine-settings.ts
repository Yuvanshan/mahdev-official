import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import rawConfig from '../firebase-applet-config.json';
import { COMPANY_INFO } from '../src/config/company';

const firebaseConfig = {
  apiKey: rawConfig.apiKey,
  authDomain: rawConfig.authDomain,
  projectId: rawConfig.projectId,
  storageBucket: rawConfig.storageBucket,
  messagingSenderId: rawConfig.messagingSenderId,
  appId: rawConfig.appId,
};

const databaseId = rawConfig.firestoreDatabaseId || 'mahdev-pvt-ldt';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, databaseId);

const CLEANUP_ADMIN_EMAIL = `superadmin-${Date.now()}@mahdev.lk`;
const ADMIN_PASS = 'MahdevAdmin2026!#$Secure';

async function updateProductionSettings() {
  const cred = await createUserWithEmailAndPassword(auth, CLEANUP_ADMIN_EMAIL, ADMIN_PASS);
  console.log(`[Auth] Authenticated Super Admin: ${cred.user.email}`);

  // Set pristine corporate company settings with Yuvanshan Prabakaran and info.mahdev.lk@gmail.com
  const companyPayload = {
    companyName: 'Mahdev Pvt Ltd',
    tagline: 'Creating Moments • Capturing Memories • Delivering Innovation',
    contactEmail: 'info.mahdev.lk@gmail.com',
    supportEmail: 'info.mahdev.lk@gmail.com',
    primaryPhone: '+94 77 000 0000',
    secondaryPhone: '',
    whatsappNumber: '+94 77 000 0000',
    hotline: '+94 77 000 0000',
    address: 'Colombo, Western Province, Sri Lanka',
    currency: 'LKR',
    currencySymbol: 'Rs.',
    superAdminName: 'Yuvanshan Prabakaran',
    superAdminEmail: 'info.mahdev.lk@gmail.com',
    businessHours: {
      weekdays: '8:30 AM - 6:30 PM',
      saturday: '9:00 AM - 3:00 PM',
      sunday: 'Closed (Emergency Support Only)',
    },
    socialLinks: {
      facebook: 'https://facebook.com/mahdev.lk',
      instagram: 'https://instagram.com/mahdev.lk',
      linkedin: 'https://linkedin.com/company/mahdev',
      youtube: 'https://youtube.com/@mahdev',
      tiktok: '',
      twitter: '',
    },
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'settings', 'company'), companyPayload, { merge: true });
  console.log('[Firestore] Pristine settings/company saved.');

  const homepagePayload = {
    hero: {
      badgeText: 'CORPORATE SYNERGY • EST. 2022',
      titleLine1: 'Creating Moments...',
      titleHighlight: 'Capturing Memories...',
      titleLine2: '& Delivering Innovation...',
      description: 'Mahdev Pvt Ltd is an integrated parent enterprise uniting luxury event and wedding decorations, fine-art photography and 8K cinema, scalable IT solutions, bespoke luxury travel, and verified tech commerce under a singular standard of perfection.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1920&q=85',
      primaryCtaLabel: 'Explore Ecosystem',
      primaryCtaLink: '#divisions',
      secondaryCtaLabel: 'Get In Touch',
      secondaryCtaLink: '/contact',
      metrics: [
        { label: 'Business Divisions', value: '5', subtext: 'Synergized Operations' },
        { label: 'Client Satisfaction', value: '99.4%', subtext: 'Enterprise Rated' },
        { label: 'Projects Delivered', value: '1,450+', subtext: 'Island-wide & Global' },
        { label: 'Uptime & Reliability', value: '99.9%', subtext: 'Mission Critical' },
      ],
    },
    intro: {
      badge: 'THE MAHDEV ADVANTAGE',
      headline: 'A Unified Ecosystem of Specialized Excellence',
      subheadline: 'Eliminating friction across multi-vendor logistics with a single trusted corporate partner.',
      description: 'Founded with a bold vision to elevate creative event decorations, photographic mastery, IT engineering, and luxury hospitality across Sri Lanka, Mahdev Pvt Ltd operates as an integrated group with five specialized divisions.',
      pillars: [
        { title: 'Turnkey Integration', desc: 'Seamless single-point coordination from event decor to photography, software systems, and luxury travel.', icon: 'Layers' },
        { title: 'Enterprise Rigor', desc: 'ISO-aligned quality standards, calibrated camera and stage gear, and enterprise SLA guarantees.', icon: 'ShieldCheck' },
        { title: 'Bespoke Craftsmanship', desc: 'Tailored solutions whether styling an opulent wedding decor, capturing 8K cinema, or engineering cloud IT infrastructure.', icon: 'Sparkles' },
      ],
    },
    featuredServices: {
      badge: 'FLAGSHIP SOLUTIONS',
      title: 'Featured Services & Solutions',
      subtitle: 'Explore key flagship services delivered across our 5 specialized enterprise divisions.',
      selectedServiceIds: [],
      enabled: true,
    },
    featuredProducts: {
      badge: 'HARDWARE & COMMERCE',
      title: 'Enterprise Hardware & Procurement',
      subtitle: 'Calibrated cinema cameras, high-output lighting, pro audio, and certified electronics.',
      selectedProductIds: [],
      spotlightBannerText: 'Official hardware and procurement solutions in Sri Lanka.',
      enabled: true,
    },
    portfolio: {
      badge: 'FEATURED WORK',
      title: 'Signature Portfolios & Case Studies',
      subtitle: 'Explore our latest high-impact deliverables across luxury event decor, cinema photography, and scalable IT solutions.',
      selectedProjectIds: [],
      enabled: true,
    },
    milestones: {
      badge: 'OUR TRAJECTORY',
      title: 'Milestones of Excellence',
      subtitle: 'Key milestones and verified achievements.',
      items: [],
      achievements: [],
      enabled: true,
    },
    trustedCompanies: {
      badge: 'ENTERPRISE CLIENTELE',
      title: 'Trusted by Industry Leaders',
      subtitle: 'Delivering excellence for top enterprises and organizations.',
      enabled: true,
    },
    decorationVideos: {
      badge: 'CINEMATIC SHOWCASE',
      title: 'Event & Decoration Showcase',
      subtitle: 'High-definition video experiences.',
      videos: [],
      enabled: true,
    },
    testimonials: {
      badge: 'CLIENT TESTIMONIALS',
      title: 'What Our Clients Say',
      subtitle: 'Verified client reviews and feedback.',
      enabled: true,
    },
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'settings', 'homepage'), homepagePayload, { merge: true });
  console.log('[Firestore] Pristine settings/homepage saved with 0 content arrays.');
}

updateProductionSettings()
  .then(() => {
    console.log('[Setup Complete]');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
