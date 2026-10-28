import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from '../../lib/tursoFirestore';
import { db } from '../../lib/firebase';
import {
  AboutUsContent,
  LegalDocument,
  LegalSection,
} from '../../types/websiteContent';
import {
  DEFAULT_TERMS_CONTENT,
  DEFAULT_PRIVACY_CONTENT,
  LEGAL_CONTENT_REVISION,
  getDefaultLegalDocument,
} from '../../data/legalDocuments';

const WEBSITE_CONTENT_COLLECTION = 'websiteContent';
const LEGAL_PAGES_COLLECTION = 'legalPages';
const ABOUT_CONTENT_CACHE_KEY = 'mahdev_public_about_us_v1';

function readPublicContentCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) as T : null;
  } catch (error) {
    console.warn(`[WebsiteContentService] Could not read cache "${key}":`, error);
    return null;
  }
}

function writePublicContentCache(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`[WebsiteContentService] Could not save cache "${key}":`, error);
  }
}

function normalizeAboutUsContent(data: Partial<AboutUsContent> = {}): AboutUsContent {
  return {
    ...DEFAULT_ABOUT_US_CONTENT,
    ...data,
    hero: { ...DEFAULT_ABOUT_US_CONTENT.hero, ...(data.hero || {}) },
    companyIntro: { ...DEFAULT_ABOUT_US_CONTENT.companyIntro, ...(data.companyIntro || {}) },
    vision: { ...DEFAULT_ABOUT_US_CONTENT.vision, ...(data.vision || {}) },
    mission: { ...DEFAULT_ABOUT_US_CONTENT.mission, ...(data.mission || {}) },
    cta: { ...DEFAULT_ABOUT_US_CONTENT.cta, ...(data.cta || {}) },
    values: Array.isArray(data.values) && data.values.length > 0 ? data.values : DEFAULT_ABOUT_US_CONTENT.values,
    divisions: Array.isArray(data.divisions) && data.divisions.length > 0 ? data.divisions : DEFAULT_ABOUT_US_CONTENT.divisions,
    timeline: Array.isArray(data.timeline) && data.timeline.length > 0 ? data.timeline : DEFAULT_ABOUT_US_CONTENT.timeline,
    team: Array.isArray(data.team) ? data.team : DEFAULT_ABOUT_US_CONTENT.team,
    locations: Array.isArray(data.locations) && data.locations.length > 0 ? data.locations : DEFAULT_ABOUT_US_CONTENT.locations,
  };
}

