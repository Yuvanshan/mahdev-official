/**
 * Firestore Audit Logs Repository (Phase 57 Compliant)
 * System activity and administrative audit trail
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  Unsubscribe,
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreAuditLog } from '../../types/firestore';

export interface AuditLogQueryOptions {
  userId?: string;
  collectionName?: string;
  action?: string;
  limit?: number;
}

export const firestoreAuditLogsService = {
  /**
   * Fetch recent audit logs
   */
  async getAuditLogs(options?: AuditLogQueryOptions): Promise<FirestoreAuditLog[]> {
    try {
      const colRef = collection(db, 'auditLogs');
      const constraints: any[] = [];

      if (options?.userId) {
        constraints.push(where('userId', '==', options.userId));
      }
      if (options?.collectionName) {
        constraints.push(where('collection', '==', options.collectionName));
      }
      if (options?.action) {
        constraints.push(where('action', '==', options.action));
      }

      constraints.push(orderBy('createdAt', 'desc'));
      const maxLimit = options?.limit ? Math.min(options.limit, 100) : 50;
      constraints.push(firestoreLimit(maxLimit));

      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreAuditLog[];
    } catch (err) {
      console.warn('[Firestore AuditLogs] getAuditLogs error:', err);
      return [];
    }
  },

  /**
   * Record an audit log entry
   */
  async logAction(entry: Omit<FirestoreAuditLog, 'id' | 'createdAt'>): Promise<string> {
    const id = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const docRef = doc(db, 'auditLogs', id);
    const now = new Date().toISOString();
    const payload: FirestoreAuditLog = sanitizeForFirestore({
      ...entry,
      id,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      createdAt: now,
    });
    await setDoc(docRef, payload);
    return id;
  },

  /**
   * Realtime audit log stream for super admins
   */
  subscribeAuditLogs(
    onData: (logs: FirestoreAuditLog[]) => void,
    limitCount = 30
  ): Unsubscribe {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );
    return onSnapshot(
      q,
      (snap) => {
        onData(snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreAuditLog[]);
      },
      (err) => {
        console.warn('[Firestore AuditLogs] subscribe error:', err);
        onData([]);
      }
    );
  },
};
