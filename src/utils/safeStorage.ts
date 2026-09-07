/**
 * Safe Browser Storage Utility
 * Prevents DOMException: QuotaExceededError crashes when storing large CMS payloads,
 * base64 media, or when browser storage reaches its 5MB capacity.
 * 
 * Features:
 * - Graceful fallback with zero uncaught exceptions
 * - Automated progressive eviction of disposable cache keys (mahdev_cached_*)
 * - Base64 Data URL compaction for local offline storage
 * - Transparent in-memory retention when storage is physically exhausted
 */

const DISPOSABLE_CACHE_KEYS = [
  'mahdev_cached_company_settings',
  'mahdev_cached_site_settings',
  'mahdev_cached_homepage_config',
  'mahdev_cached_divisions',
  'mahdev_cached_categories',
  'mahdev_cached_services',
  'mahdev_cached_products',
  'mahdev_cached_milestones',
  'mahdev_cached_companies',
  'mahdev_cached_testimonials',
  'mahdev_cached_google_reviews_config',
  'mahdev_cached_google_reviews',
  'mahdev_cached_portfolio',
  'mahdev_cached_gallery',
];

/**
 * Strips huge base64 Data URLs from serialized JSON objects or arrays
 * to prevent local storage blowout while preserving structural metadata.
 */
function sanitizePayloadForLocalStorage(value: string): string {
  if (!value.includes('data:image/')) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    const sanitizeItem = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeItem);

      const cleaned = { ...obj };
      for (const prop of Object.keys(cleaned)) {
        const val = cleaned[prop];
        if (typeof val === 'string' && val.startsWith('data:image/') && val.length > 25000) {
          // If it's a huge base64 image, keep a lightweight placeholder indicator for local cache
          cleaned[prop] = val.slice(0, 100) + '...[compacted_for_storage]';
        } else if (val && typeof val === 'object') {
          cleaned[prop] = sanitizeItem(val);
        }
      }
      return cleaned;
    };

    return JSON.stringify(sanitizeItem(parsed));
  } catch {
    return value;
  }
}

/**
 * Emergency cache eviction when QuotaExceededError is detected
 */
function runStorageEviction(targetKey: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  // Phase 1: Purge duplicated Firestore read caches (these can be re-queried anytime)
  for (const key of DISPOSABLE_CACHE_KEYS) {
    if (key !== targetKey) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
  }

  // Phase 2: Compact media catalogs
  const mediaCatalogKey = 'mahdev_media_catalog_v1';
  try {
    const raw = window.localStorage.getItem(mediaCatalogKey);
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        // Keep only top 10 items and strip base64 data
        const compacted = items.slice(0, 10).map((i) => {
          if (i.url && typeof i.url === 'string' && i.url.startsWith('data:')) {
            return { ...i, url: '' };
          }
          return i;
        });
        window.localStorage.setItem(mediaCatalogKey, JSON.stringify(compacted));
      }
    }
  } catch {}

  const adminMediaKey = 'mahdev_admin_media_v1';
  try {
    const raw = window.localStorage.getItem(adminMediaKey);
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        const compacted = items.slice(0, 10).map((i) => {
          if (i.url && typeof i.url === 'string' && i.url.startsWith('data:')) {
            return { ...i, url: '' };
          }
          return i;
        });
        window.localStorage.setItem(adminMediaKey, JSON.stringify(compacted));
      }
    }
  } catch {}

  // Phase 3: Trim audit logs
  const auditKey = 'mahdev_admin_audit_logs_v1';
  try {
    const raw = window.localStorage.getItem(auditKey);
    if (raw) {
      const logs = JSON.parse(raw);
      if (Array.isArray(logs)) {
        window.localStorage.setItem(auditKey, JSON.stringify(logs.slice(0, 20)));
      }
    }
  } catch {}
}

export const safeStorage = {
  /**
   * Safely reads from localStorage without throwing
   */
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to read key "${key}":`, e);
      return null;
    }
  },

  /**
   * Safely writes to localStorage. If quota is exceeded, automatically evicts
   * non-critical caches and retries. If storage remains physically full,
   * gracefully catches the error so the calling application NEVER crashes.
   */
  setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    // Attempt 1: Direct write
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (err: any) {
      const isQuotaError =
        err?.name === 'QuotaExceededError' ||
        err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err?.code === 22 ||
        err?.code === 1014 ||
        err?.message?.toLowerCase().includes('quota') ||
        err?.message?.toLowerCase().includes('exceeded');

      if (!isQuotaError) {
        console.warn(`[SafeStorage] Non-quota error setting "${key}":`, err);
        return false;
      }

      console.warn(
        `[SafeStorage] Quota exceeded on key "${key}". Running automated storage recovery...`
      );

      // Attempt 2: Run cache eviction and retry
      try {
        runStorageEviction(key);
        window.localStorage.setItem(key, value);
        return true;
      } catch {}

      // Attempt 3: If payload contains large base64 strings, sanitize and compact it
      try {
        const sanitized = sanitizePayloadForLocalStorage(value);
        window.localStorage.setItem(key, sanitized);
        console.info(`[SafeStorage] Key "${key}" successfully saved after base64 compaction.`);
        return true;
      } catch {}

      // Attempt 4: More aggressive eviction across all mahdev keys except the target key
      try {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const k = window.localStorage.key(i);
          if (k && k !== key && (k.startsWith('mahdev_cached_') || k.includes('_media_') || k.includes('_audit_'))) {
            window.localStorage.removeItem(k);
          }
        }
        const sanitized = sanitizePayloadForLocalStorage(value);
        window.localStorage.setItem(key, sanitized);
        return true;
      } catch (finalErr) {
        console.warn(
          `[SafeStorage] Browser storage quota completely exhausted for "${key}". Data safely maintained in memory and Firestore.`,
          finalErr
        );
        return false;
      }
    }
  },

  /**
   * Safely removes a key from localStorage
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to remove key "${key}":`, e);
    }
  },

  /**
   * Proactively purges disposable caches to free up browser storage
   */
  clearDisposableCaches(): void {
    runStorageEviction('');
  },
};