export const DEFAULT_ABOUT_US_CONTENT: AboutUsContent = {
  id: 'aboutUs',
  hero: {
    title: 'About MAHDEV Pvt Ltd',
    subtitle: 'Creating Moments. Capturing Memories. Delivering Innovation',
    description:
      'MAHDEV Pvt Ltd is a Sri Lankan company bringing creativity, technology, travel, and everyday solutions together through a growing range of business divisions.',
    buttonText: 'Explore Our Services',
    buttonRoute: '/services',
  },
  companyIntro: {
    heading: 'Who We Are',
    description:
      'MAHDEV Pvt Ltd is a Sri Lankan company built around creativity, innovation, and meaningful experiences. Through our growing range of divisions, we bring together event management, creative studio services, information technology, travel, and online commerce under one brand.\n\nWe believe every great idea deserves thoughtful planning, quality execution, and a commitment to customer satisfaction. Whether we are creating a memorable celebration, developing a digital solution, supporting a travel experience, or connecting customers with products, our goal is to deliver services that make a lasting difference.',
  },
  vision: {
    heading: 'Our Vision',
    description:
      'To build a trusted, innovative, and customer-focused business that creates meaningful experiences and delivers practical solutions across different industries.',
  },
  mission: {
    heading: 'Our Mission',
    description:
      'To provide creative, reliable, and accessible services through our diverse business divisions while continuously improving our quality, technology, and customer experience.',
  },
  values: [
    {
      id: 'val-1',
      title: 'Customer Focus',
      description: 'Understanding customer needs and building lasting relationships.',
      order: 1,
      enabled: true,
      iconName: 'Users',
    },
    {
      id: 'val-2',
      title: 'Innovation',
      description: 'Exploring new ideas and technology to improve our services.',
      order: 2,
      enabled: true,
      iconName: 'Lightbulb',
    },
    {
      id: 'val-3',
      title: 'Integrity',
      description: 'Working with honesty, responsibility, and transparency.',
      order: 3,
      enabled: true,
      iconName: 'ShieldCheck',
    },
    {
      id: 'val-4',
      title: 'Quality',
      description: 'Striving for professional results in everything we do.',
      order: 4,
      enabled: true,
      iconName: 'Award',
    },
  ],
  divisions: [
    {
      id: 'sws',
      name: 'SWS Event Management',
      tagline: 'Events & Celebration Artistry',
      description:
        'SWS Event Management is our event and celebration division, helping customers create memorable occasions through professional event planning, decorations, photography, and related services.',
      services: [
        'Weddings',
        'Birthdays',
        'Cradle ceremonies',
        'Puberty ceremonies',
        'Mehendi functions',
        'Baby showers',
        'Surprise events',
        'Registration ceremonies',
        'Decorations',
        'Photography',
        'Makeup',
        'Cakes',
        'Buffet arrangements',
        'Chairs',
        'Themed decorations',
      ],
      route: '/sws',
      order: 1,
      enabled: true,
    },
    {
      id: 'u1',
      name: 'U1 Studio',
      tagline: 'Visual Storytelling & Creative Media',
      description:
        'U1 Studio is our creative studio division, focused on photography, visual storytelling, and creative media services. We aim to preserve important moments and transform creative ideas into meaningful visual experiences.',
      services: [
        'Wedding Cinematography',
        'Portraiture & Studio Shoots',
        'Commercial Visual Storytelling',
        'Event Coverage',
        'Editorial Photography',
        'Aerial Drone Filming',
      ],
      route: '/u1',
      order: 2,
      enabled: true,
    },
    {
      id: 'it',
      name: 'Mahdev IT and Solutions',
      tagline: 'Modern Enterprise Technology',
      description:
        'Mahdev IT and Solutions delivers technology-focused services designed to help individuals and businesses improve their digital operations.',
      services: [
        'Software development',
        'Website development',
        'Mobile applications',
        'Business systems',
        'Digital solutions',
        'Technology services',
      ],
      route: '/it',
      order: 3,
      enabled: true,
    },
    {
      id: 'travels',
      name: 'Mahdev Travels',
      tagline: 'Journeys & Destination Expeditions',
      description:
        'Mahdev Travels is our travel division, focused on helping customers explore destinations and access travel-related services and experiences.',
      services: [
        'Custom Sri Lanka Itineraries',
        'Luxury Vehicle Fleet',
        'Airport Transfers & Chauffeur Services',
        'Corporate Retreats',
        'Cultural & Wildlife Tours',
      ],
      route: '/travels',
      order: 4,
      enabled: true,
    },
    {
      id: 'mart',
      name: 'Mahdev Online Mart',
      tagline: 'Convenient Online Commerce',
      description:
        'Mahdev Online Mart is our online commerce division, created to connect customers with products and convenient shopping experiences.',
      services: [
        'Curated Consumer Tech',
        'Event Accessories & Decor Items',
        'Fast Nationwide Islandwide Delivery',
        'Verified Direct Warranties',
        'Secure Order Tracking',
      ],
      route: '/mart',
      order: 5,
      enabled: true,
    },
  ],
  timeline: [
    {
      id: 'time-2022',
      year: '2022',
      title: 'SWS Event Management begins',
      description: 'SWS Event Management started in Trincomalee on 1 January 2022.',
      order: 1,
      enabled: true,
    },
    {
      id: 'time-2023',
      year: '2023',
      title: 'Creative Studio Expansion',
      description: 'Expanded into studio and creative media services.',
      order: 2,
      enabled: true,
    },
    {
      id: 'time-2024',
      year: '2024',
      title: 'Growing Event Services',
      description: 'Expanded decoration services and customer reach.',
      order: 3,
      enabled: true,
    },
    {
      id: 'time-2025',
      year: '2025',
      title: 'Technology Division Introduced',
      description: 'Expanded into IT and digital solutions.',
      order: 4,
      enabled: true,
    },
    {
      id: 'time-2026',
      year: '2026',
      title: 'Business Expansion',
      description:
        'Expanded into Colombo operations, company registration, and travel-related services.',
      order: 5,
      enabled: true,
    },
  ],
  locations: [
    {
      id: 'loc-colombo',
      city: 'Colombo',
      address: '41/22 Pickings Road, Colombo 13, Sri Lanka',
      phone: '075 092 8078 / 076 898 8970',
      email: 'info.mahdev.lk@gmail.com',
      mapUrl: 'https://maps.app.goo.gl/aS8i2snTchk5jDX98',
      order: 1,
      enabled: true,
    },
    {
      id: 'loc-trincomalee',
      city: 'Trincomalee',
      address: '95/15 Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka',
      phone: '075 092 8078 / 076 898 8970',
      email: 'info.mahdev.lk@gmail.com',
      mapUrl: 'https://maps.app.goo.gl/WwWZBcPNtZjB1KWn9',
      order: 2,
      enabled: true,
    },
  ],
  team: [
    {
      id: 'ceo-yuvanshan-prabakaran',
      name: 'Yuvanshan Prabakaran',
      title: 'Chief Executive Officer',
      imageUrl: '/assets/images/ceo1.jpeg',
      order: 1,
      enabled: true,
    },
    {
      id: 'ceo-divaincy-fernando',
      name: 'Divaincy Fernando',
      title: 'Board of Director',
      imageUrl: '/assets/images/ceo2.jpeg',
      order: 2,
      enabled: true,
    },
  ],
  cta: {
    title: "Let's Create Something Meaningful",
    description:
      'Whether you are planning an unforgettable celebration, looking for a technology solution, exploring travel opportunities, or searching for products and services, MAHDEV is here to help.',
    primaryButtonText: 'Explore Our Services',
    primaryButtonRoute: '/services',
    secondaryButtonText: 'Contact Us',
    secondaryButtonRoute: '/contact',
  },
  status: 'published',
  version: 1,
  lastUpdated: 'March 2026',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  publishedAt: '2026-03-01T00:00:00.000Z',
  updatedBy: 'info.mahdev.lk@gmail.com',
};

