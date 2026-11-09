import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';

export interface FirestoreHeroSection {
  id: string;
  badge?: string;
  title: string;
  highlightText?: string;
  subtitle?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaLink?: string;
  secondaryCtaLabel?: string;
  secondaryCtaLink?: string;
  backgroundType?: 'image' | 'video' | 'gradient';
  backgroundUrl?: string;
  videoUrl?: string;
  isActive: boolean;
  order: number;
  stats?: Array<{ label: string; value: string; subtext?: string }>;
  divisionId?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'heroSections';

export const firestoreHeroSectionsService = {
  async getHeroSections(): Promise<FirestoreHeroSection[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as FirestoreHeroSection[];
    } catch (err) {
      console.warn(`[FirestoreHero] Failed to fetch hero sections:`, err);
      return [];
    }
  },

  async saveHeroSection(id: string, data: Partial<FirestoreHeroSection>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const sanitized = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  },

  async deleteHeroSection(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  subscribeHeroSections(callback: (sections: FirestoreHeroSection[]) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(
      q,
      (snapshot) => {
        const sections = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as FirestoreHeroSection))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(sections);
      },
      (err) => {
        console.warn(`[FirestoreHero] Snapshot listener error:`, err);
      }
    );
  },
};
