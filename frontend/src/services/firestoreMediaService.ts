/**
 * Firestore Media Storage & Chunking Service
 * Provides reliable, Firestore-native storage for videos and high-res media.
 * Solves Vercel serverless 404s and overcomes Firestore's 1MB single-document limit
 * by chunking binary media into synchronized Firestore subcollections.
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from '../lib/tursoFirestore';
import { db } from '../lib/firebase';

const CHUNK_SIZE_BYTES = 450 * 1024; // 450KB per chunk (~600KB in base64, safe under 1MB limit)
const memoryBlobUrlCache = new Map<string, string>();
const inFlightResolutions = new Map<string, Promise<string>>();
const MEDIA_CACHE_DATABASE = 'mahdev-media-cache';
const MEDIA_CACHE_STORE = 'blobs';
const MEDIA_CACHE_MAX_BYTES = 64 * 1024 * 1024;
let mediaCacheDatabase: Promise<IDBDatabase> | null = null;

interface CachedMediaBlob {
  blob: Blob;
  cachedAt: number;
}

function openMediaCacheDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable.'));
  }
  if (!mediaCacheDatabase) {
    mediaCacheDatabase = new Promise((resolve, reject) => {
      const request = indexedDB.open(MEDIA_CACHE_DATABASE, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(MEDIA_CACHE_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open the media cache.'));
    });
  }
  return mediaCacheDatabase;
}

async function readCachedMediaBlob(blobId: string): Promise<Blob | null> {
  try {
    const database = await openMediaCacheDatabase();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(MEDIA_CACHE_STORE, 'readonly')
        .objectStore(MEDIA_CACHE_STORE)
        .get(blobId);
      request.onsuccess = () => {
        const cached = request.result as CachedMediaBlob | undefined;
        resolve(cached?.blob instanceof Blob ? cached.blob : null);
      };
      request.onerror = () => reject(request.error || new Error('Could not read the media cache.'));
    });
  } catch (error) {
    mediaCacheDatabase = null;
    console.warn('[FirestoreMedia] Persistent cache unavailable; downloading media:', error);
    return null;
  }
}

async function writeCachedMediaBlob(blobId: string, blob: Blob): Promise<void> {
  if (blob.size > MEDIA_CACHE_MAX_BYTES) return;
  try {
    const database = await openMediaCacheDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(MEDIA_CACHE_STORE, 'readwrite');
      const store = transaction.objectStore(MEDIA_CACHE_STORE);
      store.put({ blob, cachedAt: Date.now() } satisfies CachedMediaBlob, blobId);
      const entriesRequest = store.getAll();
      const keysRequest = store.getAllKeys();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not write the media cache.'));
      entriesRequest.onerror = () => reject(entriesRequest.error || new Error('Could not inspect the media cache.'));
      keysRequest.onerror = () => reject(keysRequest.error || new Error('Could not inspect the media cache.'));
      const prune = () => {
        if (!entriesRequest.result || !keysRequest.result) return;
        const entries = entriesRequest.result as CachedMediaBlob[];
        const keys = keysRequest.result;
        let totalBytes = entries.reduce((total, entry) => total + (entry.blob?.size || 0), 0);
        const oldestFirst = entries
          .map((entry, index) => ({ key: keys[index], size: entry.blob?.size || 0, cachedAt: entry.cachedAt || 0 }))
          .sort((left, right) => left.cachedAt - right.cachedAt);
        for (const entry of oldestFirst) {
          if (totalBytes <= MEDIA_CACHE_MAX_BYTES) break;
          store.delete(entry.key);
          totalBytes -= entry.size;
        }
      };
      entriesRequest.onsuccess = prune;
      keysRequest.onsuccess = prune;
    });
  } catch (error) {
    mediaCacheDatabase = null;
    console.warn('[FirestoreMedia] Could not persist media for the next visit:', error);
  }
}

async function deleteCachedMediaBlob(blobId: string): Promise<void> {
  try {
    const database = await openMediaCacheDatabase();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(MEDIA_CACHE_STORE, 'readwrite')
        .objectStore(MEDIA_CACHE_STORE)
        .delete(blobId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error('Could not delete the cached media.'));
    });
  } catch (error) {
    mediaCacheDatabase = null;
    console.warn('[FirestoreMedia] Could not remove media from the persistent cache:', error);
  }
}

export interface FirestoreMediaMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  createdAt: string;
}

/**
 * Uploads a media file (video or image) directly into Firestore chunked documents.
 * Returns a uniform resource string: `firestore://media_blobs/{id}`
 */