// Legal page defaults now live in src/data/legalDocuments.ts; re-exported for existing imports.
export { DEFAULT_TERMS_CONTENT, DEFAULT_PRIVACY_CONTENT };

/**
 * Sanitizes text to remove unsafe HTML or script tags
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onload=/gi, '');
}

/**
 * Sanitizes all sections in a legal document
 */
export function sanitizeSections(sections: LegalSection[]): LegalSection[] {
  return sections.map((sec, idx) => ({
    ...sec,
    number: idx + 1,
    heading: sanitizeText(sec.heading),
    content: sec.content.map(sanitizeText),
    subsections: sec.subsections?.map((sub) => ({
      title: sanitizeText(sub.title),
      text: sanitizeText(sub.text),
    })),
  }));
}

// The revision is part of the key so browsers drop cached copies of older policy text.
function legalCacheKey(docId: string): string {
  return `mahdev_public_legal_${docId}_${LEGAL_CONTENT_REVISION}`;
}

/**
 * Merges a stored legal document over its default. Stored text written before
 * the current LEGAL_CONTENT_REVISION is ignored so the updated defaults show.
 */
function resolveStoredLegalDocument(
  defaultDoc: LegalDocument,
  data: LegalDocument,
  includeDraft: boolean
): LegalDocument {
  const isCurrent = data.contentRevision === LEGAL_CONTENT_REVISION;
  const baseDoc: LegalDocument = isCurrent
    ? {
        ...defaultDoc,
        ...data,
        sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : defaultDoc.sections,
      }
    : defaultDoc;

  const hasCurrentDraft =
    data.draftRevision === LEGAL_CONTENT_REVISION &&
    Array.isArray(data.draftSections) &&
    data.draftSections.length > 0;

  if (includeDraft && hasCurrentDraft) {
    return {
      ...baseDoc,
      title: data.draftTitle || baseDoc.title,
      subtitle: data.draftSubtitle ?? baseDoc.subtitle,
      sections: data.draftSections as LegalSection[],
      hasUnpublishedChanges: true,
    };
  }
  return baseDoc;
}

/** Editable header fields saved alongside a legal document's sections. */
export type LegalDocumentDetails = Pick<LegalDocument, 'title' | 'subtitle'>;

/**
 * Firestore Service for Website Content & Legal Pages
 */
