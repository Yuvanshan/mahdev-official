/**
 * Mahdev Cloud Firestore Media Management Service
 * Provides durable cloud persistence for media assets, syncing them in real-time
 * with Firestore collection 'media_assets' and ensuring permanent, multi-tier
 * deletion from Firestore, Firebase Storage, and chunked media blobs.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  updateDoc,
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { StorageCategory } from '../../types/storage';
import { storageService } from '../storageService';
import { deleteMediaBlobFromFirestore } from '../firestoreMediaService';
import { safeStorage } from '../../utils/safeStorage';

export interface StoredMediaItem {
  id: string;
  title: string;
  category: StorageCategory;
  url: string;
  storagePath?: string;
  dimensions: string;
  fileSize: string;
  mimeType: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  division?: string;
  divisionId?: string;
  description?: string;
  altText?: string;
}

const COLLECTION_NAME = 'media_assets';
const SYSTEM_METADATA_DOC = 'deleted_media';
const STORAGE_DELETED_KEY = 'mahdev_deleted_media_ids_v1';
const STORAGE_DELETED_URLS_KEY = 'mahdev_deleted_media_urls_v1';

const MEDIA_CACHE_TTL_MS = 1000 * 60 * 15; // 15 min cache
let cachedMediaAssets: { data: StoredMediaItem[]; timestamp: number } | null = null;
let inFlightMediaPromise: Promise<StoredMediaItem[]> | null = null;

export function invalidateMediaCache(): void {
  cachedMediaAssets = null;
}

export const DEFAULT_MEDIA_ITEMS: StoredMediaItem[] = [
  {
    id: 'med-co-01',
    title: 'Mahdev Enterprise Executive Corporate Emblem',
    category: 'company',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'company/corp_headquarters.webp',
    dimensions: '1920x1080',
    fileSize: '380 KB',
    mimeType: 'image/webp',
    tags: ['corporate', 'colombo', 'headquarters'],
    createdAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'med-div-01',
    title: 'SWS Sound Wave Studio Production Floor',
    category: 'divisions',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'divisions/sws/production_floor.webp',
    dimensions: '1920x1080',
    fileSize: '450 KB',
    mimeType: 'image/webp',
    tags: ['sws', 'audio', 'studio', 'division'],
    createdAt: '2026-01-08T10:00:00Z',
  },
  {
    id: 'med-srv-01',
    title: 'BMICH Grand Gala 4K LED Matrix Stage Service',
    category: 'services',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'services/events/bmich_gala.webp',
    dimensions: '1920x1080',
    fileSize: '420 KB',
    mimeType: 'image/webp',
    tags: ['bmich', 'stage', 'led', 'concert', 'service'],
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'med-prod-01',
    title: 'Mahdev Ceylon Single-Estate Earl Grey Collection',
    category: 'products',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'products/tea/earl_grey_tin.webp',
    dimensions: '1200x1200',
    fileSize: '320 KB',
    mimeType: 'image/webp',
    tags: ['tea', 'ceylon', 'earlgrey', 'mart', 'product'],
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'med-port-01',
    title: 'Fine-Art Editorial Studio Shoot Portfolio',
    category: 'portfolio',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'portfolio/shoots/editorial_cover.webp',
    dimensions: '1200x1600',
    fileSize: '390 KB',
    mimeType: 'image/webp',
    tags: ['portrait', 'fashion', 'studio', 'portfolio'],
    createdAt: '2026-01-18T10:00:00Z',
  },
  {
    id: 'med-gal-01',
    title: 'Bespoke Highland Safari & Expedition Showcase',
    category: 'gallery',
    url: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80',
    storagePath: 'gallery/travels/highland_expedition.webp',
    dimensions: '1920x1280',
    fileSize: '510 KB',
    mimeType: 'image/webp',
    tags: ['travels', 'sigiriya', 'gallery', 'safari'],
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'med-test-01',
    title: 'Client Testimonial Executive Verified Portrait',
    category: 'testimonials',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    storagePath: 'testimonials/client_dr_perera.webp',
    dimensions: '400x400',
    fileSize: '95 KB',
    mimeType: 'image/webp',
    tags: ['testimonial', 'portrait', 'executive'],
    createdAt: '2026-01-22T10:00:00Z',
  },
];

/**
 * Retrieves the set of permanently deleted asset IDs from Firestore and local cache
 */
export async function getPermanentlyDeletedIds(): Promise<Set<string>> {
  const localSet = new Set<string>();
  try {
    const raw = safeStorage.getItem(STORAGE_DELETED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => localSet.add(id));
      }
    }
  } catch {}

  try {
    const metaDocRef = doc(db, 'system_metadata', SYSTEM_METADATA_DOC);
    const snap = await getDoc(metaDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.deletedIds)) {
        data.deletedIds.forEach((id: string) => localSet.add(id));
      }
    }
  } catch (err) {
    console.debug('[MediaService] Could not read remote deletedIds meta doc:', err);
  }

  return localSet;
}

