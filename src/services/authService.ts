import {
  CustomerUser,
  LoginCredentials,
  RegisterInput,
  CustomerAddress,
  CustomerPreferences,
} from '../types/customer';
import { Order } from '../types/order';
import { Booking } from '../types/booking';

const SESSION_STORAGE_KEY = 'mahdev_customer_session_v1';
const ACCOUNTS_STORAGE_KEY = 'mahdev_customer_accounts_v1';

// Pre-seeded customer profiles
const INITIAL_DEMO_ACCOUNTS: CustomerUser[] = [
  {
    id: 'CUST-2026-8821',
    fullName: 'Yuvanshan Perera',
    email: 'yuvanshan875@gmail.com',
    phone: '+94 77 912 3456',
    company: 'Ceylon Horizon Ventures PLC',
    accountType: 'corporate',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    role: 'customer',
    corporateTier: 'Enterprise VIP',
    address: {
      street: '42 Gregory Road',
      apartment: 'Suite 8B, Tower One',
      city: 'Colombo',
      state: 'Western Province',
      postalCode: '00700',
      country: 'Sri Lanka',
    },
    preferences: {
      currency: 'USD',
      preferredContactMethod: 'whatsapp',
      orderNotifications: true,
      promotionalUpdates: true,
      smsAlerts: true,
      twoFactorEnabled: true,
    },
    createdAt: '2026-01-15T08:00:00.000Z',
    lastLogin: '2026-08-18T00:30:00.000Z',
  },
  {
    id: 'CUST-2026-3910',
    fullName: 'Dr. Ruwan Wickremasinghe',
    email: 'ruwan.wick@ceyloncorp.lk',
    phone: '+94 71 889 0012',
    company: 'Wickremasinghe Tech & Trading Ltd',
    accountType: 'corporate',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    role: 'corporate_partner',
    corporateTier: 'Platinum',
    address: {
      street: '15/2 Alfred House Gardens',
      apartment: 'Penthouse A',
      city: 'Colombo',
      state: 'Western Province',
      postalCode: '00300',
      country: 'Sri Lanka',
    },
    preferences: {
      currency: 'USD',
      preferredContactMethod: 'email',
      orderNotifications: true,
      promotionalUpdates: false,
      smsAlerts: true,
      twoFactorEnabled: false,
    },
    createdAt: '2026-02-01T10:15:00.000Z',
    lastLogin: '2026-08-17T18:45:00.000Z',
  },
  {
    id: 'CUST-2026-1088',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@creative.co',
    phone: '+44 7911 123456',
    company: 'Lumière International Studios',
    accountType: 'individual',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    role: 'customer',
    corporateTier: 'Gold',
    address: {
      street: '77 Kensington High Street',
      city: 'London',
      state: 'Greater London',
      postalCode: 'W8 5SF',
      country: 'United Kingdom',
    },
    preferences: {
      currency: 'USD',
      preferredContactMethod: 'email',
      orderNotifications: true,
      promotionalUpdates: true,
      smsAlerts: false,
      twoFactorEnabled: true,
    },
    createdAt: '2026-03-10T14:20:00.000Z',
    lastLogin: '2026-08-16T12:10:00.000Z',
  },
];

