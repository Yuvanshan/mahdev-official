/**
 * Uploads media to Firebase Storage and returns a compact URL for database records.
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { auth, storage } from '../lib/firebase';

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

  const isVideo =
    file.type.startsWith('video/') ||
    file.name.toLowerCase().endsWith('.mp4') ||
    file.name.toLowerCase().endsWith('.webm') ||
    file.name.toLowerCase().endsWith('.ogg') ||
    file.name.toLowerCase().endsWith('.mov') ||
    file.name.toLowerCase().endsWith('.m4v');
  const MAX_FILE_SIZE_BYTES = (isVideo ? 100 : 50) * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${isVideo ? '100' : '50'} MB ${isVideo ? 'video' : 'image'} limit.`
    );
  }

  const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const storageFolder = isVideo ? 'videos' : 'images';
  const storageReference = ref(storage, `${storageFolder}/${cleanName}`);
  const uploadTask = uploadBytesResumable(storageReference, file, {
    contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
  });

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const rawProgress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(Math.min(99, rawProgress));
        }
      },
      reject,
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
  }).catch((error: unknown) => {
    console.error('[MediaUpload] Firebase Storage upload failed:', error);
    if (error instanceof Error) {
      throw new Error(`Firebase Storage upload failed: ${error.message}`);
    }
    throw new Error('Firebase Storage upload failed. Check your connection and storage permissions.');
  });
}
