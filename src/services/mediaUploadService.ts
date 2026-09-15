/**
 * Mahdev Enterprise Media Upload Service
 * Handles uploading large video files (MP4, WebM, OGG, MOV) and high-res images.
 * Uses direct binary streaming via HTTP to prevent memory exhaustion and browser crashes ("Aw, Snap!").
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

  // PRIORITY 1: Direct Server-Side High-Speed Binary Streaming (/api/upload/media)
  // Streams the raw binary payload directly over HTTP without decoding frames or converting to Base64.
  // This guarantees ZERO browser memory spikes and prevents Chromium "Aw, Snap!" renderer crashes.
  try {
    const serverUrl = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload/media', true);

      xhr.setRequestHeader(
        'Content-Type',
        file.type || (isVideo ? 'video/mp4' : 'application/octet-stream')
      );
      xhr.setRequestHeader('x-filename', cleanName);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const rawPercent = Math.round((event.loaded / event.total) * 100);
          onProgress?.(Math.min(99, rawPercent));
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
          reject(new Error(`Server upload returned status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error connecting to /api/upload/media'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload request timed out after 5 minutes'));
      };

      // 5-minute timeout for large video uploads
      xhr.timeout = 300000;

      xhr.send(file);
    });

    return serverUrl;
  } catch (serverErr) {
    console.warn('[MediaUpload] Server direct upload failed, attempting cloud storage fallback:', serverErr);
  }

  // PRIORITY 2: Firebase Storage Fallback (direct cloud bucket upload)
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
    console.warn('[MediaUpload] Cloud Storage fallback notice:', fbErr);
  }

  // PRIORITY 3: Only for small images (< 800KB), fallback to Firestore chunked storage.
  // NEVER chunk large video files into Firestore to prevent quota exhaustion and memory leaks.
  if (!isVideo && file.size < 800 * 1024) {
    try {
      return await uploadMediaToFirestore(file, onProgress);
    } catch (firestoreErr) {
      console.warn('[MediaUpload] Firestore fallback notice:', firestoreErr);
    }
  }

  throw new Error('Unable to upload media to server or cloud storage. Please verify your connection or use YouTube/Vimeo for video embedding.');
}

