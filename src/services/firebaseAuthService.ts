/**
 * Mahdev Firebase Authentication Foundation (Phase 22)
 * Manages user authentication lifecycle, role synchronization, and user documents.
 */

import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as fbSignOut,
  signInAnonymously,
  Unsubscribe,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firestoreService } from './firestoreService';
import { FirestoreUser, UserRole } from '../types/firestore';

class FirebaseAuthService {
  /**
   * Subscribes to auth state changes and loads or creates user document in Firestore
   */
  onAuthStateChanged(
    callback: (user: FirebaseUser | null, firestoreUser: FirestoreUser | null) => void
  ): Unsubscribe {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let firestoreUser = await firestoreService.getUser(firebaseUser.uid);
        if (!firestoreUser) {
          // Initialize foundational user document
          const initialUser: Partial<FirestoreUser> = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Mahdev Guest',
            email: firebaseUser.email || '',
            phone: firebaseUser.phoneNumber || '',
            photoURL: firebaseUser.photoURL || '',
            role: 'customer',
            status: 'active',
          };
          await firestoreService.setUser(firebaseUser.uid, initialUser);
          firestoreUser = await firestoreService.getUser(firebaseUser.uid);
        }
        callback(firebaseUser, firestoreUser);
      } else {
        callback(null, null);
      }
    });
  }

  /**
   * Anonymous sign-in for guest checkout / fast bookings
   */
  async signInAsGuest(): Promise<FirebaseUser | null> {
    try {
      const cred = await signInAnonymously(auth);
      return cred.user;
    } catch (err) {
      console.warn('[FirebaseAuth] Guest sign-in error:', err);
      return null;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await fbSignOut(auth);
  }

  /**
   * Assign or update user role (admin/manager/staff/customer)
   */
  async updateUserRole(uid: string, role: UserRole): Promise<void> {
    await firestoreService.setUser(uid, { role });
    await firestoreService.logAudit({
      actorName: auth.currentUser?.displayName || 'System Admin',
      action: 'update_user_role',
      resourceType: 'users',
      resourceId: uid,
      details: { newRole: role },
    });
  }

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}

export const firebaseAuthService = new FirebaseAuthService();