export const websiteContentService = {
  /**
   * Fetch About Us content from Firestore (creates default seed if doc doesn't exist)
   */
  async getAboutUsContent(forceRefresh = false): Promise<AboutUsContent> {
    const cached = readPublicContentCache<AboutUsContent>(ABOUT_CONTENT_CACHE_KEY);
    if (cached && !forceRefresh) return normalizeAboutUsContent(cached);

    try {
      const docRef = doc(db, WEBSITE_CONTENT_COLLECTION, 'aboutUs');
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const content = normalizeAboutUsContent(snap.data() as AboutUsContent);
        writePublicContentCache(ABOUT_CONTENT_CACHE_KEY, content);
        return content;
      }

      // First run: Seed Firestore with authentic defaults
      await setDoc(docRef, {
        ...DEFAULT_ABOUT_US_CONTENT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      writePublicContentCache(ABOUT_CONTENT_CACHE_KEY, DEFAULT_ABOUT_US_CONTENT);
      return DEFAULT_ABOUT_US_CONTENT;
    } catch (err) {
      console.warn('[WebsiteContentService] Error fetching About Us content from the database, using baseline:', err);
      return cached ? normalizeAboutUsContent(cached) : DEFAULT_ABOUT_US_CONTENT;
    }
  },

  /**
   * Save / Update About Us content
   */
  async saveAboutUsContent(data: Partial<AboutUsContent>, userEmail?: string): Promise<void> {
    const docRef = doc(db, WEBSITE_CONTENT_COLLECTION, 'aboutUs');
    const updatePayload: any = {
      ...data,
      updatedAt: new Date().toISOString(),
      lastUpdated: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
      status: 'published',
    };
    if (userEmail) {
      updatePayload.updatedBy = userEmail;
    }
    await setDoc(docRef, updatePayload, { merge: true });
    const cached = readPublicContentCache<AboutUsContent>(ABOUT_CONTENT_CACHE_KEY);
    writePublicContentCache(ABOUT_CONTENT_CACHE_KEY, normalizeAboutUsContent({ ...cached, ...updatePayload }));
  },

  /**
   * Subscribe to real-time updates for About Us content
   */
  subscribeAboutUsContent(callback: (content: AboutUsContent) => void): () => void {
    const docRef = doc(db, WEBSITE_CONTENT_COLLECTION, 'aboutUs');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AboutUsContent;
          callback({
            ...DEFAULT_ABOUT_US_CONTENT,
            ...data,
            hero: { ...DEFAULT_ABOUT_US_CONTENT.hero, ...(data.hero || {}) },
            companyIntro: { ...DEFAULT_ABOUT_US_CONTENT.companyIntro, ...(data.companyIntro || {}) },
            vision: { ...DEFAULT_ABOUT_US_CONTENT.vision, ...(data.vision || {}) },
            mission: { ...DEFAULT_ABOUT_US_CONTENT.mission, ...(data.mission || {}) },
            cta: { ...DEFAULT_ABOUT_US_CONTENT.cta, ...(data.cta || {}) },
            values: Array.isArray(data.values) && data.values.length > 0 ? data.values : DEFAULT_ABOUT_US_CONTENT.values,
            divisions: Array.isArray(data.divisions) && data.divisions.length > 0 ? data.divisions : DEFAULT_ABOUT_US_CONTENT.divisions,
            timeline: Array.isArray(data.timeline) && data.timeline.length > 0 ? data.timeline : DEFAULT_ABOUT_US_CONTENT.timeline,
            team: Array.isArray(data.team) ? data.team : DEFAULT_ABOUT_US_CONTENT.team,
            locations: Array.isArray(data.locations) && data.locations.length > 0 ? data.locations : DEFAULT_ABOUT_US_CONTENT.locations,
          });
        } else {
          callback(DEFAULT_ABOUT_US_CONTENT);
        }
      },
      (err) => {
        console.warn('[WebsiteContentService] Error on About Us snapshot listener:', err);
        callback(DEFAULT_ABOUT_US_CONTENT);
      }
    );
  },

  /**
   * Get Legal Document (Terms, Privacy, Refund, Shipping or Cookie)
   */
  async getLegalDocument(
    docId: 'termsAndConditions' | 'privacyPolicy' | string,
    includeDraft = false,
    forceRefresh = false
  ): Promise<LegalDocument> {
    const defaultDoc = getDefaultLegalDocument(docId);
    const cacheKey = legalCacheKey(docId);
    const cached = includeDraft ? null : readPublicContentCache<LegalDocument>(cacheKey);
    if (cached && !forceRefresh) return cached;

    try {
      const docRef = doc(db, LEGAL_PAGES_COLLECTION, docId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const resolved = resolveStoredLegalDocument(defaultDoc, snap.data() as LegalDocument, includeDraft);
        if (!includeDraft) writePublicContentCache(cacheKey, resolved);
        return resolved;
      }

      // Seed if not exists
      await setDoc(docRef, {
        ...defaultDoc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (!includeDraft) writePublicContentCache(cacheKey, defaultDoc);
      return defaultDoc;
    } catch (err) {
      console.warn(`[WebsiteContentService] Error fetching legal doc ${docId}, using baseline:`, err);
      return cached || defaultDoc;
    }
  },

  /**
   * Save Legal Document Draft
   */
  async saveLegalDraft(
    docId: 'termsAndConditions' | 'privacyPolicy' | string,
    sections: LegalSection[],
    userEmail?: string,
    details?: LegalDocumentDetails
  ): Promise<void> {
    const docRef = doc(db, LEGAL_PAGES_COLLECTION, docId);
    const sanitized = sanitizeSections(sections);
    await setDoc(
      docRef,
      {
        draftSections: sanitized,
        draftRevision: LEGAL_CONTENT_REVISION,
        ...(details && {
          draftTitle: sanitizeText(details.title),
          draftSubtitle: sanitizeText(details.subtitle),
        }),
        hasUnpublishedChanges: true,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail || 'admin',
      },
      { merge: true }
    );
  },

  /**
   * Publish Legal Document
   */
  async publishLegalDocument(
    docId: 'termsAndConditions' | 'privacyPolicy' | string,
    sections: LegalSection[],
    userEmail?: string,
    newVersion?: string,
    details?: LegalDocumentDetails
  ): Promise<LegalDocument> {
    const docRef = doc(db, LEGAL_PAGES_COLLECTION, docId);
    const sanitized = sanitizeSections(sections);
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);

    const snap = await getDoc(docRef);
    // The live document as visitors see it. Stored copies from an older revision resolve to the
    // defaults, so their version, dates and titles are not carried into the new publish.
    const defaultDoc = getDefaultLegalDocument(docId);
    const liveDoc = snap.exists()
      ? resolveStoredLegalDocument(defaultDoc, snap.data() as LegalDocument, false)
      : defaultDoc;
    const currentVersion = liveDoc.version || defaultDoc.version;
    const title = sanitizeText(details?.title ?? liveDoc.title) || defaultDoc.title;
    const subtitle = sanitizeText(details?.subtitle ?? liveDoc.subtitle);

    // Auto-increment version if not explicitly supplied
    let computedVersion = newVersion;
    if (!computedVersion) {
      const parts = currentVersion.split('.').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        computedVersion = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
      } else {
        computedVersion = `${currentVersion}.1`;
      }
    }

    const payload: Partial<LegalDocument> = {
      title,
      subtitle,
      draftTitle: title,
      draftSubtitle: subtitle,
      effectiveDate: liveDoc.effectiveDate,
      sections: sanitized,
      draftSections: sanitized,
      contentRevision: LEGAL_CONTENT_REVISION,
      draftRevision: LEGAL_CONTENT_REVISION,
      hasUnpublishedChanges: false,
      status: 'published',
      version: computedVersion,
      lastUpdated: formattedDate,
      publishedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      updatedBy: userEmail || 'admin',
    };

    await setDoc(docRef, payload, { merge: true });

    const publishedDocument = {
      ...liveDoc,
      ...payload,
    } as LegalDocument;
    writePublicContentCache(legalCacheKey(docId), publishedDocument);
    return publishedDocument;
  },

  /**
   * Subscribe to real-time updates for Legal Document
   */
  subscribeLegalDocument(
    docId: 'termsAndConditions' | 'privacyPolicy' | string,
    callback: (doc: LegalDocument) => void,
    includeDraft = false
  ): () => void {
    const defaultDoc = getDefaultLegalDocument(docId);
    const docRef = doc(db, LEGAL_PAGES_COLLECTION, docId);

    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(resolveStoredLegalDocument(defaultDoc, snap.data() as LegalDocument, includeDraft));
        } else {
          callback(defaultDoc);
        }
      },
      (err) => {
        console.warn(`[WebsiteContentService] Error in snapshot for ${docId}:`, err);
        callback(defaultDoc);
      }
    );
  },
};
