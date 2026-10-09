import { randomUUID } from 'node:crypto';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-matroska',
]);

function getStorageBucket() {
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'for-her-33ea9.firebasestorage.app';
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!getApps().length) {
    if (serviceAccountJson) {
      let serviceAccount: Record<string, unknown>;
      try {
        serviceAccount = JSON.parse(serviceAccountJson) as Record<string, unknown>;
      } catch (error) {
        console.error('[AdminMediaUpload] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', error);
        throw new Error('Server Firebase service account configuration is invalid.');
      }
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({ credential: cert(serviceAccount), storageBucket: bucketName });
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('Server Firebase storage is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.');
    } else {
      initializeApp({ storageBucket: bucketName });
    }
  }

  return getStorage(getApp()).bucket(bucketName);
}

export async function createAdminMediaUpload(input: {
  filename: unknown;
  contentType: unknown;
  size: unknown;
}): Promise<{ uploadUrl: string; downloadUrl: string; storagePath: string }> {
  const contentType = typeof input.contentType === 'string' ? input.contentType.toLowerCase() : '';
  const filename = typeof input.filename === 'string' ? input.filename : '';
  const size = typeof input.size === 'number' ? input.size : Number.NaN;
  const isVideo = contentType.startsWith('video/');

  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error('Unsupported media type. Upload a supported image or video file.');
  }
  if (!Number.isSafeInteger(size) || size <= 0 || size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
    throw new Error(`Media size must be between 1 byte and ${isVideo ? '100 MB' : '50 MB'}.`);
  }

  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'media';
  const storagePath = `${isVideo ? 'videos' : 'images'}/${Date.now()}_${randomUUID()}_${safeFilename}`;
  const downloadToken = randomUUID();
  const bucket = getStorageBucket();

  const [uploadUrl] = await bucket.file(storagePath).createResumableUpload({
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
      metadata: { firebaseStorageDownloadTokens: downloadToken },
    },
  });

  const downloadUrl =
    `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}` +
    `/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;
  return { uploadUrl, downloadUrl, storagePath };
}
