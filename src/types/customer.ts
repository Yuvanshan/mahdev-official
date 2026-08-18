export type CustomerRole = 'customer' | 'corporate_partner' | 'admin';

export interface CustomerAddress {
  street: string;
  apartment?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface CustomerPreferences {
  currency: 'USD' | 'LKR';
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  orderNotifications: boolean;
  promotionalUpdates: boolean;
  smsAlerts: boolean;
  twoFactorEnabled: boolean;
}

export interface CustomerUser {
  id: string; // e.g. "CUST-2026-8941"
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  accountType: 'individual' | 'corporate';
  avatarUrl?: string;
  role: CustomerRole;
  address: CustomerAddress;
  preferences: CustomerPreferences;
  createdAt: string;
  lastLogin: string;
  corporateTier?: 'Silver' | 'Gold' | 'Platinum' | 'Enterprise VIP';
}

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  accountType: 'individual' | 'corporate';
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface AuthState {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PasswordResetRequest {
  email: string;
}
