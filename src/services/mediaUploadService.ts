/**
 * Mahdev Enterprise Media Upload Service
 * Handles uploading large video files (MP4, WebM, OGG, MOV) and high-res images.
 * Streams binary data without converting to large base64 strings, avoiding Firestore document size limits.
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../lib/firebase';

export interface UploadMediaProgressCallback {
  (percent: number): void;
}

export async function uploadMediaAsset(
  file: File,
  onProgress?: UploadMediaProgressCallback
): Promise<string> {
  const isVideo =
    file.type.startsWith('video/') ||
    file.name.endsWith('.mp4') ||
    file.name.endsWith('.webm') ||
    file.name.endsWith('.ogg') ||
    file.name.endsWith('.mov');

  const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  // 1. Attempt upload to Firebase Storage if authenticated
  if (auth.currentUser) {
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
            console.warn('[MediaUpload] Firebase Storage upload error, falling back to server backend:', error);
            reject(error);
          },
          async () => {
            const url = await getDownloadURL(storageReference);
            onProgress?.(100);
            resolve(url);
          }
        );
      });
    } catch (fbErr) {
      console.warn('[MediaUpload] Falling back to backend server upload:', fbErr);
    }
  }

  // 2. Direct upload to local Express backend /api/upload/media via XMLHttpRequest for accurate progress
  return new Promise<string>((resolve, reject) => {
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
        } catch (parseErr) {
          reject(new Error('Invalid server response format during media upload.'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error || `Upload failed with status code ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with server status ${xhr.status} ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload. Please check your connection.'));
    };

    xhr.send(file);
  });
}
