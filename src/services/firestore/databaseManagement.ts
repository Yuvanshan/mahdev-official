
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const MANAGED_COLLECTIONS = [
  'products',
  'services',
  'categories',
  'milestones',
  'trustedCompanies',
  'testimonials',
  'portfolio',
  'projects',
  'gallery',
  'orders',
  'bookings',
  'contactSubmissions',
  'contactMessages',
  'inquiries',
  'announcements',
  'payments',
  'divisions',
  'navigation',
  'pages',
  'heroSections',
  'statistics',
  'clients',
  'team',
  'faqs',
  'blog',
  'auditLogs',
] as const;

export interface DatabaseClearResult {
  success: boolean;
  totalDeleted: number;
  collectionsCleared: string[];
  errors: Array<{ collection: string; error: string }>;
}

/**
 * Completely clears all content collections in the Firestore database.
 * Preserves the designated `settings/company` baseline if requested.
 */
export async function clearAllFirestoreCollections(preserveSettings: boolean = true): Promise<DatabaseClearResult> {
  let totalDeleted = 0;
  const collectionsCleared: string[] = [];
  const errors: Array<{ collection: string; error: string }> = [];

  const targets = [...MANAGED_COLLECTIONS];
  if (!preserveSettings) {
    targets.push('settings' as any);
  }

  for (const colName of targets) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        for (const docSnap of snap.docs) {
          try {
            await deleteDoc(docSnap.ref);
            totalDeleted++;
          } catch (delErr: any) {
            errors.push({ collection: colName, error: delErr?.message || String(delErr) });
          }
        }
      }
      collectionsCleared.push(colName);
    } catch (colErr: any) {
      errors.push({ collection: colName, error: colErr?.message || String(colErr) });
    }
  }

  return {
    success: errors.length === 0,
    totalDeleted,
    collectionsCleared,
    errors,
  };
}

/**
 * Seeds pristine production configuration for Mahdev Pvt Ltd.
 */
export async function seedPristineProductionSettings(): Promise<void> {
  const companyPayload = {
    companyName: 'Mahdev Pvt Ltd',
    tagline: 'Creating Moments • Capturing Memories • Delivering Innovation',
    contactEmail: 'info.mahdev.lk@gmail.com',
    supportEmail: 'info.mahdev.lk@gmail.com',
    primaryPhone: '075 092 8078',
    whatsappNumber: '+94 75 092 8078',
    address: 'Colombo, Western Province, Sri Lanka',
    currency: 'LKR',
    currencySymbol: 'Rs.',
    superAdminName: 'Yuvanshan Prabakaran',
    superAdminEmail: 'info.mahdev.lk@gmail.com',
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'settings', 'company'), companyPayload, { merge: true });

  const homepagePayload = {
    hero: {
      badgeText: 'CORPORATE ECOSYSTEM • EST. 2022',
      titleLine1: 'Creating Moments...',
      titleHighlight: 'Capturing Memories...',
      titleLine2: '& Delivering Innovation...',
      description: 'Mahdev Pvt Ltd is an integrated parent enterprise uniting luxury event decorations, fine-art photography and 8K cinema, scalable IT solutions, bespoke travel, and verified tech commerce.',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1920&q=85',
      primaryCtaLabel: 'Explore Ecosystem',
      primaryCtaLink: '#divisions',
      secondaryCtaLabel: 'Get In Touch',
      secondaryCtaLink: '/contact',
    },
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'settings', 'homepage'), homepagePayload, { merge: true });
}

/**
 * Permanently removes studio posts ('u1', 'u1-studio', 'u1-cinema') from Firestore
 * that have been removed/archived or marked for purge.
 */
export interface StudioCleanupResult {
  success: boolean;
  galleryDeleted: number;
  portfolioDeleted: number;
  totalDeleted: number;
  errors: string[];
}

export async function purgeRemovedStudioPostsFromFirestore(
  purgeAllStudioPosts: boolean = false
): Promise<StudioCleanupResult> {
  let galleryDeleted = 0;
  let portfolioDeleted = 0;
  const errors: string[] = [];

  const studioDivisionKeys = ['u1', 'u1-studio', 'u1-cinema'];

  // 1. Scan and purge from 'gallery' collection in Firestore
  try {
    const gallerySnap = await getDocs(collection(db, 'gallery'));
    for (const docSnap of gallerySnap.docs) {
      const data = docSnap.data();
      const div = String(data.division || data.divisionId || '').toLowerCase();
      const isStudio = studioDivisionKeys.includes(div);

      if (isStudio) {
        const isArchivedOrDeleted =
          data.isDeleted === true ||
          data.status === 'deleted' ||
          data.status === 'archived' ||
          data.status === 'hidden' ||
          data.isActive === false;

        if (purgeAllStudioPosts || isArchivedOrDeleted) {
          try {
            await deleteDoc(docSnap.ref);
            galleryDeleted++;
          } catch (delErr: any) {
            errors.push(`Gallery doc ${docSnap.id}: ${delErr?.message || delErr}`);
          }
        }
      }
    }
  } catch (err: any) {
    errors.push(`Gallery collection scan: ${err?.message || err}`);
  }

  // 2. Scan and purge from 'portfolio' collection in Firestore
  try {
    const portfolioSnap = await getDocs(collection(db, 'portfolio'));
    for (const docSnap of portfolioSnap.docs) {
      const data = docSnap.data();
      const div = String(data.division || data.divisionId || '').toLowerCase();
      const isStudio = studioDivisionKeys.includes(div);

      if (isStudio) {
        const isArchivedOrDeleted =
          data.isDeleted === true ||
          data.status === 'deleted' ||
          data.status === 'archived' ||
          data.status === 'hidden' ||
          data.isActive === false;

        if (purgeAllStudioPosts || isArchivedOrDeleted) {
          try {
            await deleteDoc(docSnap.ref);
            portfolioDeleted++;
          } catch (delErr: any) {
            errors.push(`Portfolio doc ${docSnap.id}: ${delErr?.message || delErr}`);
          }
        }
      }
    }
  } catch (err: any) {
    errors.push(`Portfolio collection scan: ${err?.message || err}`);
  }

  return {
    success: errors.length === 0,
    galleryDeleted,
    portfolioDeleted,
    totalDeleted: galleryDeleted + portfolioDeleted,
    errors,
  };
}
