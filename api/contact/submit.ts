import type { IncomingMessage, ServerResponse } from 'node:http';
import handler from '../../backend/api/handlers/publicEmail.js';

export default function submitContact(
  request: IncomingMessage & { method?: string; body?: unknown },
  response: ServerResponse
): Promise<void> {
  return handler(request, response);
}
