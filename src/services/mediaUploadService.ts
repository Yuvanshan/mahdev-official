/**
 * Uploads media to Firebase Storage through the admin-session-protected API.
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
    credentials: 'same-origin',
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

  const chunkSize = 3 * 1024 * 1024;
  let receivedBytes = 0;
  while (receivedBytes < file.size) {
    const start = receivedBytes;
    const end = Math.min(start + chunkSize, file.size) - 1;
    const chunk = file.slice(start, end + 1);
    const chunkResult = await new Promise<{ receivedBytes: number; complete: boolean }>((resolve, reject) => {
      const uploadRequest = new XMLHttpRequest();
      uploadRequest.open('PUT', '/api/upload/media');
      uploadRequest.withCredentials = true;
      uploadRequest.setRequestHeader('Content-Type', file.type || (isVideo ? 'video/mp4' : 'image/jpeg'));
      uploadRequest.setRequestHeader('Content-Range', `bytes ${start}-${end}/${file.size}`);
      uploadRequest.setRequestHeader('X-Upload-Session', result.uploadUrl!);
      uploadRequest.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const transferred = start + Math.min(event.loaded, event.total);
          onProgress?.(Math.min(99, Math.round((transferred / file.size) * 100)));
        }
      };
      uploadRequest.onerror = () => reject(new Error('Network error while sending a media chunk to the admin upload service.'));
      uploadRequest.onabort = () => reject(new Error('Media upload was cancelled.'));
      uploadRequest.onload = () => {
        let responseBody: { success?: boolean; receivedBytes?: number; complete?: boolean; error?: string };
        try {
          responseBody = JSON.parse(uploadRequest.responseText);
        } catch {
          reject(new Error(`Admin upload service returned an invalid response (HTTP ${uploadRequest.status}).`));
          return;
        }
        if (uploadRequest.status < 200 || uploadRequest.status >= 300 || !responseBody.success) {
          reject(new Error(responseBody.error || `Media chunk upload failed (HTTP ${uploadRequest.status}).`));
          return;
        }
        if (typeof responseBody.receivedBytes !== 'number' || typeof responseBody.complete !== 'boolean') {
          reject(new Error('Admin upload service returned an incomplete chunk acknowledgment.'));
          return;
        }
        resolve({
          receivedBytes: responseBody.receivedBytes,
          complete: responseBody.complete,
        });
      };
      uploadRequest.send(chunk);
    });
    if (chunkResult.receivedBytes <= receivedBytes || chunkResult.receivedBytes > file.size) {
      throw new Error('Firebase Storage returned an invalid upload offset.');
    }
    receivedBytes = chunkResult.receivedBytes;
    if (chunkResult.complete) {
      if (receivedBytes !== file.size) {
        throw new Error('Firebase Storage completed the upload at an unexpected file size.');
      }
      break;
    }
    if (receivedBytes <= end) {
      throw new Error('Firebase Storage did not acknowledge the full uploaded chunk.');
    }
  }

  if (receivedBytes !== file.size) {
    throw new Error('Media upload ended before the full file was received.');
  }
  onProgress?.(100);
  return result.downloadUrl;
}
