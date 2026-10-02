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
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreGallery, DivisionId } from '../../types/firestore';
import { isSameDivision } from './divisions';

const CACHE_TTL_MS = 1000 * 60 * 20;
let cachedGallery: { data: FirestoreGallery[]; timestamp: number } | null = null;
let inFlightGalleryPromise: Promise<FirestoreGallery[]> | null = null;

export function getDefaultGallery(): FirestoreGallery[] {
  return [
    {
      id: 'gal-mtmkxpbi-q1c4',
      url: '/uploads/images/gallery_gal-mtmkxpbi-q1c4_url_munpwo73.webp',
      type: 'image',
      images: ['/uploads/images/gallery_gal-mtmkxpbi-q1c4_url_munpwo73.webp'],
      division: 'sws',
      thumbnailUrl: '/uploads/images/gallery_gal-mtmkxpbi-q1c4_thumbnailUrl_munpwnxi.webp',
      category: 'Cradle Ceremony',
      title: 'Cradle Ceremony Decoration',
      order: 1,
      sku: 'GAL-SWS-CRAD-569',
      mediaUrl: '/uploads/images/gallery_gal-mtmkxpbi-q1c4_url_munpwo73.webp',
      caption: '',
      status: 'published',
      aspectRatio: '1:1',
      tag: 'Cradle Ceremony',
      tags: ['Cradle Ceremony', 'Corporate'],
    },
    {
      id: 'gal-mu0tr4nz-2kyt',
      status: 'published',
      mediaUrl: '/uploads/images/gallery_gal-mu0tr4nz-2kyt_mediaUrl_munpwp71.webp',
      caption: '',
      url: '/uploads/images/gallery_gal-mu0tr4nz-2kyt_url_munpwpd7.webp',
      category: 'Big Girl Ceremony',
      tags: ['Big Girl Ceremony', 'Weddings'],
      aspectRatio: '16:9',
      type: 'image',
      title: 'Big Girl Ceremony Decoration ',
      thumbnailUrl: '/uploads/images/gallery_gal-mu0tr4nz-2kyt_thumbnailUrl_munpwoud.webp',
      division: 'sws',
      order: 2,
      tag: 'Big Girl Ceremony',
      images: ['/uploads/images/gallery_gal-mu0tr4nz-2kyt_images_0_munpwp0n.webp'],
      sku: 'GAL-SWS-GAL-222',
    },
    {
      id: 'gal-mu0tskl3-vjzo',
      sku: 'GAL-SWS-BIGG-481',
      tag: 'Big Girl Ceremony',
      category: 'Big Girl Ceremony',
      type: 'image',
      images: ['/uploads/images/gallery_gal-mu0tskl3-vjzo_images_0_munpwpqx.webp'],
      mediaUrl: '/uploads/images/gallery_gal-mu0tskl3-vjzo_mediaUrl_munpwpxh.webp',
      order: 3,
      title: 'Big Girl Ceremony ',
      aspectRatio: '4:3',
      caption: '',
      status: 'published',
      thumbnailUrl: '/uploads/images/gallery_gal-mu0tskl3-vjzo_thumbnailUrl_munpwq3m.webp',
      tags: ['Big Girl Ceremony', 'Weddings'],
      url: '/uploads/images/gallery_gal-mu0tskl3-vjzo_url_munpwqa2.webp',
      division: 'sws',
    },
    {
      id: 'gal-mu6zy8zq-pw4v',
      tags: ['Surprise', 'Weddings'],
      aspectRatio: '4:3',
      mediaUrl: '/uploads/images/gallery_gal-mu6zy8zq-pw4v_mediaUrl_munpwqww.webp',
      title: 'Marry Me Surprise Decoration ',
      thumbnailUrl: '/uploads/images/gallery_gal-mu6zy8zq-pw4v_thumbnailUrl_munpwqsj.webp',
      tag: 'Surprise',
      order: 4,
      status: 'published',
      sku: 'GAL-SWS-MARR-764',
      category: 'Surprise',
      caption: 'Marry me decor',
      images: ['/uploads/images/gallery_gal-mu6zy8zq-pw4v_images_0_munpwqo1.webp'],
      url: '/uploads/images/gallery_gal-mu6zy8zq-pw4v_url_munpwr1e.webp',
      division: 'sws',
      type: 'image',
    },
    {
      id: 'gal-mu6zzx5p-vory',
      tags: ['Weddings'],
      status: 'published',
      division: 'sws',
      url: '/uploads/images/gallery_gal-mu6zzx5p-vory_url_munpwrdr.webp',
      caption: 'Wedding Decoration ',
      category: 'Weddings',
      aspectRatio: '4:3',
      tag: 'Weddings',
      sku: 'GAL-SWS-WEDD-234',
      order: 5,
      mediaUrl: '/uploads/images/gallery_gal-mu6zzx5p-vory_url_munpwrdr.webp',
      images: ['/uploads/images/gallery_gal-mu6zzx5p-vory_url_munpwrdr.webp'],
      title: 'Wedding Decoration ',
      type: 'image',
      thumbnailUrl: '/uploads/images/gallery_gal-mu6zzx5p-vory_thumbnailUrl_munpwrjy.webp',
    },
    {
      id: 'gal-mubd75a7-iuk0',
      images: ['/uploads/images/gallery_gal-mubd75a7-iuk0_images_0_munpwso2.webp'],
      category: 'Album',
      url: '/uploads/images/gallery_gal-mubd75a7-iuk0_url_munpws8w.webp',
      mediaUrl: '/uploads/images/gallery_gal-mubd75a7-iuk0_mediaUrl_munpws1y.webp',
      title: '12 x 36 Album',
      tags: ['Album', 'Weddings'],
      order: 6,
      type: 'image',
      thumbnailUrl: '/uploads/images/gallery_gal-mubd75a7-iuk0_thumbnailUrl_munpwsg5.webp',
      caption: '',
      aspectRatio: '4:3',
      tag: 'Album',
      division: 'u1',
      sku: 'GAL-U1-12X3-345',
      status: 'published',
    },
    {
      id: 'gal-mubd8ty2-pc2w',
      mediaUrl: '/uploads/images/gallery_gal-mubd8ty2-pc2w_mediaUrl_munpwtf3.webp',
      title: 'Mini Album ',
      category: 'Album',
      thumbnailUrl: '/uploads/images/gallery_gal-mubd8ty2-pc2w_thumbnailUrl_munpwt8w.webp',
      type: 'image',
      sku: 'GAL-SWS-GAL-955',
      order: 7,
      aspectRatio: '4:3',
      images: ['/uploads/images/gallery_gal-mubd8ty2-pc2w_images_0_munpwt2s.webp'],
      tag: 'Album',
      division: 'u1',
      url: '/uploads/images/gallery_gal-mubd8ty2-pc2w_url_munpwtln.webp',
      status: 'published',
      tags: ['Album', 'Weddings'],
      caption: '',
    },
    {
      id: 'gal-mugs4qz6-4r9o',
      aspectRatio: '4:3',
      order: 8,
      type: 'image',
      title: 'Birthday Decoration ',
      status: 'published',
      division: 'sws',
      url: '/uploads/images/gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp',
      category: 'Birthday Decoration',
      thumbnailUrl: '/uploads/images/gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp',
      tag: 'Birthday Decoration',
      images: ['/uploads/images/gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp'],
      sku: 'GAL-SWS-BIRT-867',
      tags: ['Birthday Decoration', 'Weddings'],
      mediaUrl: '/uploads/images/gallery_gal-mugs4qz6-4r9o_url_munpwuzu.webp',
      caption: 'Birthday ',
    },
  ];
}

