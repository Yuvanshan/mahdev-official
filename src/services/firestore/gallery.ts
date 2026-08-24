/**
 * Firestore Gallery Repository
 * Phase 23 - Real Firestore Data Integration
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirestoreGallery, DivisionId } from '../../types/firestore';

const CACHE_TTL_MS = 1000 * 60 * 20;
let cachedGallery: { data: FirestoreGallery[]; timestamp: number } | null = null;

export function getDefaultGallery(): FirestoreGallery[] {
  return [
    {
      id: 'gal-sws-01',
      division: 'sws',
      title: 'Grand Ballroom Floral Symphony',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      type: 'image',
      tag: 'Weddings',
      status: 'published',
    },
    {
      id: 'gal-u1-01',
      division: 'u1',
      title: '8K RED V-Raptor Cinematic Studio Rig',
      url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
      type: 'image',
      tag: 'Cinematography',
      status: 'published',
    },
    {
      id: 'gal-it-01',
      division: 'it',
      title: 'Enterprise Hybrid Cloud Architecture Operations',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      type: 'image',
      tag: 'DevOps',
      status: 'published',
    },
    {
      id: 'gal-travels-01',
      division: 'travels',
      title: 'VIP Yala Leopard Safari Expedition',
      url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80',
      type: 'image',
      tag: 'Wildlife',
      status: 'published',
    },
    {
      id: 'gal-mart-01',
      division: 'mart',
      title: 'Nuwara Eliya Single-Estate Tea Reserve Packaging',
      url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
      type: 'image',
      tag: 'Ceylon Tea',
      status: 'published',
    },
  ];
}

export const firestoreGalleryService = {
  async getGallery(division?: DivisionId, forceRefresh = false): Promise<FirestoreGallery[]> {
    const now = Date.now();
    let allItems: FirestoreGallery[] = [];

    if (!forceRefresh && cachedGallery && now - cachedGallery.timestamp < CACHE_TTL_MS) {
      allItems = cachedGallery.data;
    } else {
      try {
        const snap = await getDocs(collection(db, 'gallery'));
        if (!snap.empty) {
          allItems = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreGallery[];
          cachedGallery = { data: allItems, timestamp: now };
        } else {
          const defaults = getDefaultGallery();
          for (const item of defaults) {
            await setDoc(doc(db, 'gallery', item.id), item, { merge: true });
          }
          allItems = defaults;
          cachedGallery = { data: defaults, timestamp: now };
        }
      } catch (err) {
        console.warn('[Firestore Gallery] getGallery fallback:', err);
        allItems = cachedGallery?.data || getDefaultGallery();
      }
    }

    if (division) {
      return allItems.filter((g) => g.division === division);
    }
    return allItems;
  },

  async saveGallery(id: string, data: Partial<FirestoreGallery>): Promise<void> {
    const docRef = doc(db, 'gallery', id);
    await setDoc(docRef, { ...data, id }, { merge: true });
    if (cachedGallery) {
      const idx = cachedGallery.data.findIndex((g) => g.id === id);
      if (idx >= 0) {
        cachedGallery.data[idx] = { ...cachedGallery.data[idx], ...data } as FirestoreGallery;
      }
    }
  },

  async deleteGallery(id: string): Promise<void> {
    const docRef = doc(db, 'gallery', id);
    await deleteDoc(docRef);
    if (cachedGallery) {
      cachedGallery.data = cachedGallery.data.filter((g) => g.id !== id);
    }
  },

  subscribeGallery(division: DivisionId | undefined, onData: (data: FirestoreGallery[]) => void): Unsubscribe {
    const colRef = collection(db, 'gallery');
    const q = division ? query(colRef, where('division', '==', division)) : colRef;
    return onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          onData(snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreGallery[]);
        } else {
          const defaults = getDefaultGallery();
          onData(division ? defaults.filter((g) => g.division === division) : defaults);
        }
      },
      () => {
        const defaults = getDefaultGallery();
        onData(division ? defaults.filter((g) => g.division === division) : defaults);
      }
    );
  },
};
