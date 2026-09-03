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
    primaryPhone: '+94 77 000 0000',
    whatsappNumber: '+94 77 000 0000',
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
