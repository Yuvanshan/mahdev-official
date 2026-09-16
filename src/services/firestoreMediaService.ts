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
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const CHUNK_SIZE_BYTES = 450 * 1024; // 450KB per chunk (~600KB in base64, safe under 1MB limit)
const memoryBlobUrlCache = new Map<string, string>();
const inFlightResolutions = new Map<string, Promise<string>>();

export interface FirestoreMediaMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  createdAt: string;
}

// Simple browser IndexedDB cache helper for zero-latency playback
const IDB_NAME = 'mahdev_media_vault_v1';
const IDB_STORE = 'blobs';

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedBlobFromIdb(key: string): Promise<Blob | null> {
  try {
    const idbPromise = openMediaDB();
    const timeoutPromise = new Promise<null>((r) => setTimeout(() => r(null), 300));
    const idb = await Promise.race([idbPromise, timeoutPromise]);
    if (!idb) return null;
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveCachedBlobToIdb(key: string, blob: Blob): Promise<void> {
  try {
    const idbPromise = openMediaDB();
    const timeoutPromise = new Promise<null>((r) => setTimeout(() => r(null), 300));
    const idb = await Promise.race([idbPromise, timeoutPromise]);
    if (!idb) return;
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(blob, key);
  } catch {}
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

  // Pre-cache into IndexedDB and memory URL cache for instantaneous playback in current session
  try {
    await saveCachedBlobToIdb(blobId, file);
    const localUrl = URL.createObjectURL(file);
    memoryBlobUrlCache.set(blobId, localUrl);
  } catch {}

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

  // 2. Check IndexedDB persistent local cache
  const cachedBlob = await getCachedBlobFromIdb(blobId);
  if (cachedBlob) {
    const objUrl = URL.createObjectURL(cachedBlob);
    memoryBlobUrlCache.set(blobId, objUrl);
    return objUrl;
  }

  // 3. Deduplicate concurrent in-flight download promises
  if (inFlightResolutions.has(blobId)) {
    return inFlightResolutions.get(blobId)!;
  }

  const resolutionPromise = (async () => {
    try {
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
      // Non-blocking write to IDB in background
      saveCachedBlobToIdb(blobId, reconstructedBlob).catch(() => {});

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

    // 3. Clear memory and IDB cache
    if (memoryBlobUrlCache.has(blobId)) {
      const oldUrl = memoryBlobUrlCache.get(blobId);
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }
      memoryBlobUrlCache.delete(blobId);
    }

    try {
      const dbInstance = await openMediaDB();
      const tx = dbInstance.transaction('blobs', 'readwrite');
      tx.objectStore('blobs').delete(blobId);
    } catch {}

    return true;
  } catch (err) {
    console.error('[FirestoreMedia] Error deleting media blob from Firestore:', err);
    return false;
  }
}
