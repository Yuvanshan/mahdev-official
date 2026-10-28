import type { IncomingMessage } from 'node:http';
import { consumeRateLimit, getClientIp, RateLimitError } from '../security/rateLimit.js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestsByClient = new Map<string, { count: number; resetAt: number }>();

/** In-memory fallback, used only if the shared database limiter is unavailable. */
function isAllowedInMemory(clientAddress: string): boolean {
  const now = Date.now();
  const current = requestsByClient.get(clientAddress);

  if (!current || current.resetAt <= now) {
    requestsByClient.set(clientAddress, { count: 1, resetAt: now + WINDOW_MS });
    for (const [address, state] of requestsByClient) {
      if (state.resetAt <= now) requestsByClient.delete(address);
    }
    return true;
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

/**
 * 10 email-sending requests per minute per visitor. Counted in the database so
 * every server instance shares one count, keyed on the platform-provided IP
 * (getClientIp), which callers cannot set themselves.
 */
export async function isPublicEmailRequestAllowed(request: IncomingMessage): Promise<boolean> {
  const clientAddress = getClientIp(request);
  try {
    await consumeRateLimit(`public-email:${clientAddress}`, MAX_REQUESTS_PER_WINDOW, WINDOW_MS);
    return true;
  } catch (error) {
    if (error instanceof RateLimitError) return false;
    console.error('[Public email] Shared rate limiter unavailable; using this instance only:', error);
    return isAllowedInMemory(clientAddress);
  }
}