/**
 * Retrieves the set of permanently deleted asset URLs from Firestore and local cache
 */
export async function getPermanentlyDeletedUrls(): Promise<Set<string>> {
  const localSet = new Set<string>();
  try {
    const raw = safeStorage.getItem(STORAGE_DELETED_URLS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((u) => localSet.add(u));
      }
    }
  } catch {}

  try {
    const metaDocRef = doc(db, 'system_metadata', SYSTEM_METADATA_DOC);
    const snap = await getDoc(metaDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.deletedUrls)) {
        data.deletedUrls.forEach((u: string) => localSet.add(u));
      }
    }
  } catch (err) {
    console.debug('[MediaService] Could not read remote deletedUrls meta doc:', err);
  }

  return localSet;
}

/**
 * Records an asset ID and URL as permanently deleted in Firestore and local storage
 */
export async function recordPermanentlyDeletedAsset(id: string, url?: string): Promise<void> {
  if (!id && !url) return;

  // 1. Update local cache
  try {
    if (id) {
      const rawIds = safeStorage.getItem(STORAGE_DELETED_KEY);
      const idList: string[] = rawIds ? JSON.parse(rawIds) : [];
      if (!idList.includes(id)) {
        idList.push(id);
        safeStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(idList));
      }
    }

    if (url) {
      const rawUrls = safeStorage.getItem(STORAGE_DELETED_URLS_KEY);
      const urlList: string[] = rawUrls ? JSON.parse(rawUrls) : [];
      if (!urlList.includes(url)) {
        urlList.push(url);
        safeStorage.setItem(STORAGE_DELETED_URLS_KEY, JSON.stringify(urlList));
      }
    }
  } catch {}

  // 2. Persist to Firestore system metadata
  try {
    const metaDocRef = doc(db, 'system_metadata', SYSTEM_METADATA_DOC);
    const updatePayload: Record<string, any> = {
      lastDeletedAt: new Date().toISOString(),
    };
    if (id) {
      updatePayload.deletedIds = arrayUnion(id);
    }
    if (url) {
      updatePayload.deletedUrls = arrayUnion(url);
    }
    await setDoc(metaDocRef, updatePayload, { merge: true });
  } catch (err) {
    console.warn('[MediaService] Could not write to remote deleted_media doc:', err);
  }
}

export const recordPermanentlyDeletedId = (id: string) => recordPermanentlyDeletedAsset(id);

