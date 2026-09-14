/**
 * Mahdev Enterprise Media Upload Service
 * Handles uploading large video files (MP4, WebM, OGG, MOV) and high-res images.
 * Streams binary data without converting to large base64 strings, avoiding Firestore document size limits.
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signInAnonymously } from 'firebase/auth';
import { auth, storage } from '../lib/firebase';
import { uploadMediaToFirestore } from './firestoreMediaService';
import { compressVideoFile } from './videoCompressionService';

export interface UploadMediaProgressCallback {
  (percent: number): void;
}

export async function uploadMediaAsset(
  file: File,
  onProgress?: UploadMediaProgressCallback
): Promise<string> {
  const isVideo =
    file.type.startsWith('video/') ||
    file.name.toLowerCase().endsWith('.mp4') ||
    file.name.toLowerCase().endsWith('.webm') ||
    file.name.toLowerCase().endsWith('.ogg') ||
    file.name.toLowerCase().endsWith('.mov') ||
    file.name.toLowerCase().endsWith('.m4v');

  // Compress video client-side before upload to reduce size while preserving quality
  let fileToUpload = file;
  if (isVideo) {
    try {
      fileToUpload = await compressVideoFile(file, {
        onProgress: (pct) => {
          // Reserve 0-30% for compression stage
          onProgress?.(Math.round(pct * 0.3));
        },
      });
    } catch (compErr) {
      console.warn('[MediaUpload] Video compression notice, using original file:', compErr);
      fileToUpload = file;
    }
  }

  const cleanName = `${Date.now()}_${fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // 1. Ensure Firebase Auth session is active (sign in anonymously if not yet signed in)
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (authErr) {
      console.warn('[MediaUpload] Anonymous Firebase Auth sign-in notice:', authErr);
    }
  }

  // 2. Attempt direct upload to Firebase Storage (works seamlessly on Vercel, Cloud Run, and locally)
  try {
    const storageFolder = isVideo ? 'videos' : 'images';
    const storageReference = ref(storage, `${storageFolder}/${cleanName}`);
    const uploadTask = uploadBytesResumable(storageReference, fileToUpload, {
      contentType: fileToUpload.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    });

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const rawProgress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          const scaledProgress = isVideo ? Math.min(99, 30 + Math.round(rawProgress * 0.7)) : rawProgress;
          onProgress?.(scaledProgress);
        },
        (error) => {
          console.warn('[MediaUpload] Firebase Storage upload failed, attempting fallback:', error);
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
    console.info('[MediaUpload] Firebase Storage not active, routing to Firestore Cloud Media Chunks:', fbErr);
  }

  // 3. Direct cloud persistence into Firestore media_blobs collection
  try {
    console.info('[MediaUpload] Uploading media directly to Firestore media_blobs...');
    return await uploadMediaToFirestore(fileToUpload, (pct) => {
      const scaledProgress = isVideo ? Math.min(99, 30 + Math.round(pct * 0.7)) : pct;
      onProgress?.(scaledProgress);
    });
  } catch (firestoreErr) {
    console.warn('[MediaUpload] Firestore chunked upload notice:', firestoreErr);
  }

  // 4. Secondary fallback: local server API upload if running with local backend
  try {
    return await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload/media', true);

      xhr.setRequestHeader('Content-Type', fileToUpload.type || (isVideo ? 'video/mp4' : 'application/octet-stream'));
      xhr.setRequestHeader('x-filename', fileToUpload.name);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const rawPercent = Math.round((event.loaded / event.total) * 100);
          const scaledProgress = isVideo ? Math.min(99, 30 + Math.round(rawPercent * 0.7)) : rawPercent;
          onProgress?.(scaledProgress);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.url) {
              onProgress?.(100);
              resolve(response.url);
            } else {
              reject(new Error(response.error || 'Server did not return a valid asset URL.'));
            }
          } catch {
            reject(new Error('Invalid server response format during media upload.'));
          }
        } else {
          reject(new Error(`Upload failed with server status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during media upload fallback.'));
      };

      xhr.send(file);
    });
  } catch (backendErr: any) {
    throw new Error('Unable to upload media to cloud storage or server. Please check network connection.');
  }
}
