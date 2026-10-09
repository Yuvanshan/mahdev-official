/**
 * Uploads media to Firebase Storage and returns a compact URL for database records.
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { auth, storage } from '../lib/firebase';
import { uploadMediaToFirestore } from './firestoreMediaService';

export interface UploadMediaProgressCallback {
  (percent: number): void;
}

export async function uploadMediaAsset(
  file: File,
  onProgress?: UploadMediaProgressCallback
): Promise<string> {
  if (!file) {
    throw new Error('No file selected for upload.');
  }

  // Enforce a strict 100MB ceiling to protect client memory and server limits
  const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 100 MB limit. Please use a compressed video file or embed via YouTube URL.`
    );
  }

  const isVideo =
    file.type.startsWith('video/') ||
    file.name.toLowerCase().endsWith('.mp4') ||
    file.name.toLowerCase().endsWith('.webm') ||
    file.name.toLowerCase().endsWith('.ogg') ||
    file.name.toLowerCase().endsWith('.mov') ||
    file.name.toLowerCase().endsWith('.m4v');

  const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // Store the binary asset outside Turso so content writes only carry a compact URL.
  try {
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn('[MediaUpload] Anonymous Firebase Auth notice:', authErr);
      }
    }

    const storageFolder = isVideo ? 'videos' : 'images';
    const storageReference = ref(storage, `${storageFolder}/${cleanName}`);
    const uploadTask = uploadBytesResumable(storageReference, file, {
      contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    });

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const rawProgress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress?.(Math.min(99, rawProgress));
          }
        },
        (error) => {
          console.warn('[MediaUpload] Firebase Storage upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(storageReference);
            onProgress?.(100);
            resolve(url);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });
  } catch (fbErr) {
    console.warn('[MediaUpload] Firebase Storage upload failed; trying chunked database media storage:', fbErr);
  }

  // Keep the legacy database-backed fallback for environments where Storage is unavailable.
  if (file.size <= 35 * 1024 * 1024) {
    try {
      console.info('[MediaUpload] Falling back to Firestore Native Chunked Media Storage for', file.name);
      return await uploadMediaToFirestore(file, onProgress);
    } catch (firestoreErr) {
      console.warn('[MediaUpload] Firestore fallback notice:', firestoreErr);
    }
  }

  throw new Error('Unable to upload media to server or cloud storage. Please verify your connection or use YouTube/Vimeo for video embedding.');
}
