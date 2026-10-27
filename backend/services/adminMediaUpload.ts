import { randomUUID } from 'node:crypto';
import https from 'node:https';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const ADMIN_MEDIA_CHUNK_BYTES = 3 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-matroska',
]);
const RESUMABLE_ALIGNMENT_BYTES = 256 * 1024;

function parseServiceAccount(value: string): Record<string, unknown> {
  const raw = value.trim();
  let serviceAccount: unknown;

  try {
    serviceAccount = JSON.parse(raw);
  } catch {
    const escapedPrivateKey = raw.replace(
      /("private_key"\s*:\s*")([\s\S]*?)("\s*[,}])/,
      (_match, prefix: string, privateKey: string, suffix: string) =>
        `${prefix}${privateKey.replace(/\r?\n/g, '\\n')}${suffix}`
    );
    try {
      serviceAccount = JSON.parse(escapedPrivateKey);
    } catch {
      console.error('[AdminMediaUpload] FIREBASE_SERVICE_ACCOUNT_JSON is not a valid service-account JSON document.');
      throw new Error('Server Firebase service account configuration is invalid. Provide the complete service-account JSON.');
    }
  }

  if (!serviceAccount || typeof serviceAccount !== 'object' || Array.isArray(serviceAccount)) {
    throw new Error('Server Firebase service account configuration must be a JSON object.');
  }

  const account = serviceAccount as Record<string, unknown>;
  if (
    typeof account.project_id !== 'string' ||
    !account.project_id.trim() ||
    typeof account.client_email !== 'string' ||
    !account.client_email.trim() ||
    typeof account.private_key !== 'string' ||
    !account.private_key.includes('PRIVATE KEY')
  ) {
    throw new Error('Server Firebase service account JSON must include project_id, client_email, and private_key.');
  }

  account.private_key = account.private_key.replace(/\\n/g, '\n');
  return account;
}

function storageBucketName(): string {
  return process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'for-her-33ea9.firebasestorage.app';
}

/** The server's firebase-admin app (storage and auth), initialised once from FIREBASE_SERVICE_ACCOUNT_JSON. */
export function getFirebaseAdminApp() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!getApps().length) {
    if (serviceAccountJson) {
      const serviceAccount = parseServiceAccount(serviceAccountJson);
      initializeApp({ credential: cert(serviceAccount), storageBucket: storageBucketName() });
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('Server Firebase storage is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.');
    } else {
      initializeApp({ storageBucket: storageBucketName() });
    }
  }

  return getApp();
}