export async function uploadMediaToFirestore(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const blobId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE_BYTES);

  // 1. Write the parent metadata document
  const metaDocRef = doc(db, 'media_blobs', blobId);
  const metadata: FirestoreMediaMetadata = {
    id: blobId,
    name: file.name,
    mimeType: file.type || 'video/mp4',
    size: file.size,
    chunkCount: totalChunks,
    createdAt: new Date().toISOString(),
  };

  await setDoc(metaDocRef, metadata);
  onProgress?.(5);

  // 2. Upload each chunk sequentially to maintain order and report progress
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE_BYTES;
    const end = Math.min(start + CHUNK_SIZE_BYTES, file.size);
    const slice = file.slice(start, end);

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data URL header (e.g. data:video/mp4;base64,) to save space
        const commaIdx = result.indexOf(',');
        resolve(commaIdx !== -1 ? result.slice(commaIdx + 1) : result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(slice);
    });

    const chunkDocRef = doc(db, 'media_blobs', blobId, 'chunks', String(i).padStart(4, '0'));
    
    // Write chunk with backoff retry to prevent stream queue exhaustion
    let chunkWritten = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await setDoc(chunkDocRef, {
          index: i,
          data: base64Data,
        });
        chunkWritten = true;
        break;
      } catch (err: any) {
        if (attempt < 2) {
          const delay = (attempt + 1) * 600;
          console.warn(`[FirestoreMedia] Chunk ${i} write backoff delay ${delay}ms:`, err?.message);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }

    const currentPct = Math.round(5 + ((i + 1) / totalChunks) * 90);
    onProgress?.(currentPct);

    // Controlled inter-chunk pacing allows the Firestore stream buffer to drain smoothly
    if (i < totalChunks - 1) {
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  const localUrl = URL.createObjectURL(file);
  memoryBlobUrlCache.set(blobId, localUrl);

  onProgress?.(100);
  return `firestore://media_blobs/${blobId}`;
}

/**
 * Resolves a media URL:
 * If it's a standard URL (http, https, data:), returns it immediately.
 * If it's `firestore://media_blobs/{id}`, downloads and reconstructs the Blob from Firestore.
 */
export async function resolveMediaUrl(rawUrl: string | undefined): Promise<string> {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (!trimmed.startsWith('firestore://')) {
    return trimmed;
  }

  const blobId = trimmed
    .replace('firestore://media_blobs/', '')
    .replace('firestore://blobs/', '')
    .replace('firestore://media/', '')
    .replace('firestore://', '')
    .split('/')[0]
    .trim();

  if (!blobId) return trimmed;

  // 1. Check in-memory cache
  if (memoryBlobUrlCache.has(blobId)) {
    return memoryBlobUrlCache.get(blobId)!;
  }

  // Deduplicate concurrent in-flight downloads.
  if (inFlightResolutions.has(blobId)) {
    return inFlightResolutions.get(blobId)!;
  }

  const resolutionPromise = (async () => {
    try {
      const cachedBlob = await readCachedMediaBlob(blobId);
      if (cachedBlob) {
        const objectUrl = URL.createObjectURL(cachedBlob);
        memoryBlobUrlCache.set(blobId, objectUrl);
        return objectUrl;
      }

      const metaDocRef = doc(db, 'media_blobs', blobId);
      const metaSnap = await getDoc(metaDocRef);
      if (!metaSnap.exists()) {
        console.warn('[FirestoreMedia] Media blob metadata not found:', blobId);
        return '';
      }
      const meta = metaSnap.data() as FirestoreMediaMetadata;

      const chunksCollRef = collection(db, 'media_blobs', blobId, 'chunks');
      const chunkSnaps = await getDocs(chunksCollRef);

      if (chunkSnaps.empty) {
        console.warn('[FirestoreMedia] Media blob chunks missing for:', blobId);
        return '';
      }

      // Explicit in-memory numerical sorting by chunk index
      const sortedSnaps = chunkSnaps.docs.slice().sort((a, b) => {
        const idxA = typeof a.data()?.index === 'number' ? a.data().index : parseInt(a.id, 10) || 0;
        const idxB = typeof b.data()?.index === 'number' ? b.data().index : parseInt(b.id, 10) || 0;
        return idxA - idxB;
      });

      const chunkDataParts: Uint8Array[] = [];
      for (const snap of sortedSnaps) {
        const b64 = snap.data()?.data;
        if (b64) {
          const binaryString = atob(b64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let j = 0; j < len; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          chunkDataParts.push(bytes);
        }
      }

      const reconstructedBlob = new Blob(chunkDataParts, { type: meta.mimeType || 'video/mp4' });
      if (typeof meta.size === 'number' && meta.size > 0 && reconstructedBlob.size !== meta.size) {
        throw new Error(`Media size mismatch for ${blobId}.`);
      }
      await writeCachedMediaBlob(blobId, reconstructedBlob);
      const objectUrl = URL.createObjectURL(reconstructedBlob);
      memoryBlobUrlCache.set(blobId, objectUrl);
      return objectUrl;
    } catch (err) {
      console.error('[FirestoreMedia] Error reconstructing media blob:', err);
      return '';
    } finally {
      inFlightResolutions.delete(blobId);
    }
  })();

  inFlightResolutions.set(blobId, resolutionPromise);
  return resolutionPromise;
}

/**
 * Pre-buffers video in the browser to ensure zero-stutter playback before UI reveals it.
 * Has a strict timeout fallback so the application never hangs if offline or on slow network.
 */
export function preloadVideo(url: string, timeoutMs = 8000): Promise<boolean> {
  if (!url || typeof window === 'undefined') return Promise.resolve(true);
  if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let finished = false;
    let timer: any = null;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      try {
        video.src = '';
        video.load();
        video.remove();
      } catch {}
      resolve(true);
    };

    timer = setTimeout(cleanup, timeoutMs);

    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    (video as any).defaultMuted = true;
    video.playsInline = true;
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';

    video.oncanplay = cleanup;
    video.onloadeddata = cleanup;
    video.oncanplaythrough = cleanup;
    video.onerror = cleanup;

    video.src = url;
    document.body.appendChild(video);
    video.load();
  });
}