export const firestoreGalleryService = {
  async getGallery(division?: DivisionId, forceRefresh = false): Promise<FirestoreGallery[]> {
    const now = Date.now();
    let allItems: FirestoreGallery[] = [];

    // 1. Return fresh in-memory cache immediately if not forced to refresh
    if (!forceRefresh && cachedGallery && now - cachedGallery.timestamp < CACHE_TTL_MS) {
      allItems = cachedGallery.data;
    } else if (inFlightGalleryPromise) {
      // 2. Reuse concurrent in-flight request to avoid duplicate network roundtrips
      allItems = await inFlightGalleryPromise;
    } else {
      // 3. Initiate single deduplicated Firestore query
      inFlightGalleryPromise = (async () => {
        try {
          const snap = await getDocs(collection(db, 'gallery'));
          if (!snap.empty) {
            const items = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreGallery[];
            cachedGallery = { data: items, timestamp: Date.now() };
            return items;
          } else {
            cachedGallery = { data: [], timestamp: Date.now() };
            return [];
          }
        } catch (err) {
          console.warn('[Firestore Gallery] getGallery error:', err);
          return cachedGallery?.data || [];
        } finally {
          inFlightGalleryPromise = null;
        }
      })();
      allItems = await inFlightGalleryPromise;
    }

    if (division) {
      return allItems.filter(
        (g) => isSameDivision(g.division, division) || isSameDivision((g as any).divisionId, division)
      );
    }
    return allItems;
  },

  async saveGallery(id: string, data: Partial<FirestoreGallery>): Promise<void> {
    const docRef = doc(db, 'gallery', id);
    const payload = sanitizeForFirestore({ ...data, id });
    if (cachedGallery) {
      const idx = cachedGallery.data.findIndex((g) => g.id === id);
      if (idx >= 0) {
        cachedGallery.data[idx] = { ...cachedGallery.data[idx], ...payload } as FirestoreGallery;
      } else {
        cachedGallery.data.unshift(payload as FirestoreGallery);
      }
    }
    try {
      await Promise.race([
        setDoc(docRef, payload, { merge: true }),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
    } catch (err) {
      console.warn('[Firestore Gallery] save warning:', err);
    }
  },

  async deleteGallery(id: string): Promise<void> {
    const docRef = doc(db, 'gallery', id);
    if (cachedGallery) {
      cachedGallery.data = cachedGallery.data.filter((g) => g.id !== id);
    }
    try {
      await Promise.race([
        deleteDoc(docRef),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
    } catch (err) {
      console.warn('[Firestore Gallery] delete warning:', err);
    }
  },

  subscribeGallery(division: DivisionId | undefined, onData: (data: FirestoreGallery[]) => void): Unsubscribe {
    const colRef = collection(db, 'gallery');

    return onSnapshot(
      colRef,
      (snap) => {
        const data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreGallery[];
        cachedGallery = { data, timestamp: Date.now() };
        if (division) {
          const filtered = data.filter(
            (g) => isSameDivision(g.division, division) || isSameDivision((g as any).divisionId, division)
          );
          onData(filtered);
        } else {
          onData(data);
        }
      },
      (err) => {
        console.warn('[Firestore Gallery] Listener error:', err);
        const fallback = cachedGallery?.data || [];
        if (division) {
          onData(
            fallback.filter(
              (g) => isSameDivision(g.division, division) || isSameDivision((g as any).divisionId, division)
            )
          );
        } else {
          onData(fallback);
        }
      }
    );
  },

  /**
   * Explicitly invalidate in-memory gallery cache
   */
  clearCache(): void {
    cachedGallery = null;
    inFlightGalleryPromise = null;
  },
};
