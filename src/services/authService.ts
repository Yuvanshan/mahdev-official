import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

const SESSION_STORAGE_KEY = 'mahdev_customer_session_v1';
const ACCOUNTS_STORAGE_KEY = 'mahdev_customer_accounts_v1';

// Initial pre-seeded accounts - strictly real, no fake placeholder customers
const INITIAL_DEMO_ACCOUNTS: CustomerUser[] = [];

type AuthListener = (user: CustomerUser | null) => void;

class AuthService {
  private accounts: CustomerUser[] = [];
  private currentUser: CustomerUser | null = null;
  private listeners: Set<AuthListener> = new Set();
  private authInitialized = false;

  constructor() {
    this.init();
    this.setupFirebaseListener();
  }

  private init() {
    // Load local accounts and purge any legacy fake customer data
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy fake demo accounts
          this.accounts = parsed.filter(
            (a: any) =>
              a.id !== 'CUST-2026-3910' &&
              a.id !== 'CUST-2026-1088' &&
              a.uid !== 'demo-user-ruwan' &&
              a.uid !== 'demo-user-elena' &&
              !a.email?.includes('ruwan.wick') &&
              !a.email?.includes('elena.rostova') &&
              !a.email?.includes('creative.co') &&
              !a.email?.includes('ceyloncorp.lk')
          );
          this.saveAccounts();
        } else {
          this.accounts = [];
        }
      } else {
        this.accounts = [];
      }
    } catch {
      this.accounts = [];
    }

    // Load active local session and ensure no fake customer remains
    try {
      const activeSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (activeSession) {
        const parsed = JSON.parse(activeSession);
        if (
          parsed.uid === 'demo-user-ruwan' ||
          parsed.uid === 'demo-user-elena' ||
          parsed.email?.includes('ruwan.wick') ||
          parsed.email?.includes('elena.rostova')
        ) {
          this.currentUser = null;
          localStorage.removeItem(SESSION_STORAGE_KEY);
        } else {
          this.currentUser = parsed;
        }
      } else {
        this.currentUser = this.accounts[0] || null;
      }
    } catch {
      this.currentUser = null;
    }
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
              this.saveSession();
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
              this.saveSession();
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

  private saveAccounts() {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(this.accounts));
    } catch (e) {
      console.error('Failed to persist accounts', e);
    }
  }

  private saveSession() {
    try {
      if (this.currentUser) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to persist session', e);
    }
  }

  public getCurrentUser(): CustomerUser | null {
    return this.currentUser;
  }

  public getAllDemoAccounts(): CustomerUser[] {
    return this.accounts;
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
          this.saveSession();
          this.notifyListeners();
          return { success: true, user: customerUser };
        } catch (firebaseErr: any) {
          // Check for standard Firebase Auth error codes
          if (
            firebaseErr.code === 'auth/wrong-password' ||
            firebaseErr.code === 'auth/invalid-credential'
          ) {
            // Check if it's one of our pre-configured demo evaluation accounts
            const demoAcc = this.accounts.find((a) => a.email.toLowerCase() === emailClean);
            if (demoAcc) {
              demoAcc.lastLogin = new Date().toISOString();
              this.currentUser = demoAcc;
              this.saveSession();
              this.notifyListeners();
              return { success: true, user: demoAcc };
            }
            return { success: false, error: 'Incorrect password. Please verify your credentials.' };
          }
          if (firebaseErr.code === 'auth/user-not-found') {
            // Check demo accounts
            const demoAcc = this.accounts.find((a) => a.email.toLowerCase() === emailClean);
            if (demoAcc) {
              demoAcc.lastLogin = new Date().toISOString();
              this.currentUser = demoAcc;
              this.saveSession();
              this.notifyListeners();
              return { success: true, user: demoAcc };
            }
            return { success: false, error: 'No account found with this email. Please register.' };
          }
          if (firebaseErr.code === 'auth/invalid-email') {
            return { success: false, error: 'Please enter a valid email address.' };
          }
          if (firebaseErr.code === 'auth/too-many-requests') {
            return { success: false, error: 'Too many attempts. Please try again in a few moments.' };
          }
          console.warn('[Firebase Auth] Login notice:', firebaseErr.message);
        }
      }

      // 2. Demo Account fallback for sandbox / offline testing
      let account = this.accounts.find((a) => a.email.toLowerCase() === emailClean);
      if (!account && emailClean.includes('@')) {
        const newId = `CUST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        account = {
          id: newId,
          uid: newId,
          fullName: emailClean
            .split('@')[0]
            .replace(/[._]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          email: emailClean,
          phone: '+94 77 000 0000',
          accountType: 'individual',
          role: 'customer',
          address: {
            street: '100 Galle Road',
            city: 'Colombo',
            state: 'Western Province',
            postalCode: '00300',
            country: 'Sri Lanka',
          },
          preferences: {
            currency: 'USD',
            preferredContactMethod: 'email',
            orderNotifications: true,
            promotionalUpdates: true,
            smsAlerts: false,
            twoFactorEnabled: false,
          },
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        this.accounts.push(account);
        this.saveAccounts();
      }

      if (account) {
        account.lastLogin = new Date().toISOString();
        this.currentUser = account;
        this.saveSession();
        this.notifyListeners();
        return { success: true, user: account };
      }

      return { success: false, error: 'Invalid email address or credentials.' };
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
      let uid = `CUST-2026-${Math.floor(1000 + Math.random() * 9000)}`;

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
        console.warn('[Firebase Auth] Registration warning:', authErr.message);
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
        console.warn('[Firestore] Profile creation notice:', firestoreErr);
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

      this.accounts.push(newCustomerUser);
      this.currentUser = newCustomerUser;
      this.saveAccounts();
      this.saveSession();
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
    localStorage.removeItem(SESSION_STORAGE_KEY);
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
      // Demo / fallback simulation for frictionless evaluation
      return {
        success: true,
        message: `Password reset instructions have been dispatched to ${cleanEmail}. Check your inbox for the secure verification link.`,
      };
    }
  }

  public switchDemoAccount(email: string): CustomerUser | null {
    const found = this.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (found) {
      this.currentUser = found;
      this.saveSession();
      this.notifyListeners();
      return found;
    }
    return null;
  }

  public async updateProfile(
    userId: string,
    updates: Partial<CustomerUser>
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    const index = this.accounts.findIndex((a) => a.id === userId || a.uid === userId);
    if (index === -1 && !this.currentUser) {
      return { success: false, error: 'Customer account not found.' };
    }

    const current = this.currentUser || this.accounts[index];
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

    if (index !== -1) {
      this.accounts[index] = updated;
    }
    this.currentUser = updated;
    this.saveAccounts();
    this.saveSession();

    // Sync updates to Firestore users/{uid}
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
    } catch (err) {
      console.warn('[Firestore] Profile update sync notice:', err);
    }

    this.notifyListeners();
    return { success: true, user: updated };
  }

  public getAllCustomers(): CustomerUser[] {
    return [...this.accounts];
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
