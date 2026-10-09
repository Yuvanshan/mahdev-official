import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from '../lib/tursoFirestore';
import { auth, db } from '../lib/firebase';
import {
  CustomerUser,
  LoginCredentials,
  RegisterInput,
  CustomerAddress,
  CustomerPreferences,
  CustomerRole,
} from '../types/customer';
import { FirestoreUser } from '../types/firestore';
import { Order } from '../types/order';
import { Booking } from '../types/booking';

type AuthListener = (user: CustomerUser | null) => void;

class AuthService {
  private currentUser: CustomerUser | null = null;
  private listeners: Set<AuthListener> = new Set();
  private authInitialized = false;

  constructor() {
    this.init();
    this.setupFirebaseListener();
  }

  private init() {
    this.currentUser = null;
  }

  private setupFirebaseListener() {
    try {
      onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        this.authInitialized = true;
        if (firebaseUser) {
          try {
            // Fetch Firestore profile at users/{uid}
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const data = userDocSnap.data() as FirestoreUser;
              const mappedUser: CustomerUser = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                fullName: data.name || firebaseUser.displayName || 'Mahdev Customer',
                email: firebaseUser.email || data.email || '',
                phone: data.phone || '',
                company: (data as any).company || '',
                accountType: 'individual',
                role: (data.role as CustomerRole) || 'customer',
                avatarUrl: firebaseUser.photoURL || data.photoURL || '',
                address: (data as any).address || {
                  street: '',
                  city: 'Colombo',
                  postalCode: '',
                  country: 'Sri Lanka',
                },
                preferences: {
                  currency: (data as any).preferences?.currency || 'LKR',
                  preferredContactMethod: (data as any).preferences?.preferredContactMethod || 'whatsapp',
                  orderNotifications: (data as any).preferences?.orderNotifications ?? true,
                  promotionalUpdates: (data as any).preferences?.promotionalUpdates ?? true,
                  smsAlerts: (data as any).preferences?.smsAlerts ?? true,
                  twoFactorEnabled: (data as any).preferences?.twoFactorEnabled ?? false,
                },
                createdAt: data.createdAt || new Date().toISOString(),
                lastLogin: new Date().toISOString(),
              };

              this.currentUser = mappedUser;
              this.notifyListeners();
            } else {
              // Profile doc doesn't exist yet, provision it now
              const now = new Date().toISOString();
              const newFirestoreProfile: FirestoreUser = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'Mahdev Customer',
                email: firebaseUser.email || '',
                phone: '',
                photoURL: firebaseUser.photoURL || '',
                role: 'customer',
                status: 'active',
                createdAt: now,
                updatedAt: now,
              };

              await setDoc(userDocRef, newFirestoreProfile, { merge: true });

              const mappedUser: CustomerUser = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                fullName: newFirestoreProfile.name,
                email: newFirestoreProfile.email,
                phone: '',
                accountType: 'individual',
                role: 'customer',
                avatarUrl: newFirestoreProfile.photoURL,
                address: {
                  street: '',
                  city: 'Colombo',
                  postalCode: '',
                  country: 'Sri Lanka',
                },
                preferences: {
                  currency: 'USD',
                  preferredContactMethod: 'whatsapp',
                  orderNotifications: true,
                  promotionalUpdates: true,
                  smsAlerts: true,
                  twoFactorEnabled: false,
                },
                createdAt: now,
                lastLogin: now,
              };

              this.currentUser = mappedUser;
              this.notifyListeners();
            }
          } catch (err) {
            console.warn('[Firebase Auth] Firestore profile fetch error:', err);
          }
        }
      });
    } catch (err) {
      console.warn('[Firebase Auth] Listener initialization error:', err);
    }
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.currentUser));
  }

  public getCurrentUser(): CustomerUser | null {
    return this.currentUser;
  }

  /**
   * Firebase Authentication - Login
   */
  public async login(
    credentials: LoginCredentials
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    const emailClean = credentials.email.trim().toLowerCase();
    if (!emailClean) {
      return { success: false, error: 'Email address is required.' };
    }

    try {
      // 1. Primary: Attempt Firebase Authentication with Email & Password
      if (credentials.password) {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            emailClean,
            credentials.password
          );
          const fbUser = userCredential.user;

          // Fetch Firestore user doc
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          let profile = userDocSnap.exists() ? (userDocSnap.data() as FirestoreUser) : null;

          if (!profile) {
            // Create user document if missing
            const now = new Date().toISOString();
            profile = {
              uid: fbUser.uid,
              name: fbUser.displayName || emailClean.split('@')[0],
              email: fbUser.email || emailClean,
              phone: '',
              photoURL: fbUser.photoURL || '',
              role: 'customer',
              status: 'active',
              createdAt: now,
              updatedAt: now,
            };
            await setDoc(userDocRef, profile, { merge: true });
          }

          const customerUser: CustomerUser = {
            id: fbUser.uid,
            uid: fbUser.uid,
            fullName: profile.name || fbUser.displayName || 'Mahdev Customer',
            email: fbUser.email || emailClean,
            phone: profile.phone || '',
            company: '',
            accountType: 'individual',
            role: (profile.role as CustomerRole) || 'customer',
            avatarUrl: fbUser.photoURL || profile.photoURL || '',
            address: {
              street: '',
              city: 'Colombo',
              postalCode: '',
              country: 'Sri Lanka',
            },
            preferences: {
              currency: 'USD',
              preferredContactMethod: 'whatsapp',
              orderNotifications: true,
              promotionalUpdates: true,
              smsAlerts: true,
              twoFactorEnabled: false,
            },
            createdAt: profile.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };

          this.currentUser = customerUser;
          this.notifyListeners();
          return { success: true, user: customerUser };
        } catch (firebaseErr: any) {
          // Check for standard Firebase Auth error codes
          if (
            firebaseErr.code === 'auth/wrong-password' ||
            firebaseErr.code === 'auth/invalid-credential'
          ) {
            return { success: false, error: 'Incorrect password. Please verify your credentials.' };
          }
          if (firebaseErr.code === 'auth/user-not-found') {
            return { success: false, error: 'No account found with this email. Please register.' };
          }
          if (firebaseErr.code === 'auth/invalid-email') {
            return { success: false, error: 'Please enter a valid email address.' };
          }
          if (firebaseErr.code === 'auth/too-many-requests') {
            return { success: false, error: 'Too many attempts. Please try again in a few moments.' };
          }
          console.error('[Firebase Auth] Login failed:', firebaseErr);
          return { success: false, error: firebaseErr.message || 'Firebase sign-in failed.' };
        }
      }
      return { success: false, error: 'Password is required.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  }

  /**
   * Firebase Authentication - Register
   * Creates user in Firebase Auth and profile in Firestore users/{uid}
   */
  public async register(
    input: RegisterInput
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    const emailClean = input.email.trim().toLowerCase();
    const fullNameClean = input.fullName.trim();

    if (!fullNameClean) {
      return { success: false, error: 'Full name is required.' };
    }

    if (!emailClean || !emailClean.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }

    if (input.password.length < 6) {
      return { success: false, error: 'Password must contain at least 6 characters.' };
    }

    if (input.password !== input.confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    try {
      let uid: string;

      // 1. Primary: Create User in Firebase Auth
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          emailClean,
          input.password
        );
        const fbUser = userCredential.user;
        uid = fbUser.uid;

        // Update Firebase Auth profile displayName
        await updateFirebaseProfile(fbUser, { displayName: fullNameClean });
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          return {
            success: false,
            error: 'An account with this email already exists. Please sign in instead.',
          };
        }
        if (authErr.code === 'auth/weak-password') {
          return {
            success: false,
            error: 'Password is too weak. Please use a stronger password.',
          };
        }
        if (authErr.code === 'auth/invalid-email') {
          return {
            success: false,
            error: 'The provided email address is invalid.',
          };
        }
        console.error('[Firebase Auth] Registration failed:', authErr);
        return { success: false, error: authErr.message || 'Firebase registration failed.' };
      }

      // 2. Create Firestore Customer Profile Document at users/{uid}
      const now = new Date().toISOString();
      const firestoreUserProfile: FirestoreUser = {
        uid: uid,
        name: fullNameClean,
        email: emailClean,
        phone: input.phone.trim(),
        role: 'customer', // Security: Strictly locked to customer role on public registration
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'users', uid), firestoreUserProfile, { merge: true });
      } catch (firestoreErr) {
        console.error('[Turso] Customer profile creation failed:', firestoreErr);
        await signOut(auth);
        return {
          success: false,
          error: firestoreErr instanceof Error ? firestoreErr.message : 'Could not save the customer profile.',
        };
      }

      const newCustomerUser: CustomerUser = {
        id: uid,
        uid: uid,
        fullName: fullNameClean,
        email: emailClean,
        phone: input.phone.trim(),
        company: input.company?.trim(),
        accountType: input.accountType || 'individual',
        role: 'customer',
        corporateTier: input.accountType === 'corporate' ? 'Silver' : undefined,
        address: {
          street: '',
          city: 'Colombo',
          postalCode: '',
          country: 'Sri Lanka',
        },
        preferences: {
          currency: 'USD',
          preferredContactMethod: 'whatsapp',
          orderNotifications: true,
          promotionalUpdates: true,
          smsAlerts: true,
          twoFactorEnabled: false,
        },
        createdAt: now,
        lastLogin: now,
      };

      this.currentUser = newCustomerUser;
      this.notifyListeners();

      return { success: true, user: newCustomerUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  }

  /**
   * Firebase Authentication - Logout
   */
  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Firebase Auth] Logout notice:', err);
    }
    this.currentUser = null;
    this.notifyListeners();
  }

  /**
   * Firebase Authentication - Forgot Password / Password Reset Email
   */
  public async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Password reset instructions have been dispatched to ${cleanEmail}. Check your inbox for the secure verification link.`,
      };
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        return {
          success: false,
          error: 'No account found with this email address. Please check your spelling or register.',
          message: '',
        };
      }
      if (err.code === 'auth/invalid-email') {
        return {
          success: false,
          error: 'Please enter a valid email address.',
          message: '',
        };
      }
      console.error('[Firebase Auth] Password reset request failed:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Could not send password reset instructions.',
        message: '',
      };
    }
  }

  public async updateProfile(
    userId: string,
    updates: Partial<CustomerUser>
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    if (!this.currentUser || (this.currentUser.id !== userId && this.currentUser.uid !== userId)) {
      return { success: false, error: 'Customer account not found.' };
    }

    const current = this.currentUser;
    const updated: CustomerUser = {
      ...current,
      ...updates,
      address: {
        ...current.address,
        ...(updates.address || {}),
      },
      preferences: {
        ...current.preferences,
        ...(updates.preferences || {}),
      },
    };

    try {
      const targetUid = current.uid || current.id;
      const userRef = doc(db, 'users', targetUid);
      await setDoc(
        userRef,
        {
          name: updated.fullName,
          phone: updated.phone,
          company: updated.company || '',
          avatarUrl: updated.avatarUrl || '',
          address: updated.address || {},
          preferences: updated.preferences || {},
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      this.currentUser = updated;
      this.notifyListeners();
      return { success: true, user: updated };
    } catch (err) {
      console.error('[Turso] Customer profile update failed:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Could not save customer profile changes.',
      };
    }
  }

  public async getAllCustomers(): Promise<CustomerUser[]> {
    const response = await fetch('/api/admin/customers', { cache: 'no-store' });
    const result = await response.json() as {
      success: boolean;
      customers?: Array<FirestoreUser & Record<string, any> & { id: string }>;
      error?: string;
    };
    if (!response.ok || !result.success || !result.customers) {
      throw new Error(result.error || 'Could not load customers from the database.');
    }

    return result.customers.map((data) => {
      return {
        id: data.id,
        uid: data.uid || data.id,
        fullName: data.name || data.displayName || 'Mahdev Customer',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        accountType: data.accountType || 'individual',
        role: (data.role as CustomerRole) || 'customer',
        avatarUrl: data.photoURL || data.photoUrl || '',
        address: data.address || {
          street: '',
          city: '',
          postalCode: '',
          country: '',
        },
        preferences: data.preferences || {
          currency: 'LKR',
          preferredContactMethod: 'email',
          orderNotifications: true,
          promotionalUpdates: false,
          smsAlerts: false,
          twoFactorEnabled: false,
        },
        createdAt: data.createdAt || '',
        lastLogin: data.lastLogin || data.updatedAt || data.createdAt || '',
      } satisfies CustomerUser;
    });
  }

  // ==========================================
  // SECURITY & AUTHORIZATION RULES
  // ==========================================
  public canCustomerAccessOrder(order: Order, customer: CustomerUser | null): boolean {
    if (!customer) return false;
    if (['admin', 'superAdmin', 'manager', 'staff'].includes(customer.role)) return true;
    return (
      order.customer.email.toLowerCase().trim() === customer.email.toLowerCase().trim()
    );
  }

  public canCustomerAccessBooking(booking: Booking, customer: CustomerUser | null): boolean {
    if (!customer) return false;
    if (['admin', 'superAdmin', 'manager', 'staff'].includes(customer.role)) return true;
    return (
      booking.customer.email.toLowerCase().trim() === customer.email.toLowerCase().trim() ||
      booking.customerId === customer.id ||
      (customer.uid && booking.customerId === customer.uid)
    );
  }
}

export const authService = new AuthService();
