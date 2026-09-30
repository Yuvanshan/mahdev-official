import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Eye,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { StorageCategory, StorageOptimizationOptions, UploadedMediaItem } from '../../types/storage';
import { storageService } from '../../services/storageService';
import { formatBytes } from '../../utils/imageOptimizer';
import { Button } from '../ui/Button';

interface ImageUploaderProps {
  category: StorageCategory;
  subfolder?: string;
  targetUserId?: string;
  currentImageUrl?: string;
  currentStoragePath?: string;
  onUploadSuccess: (item: UploadedMediaItem) => void;
  onDelete?: () => void;
  options?: StorageOptimizationOptions;
  label?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  category,
  subfolder,
  targetUserId,
  currentImageUrl,
  currentStoragePath,
  onUploadSuccess,
  onDelete,
  options,
  label = 'Upload Media',
  helperText = 'Supports WebP, JPEG, PNG up to 8MB. Auto-optimized for web.',
  className = '',
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [latestItem, setLatestItem] = useState<UploadedMediaItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setStatusMessage('Optimizing & compressing image...');
    setIsUploading(true);
    setUploadProgress(10);

    const uploadOptions: StorageOptimizationOptions = {
      ...options,
      onProgress: (p) => {
        setUploadProgress(Math.max(10, p));
      },
    };

    const result = await storageService.uploadFile(
      file,
      category,
      subfolder,
      uploadOptions,
      targetUserId
    );

    setIsUploading(false);

    if (result.success && result.item) {
      setPreviewUrl(result.item.url);
      setLatestItem(result.item);
      setStatusMessage('Upload complete!');
      setTimeout(() => setStatusMessage(null), 3000);
      onUploadSuccess(result.item);
    } else {
      setErrorMessage(result.error || 'Failed to upload media.');
      setStatusMessage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDelete = async () => {
    if (currentStoragePath || latestItem?.storagePath) {
      const pathToDelete = latestItem?.storagePath || currentStoragePath || '';
      setIsUploading(true);
      setStatusMessage('Deleting asset...');
      await storageService.deleteFile(pathToDelete);
      setIsUploading(false);
    }

    setPreviewUrl(null);
    setLatestItem(null);
    setStatusMessage(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onDelete?.();
  };

  const triggerSelect = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 tracking-wide">
            {label}
          </label>
          <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
            {category}
          </span>
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Active Preview Box */}
      {previewUrl ? (
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300">
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 shadow-xs group">
              <img
                src={previewUrl}
                alt="Uploaded media preview"
                className="w-full h-full object-cover"
                
              />
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                title="View Full Resolution"
              >
                <Eye className="w-5 h-5" />
              </a>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">Optimized Media Active</span>
              </div>

              {latestItem && (
                <div className="text-[11px] text-slate-500 space-y-0.5 font-mono">
                  <div className="truncate font-sans font-medium text-slate-700">
                    {latestItem.name}
                  </div>
                  <div>Size: {formatBytes(latestItem.sizeBytes)}</div>
                  {latestItem.dimensions && latestItem.dimensions.width > 0 && (
                    <div>Dimensions: {latestItem.dimensions.width} × {latestItem.dimensions.height}px</div>
                  )}
                </div>
              )}

              <div className="pt-1 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerSelect}
                  disabled={disabled || isUploading}
                  className="text-xs h-8"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isUploading ? 'animate-spin' : ''}`} />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={disabled || isUploading}
                  className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {statusMessage && (
            <div className="mt-3 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {statusMessage}
            </div>
          )}
        </div>
      ) : (
        /* Empty / Dropzone State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerSelect}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="space-y-3 py-2">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  {statusMessage || 'Processing upload...'}
                </p>
                <div className="w-48 bg-slate-200 h-1.5 rounded-full mx-auto overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 hover:underline">
                  Click to upload
                </span>
                <span className="text-xs text-slate-500"> or drag and drop image</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {helperText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message display */}
      {errorMessage && (
        <div className="text-xs font-medium text-rose-600 bg-rose-50 p-3 rounded-xl flex items-start gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