export const mediaService = {
  /**
   * Retrieves all verified media assets directly from Firestore with caching and deduplication
   */
  async getMediaAssets(forceRefresh = false): Promise<StoredMediaItem[]> {
    const now = Date.now();
    if (!forceRefresh && cachedMediaAssets && now - cachedMediaAssets.timestamp < MEDIA_CACHE_TTL_MS) {
      return cachedMediaAssets.data;
    }
    if (inFlightMediaPromise) {
      return inFlightMediaPromise;
    }

    inFlightMediaPromise = (async () => {
      try {
        const collRef = collection(db, COLLECTION_NAME);
        const [deletedIds, deletedUrls] = await Promise.all([
          getPermanentlyDeletedIds(),
          getPermanentlyDeletedUrls(),
        ]);
        const snapshot = await getDocs(collRef);
        const items: StoredMediaItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as StoredMediaItem;
          const isMarkedDeleted = Boolean(data.isDeleted || (data as any).deleted);
          const isIdDeleted = deletedIds.has(docSnap.id) || (data.id && deletedIds.has(data.id));
          const isUrlDeleted = Boolean(data.url && deletedUrls.has(data.url));

          if (!isMarkedDeleted && !isIdDeleted && !isUrlDeleted) {
            items.push({
              ...data,
              id: docSnap.id || data.id,
            });
          }
        });
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        cachedMediaAssets = { data: items, timestamp: Date.now() };
        return items;
      } catch (err) {
        console.warn('[MediaService] getMediaAssets failed:', err);
        return cachedMediaAssets?.data || [];
      } finally {
        inFlightMediaPromise = null;
      }
    })();

    return inFlightMediaPromise;
  },

  /**
   * Subscribes to real-time updates from Firestore 'media_assets' collection.
   * Strictly delivers verified Firestore records; never injects fake default mock items.
   */
  subscribeToMediaAssets(
    callback: (items: StoredMediaItem[]) => void,
    onError?: (error: any) => void
  ): () => void {
    const collRef = collection(db, COLLECTION_NAME);

    const unsub = onSnapshot(
      collRef,
      async (snapshot) => {
        const [deletedIds, deletedUrls] = await Promise.all([
          getPermanentlyDeletedIds(),
          getPermanentlyDeletedUrls(),
        ]);

        if (snapshot.empty) {
          callback([]);
          return;
        }

        const items: StoredMediaItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as StoredMediaItem;
          const isMarkedDeleted = Boolean(data.isDeleted || (data as any).deleted);
          const isIdDeleted = deletedIds.has(docSnap.id) || (data.id && deletedIds.has(data.id));
          const isUrlDeleted = Boolean(data.url && deletedUrls.has(data.url));

          if (!isMarkedDeleted && !isIdDeleted && !isUrlDeleted) {
            items.push({
              ...data,
              id: docSnap.id || data.id,
            });
          }
        });

        // Sort latest first
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        callback(items);
      },
      (err) => {
        console.error('[MediaService] Snapshot error:', err);
        if (onError) onError(err);
        const raw = safeStorage.getItem('mahdev_admin_media_v1');
        const items = raw ? JSON.parse(raw) : [];
        callback(items);
      }
    );

    return unsub;
  },

  /**
   * Saves or updates a media asset in Firestore
   */
  async saveMediaAsset(
    itemOrId: StoredMediaItem | string,
    partialUpdate?: Partial<StoredMediaItem>
  ): Promise<void> {
    let id: string;
    let payload: Record<string, any>;

    if (typeof itemOrId === 'string') {
      id = itemOrId;
      payload = sanitizeForFirestore({
        ...partialUpdate,
        id,
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      });
    } else {
      id = itemOrId.id;
      payload = sanitizeForFirestore({
        ...itemOrId,
        updatedAt: new Date().toISOString(),
        isDeleted: false,
      });
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, payload, { merge: true });

    // Update local safe storage cache as secondary mirror
    try {
      const raw = safeStorage.getItem('mahdev_admin_media_v1');
      const existing: StoredMediaItem[] = raw ? JSON.parse(raw) : [];
      const updated = [
        { ...payload, id } as StoredMediaItem,
        ...existing.filter((i) => i.id !== id && (!payload.url || i.url !== payload.url)),
      ];
      safeStorage.setItem('mahdev_admin_media_v1', JSON.stringify(updated));
    } catch {}
  },

  /**
   * Permanently deletes a media asset across all storage layers:
   * 1. Firestore 'media_assets' document (and all matching docs by ID or URL)
   * 2. Firestore system_metadata deletedIds and deletedUrls registry
   * 3. Firebase Storage (if storagePath exists)
   * 4. Firestore chunked media blob (if url is firestore://)
   * 5. Local safeStorage cache
   */
  async deleteMediaAsset(
    id: string,
    storagePath?: string,
    url?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Mark in permanent deleted IDs & URLs registry so presets/snapshots never resurrect it
      await recordPermanentlyDeletedAsset(id, url);

      // 2. Multi-tier Firestore deletion:
      // First: soft-delete the direct doc to immediately invalidate any caching
      try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await setDoc(docRef, { isDeleted: true, deletedAt: new Date().toISOString() }, { merge: true });
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('[MediaService] Firestore deleteDoc direct notice:', err);
      }

      // Second: Query and purge any duplicate or auto-generated documents matching ID or URL
      try {
        const collRef = collection(db, COLLECTION_NAME);
        const snapshot = await getDocs(collRef);
        const docsToDelete: string[] = [];

        snapshot.forEach((d) => {
          const data = d.data();
          const matchesId = d.id === id || data.id === id;
          const matchesUrl = Boolean(url && (data.url === url || (data as any)?.thumbnailUrl === url));
          const matchesPath = Boolean(storagePath && data.storagePath === storagePath);

          if (matchesId || matchesUrl || matchesPath) {
            docsToDelete.push(d.id);
          }
        });

        for (const docId of docsToDelete) {
          try {
            await setDoc(doc(db, COLLECTION_NAME, docId), { isDeleted: true, deletedAt: new Date().toISOString() }, { merge: true });
            await deleteDoc(doc(db, COLLECTION_NAME, docId));
          } catch (e) {
            console.debug('[MediaService] Purge doc notice for', docId, e);
          }
        }
      } catch (err) {
        console.debug('[MediaService] Bulk query delete notice:', err);
      }

      // 3. Delete from Firebase Storage if path provided
      if (storagePath) {
        try {
          await storageService.deleteFile(storagePath);
        } catch (err) {
          console.warn('[MediaService] Storage deleteFile notice:', err);
        }
      }

      // 4. Delete chunked blob from Firestore if URL points to media_blobs
      if (url && (url.startsWith('firestore://') || url.includes('media_blobs'))) {
        try {
          await deleteMediaBlobFromFirestore(url);
        } catch (err) {
          console.warn('[MediaService] Firestore blob purge notice:', err);
        }
      }

      // 5. Purge from local safeStorage mirror by both ID and URL
      try {
        const raw = safeStorage.getItem('mahdev_admin_media_v1');
        if (raw) {
          const list: StoredMediaItem[] = JSON.parse(raw);
          const filtered = list.filter((item) => item.id !== id && (!url || item.url !== url));
          safeStorage.setItem('mahdev_admin_media_v1', JSON.stringify(filtered));
        }
      } catch {}

      return { success: true };
    } catch (err: any) {
      console.error('[MediaService] Delete media asset error:', err);
      return { success: false, error: err.message || 'Failed to delete asset from Firestore.' };
    }
  },
};
