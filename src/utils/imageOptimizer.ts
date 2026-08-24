/**
 * Client-Side Media Validator & Optimizer (Phase 26)
 * Supports browser-native canvas resizing, format conversion (WebP/JPEG),
 * and byte-size compression before storage upload.
 */

import { StorageOptimizationOptions } from '../types/storage';

export const DEFAULT_ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/gif',
];

export const DEFAULT_ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates SVG content to ensure XML validity and detect malicious embedded scripts / event handlers.
 */
export async function validateSvgSecurity(file: File): Promise<ValidationResult> {
  if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
    return { valid: true };
  }

  try {
    const text = await file.text();
    
    // Check basic length
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'SVG file is empty.' };
    }

    // Check for dangerous script tags or inline handlers
    const lower = text.toLowerCase();
    const dangerousPatterns = [
      /<script[\s>]/i,
      /<\/script>/i,
      /javascript:/i,
      /data:\s*text\/html/i,
      /\bon\w+\s*=/i, // onload=, onerror=, onclick=, etc.
      /<iframe[\s>]/i,
      /<object[\s>]/i,
      /<embed[\s>]/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(lower)) {
        return {
          valid: false,
          error: 'Security validation failed: SVG contains disallowed script elements or executable event attributes.',
        };
      }
    }

    // Verify XML syntax parseability
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        valid: false,
        error: 'Invalid SVG structure: XML syntax error detected in SVG file.',
      };
    }

    const rootTag = doc.documentElement?.nodeName?.toLowerCase();
    if (rootTag !== 'svg') {
      return {
        valid: false,
        error: 'Invalid SVG file: root element is not an <svg> tag.',
      };
    }

    return { valid: true };
  } catch (err: any) {
    return {
      valid: false,
      error: `Failed to validate SVG: ${err?.message || 'Unknown XML parse error.'}`,
    };
  }
}

/**
 * Validates file type and size constraints
 */
export function validateFile(
  file: File,
  options?: StorageOptimizationOptions,
  isDocument = false
): ValidationResult {
  const maxSize = options?.maxSizeBytes || (isDocument ? 15 * 1024 * 1024 : 5 * 1024 * 1024); // 5MB for images, 15MB for docs
  const allowedTypes = options?.allowedMimeTypes || (isDocument ? [...DEFAULT_ALLOWED_DOC_TYPES, ...DEFAULT_ALLOWED_IMAGE_TYPES] : DEFAULT_ALLOWED_IMAGE_TYPES);

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds maximum allowed limit of ${maxSizeMB} MB (file is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  // Handle extension matching for icon files where MIME might be empty or generic application/octet-stream
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isIco = ext === 'ico';
  const isSvg = ext === 'svg';

  const typeMatches =
    allowedTypes.includes(file.type) ||
    (isIco && allowedTypes.some((t) => t.includes('icon') || t.includes('ico'))) ||
    (isSvg && allowedTypes.includes('image/svg+xml'));

  if (!typeMatches && file.type) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Allowed formats: ${allowedTypes.map((t) => t.split('/')[1] || t).join(', ')}.`,
    };
  }

  return { valid: true };
}

/**
 * Reads an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(new Error('Failed to decode image data: ' + err));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(new Error('Failed to read file: ' + err));
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an image file: resizes, converts format to modern WebP (or JPEG fallback),
 * and compresses quality to optimize bandwidth and storage costs.
 */
export async function optimizeImage(
  file: File,
  options?: StorageOptimizationOptions
): Promise<{
  optimizedFile: File;
  originalSize: number;
  optimizedSize: number;
  dimensions: { width: number; height: number };
}> {
  const originalSize = file.size;

  // If SVG or GIF or not an image, pass through without bitmap manipulation
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || !file.type.startsWith('image/')) {
    return {
      optimizedFile: file,
      originalSize,
      optimizedSize: originalSize,
      dimensions: { width: 0, height: 0 },
    };
  }

  const maxWidth = options?.maxWidth || 1920;
  const maxHeight = options?.maxHeight || 1920;
  const quality = options?.quality ?? 0.85;
  const targetFormat = options?.targetFormat || 'image/webp';

  try {
    const img = await loadImage(file);
    let { width, height } = img;

    // Calculate aspect-ratio preserving downscaled dimensions
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return {
        optimizedFile: file,
        originalSize,
        optimizedSize: originalSize,
        dimensions: { width: img.width, height: img.height },
      };
    }

    // High quality canvas rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Export to Blob with compression
    const mimeType = targetFormat === 'original' ? file.type : targetFormat;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeType, quality);
    });

    if (!blob) {
      return {
        optimizedFile: file,
        originalSize,
        optimizedSize: originalSize,
        dimensions: { width, height },
      };
    }

    // Generate output file extension matching mimeType
    const ext = mimeType === 'image/webp' ? '.webp' : mimeType === 'image/png' ? '.png' : '.jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${baseName}${ext}`;

    const optimizedFile = new File([blob], newFileName, {
      type: mimeType,
      lastModified: Date.now(),
    });

    return {
      optimizedFile,
      originalSize,
      optimizedSize: optimizedFile.size,
      dimensions: { width, height },
    };
  } catch (err) {
    console.warn('[ImageOptimizer] Optimization failed, using original file:', err);
    return {
      optimizedFile: file,
      originalSize,
      optimizedSize: originalSize,
      dimensions: { width: 0, height: 0 },
    };
  }
}

/**
 * Format bytes to readable string (e.g., 2.4 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
