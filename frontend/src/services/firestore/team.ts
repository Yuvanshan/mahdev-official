import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';

export interface FirestoreTeamMember {
  id: string;
  name: string;
  role: string;
  division?: string;
  bio?: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  order: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'team';

export const firestoreTeamService = {
  async getTeam(): Promise<FirestoreTeamMember[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreTeamMember))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (err) {
      console.warn(`[FirestoreTeam] Error fetching team members:`, err);
      return [];
    }
  },

  async saveMember(id: string, data: Partial<FirestoreTeamMember>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const sanitized = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  },

  async deleteMember(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  subscribeTeam(callback: (team: FirestoreTeamMember[]) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(
      q,
      (snapshot) => {
        const team = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as FirestoreTeamMember))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(team);
      },
      (err) => {
        console.warn(`[FirestoreTeam] Snapshot listener error:`, err);
      }
    );
  },
};
