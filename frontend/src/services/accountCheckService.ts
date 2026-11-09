/**
 * Asks the server whether an email, phone number or NIC already belongs to a
 * customer account (POST /api/account/check). Used before creating an account
 * and before sending a password reset link.
 */

export type AccountCheckResult = 'taken' | 'available' | 'invalid';

export interface AccountCheck {
  email?: AccountCheckResult;
  phone?: AccountCheckResult;
  nic?: AccountCheckResult;
}

/**
 * Returns null when the check could not be made (offline, rate limited...), so
 * callers can carry on; the server still refuses duplicate accounts.
 */
export async function checkAccountDetails(details: { email?: string; phone?: string; nic?: string }): Promise<AccountCheck | null> {
  try {
    const response = await fetch('/api/account/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as AccountCheck & { success?: boolean };
    return body.success ? { email: body.email, phone: body.phone, nic: body.nic } : null;
  } catch {
    return null;
  }
}

/** Field errors for details that already have an account ("Please sign in instead"). */
export function takenDetailErrors(check: AccountCheck | null): Partial<Record<'email' | 'phone' | 'nic', string>> {
  if (!check) return {};
  return {
    ...(check.email === 'taken' ? { email: 'This email already has an account. Please sign in instead.' } : {}),
    ...(check.phone === 'taken' ? { phone: 'This contact number already has an account. Please sign in instead.' } : {}),
    ...(check.nic === 'taken' ? { nic: 'This NIC number already has an account. Please sign in instead.' } : {}),
  };
}