/**
 * Permanently deletes a chunked media blob from Firestore (both parent metadata and all chunk documents).
 * Also cleans up IndexedDB and memory URL caches.
 */
export async function deleteMediaBlobFromFirestore(rawUrl: string): Promise<boolean> {
  if (!rawUrl || typeof rawUrl !== 'string') return true;

  const blobId = rawUrl
    .replace('firestore://media_blobs/', '')
    .replace('firestore://blobs/', '')
    .replace('firestore://media/', '')
    .replace('firestore://', '')
    .split('/')[0]
    .split('?')[0]
    .trim();

  if (!blobId) return true;

  try {
    await deleteCachedMediaBlob(blobId);

    // 1. Delete all chunk documents in subcollection
    const chunksCollRef = collection(db, 'media_blobs', blobId, 'chunks');
    const chunkSnaps = await getDocs(chunksCollRef);
    if (!chunkSnaps.empty) {
      const deletePromises = chunkSnaps.docs.map((chunkDoc) => deleteDoc(chunkDoc.ref));
      await Promise.all(deletePromises);
    }

    // 2. Delete parent metadata doc
    const metaDocRef = doc(db, 'media_blobs', blobId);
    await deleteDoc(metaDocRef);

    // Clear the in-memory object URL cache.
    if (memoryBlobUrlCache.has(blobId)) {
      const oldUrl = memoryBlobUrlCache.get(blobId);
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }
      memoryBlobUrlCache.delete(blobId);
    }

    return true;
  } catch (err) {
    console.error('[FirestoreMedia] Error deleting media blob from the database:', err);
    return false;
  }
}