function getStorageBucket() {
  return getStorage(getFirebaseAdminApp()).bucket(storageBucketName());
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

export async function forwardAdminMediaUploadChunk(input: {
  uploadUrl: unknown;
  contentRange: unknown;
  contentType: unknown;
  body: Buffer;
}): Promise<{ receivedBytes: number; complete: boolean }> {
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'for-her-33ea9.firebasestorage.app';
  const uploadUrl = typeof input.uploadUrl === 'string' ? input.uploadUrl : '';
  const contentRange = typeof input.contentRange === 'string' ? input.contentRange : '';
  const contentType = typeof input.contentType === 'string' ? input.contentType : '';
  const rangeMatch = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(contentRange);

  if (!uploadUrl || !rangeMatch) {
    throw new Error('Invalid resumable upload session or byte range.');
  }

  const parsedUrl = new URL(uploadUrl);
  const expectedPath = `/upload/storage/v1/b/${bucketName}/o`;
  const objectName = parsedUrl.searchParams.get('name') || '';
  if (
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.hostname !== 'storage.googleapis.com' ||
    parsedUrl.port !== '' ||
    parsedUrl.username !== '' ||
    parsedUrl.password !== '' ||
    parsedUrl.hash !== '' ||
    parsedUrl.pathname !== expectedPath ||
    !parsedUrl.searchParams.get('upload_id') ||
    parsedUrl.searchParams.get('uploadType') !== 'resumable' ||
    (!objectName.startsWith('images/') && !objectName.startsWith('videos/'))
  ) {
    throw new Error('Invalid Firebase Storage upload session.');
  }

  const start = Number(rangeMatch[1]);
  const end = Number(rangeMatch[2]);
  const total = Number(rangeMatch[3]);
  const expectedChunkSize = end - start + 1;
  const isVideo = contentType.startsWith('video/');
  const maxTotalBytes = (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES);
  if (
    !ALLOWED_TYPES.has(contentType) ||
    isVideo !== objectName.startsWith('videos/') ||
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    !Number.isSafeInteger(total) ||
    start < 0 ||
    end < start ||
    total <= end ||
    total > maxTotalBytes ||
    expectedChunkSize > ADMIN_MEDIA_CHUNK_BYTES ||
    start % RESUMABLE_ALIGNMENT_BYTES !== 0 ||
    (end + 1 < total && expectedChunkSize % RESUMABLE_ALIGNMENT_BYTES !== 0) ||
    input.body.length !== expectedChunkSize
  ) {
    throw new Error('Invalid media upload chunk size or byte range.');
  }

  return new Promise((resolve, reject) => {
    const request = https.request(parsedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(input.body.length),
        'Content-Range': contentRange,
      },
    }, (response) => {
      const responseChunks: Buffer[] = [];
      let responseBytes = 0;
      response.on('data', (chunk: Buffer | string) => {
        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        responseBytes += data.length;
        if (responseBytes <= 64 * 1024) responseChunks.push(data);
      });
      response.on('end', () => {
        const status = response.statusCode || 0;
        if (status === 308) {
          const acknowledgedRange = response.headers.range;
          const acknowledgedMatch = typeof acknowledgedRange === 'string'
            ? /^bytes=0-(\d+)$/.exec(acknowledgedRange)
            : null;
          const receivedBytes = acknowledgedMatch ? Number(acknowledgedMatch[1]) + 1 : 0;
          if (!Number.isSafeInteger(receivedBytes) || receivedBytes < end + 1) {
            reject(new Error('Firebase Storage did not acknowledge the uploaded chunk.'));
            return;
          }
          resolve({ receivedBytes, complete: false });
          return;
        }
        if (status === 200 || status === 201) {
          resolve({ receivedBytes: total, complete: true });
          return;
        }

        const responseBody = Buffer.concat(responseChunks).toString('utf8');
        console.error('[AdminMediaUpload] Firebase Storage rejected a chunk:', status, responseBody);
        reject(new Error(`Firebase Storage rejected the upload chunk (HTTP ${status}).`));
      });
    });

    request.on('error', (error) => {
      console.error('[AdminMediaUpload] Could not forward upload chunk to Firebase Storage:', error);
      reject(new Error('Server could not forward the media chunk to Firebase Storage.'));
    });
    request.end(input.body);
  });
}

export async function storeCareerCv(input: {
  filename: string;
  contentType: string;
  body: Buffer;
}): Promise<string> {
  const extension = input.filename.split('.').pop()?.toLowerCase() || '';
  const maxBytes = 10 * 1024 * 1024;
  if (
    extension !== 'pdf' ||
    !['application/pdf', 'application/octet-stream'].includes(input.contentType.toLowerCase()) ||
    input.body.length < 8 ||
    input.body.length > maxBytes
  ) {
    throw new Error('Upload a PDF CV no larger than 10 MB.');
  }

  const isPdf = input.body.subarray(0, 5).toString('ascii') === '%PDF-';
  if (!isPdf) {
    throw new Error('The uploaded CV must be a valid PDF file.');
  }

  const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || `cv.${extension}`;
  const storagePath = `career-cvs/${randomUUID()}_${safeFilename}`;
  await getStorageBucket().file(storagePath).save(input.body, {
    resumable: false,
    metadata: {
      contentType: 'application/pdf',
      cacheControl: 'private, no-store',
      contentDisposition: 'attachment',
    },
  });
  return storagePath;
}

export async function readCareerCv(storagePath: string): Promise<{
  body: Buffer;
  contentType: string;
}> {
  if (!/^career-cvs\/[0-9a-f-]{36}_[a-zA-Z0-9._-]{1,100}$/.test(storagePath)) {
    throw new Error('Invalid CV storage reference.');
  }
  const [body] = await getStorageBucket().file(storagePath).download();
  const extension = storagePath.split('.').pop()?.toLowerCase();
  const contentType = extension === 'pdf'
    ? 'application/pdf'
    : extension === 'doc'
      ? 'application/msword'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return { body, contentType };
}

export async function deleteCareerCv(storagePath: string): Promise<void> {
  if (!/^career-cvs\/[0-9a-f-]{36}_[a-zA-Z0-9._-]{1,100}\.pdf$/i.test(storagePath)) {
    throw new Error('Invalid CV storage reference.');
  }
  await getStorageBucket().file(storagePath).delete({ ignoreNotFound: true });
}
