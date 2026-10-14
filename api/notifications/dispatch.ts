import type { IncomingMessage, ServerResponse } from 'node:http';
import handler from '../../backend/api/handlers/notifications.js';

export default function dispatchNotifications(
  request: IncomingMessage & { method?: string; body?: unknown },
  response: ServerResponse
): Promise<void> {
  return handler(request, response);
}
