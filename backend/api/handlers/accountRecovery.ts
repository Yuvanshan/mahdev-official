import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getTursoDocument,
  initializeTursoDatabase,
  listTursoDocuments,
  writeTursoDocument,
  consumeAccountRecoveryAttempt,
  markAccountRecoveryChallengeUsed,
  pruneExpiredAccountRecoveryChallenges,
} from '../../db/tursoDatabase.js';
import { sendCustomerEmail } from '../../services/emailService.js';
import { consumeRateLimit, getClientIp, RateLimitError } from '../../security/rateLimit.js';
import { normaliseSriLankaPhone, parseNic } from '../../../src/utils/sriLankaIdentity.js';

interface AccountRecoveryRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

const CHALLENGE_COLLECTION = 'accountRecoveryChallenges';
const CHALLENGE_LIFETIME_MS = 10 * 60_000;
const MAX_CODE_ATTEMPTS = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEUTRAL_MESSAGE = 'If the details match an account, a verification code has been sent to its registered email address.';

interface RecoveryIdentifier {
  normalized: string;
  filter: { field: string; operator: string; value: unknown };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function recoverySecret(): string {
  const secret = process.env.TURSO_AUTH_TOKEN;
  if (!secret) throw new Error('Account recovery requires the configured database authentication secret.');
  return secret;
}

function digest(value: string): string {
  return createHmac('sha256', recoverySecret()).update(value).digest('hex');
}

function parseIdentifier(value: unknown): RecoveryIdentifier | null {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (EMAIL_PATTERN.test(input)) {
    const email = input.toLowerCase();
    return { normalized: `email:${email}`, filter: { field: 'email', operator: '==', value: email } };
  }
  const nic = parseNic(input);
  if (nic) {
    return { normalized: `nic:${nic.nic}`, filter: { field: 'nic', operator: '==', value: nic.nic } };
  }
  const phone = normaliseSriLankaPhone(input);
  if (phone) {
    const digits = phone.slice(1);
    return {
      normalized: `phone:${phone}`,
      filter: {
        field: 'phone',
        operator: 'in',
        value: [phone, `0${digits.slice(2)}`, digits, digits.slice(2)],
      },
    };
  }
  return null;
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function codeMatches(code: unknown, expected: unknown): boolean {
  if (typeof code !== 'string' || typeof expected !== 'string' || !/^\d{8}$/.test(code)) return false;
  const actualHash = Buffer.from(digest(`code:${code}`), 'hex');
  const expectedHash = Buffer.from(expected, 'hex');
  return actualHash.length === expectedHash.length && timingSafeEqual(actualHash, expectedHash);
}

async function startRecovery(
  body: Record<string, unknown>,
  request: AccountRecoveryRequest,
  response: ServerResponse,
): Promise<void> {
  const identifier = parseIdentifier(body.identifier);
  if (!identifier) {
    sendJson(response, 400, { success: false, error: 'Enter a valid email address, Sri Lankan phone number, or NIC.' });
    return;
  }

  const ip = getClientIp(request);
  const identifierDigest = digest(identifier.normalized);
  try {
    await consumeRateLimit(`account-recovery:start:ip:${ip}`, 5, 15 * 60_000);
    await consumeRateLimit(`account-recovery:start:identifier:${identifierDigest}`, 3, 60 * 60_000);
    await consumeRateLimit('account-recovery:start:global', 1000, 60 * 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    console.error('[Account recovery] Rate limiter unavailable:', error);
    throw new Error('Account recovery is temporarily unavailable.');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + CHALLENGE_LIFETIME_MS).toISOString();
  await pruneExpiredAccountRecoveryChallenges(now.toISOString());
  const matches = await listTursoDocuments('users', '', [identifier.filter], undefined, 2);
  const matchingUser = matches.length === 1 ? matches[0] : null;
  const email = typeof matchingUser?.data.email === 'string' && EMAIL_PATTERN.test(matchingUser.data.email)
    ? matchingUser.data.email.toLowerCase()
    : '';
  const code = String(randomInt(0, 100_000_000)).padStart(8, '0');
  const challengeId = randomUUID();

  await writeTursoDocument({
    type: 'set',
    collection: CHALLENGE_COLLECTION,
    parentPath: '',
    id: challengeId,
    data: {
      codeHash: digest(`code:${code}`),
      identifierHash: identifierDigest,
      targetUid: email && matchingUser ? matchingUser.id : '',
      targetEmail: email,
      attempts: 0,
      used: false,
      expiresAt,
    },
  });

  if (email) {
    const result = await sendCustomerEmail({
      to: email,
      subject: 'Your Mahdev account verification code',
      text: `Your Mahdev account verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: `<p>Your Mahdev account verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
    });
    if (!result.delivered) {
      console.error(`[Account recovery] Verification code email was not delivered (challenge ${challengeId}).`);
    }
  }

  sendJson(response, 200, { success: true, challengeId, message: NEUTRAL_MESSAGE });
}

async function verifyRecovery(
  body: Record<string, unknown>,
  request: AccountRecoveryRequest,
  response: ServerResponse,
): Promise<void> {
  const challengeId = typeof body.challengeId === 'string' ? body.challengeId : '';
  const now = new Date().toISOString();
  try {
    await consumeRateLimit(`account-recovery:verify:ip:${getClientIp(request)}`, 20, 15 * 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) throw error;
    console.error('[Account recovery] Verification rate limiter unavailable:', error);
    throw new Error('Account recovery is temporarily unavailable.');
  }

  const challenge = challengeId
    ? await consumeAccountRecoveryAttempt(challengeId, now, MAX_CODE_ATTEMPTS)
    : null;
  if (!challenge || !codeMatches(body.code, challenge.data.codeHash)) {
    sendJson(response, 400, { success: false, error: 'That code is invalid or expired. Request a new code and try again.' });
    return;
  }

  const targetUid = typeof challenge.data.targetUid === 'string' ? challenge.data.targetUid : '';
  const targetEmail = typeof challenge.data.targetEmail === 'string' ? challenge.data.targetEmail : '';
  if (!targetUid || !targetEmail) {
    sendJson(response, 400, { success: false, error: 'That code is invalid or expired. Request a new code and try again.' });
    return;
  }
  const currentUser = await getTursoDocument('users', '', targetUid);
  if (!currentUser || currentUser.data.email !== targetEmail) {
    sendJson(response, 400, { success: false, error: 'That code is invalid or expired. Request a new code and try again.' });
    return;
  }
  if (!(await markAccountRecoveryChallengeUsed(challengeId))) {
    sendJson(response, 400, { success: false, error: 'That code is invalid or expired. Request a new code and try again.' });
    return;
  }

  sendJson(response, 200, { success: true, email: targetEmail });
}

export default async function handler(
  request: AccountRecoveryRequest,
  response: ServerResponse,
): Promise<void> {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { success: false, error: 'Only POST requests are supported.' });
    return;
  }
  if (!isRecord(request.body)) {
    sendJson(response, 400, { success: false, error: 'A valid account recovery request is required.' });
    return;
  }

  try {
    await initializeTursoDatabase();
    if (request.body.action === 'start') {
      await startRecovery(request.body, request, response);
      return;
    }
    if (request.body.action === 'verify') {
      await verifyRecovery(request.body, request, response);
      return;
    }
    sendJson(response, 400, { success: false, error: 'Choose a valid account recovery action.' });
  } catch (error) {
    if (error instanceof RateLimitError) {
      sendJson(response, 429, { success: false, error: error.message });
      return;
    }
    console.error('[Account recovery] Request failed:', error);
    sendJson(response, 503, { success: false, error: 'Account recovery is temporarily unavailable. Please try again shortly.' });
  }
}
