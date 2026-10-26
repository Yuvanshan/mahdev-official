import type { CustomerUser } from '../types/customer';

/**
 * How complete a customer's profile is. Name, contact number and NIC are required
 * (accounts made with Google start without phone and NIC); address, photo and a confirmed
 * email address are recommended.
 */
export type ProfileItemKey = 'fullName' | 'phone' | 'nic' | 'address' | 'avatar' | 'emailVerified';

export interface ProfileItem {
  key: ProfileItemKey;
  label: string;
  required: boolean;
  done: boolean;
}

export interface ProfileCompletion {
  items: ProfileItem[];
  /** 0–100, counting every item. */
  percent: number;
  /** All required items are filled in. */
  isComplete: boolean;
  missingRequired: ProfileItem[];
}

/** A real name, not the placeholder made from the email address at first sign-in. */
export function hasRealName(user: Pick<CustomerUser, 'fullName' | 'email'>): boolean {
  const name = (user.fullName || '').trim();
  const emailName = (user.email || '').split('@')[0];
  return name.length >= 3 && name !== 'Mahdev Customer' && name.toLowerCase() !== emailName.toLowerCase();
}

export function getProfileCompletion(user: CustomerUser): ProfileCompletion {
  const items: ProfileItem[] = [
    { key: 'fullName', label: 'Full name', required: true, done: hasRealName(user) },
    { key: 'phone', label: 'Contact number', required: true, done: Boolean(user.phone) },
    { key: 'nic', label: 'NIC number', required: true, done: Boolean(user.nic) },
    { key: 'address', label: 'Delivery address', required: false, done: Boolean(user.address?.street && user.address?.city) },
    { key: 'avatar', label: 'Profile photo', required: false, done: Boolean(user.avatarUrl) },
    { key: 'emailVerified', label: 'Confirmed email', required: false, done: Boolean(user.emailVerified) },
  ];
  const missingRequired = items.filter((item) => item.required && !item.done);
  return {
    items,
    percent: Math.round((items.filter((item) => item.done).length / items.length) * 100),
    isComplete: missingRequired.length === 0,
    missingRequired,
  };
}

/** Where to send a customer after signing in: the completion step first if details are missing. */
export function postSignInPath(user: CustomerUser, redirectPath = '/account'): string {
  const safeRedirect = redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : '/account';
  if (getProfileCompletion(user).isComplete) return safeRedirect;
  return `/account/complete?redirect=${encodeURIComponent(safeRedirect)}`;
}
