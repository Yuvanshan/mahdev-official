// Firebase Storage photos are full-size PNGs (2-3 MB). In production, Vercel Image
// Optimization serves them resized and as WebP instead; the allowed host is in vercel.json.
const FIREBASE_STORAGE_URL = /^https:\/\/firebasestorage\.googleapis\.com\//;

// Must be one of the "sizes" in vercel.json, or Vercel rejects the request.
export type OptimizedImageWidth = 640 | 1080 | 1920;
const DEFAULT_OPTIMIZED_WIDTH: OptimizedImageWidth = 1080;

export function optimizedImageUrl(src: string, width: OptimizedImageWidth = DEFAULT_OPTIMIZED_WIDTH): string {
  if (!import.meta.env.PROD || !FIREBASE_STORAGE_URL.test(src)) return src;
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=72`;
}

/** Each optimised URL comes first and its original right after, so a failed optimisation falls back to the original image. */
export function withOptimizedSources(sources: string[], width: OptimizedImageWidth = DEFAULT_OPTIMIZED_WIDTH): string[] {
  return sources.flatMap((src) => {
    const optimized = optimizedImageUrl(src, width);
    return optimized === src ? [src] : [optimized, src];
  });
}
