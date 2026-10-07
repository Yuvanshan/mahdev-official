/**
 * Safe, tab-scoped storage for database-backed read caches.
 * 
 * Features:
 * - Graceful fallback with zero uncaught exceptions
 * - Automated progressive eviction of disposable cache keys (mahdev_cached_*)
 * - Base64 Data URL compaction for large cache entries
 * - Cache data is cleared when its browser tab closes
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
function sanitizePayloadForSessionStorage(value: string): string {
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
          // Keep large inline images out of the session cache.
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

function clearLegacyPersistentAppData(): void {
  if (typeof window === 'undefined') return;
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index--) {
      const key = window.localStorage.key(index);
      if (key?.startsWith('mahdev_')) window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('[SafeStorage] Could not clear legacy persistent app data:', error);
  }

  try {
    for (const key of [
      'mahdev_cms_seo_configs_v1',
      'mahdev_welcome_animation_shown',
      'mahdev_media_catalog_v1',
    ]) {
      window.sessionStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('[SafeStorage] Could not clear legacy browser-only state:', error);
  }

  try {
    const request = window.indexedDB?.deleteDatabase('mahdev_media_vault_v1');
    if (request) {
      request.onerror = () => console.error('[SafeStorage] Could not remove the legacy media cache:', request.error);
      request.onblocked = () => console.warn('[SafeStorage] Legacy media-cache deletion is blocked by another page.');
    }
  } catch (error) {
    console.error('[SafeStorage] Could not remove the legacy media cache:', error);
  }
}

clearLegacyPersistentAppData();

/**
 * Emergency cache eviction when QuotaExceededError is detected
 */
function runStorageEviction(targetKey: string): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;

  // Phase 1: Purge duplicated Firestore read caches (these can be re-queried anytime)
  for (const key of DISPOSABLE_CACHE_KEYS) {
    if (key !== targetKey) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {}
    }
  }

  // Phase 2: Compact media catalogs
  const mediaCatalogKey = 'mahdev_media_catalog_v1';
  try {
    const raw = window.sessionStorage.getItem(mediaCatalogKey);
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
        window.sessionStorage.setItem(mediaCatalogKey, JSON.stringify(compacted));
      }
    }
  } catch {}

  const adminMediaKey = 'mahdev_admin_media_v1';
  try {
    const raw = window.sessionStorage.getItem(adminMediaKey);
    if (raw) {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        const compacted = items.slice(0, 10).map((i) => {
          if (i.url && typeof i.url === 'string' && i.url.startsWith('data:')) {
            return { ...i, url: '' };
          }
          return i;
        });
        window.sessionStorage.setItem(adminMediaKey, JSON.stringify(compacted));
      }
    }
  } catch {}

  // Phase 3: Trim audit logs
  const auditKey = 'mahdev_admin_audit_logs_v1';
  try {
    const raw = window.sessionStorage.getItem(auditKey);
    if (raw) {
      const logs = JSON.parse(raw);
      if (Array.isArray(logs)) {
        window.sessionStorage.setItem(auditKey, JSON.stringify(logs.slice(0, 20)));
      }
    }
  } catch {}
}

export const safeStorage = {
  /**
   * Safely reads from sessionStorage without throwing
   */
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to read key "${key}":`, e);
      return null;
    }
  },

  /**
   * Safely writes to sessionStorage. If quota is exceeded, automatically evicts
   * non-critical caches and retries. If storage remains physically full,
   * gracefully catches the error so the calling application NEVER crashes.
   */
  setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;

    // Attempt 1: Direct write
    try {
      window.sessionStorage.setItem(key, value);
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
        window.sessionStorage.setItem(key, value);
        return true;
      } catch {}

      // Attempt 3: If payload contains large base64 strings, sanitize and compact it
      try {
        const sanitized = sanitizePayloadForSessionStorage(value);
        window.sessionStorage.setItem(key, sanitized);
        console.info(`[SafeStorage] Key "${key}" successfully saved after base64 compaction.`);
        return true;
      } catch {}

      // Attempt 4: More aggressive eviction across all mahdev keys except the target key
      try {
        for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
          const k = window.sessionStorage.key(i);
          if (k && k !== key && (k.startsWith('mahdev_cached_') || k.includes('_media_') || k.includes('_audit_'))) {
            window.sessionStorage.removeItem(k);
          }
        }
        const sanitized = sanitizePayloadForSessionStorage(value);
        window.sessionStorage.setItem(key, sanitized);
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
   * Safely removes a key from sessionStorage
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      window.sessionStorage.removeItem(key);
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
