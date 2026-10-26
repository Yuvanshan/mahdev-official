import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset as confirmFirebasePasswordReset,
} from 'firebase/auth';
import { doc, getDoc, setDoc, setDocWithResult } from '../lib/tursoFirestore';
import { auth, db } from '../lib/firebase';
import {
  CustomerUser,
  LoginCredentials,
  RegisterInput,
  CustomerRole,
} from '../types/customer';
import { FirestoreUser } from '../types/firestore';
import { Order } from '../types/order';
import { Booking } from '../types/booking';
import { normaliseSriLankaPhone, parseNic } from '../utils/sriLankaIdentity';
import { safeStorage } from '../utils/safeStorage';

type AuthListener = (user: CustomerUser | null) => void;
type ProfileRecord = FirestoreUser & Record<string, any>;
type Result = { success: boolean; error?: string };

export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/**
 * The one password rule for registration, password changes and resets: 8–128
 * characters with at least one letter and one number. Returns the problem, or null.
 */
export function passwordPolicyError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > MAX_PASSWORD_LENGTH) return `Use at most ${MAX_PASSWORD_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return null;
}

/** What an emailed account link (verification, password reset, email change undo) does. */
export type EmailActionMode = 'verifyEmail' | 'resetPassword' | 'recoverEmail' | 'verifyAndChangeEmail';

/** How long a loaded profile is reused before asking the server again. */
const PROFILE_CACHE_MS = 60_000;
/**
 * Device copy of the signed-in customer as shown in their account (photo, name,
 * contact details), so the top bar and account pages appear at once on every visit
 * while a fresh copy loads — like the gallery's cached images. It lives as long as
 * the sign-in on this device and is removed on sign-out. The NIC is stored masked;
 * the full number only ever comes from the server.
 */
const DEVICE_PROFILE_KEY = 'mahdev_device_profile';

function saveDeviceProfile(user: CustomerUser | null) {
  try {
    if (!user) {
      window.localStorage.removeItem(DEVICE_PROFILE_KEY);
      return;
    }
    const nic = user.nic ? `${'•'.repeat(Math.max(0, user.nic.length - 4))}${user.nic.slice(-4)}` : undefined;
    window.localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify({ ...user, nic }));
  } catch {
    // Storage blocked or full: the account still loads from the server.
  }
}

/** The saved customer for this device (optionally only if it matches uid). */
export function readDeviceProfile(uid?: string): CustomerUser | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DEVICE_PROFILE_KEY) || 'null') as CustomerUser | null;
    if (!saved || typeof saved.uid !== 'string') return null;
    return !uid || saved.uid === uid ? saved : null;
  } catch {
    return null;
  }
}

/** Sign-in pages are served from this site (live), so a full-page redirect works reliably. */
const isSameSiteAuthDomain = () => typeof window !== 'undefined' && auth.config.authDomain === window.location.host;
/** Phones and tablets: a full-page redirect is smoother than a pop-up tab. */
const prefersRedirect = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
/** Where email links (verification, password reset) lead back to; only on the live site. */
const emailLinkSettings = (path: string) =>
  isSameSiteAuthDomain() ? { url: `${window.location.origin}${path}` } : undefined;

/** Set while a Google sign-in is away on a full-page redirect (popup was blocked). */
const GOOGLE_REDIRECT_FLAG = 'mahdev_google_redirect_pending';

export interface SocialSignInResult {
  success: boolean;
  user?: CustomerUser;
  error?: string;
  /** The customer closed the Google window; show nothing. */
  cancelled?: boolean;
  /** The page is leaving for Google's sign-in page and will come back signed in. */
  redirecting?: boolean;
}

export interface ProfileCompletionInput {
  fullName: string;
  phone: string;
  /** Only used when the account has no NIC yet. */
  nic?: string;
  address?: Partial<CustomerUser['address']>;
}

// One message for wrong email and wrong password, so sign-in never reveals which emails have accounts.
const INVALID_LOGIN_MESSAGE = 'Incorrect email or password. Please try again.';

/** Friendly message for a Firebase Auth error code. */
function authErrorMessage(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return INVALID_LOGIN_MESSAGE;
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return `Please choose a stronger password (at least ${MIN_PASSWORD_LENGTH} characters).`;
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/requires-recent-login':
      return 'For your security, please sign in again and retry.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact us.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. Please contact us.';
    case 'auth/account-exists-with-different-credential':
    case 'auth/credential-already-in-use':
      return 'This email already has a Mahdev account. Please sign in with your email and password.';
    case 'auth/unauthorized-domain':
      return 'Google sign-in is not set up for this website address yet. Please use email for now.';
    case 'auth/invalid-oauth-client-id':
    case 'auth/invalid-oauth-provider':
      return 'Google sign-in is not configured correctly yet. Please use email for now.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Please allow pop-ups for this site and try again.';
    case 'auth/argument-error':
    case 'auth/internal-error':
      console.error('[Firebase Auth] Sign-in setup error:', error);
      return `${fallback} (${code})`;
    default:
      if (error instanceof Error && !code) return error.message;
      // Unknown Firebase codes are logged and shown, so a failure can be traced.
      console.error('[Firebase Auth] Unhandled error:', error);
      return code ? `${fallback} (${code})` : fallback;
  }
}

/** Friendly message for an emailed link that cannot be used. */
function emailActionErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code || '';
  if (code === 'auth/expired-action-code') return 'This link has expired. Please request a new one.';
  if (code === 'auth/invalid-action-code') return 'This link is invalid or has already been used. Please request a new one.';
  return authErrorMessage(error, 'This link could not be used. Please request a new one.');
}

/** Maps a Firebase user and their profile record to the app's customer shape. */
function toCustomerUser(firebaseUser: FirebaseUser, data: Partial<ProfileRecord> | null): CustomerUser {
  const now = new Date().toISOString();
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    fullName: data?.name || data?.displayName || firebaseUser.displayName || 'Mahdev Customer',
    email: firebaseUser.email || data?.email || '',
    phone: data?.phone || '',
    company: data?.company || '',
    accountType: data?.accountType === 'corporate' ? 'corporate' : 'individual',
    role: (data?.role as CustomerRole) || 'customer',
    avatarUrl: data?.avatarUrl || data?.photoURL || data?.photoUrl || firebaseUser.photoURL || '',
    address: data?.address || { street: '', city: '', postalCode: '', country: 'Sri Lanka' },
    preferences: {
      currency: 'LKR',
      preferredContactMethod: data?.preferences?.preferredContactMethod || 'whatsapp',
      orderNotifications: data?.preferences?.orderNotifications ?? true,
      promotionalUpdates: data?.preferences?.promotionalUpdates ?? true,
      smsAlerts: data?.preferences?.smsAlerts ?? true,
      twoFactorEnabled: data?.preferences?.twoFactorEnabled ?? false,
    },
    nic: data?.nic || undefined,
    dateOfBirth: data?.dateOfBirth || undefined,
    gender: data?.gender || undefined,
    emailVerified: firebaseUser.emailVerified,
    createdAt: data?.createdAt || firebaseUser.metadata.creationTime || now,
    lastLogin: firebaseUser.metadata.lastSignInTime || now,
  };
}

class AuthService {
  private currentUser: CustomerUser | null = null;
  private listeners: Set<AuthListener> = new Set();
  private readyListeners: Set<() => void> = new Set();
  private authInitialized = false;
  // Registration writes the profile itself; the auth listener must not create a blank one first.
  private registering = false;

  // Error from a Google sign-in that came back by redirect, shown once on the sign-in page.
  private redirectError: string | null = null;

  constructor() {
    this.setupFirebaseListener();
    this.completeGoogleRedirect();
  }

  /**
   * Finishes a Google sign-in that went by full-page redirect. Only runs when one was
   * started, so ordinary page loads do not load Firebase's sign-in frame.
   */
  private completeGoogleRedirect() {
    if (!safeStorage.getItem(GOOGLE_REDIRECT_FLAG)) return;
    safeStorage.removeItem(GOOGLE_REDIRECT_FLAG);
    getRedirectResult(auth).catch((err) => {
      this.redirectError = authErrorMessage(err, 'Google sign-in failed. Please try again.');
      this.notifyListeners();
    });
  }

  /** Returns (and clears) the error from a Google redirect sign-in, if there was one. */
  public consumeRedirectError(): string | null {
    const error = this.redirectError;
    this.redirectError = null;
    return error;
  }

  // Sign-in and Firebase's session listener both ask for the profile at the same moment:
  // identical lookups share one request, and the result is reused for a short time.
  private profileCache: { uid: string; profile: ProfileRecord | null; loadedAt: number } | null = null;
  private profileRequest: { uid: string; promise: Promise<ProfileRecord | null> } | null = null;

  /** Forgets the cached profile, so the next read comes from the server. */
  private forgetProfile() {
    this.profileCache = null;
    this.profileRequest = null;
  }

  /** users/{uid}, from the short-lived cache or a shared in-flight request when possible. */
  private loadProfile(firebaseUser: FirebaseUser): Promise<ProfileRecord | null> {
    const { uid } = firebaseUser;
    if (this.profileCache?.uid === uid && Date.now() - this.profileCache.loadedAt < PROFILE_CACHE_MS) {
      return Promise.resolve(this.profileCache.profile);
    }
    if (this.profileRequest?.uid === uid) return this.profileRequest.promise;
    const promise = this.fetchProfile(firebaseUser)
      .then((profile) => {
        // A profile still being created during registration is not cached.
        if (profile) {
          this.profileCache = { uid, profile, loadedAt: Date.now() };
        }
        return profile;
      })
      .finally(() => {
        if (this.profileRequest?.promise === promise) this.profileRequest = null;
      });
    this.profileRequest = { uid, promise };
    return promise;
  }

  /** Reads users/{uid}, creating a minimal profile when it does not exist yet. */
  private async fetchProfile(firebaseUser: FirebaseUser): Promise<ProfileRecord | null> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userDocRef);
    if (snapshot.exists()) return snapshot.data() as ProfileRecord;
    if (this.registering) return null;
    const now = new Date().toISOString();
    const profile: FirestoreUser = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || (firebaseUser.email || '').split('@')[0] || 'Mahdev Customer',
      email: firebaseUser.email || '',
      phone: '',
      role: 'customer',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userDocRef, profile, { merge: true });
    return profile as ProfileRecord;
  }

  private setupFirebaseListener() {
    try {
      onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        // Registration creates and sets the profile itself: no lookup needed meanwhile.
        if (firebaseUser && this.registering) {
          this.markReady();
          return;
        }
        // Anonymous sessions (guest checkout) are not customer accounts.
        if (firebaseUser && !firebaseUser.isAnonymous) {
          // Returning visit: show the saved profile at once, then update from the server below.
          const saved = !this.currentUser ? readDeviceProfile(firebaseUser.uid) : null;
          if (saved) {
            this.currentUser = { ...saved, emailVerified: firebaseUser.emailVerified };
            this.markReady();
            this.notifyListeners();
          }
          try {
            const profile = await this.loadProfile(firebaseUser);
            if (profile || !this.registering) this.currentUser = toCustomerUser(firebaseUser, profile);
          } catch (err) {
            console.warn('[Firebase Auth] Profile load error:', err);
            // Offline or server error: keep the saved profile shown above, if there is one.
            if (!this.currentUser) this.currentUser = toCustomerUser(firebaseUser, null);
          }
        } else if (!this.registering) {
          this.currentUser = null;
        }
        this.markReady();
        this.notifyListeners();
      });
    } catch (err) {
      console.warn('[Firebase Auth] Listener initialization error:', err);
      this.markReady();
    }
  }

  private markReady() {
    if (this.authInitialized) return;
    this.authInitialized = true;
    this.readyListeners.forEach((listener) => listener());
    this.readyListeners.clear();
  }

  /** True once Firebase has restored (or ruled out) a saved session. */
  public isReady(): boolean {
    return this.authInitialized;
  }

  /** Runs once Firebase has restored the session; returns an unsubscribe function. */
  public onReady(listener: () => void): () => void {
    if (this.authInitialized) {
      listener();
      return () => undefined;
    }
    this.readyListeners.add(listener);
    return () => this.readyListeners.delete(listener);
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    // Keep the device copy in step: saved when signed in, removed when signed out.
    if (!this.registering) saveDeviceProfile(this.currentUser);
    this.listeners.forEach((l) => l(this.currentUser));
  }

  public getCurrentUser(): CustomerUser | null {
    return this.currentUser;
  }

  /**
   * Firebase Authentication - Login with email and password.
   */
  public async login(
    credentials: LoginCredentials
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    const emailClean = credentials.email.trim().toLowerCase();
    if (!emailClean) return { success: false, error: 'Please enter your email address.' };
    if (!credentials.password) return { success: false, error: 'Please enter your password.' };

    try {
      const { user: fbUser } = await signInWithEmailAndPassword(auth, emailClean, credentials.password);
      this.currentUser = toCustomerUser(fbUser, await this.loadProfile(fbUser));
      this.notifyListeners();
      return { success: true, user: this.currentUser };
    } catch (err) {
      if (!(err as { code?: string })?.code) console.error('[Firebase Auth] Login failed:', err);
      return { success: false, error: authErrorMessage(err, 'Sign-in failed. Please try again.') };
    }
  }

  /**
   * Sign in (or sign up) with Google. Uses a popup; if the browser blocks it, falls back
   * to a full-page redirect that returns signed in. New Google accounts get a profile
   * with their Google name and are asked for their contact number and NIC afterwards.
   */
  public async signInWithGoogle(): Promise<SocialSignInResult> {
    const provider = new GoogleAuthProvider();
    // Always show the account chooser, so people with several Google accounts can pick.
    provider.setCustomParameters({ prompt: 'select_account' });
    if (prefersRedirect() && isSameSiteAuthDomain()) {
      safeStorage.setItem(GOOGLE_REDIRECT_FLAG, '1');
      await signInWithRedirect(auth, provider);
      return { success: false, redirecting: true };
    }
    try {
      const { user: fbUser } = await signInWithPopup(auth, provider);
      this.currentUser = toCustomerUser(fbUser, await this.loadProfile(fbUser));
      this.notifyListeners();
      return { success: true, user: this.currentUser };
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'].includes(code)) {
        return { success: false, cancelled: true };
      }
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        safeStorage.setItem(GOOGLE_REDIRECT_FLAG, '1');
        await signInWithRedirect(auth, provider);
        return { success: false, redirecting: true };
      }
      if (!code) console.error('[Firebase Auth] Google sign-in failed:', err);
      return { success: false, error: authErrorMessage(err, 'Google sign-in failed. Please try again.') };
    }
  }

  /**
   * Saves the details an account is missing (typically after Google sign-in) in one
   * write. The server checks the NIC, keeps one account per NIC and derives the date
   * of birth and gender from it; the saved record is read back to show them.
   */
  public async completeProfile(input: ProfileCompletionInput): Promise<Result> {
    const fbUser = auth.currentUser;
    const current = this.currentUser;
    if (!fbUser || !current) return { success: false, error: 'Please sign in again.' };

    const fullName = input.fullName.trim().replace(/\s+/g, ' ');
    const phone = normaliseSriLankaPhone(input.phone);
    const nic = current.nic ? null : parseNic(input.nic || '');
    if (fullName.length < 3) return { success: false, error: 'Please enter your full name.' };
    if (!phone) return { success: false, error: 'Please enter a valid Sri Lankan contact number.' };
    if (!current.nic && !nic) return { success: false, error: 'Please enter a valid NIC number.' };

    try {
      const uid = current.uid || current.id;
      const { identity } = await setDocWithResult(
        doc(db, 'users', uid),
        {
          name: fullName,
          phone,
          ...(nic ? { nic: nic.nic } : {}),
          ...(input.address ? { address: { ...current.address, ...input.address } } : {}),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      this.forgetProfile();
      if (fbUser.displayName !== fullName) await updateFirebaseProfile(fbUser, { displayName: fullName });
      // No read-back: the write response carries any newly derived identity fields.
      this.currentUser = {
        ...current,
        fullName,
        phone,
        address: input.address ? { ...current.address, ...input.address } : current.address,
        ...(identity ? { nic: identity.nic, dateOfBirth: identity.dateOfBirth || undefined, gender: identity.gender || undefined } : {}),
      };
      this.notifyListeners();
      return { success: true };
    } catch (err) {
      console.error('[Turso] Profile completion failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Could not save your details.' };
    }
  }

  /** Adds a NIC to an account that has none (once). One write; no reload or read-back. */
  public async addNic(nicInput: string): Promise<Result> {
    const current = this.currentUser;
    if (!current) return { success: false, error: 'Please sign in again.' };
    if (current.nic) return { success: false, error: 'Your NIC number is already saved.' };
    const nic = parseNic(nicInput);
    if (!nic) return { success: false, error: 'Please enter a valid NIC number.' };
    try {
      const { identity } = await setDocWithResult(
        doc(db, 'users', current.uid || current.id),
        { nic: nic.nic, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      this.forgetProfile();
      this.currentUser = {
        ...current,
        nic: identity?.nic || nic.nic,
        dateOfBirth: identity?.dateOfBirth || nic.dateOfBirth,
        gender: identity?.gender || nic.gender,
      };
      this.notifyListeners();
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Could not save your NIC.' };
    }
  }

  /**
   * Firebase Authentication - Register.
   * Creates the Firebase login, then the profile at users/{uid}. The server checks
   * the NIC, keeps one account per NIC and derives date of birth and gender from it.
   * If the profile cannot be saved, the new login is deleted so the email can be reused.
   */
  public async register(
    input: RegisterInput
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    const emailClean = input.email.trim().toLowerCase();
    const fullNameClean = input.fullName.trim().replace(/\s+/g, ' ');
    const nic = parseNic(input.nic);
    const phone = normaliseSriLankaPhone(input.phone);

    if (!fullNameClean) return { success: false, error: 'Full name is required.' };
    if (!nic) return { success: false, error: 'Please enter a valid NIC number.' };
    if (!phone) return { success: false, error: 'Please enter a valid Sri Lankan contact number.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) return { success: false, error: 'A valid email address is required.' };
    const passwordProblem = passwordPolicyError(input.password);
    if (passwordProblem) return { success: false, error: passwordProblem };
    if (input.password !== input.confirmPassword) return { success: false, error: 'Passwords do not match.' };
    if (!input.agreeToTerms) return { success: false, error: 'Please accept the Terms and Privacy Policy.' };

    this.registering = true;
    let fbUser: FirebaseUser;
    try {
      ({ user: fbUser } = await createUserWithEmailAndPassword(auth, emailClean, input.password));
    } catch (err) {
      this.registering = false;
      if (!(err as { code?: string })?.code) console.error('[Firebase Auth] Registration failed:', err);
      return { success: false, error: authErrorMessage(err, 'Registration failed. Please try again.') };
    }

    try {
      await updateFirebaseProfile(fbUser, { displayName: fullNameClean });
      const now = new Date().toISOString();
      const profile: FirestoreUser = {
        uid: fbUser.uid,
        name: fullNameClean,
        email: emailClean,
        phone,
        nic: nic.nic,
        company: input.accountType === 'corporate' ? input.company?.trim() || '' : '',
        accountType: input.accountType || 'individual',
        role: 'customer', // The server also locks public registrations to the customer role.
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      // One write; the response includes the date of birth and gender read from the NIC.
      const { identity } = await setDocWithResult(doc(db, 'users', fbUser.uid), profile, { merge: true });
      this.forgetProfile();
      this.currentUser = toCustomerUser(fbUser, { ...profile, ...(identity || {}) } as ProfileRecord);
    } catch (err) {
      console.error('[Turso] Customer profile creation failed:', err);
      await deleteUser(fbUser).catch(() => signOut(auth));
      this.currentUser = null;
      this.registering = false;
      this.notifyListeners();
      return { success: false, error: authErrorMessage(err, 'Could not create your profile. Please try again.') };
    }

    this.registering = false;
    // A failed verification email must not fail the registration; it can be resent from the profile.
    sendEmailVerification(fbUser, emailLinkSettings('/account/profile')).catch((err) => console.warn('[Firebase Auth] Verification email failed:', err));
    this.notifyListeners();
    return { success: true, user: this.currentUser };
  }

  /**
   * Firebase Authentication - Logout
   */
  public async logout(): Promise<void> {
    this.forgetProfile();
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Firebase Auth] Logout notice:', err);
    }
    this.currentUser = null;
    this.notifyListeners();
  }

  /**
   * Firebase Authentication - Password reset email.
   * The same confirmation is shown whether or not the email has an account.
   */
  public async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const sent = {
      success: true,
      message: `If an account exists for ${cleanEmail}, a password reset link is on its way. Please check your inbox and spam folder.`,
    };
    try {
      await sendPasswordResetEmail(auth, cleanEmail, emailLinkSettings('/login'));
      return sent;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found') return sent;
      if (!code) console.error('[Firebase Auth] Password reset request failed:', err);
      return { success: false, message: '', error: authErrorMessage(err, 'Could not send the reset link. Please try again.') };
    }
  }

  /** Changes the password after confirming the current one. */
  public async changePassword(currentPassword: string, newPassword: string): Promise<Result> {
    const fbUser = auth.currentUser;
    if (!fbUser?.email) return { success: false, error: 'Please sign in again.' };
    const passwordProblem = passwordPolicyError(newPassword);
    if (passwordProblem) return { success: false, error: passwordProblem };
    try {
      await reauthenticateWithCredential(fbUser, EmailAuthProvider.credential(fbUser.email, currentPassword));
      await updatePassword(fbUser, newPassword);
      return { success: true };
    } catch (err) {
      const message = authErrorMessage(err, 'Could not change your password.');
      return { success: false, error: message === INVALID_LOGIN_MESSAGE ? 'Your current password is incorrect.' : message };
    }
  }

  /** Sends (or resends) the email address confirmation link. */
  public async sendVerificationEmail(): Promise<Result> {
    const fbUser = auth.currentUser;
    if (!fbUser) return { success: false, error: 'Please sign in again.' };
    try {
      await sendEmailVerification(fbUser, emailLinkSettings('/account/profile'));
      return { success: true };
    } catch (err) {
      return { success: false, error: authErrorMessage(err, 'Could not send the verification email.') };
    }
  }

  /**
   * Confirms an emailed link opened on this site's /auth/action page: verifies the
   * email address or restores a changed one. For password resets it only checks the
   * link and returns the account's email; confirmPasswordReset() finishes it.
   */
  public async handleEmailAction(mode: EmailActionMode, oobCode: string): Promise<Result & { email?: string }> {
    try {
      if (mode === 'resetPassword') {
        return { success: true, email: await verifyPasswordResetCode(auth, oobCode) };
      }
      const info = await checkActionCode(auth, oobCode);
      await applyActionCode(auth, oobCode);
      // Signed in on this device: show the confirmed status straight away.
      if (auth.currentUser && this.currentUser) await this.refreshEmailVerification().catch(() => undefined);
      return { success: true, email: info.data.email || undefined };
    } catch (err) {
      return { success: false, error: emailActionErrorMessage(err) };
    }
  }

  /** Sets the new password from a reset link (checked first by handleEmailAction). */
  public async confirmPasswordReset(oobCode: string, newPassword: string): Promise<Result> {
    const passwordProblem = passwordPolicyError(newPassword);
    if (passwordProblem) return { success: false, error: passwordProblem };
    try {
      await confirmFirebasePasswordReset(auth, oobCode, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: emailActionErrorMessage(err) };
    }
  }

  /** Re-reads the email verification status after the customer clicks the link. */
  public async refreshEmailVerification(): Promise<boolean> {
    const fbUser = auth.currentUser;
    if (!fbUser || !this.currentUser) return false;
    await fbUser.reload();
    this.currentUser = { ...this.currentUser, emailVerified: fbUser.emailVerified };
    this.notifyListeners();
    return fbUser.emailVerified;
  }

  public async updateProfile(
    userId: string,
    updates: Partial<CustomerUser>
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    const fbUser = auth.currentUser;
    if (!fbUser || !this.currentUser || (this.currentUser.id !== userId && this.currentUser.uid !== userId)) {
      return { success: false, error: 'Customer account not found.' };
    }

    const current = this.currentUser;
    const fullName = (updates.fullName ?? current.fullName).trim().replace(/\s+/g, ' ');
    const phoneInput = updates.phone ?? current.phone;
    const phone = phoneInput ? normaliseSriLankaPhone(phoneInput) : '';
    if (!fullName) return { success: false, error: 'Full name is required.' };
    if (phone === null) return { success: false, error: 'Please enter a valid Sri Lankan contact number.' };

    const address = { ...current.address, ...(updates.address || {}) };
    const preferences = { ...current.preferences, ...(updates.preferences || {}) };
    try {
      // NIC, date of birth and gender are not sent: they are fixed at registration.
      await setDoc(
        doc(db, 'users', current.uid || current.id),
        {
          name: fullName,
          phone,
          company: updates.company ?? current.company ?? '',
          avatarUrl: updates.avatarUrl ?? current.avatarUrl ?? '',
          address,
          preferences,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      this.forgetProfile();
      if (fbUser.displayName !== fullName) await updateFirebaseProfile(fbUser, { displayName: fullName });
      this.currentUser = {
        ...current,
        ...updates,
        fullName,
        phone,
        address,
        preferences,
        // Never taken from the update.
        nic: current.nic,
        dateOfBirth: current.dateOfBirth,
        gender: current.gender,
      };
      this.notifyListeners();
      return { success: true, user: this.currentUser };
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
        avatarUrl: data.avatarUrl || data.photoURL || data.photoUrl || '',
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
        nic: data.nic || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender || undefined,
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
