interface RecoveryApiResponse {
  success?: boolean;
  challengeId?: string;
  email?: string;
  message?: string;
  error?: string;
}

async function recoveryRequest(payload: Record<string, string>): Promise<RecoveryApiResponse> {
  const response = await fetch('/api/account/recovery', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({})) as RecoveryApiResponse;
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Account recovery is temporarily unavailable. Please try again.');
  }
  return result;
}

export async function startAccountRecovery(identifier: string): Promise<{ challengeId: string; message: string }> {
  const result = await recoveryRequest({ action: 'start', identifier });
  if (!result.challengeId) throw new Error('Could not start account recovery. Please try again.');
  return {
    challengeId: result.challengeId,
    message: result.message || 'If the details match an account, a verification code has been sent to its registered email address.',
  };
}

export async function verifyAccountRecovery(challengeId: string, code: string): Promise<{ email: string }> {
  const result = await recoveryRequest({ action: 'verify', challengeId, code });
  if (!result.email) throw new Error('The account email could not be confirmed. Please request a new code.');
  return { email: result.email };
}
