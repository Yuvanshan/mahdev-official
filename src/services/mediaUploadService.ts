/**
 * Mahdev Enterprise Media Upload Service
 * Handles uploading large video files (MP4, WebM, OGG, MOV) and high-res images.
 * Streams binary data without converting to large base64 strings, avoiding Firestore document size limits.
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
  const isVideo =
    file.type.startsWith('video/') ||
    file.name.toLowerCase().endsWith('.mp4') ||
    file.name.toLowerCase().endsWith('.webm') ||
    file.name.toLowerCase().endsWith('.ogg') ||
    file.name.toLowerCase().endsWith('.mov') ||
    file.name.toLowerCase().endsWith('.m4v');

  const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

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
    const uploadTask = uploadBytesResumable(storageReference, file, {
      contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
    });

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(progress);
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
  // Splitting media into indexed chunks in Firestore guarantees 100% synchronization across
  // all environments (Vercel, Cloud Run, preview, mobile) without local filesystem 404s.
  try {
    console.info('[MediaUpload] Uploading media directly to Firestore media_blobs...');
    return await uploadMediaToFirestore(file, onProgress);
  } catch (firestoreErr) {
    console.warn('[MediaUpload] Firestore chunked upload notice:', firestoreErr);
  }

  // 4. Secondary fallback: local server API upload if running with local backend
  try {
    return await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload/media', true);

      xhr.setRequestHeader('Content-Type', file.type || (isVideo ? 'video/mp4' : 'application/octet-stream'));
      xhr.setRequestHeader('x-filename', file.name);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress?.(percent);
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
