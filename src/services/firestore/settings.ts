/**
 * Firestore Settings Repository (Company & Site Settings)
 * Phase 23 - Real Firestore Data Integration
 */

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirestoreCompanySettings, FirestoreSiteSettings } from '../../types/firestore';
import { COMPANY_INFO } from '../../config/company';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes cache

let cachedCompanySettings: { data: FirestoreCompanySettings; timestamp: number } | null = null;
let cachedSiteSettings: { data: FirestoreSiteSettings; timestamp: number } | null = null;

export function getDefaultCompanySettings(): FirestoreCompanySettings {
  return {
    name: COMPANY_INFO.name,
    legalName: COMPANY_INFO.legalName,
    registrationNumber: COMPANY_INFO.registrationNumber || 'PV-00289410',
    tagline: COMPANY_INFO.tagline,
    description: COMPANY_INFO.description,
    domain: COMPANY_INFO.domain,
    email: COMPANY_INFO.email,
    primaryPhone: COMPANY_INFO.primaryPhone,
    secondaryPhone: COMPANY_INFO.secondaryPhone,
    phones: COMPANY_INFO.phones,
    offices: {
      colombo: {
        name: COMPANY_INFO.offices.colombo.name,
        address: COMPANY_INFO.offices.colombo.address,
        city: COMPANY_INFO.offices.colombo.city,
        country: COMPANY_INFO.offices.colombo.country,
        isHeadquarters: COMPANY_INFO.offices.colombo.isHeadquarters,
        mapQuery: COMPANY_INFO.offices.colombo.mapQuery,
      },
      trincomalee: {
        name: COMPANY_INFO.offices.trincomalee.name,
        address: COMPANY_INFO.offices.trincomalee.address,
        city: COMPANY_INFO.offices.trincomalee.city,
        country: COMPANY_INFO.offices.trincomalee.country,
        isHeadquarters: COMPANY_INFO.offices.trincomalee.isHeadquarters,
        mapQuery: COMPANY_INFO.offices.trincomalee.mapQuery,
      },
    },
    socials: (COMPANY_INFO.socials || {}) as Record<string, string>,
    workingHours: (COMPANY_INFO.workingHours || {}) as Record<string, string>,
    updatedAt: new Date().toISOString(),
  };
}

export function getDefaultSiteSettings(): FirestoreSiteSettings {
  return {
    siteName: 'Mahdev Pvt Ltd',
    maintenanceMode: false,
    announcement: {
      enabled: true,
      text: 'Universal Enterprise Ecosystem Active • Colombo & Trincomalee Hotlines Online',
      link: '/contact',
    },
    currency: 'USD',
    taxRate: 0,
    updatedAt: new Date().toISOString(),
  };
}

export const firestoreSettingsService = {
  /**
   * Fetch company settings with in-memory caching and offline fallback
   */
  async getCompanySettings(forceRefresh = false): Promise<FirestoreCompanySettings> {
    const now = Date.now();
    if (!forceRefresh && cachedCompanySettings && now - cachedCompanySettings.timestamp < CACHE_TTL_MS) {
      return cachedCompanySettings.data;
    }

    try {
      const docRef = doc(db, 'settings', 'company');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as FirestoreCompanySettings;
        cachedCompanySettings = { data, timestamp: now };
        return data;
      }
      // If not present in Firestore yet, auto-seed default
      const defaultSettings = getDefaultCompanySettings();
      await setDoc(docRef, defaultSettings, { merge: true });
      cachedCompanySettings = { data: defaultSettings, timestamp: now };
      return defaultSettings;
    } catch (err) {
      console.warn('[Firestore Settings] getCompanySettings fallback to local defaults:', err);
      return cachedCompanySettings?.data || getDefaultCompanySettings();
    }
  },

  /**
   * Update company settings in Firestore
   */
  async updateCompanySettings(data: Partial<FirestoreCompanySettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'company');
    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    if (cachedCompanySettings) {
      cachedCompanySettings.data = { ...cachedCompanySettings.data, ...payload };
      cachedCompanySettings.timestamp = Date.now();
    }
  },

  /**
   * Realtime listener for live company settings changes
   */
  subscribeCompanySettings(
    onData: (data: FirestoreCompanySettings) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = doc(db, 'settings', 'company');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreCompanySettings;
          cachedCompanySettings = { data, timestamp: Date.now() };
          onData(data);
        } else {
          onData(getDefaultCompanySettings());
        }
      },
      (err) => {
        console.warn('[Firestore Settings] Realtime listener error:', err);
        if (onError) onError(err);
        onData(cachedCompanySettings?.data || getDefaultCompanySettings());
      }
    );
  },

  /**
   * Fetch site settings with caching
   */
  async getSiteSettings(forceRefresh = false): Promise<FirestoreSiteSettings> {
    const now = Date.now();
    if (!forceRefresh && cachedSiteSettings && now - cachedSiteSettings.timestamp < CACHE_TTL_MS) {
      return cachedSiteSettings.data;
    }

    try {
      const docRef = doc(db, 'settings', 'site');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as FirestoreSiteSettings;
        cachedSiteSettings = { data, timestamp: now };
        return data;
      }
      const defaultSite = getDefaultSiteSettings();
      await setDoc(docRef, defaultSite, { merge: true });
      cachedSiteSettings = { data: defaultSite, timestamp: now };
      return defaultSite;
    } catch (err) {
      console.warn('[Firestore Settings] getSiteSettings fallback:', err);
      return cachedSiteSettings?.data || getDefaultSiteSettings();
    }
  },

  /**
   * Update site settings
   */
  async updateSiteSettings(data: Partial<FirestoreSiteSettings>): Promise<void> {
    const docRef = doc(db, 'settings', 'site');
    const payload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    if (cachedSiteSettings) {
      cachedSiteSettings.data = { ...cachedSiteSettings.data, ...payload };
      cachedSiteSettings.timestamp = Date.now();
    }
  },

  /**
   * Realtime listener for site settings & announcements
   */
  subscribeSiteSettings(
    onData: (data: FirestoreSiteSettings) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = doc(db, 'settings', 'site');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreSiteSettings;
          cachedSiteSettings = { data, timestamp: Date.now() };
          onData(data);
        } else {
          onData(getDefaultSiteSettings());
        }
      },
      (err) => {
        console.warn('[Firestore Settings] Site settings listener error:', err);
        if (onError) onError(err);
        onData(cachedSiteSettings?.data || getDefaultSiteSettings());
      }
    );
  },
};
