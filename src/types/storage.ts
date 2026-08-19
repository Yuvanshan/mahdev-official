/**
 * Mahdev Enterprise Firebase Storage Types (Phase 26)
 */

export type StorageCategory =
  | 'company'
  | 'divisions'
  | 'services'
  | 'products'
  | 'portfolio'
  | 'gallery'
  | 'testimonials'
  | 'users'
  | 'documents'
  | 'invoices';

export interface StorageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.85)
  targetFormat?: 'image/webp' | 'image/jpeg' | 'image/png' | 'original';
  maxSizeBytes?: number; // default 5MB (5 * 1024 * 1024)
  allowedMimeTypes?: string[];
  customFilename?: string;
  onProgress?: (progressPercentage: number) => void;
}

export interface UploadedMediaItem {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  category: StorageCategory;
  sizeBytes: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadedAt: string;
  uploadedBy?: string;
  userRole?: string;
  tags?: string[];
}

export interface UploadResult {
  success: boolean;
  item?: UploadedMediaItem;
  url?: string;
  storagePath?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}
