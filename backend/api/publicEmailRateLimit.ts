import type { IncomingMessage } from 'node:http';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestsByClient = new Map<string, { count: number; resetAt: number }>();

export function isPublicEmailRequestAllowed(request: IncomingMessage): boolean {
  const forwardedFor = request.headers['x-forwarded-for'];
  const clientAddress = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
    ?.split(',')[0]
    .trim() || request.socket.remoteAddress || 'unknown';
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
