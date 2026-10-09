/**
 * Creates an admin-authorized resumable upload to Firebase Storage.
 */

import { adminService } from './adminService';

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

  if (!adminService.isAuthenticated()) {
    throw new Error('Administrator sign-in is required to upload media.');
  }

  const response = await fetch('/api/upload/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
      size: file.size,
    }),
  });
  const result = await response.json() as {
    success?: boolean;
    uploadUrl?: string;
    downloadUrl?: string;
    storagePath?: string;
    error?: string;
  };
  if (!response.ok || !result.success || !result.uploadUrl || !result.downloadUrl) {
    throw new Error(result.error || `Could not initialize media upload (HTTP ${response.status}).`);
  }

  return new Promise<string>((resolve, reject) => {
    const uploadRequest = new XMLHttpRequest();
    uploadRequest.open('PUT', result.uploadUrl!);
    uploadRequest.setRequestHeader('Content-Type', file.type || (isVideo ? 'video/mp4' : 'image/jpeg'));
    uploadRequest.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    uploadRequest.onerror = () => reject(new Error('Media upload failed due to a network or Firebase Storage CORS error.'));
    uploadRequest.onabort = () => reject(new Error('Media upload was cancelled.'));
    uploadRequest.onload = () => {
      if (uploadRequest.status >= 200 && uploadRequest.status < 300) {
        try {
          onProgress?.(100);
          resolve(result.downloadUrl!);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`Firebase Storage rejected the upload (HTTP ${uploadRequest.status}).`));
      }
    }
    uploadRequest.send(file);
  });
}