class AuthService {
  private accounts: CustomerUser[] = [];
  private currentUser: CustomerUser | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Load stored accounts or seed defaults
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (stored) {
        this.accounts = JSON.parse(stored);
      } else {
        this.accounts = [...INITIAL_DEMO_ACCOUNTS];
        this.saveAccounts();
      }
    } catch {
      this.accounts = [...INITIAL_DEMO_ACCOUNTS];
    }

    // Load active session
    try {
      const activeSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (activeSession) {
        this.currentUser = JSON.parse(activeSession);
      } else {
        // Default to logged-in demo user for frictionless review
        this.currentUser = this.accounts[0];
        this.saveSession();
      }
    } catch {
      this.currentUser = this.accounts[0];
    }
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

  public async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    // Artificial latency for authentic auth feel
    await new Promise((r) => setTimeout(r, 600));

    const emailClean = credentials.email.trim().toLowerCase();
    if (!emailClean) {
      return { success: false, error: 'Email address is required.' };
    }

    let account = this.accounts.find((a) => a.email.toLowerCase() === emailClean);

    if (!account) {
      // Auto-provision if it's a valid new email for demonstration
      if (emailClean.includes('@')) {
        const newId = `CUST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        account = {
          id: newId,
          fullName: emailClean.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
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
      } else {
        return { success: false, error: 'Invalid email address or credentials.' };
      }
    }

    account.lastLogin = new Date().toISOString();
    this.currentUser = account;
    this.saveSession();
    this.saveAccounts();

    return { success: true, user: account };
  }

  public async register(input: RegisterInput): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    await new Promise((r) => setTimeout(r, 700));

    const emailClean = input.email.trim().toLowerCase();
    const existing = this.accounts.find((a) => a.email.toLowerCase() === emailClean);

    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
    }

    if (input.password.length < 6) {
      return { success: false, error: 'Password must contain at least 6 characters.' };
    }

    if (input.password !== input.confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    const newId = `CUST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAccount: CustomerUser = {
      id: newId,
      fullName: input.fullName.trim(),
      email: emailClean,
      phone: input.phone.trim(),
      company: input.company?.trim(),
      accountType: input.accountType || 'individual',
      role: 'customer',
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
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      corporateTier: input.accountType === 'corporate' ? 'Silver' : undefined,
    };

    this.accounts.push(newAccount);
    this.currentUser = newAccount;
    this.saveAccounts();
    this.saveSession();

    return { success: true, user: newAccount };
  }

  public logout(): void {
    this.currentUser = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  public switchDemoAccount(email: string): CustomerUser | null {
    const found = this.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (found) {
      this.currentUser = found;
      this.saveSession();
      return found;
    }
    return null;
  }

  public async updateProfile(
    userId: string,
    updates: Partial<CustomerUser>
  ): Promise<{ success: boolean; user?: CustomerUser; error?: string }> {
    await new Promise((r) => setTimeout(r, 400));

    const index = this.accounts.findIndex((a) => a.id === userId);
    if (index === -1) {
      return { success: false, error: 'Customer account not found.' };
    }

    const updated = {
      ...this.accounts[index],
      ...updates,
      address: {
        ...this.accounts[index].address,
        ...(updates.address || {}),
      },
      preferences: {
        ...this.accounts[index].preferences,
        ...(updates.preferences || {}),
      },
    };

    this.accounts[index] = updated;
    if (this.currentUser?.id === userId) {
      this.currentUser = updated;
      this.saveSession();
    }
    this.saveAccounts();

    return { success: true, user: updated };
  }

  public async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    await new Promise((r) => setTimeout(r, 600));
    return {
      success: true,
      message: `Password reset instructions have been dispatched to ${email}. Check your inbox for the secure verification link.`,
    };
  }

  public getAllCustomers(): CustomerUser[] {
    return [...this.accounts];
  }

  // ==========================================
  // SECURITY & AUTHORIZATION RULES
  // ==========================================
  /**
   * Enforces that customers may ONLY view their own orders.
   */
  public canCustomerAccessOrder(order: Order, customer: CustomerUser | null): boolean {
    if (!customer) return false;
    if (customer.role === 'admin') return true;
    return (
      order.customer.email.toLowerCase().trim() === customer.email.toLowerCase().trim()
    );
  }

  /**
   * Enforces that customers may ONLY view their own bookings.
   */
  public canCustomerAccessBooking(booking: Booking, customer: CustomerUser | null): boolean {
    if (!customer) return false;
    if (customer.role === 'admin') return true;
    return (
      booking.customer.email.toLowerCase().trim() === customer.email.toLowerCase().trim() ||
      booking.customerId === customer.id
    );
  }
}

export const authService = new AuthService();
