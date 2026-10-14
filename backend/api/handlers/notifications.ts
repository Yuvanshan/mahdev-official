import type { IncomingMessage, ServerResponse } from 'node:http';
import { dispatchServerNotification, type NotificationPayload } from '../../services/secureNotificationService.js';
import { isPublicEmailRequestAllowed } from '../publicEmailRateLimit.js';

interface NotificationRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

const NOTIFICATION_TYPES = new Set<NotificationPayload['type']>([
  'registration',
  'password_reset',
  'order_confirmation',
  'payment_confirmation',
  'payment_failure',
  'booking_confirmation',
  'booking_update',
  'booking_cancellation',
  'quote_request_received',
]);

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export default async function handler(
  request: NotificationRequest,
  response: ServerResponse
): Promise<void> {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { success: false, error: 'Only POST requests are supported.' });
    return;
  }
  if (!isPublicEmailRequestAllowed(request)) {
    sendJson(response, 429, { success: false, error: 'Too many notification requests. Please try again shortly.' });
    return;
  }
  if (!isRecord(request.body) || !isRecord(request.body.recipient)) {
    sendJson(response, 400, { success: false, error: 'A valid notification payload is required.' });
    return;
  }

  const body = request.body;
  if (typeof body.type === 'string' && body.type.startsWith('admin_')) {
    sendJson(response, 403, { success: false, error: 'Admin notifications are only sent from verified server-side events.' });
    return;
  }
  if (typeof body.type !== 'string' || !NOTIFICATION_TYPES.has(body.type as NotificationPayload['type'])) {
    sendJson(response, 400, { success: false, error: 'Unsupported notification type.' });
    return;
  }
  const recipient = body.recipient as Record<string, unknown>;
  const email = typeof recipient.email === 'string' ? recipient.email.trim().slice(0, 254) : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sendJson(response, 400, { success: false, error: 'A valid notification recipient email is required.' });
    return;
  }
  const data = isRecord(body.data) ? body.data : {};
  const channels: NonNullable<NotificationPayload['channels']> = Array.isArray(body.channels)
    ? body.channels.filter((channel): channel is NonNullable<NotificationPayload['channels']>[number] =>
        ['email', 'in_app', 'sms', 'whatsapp'].includes(String(channel))
      )
    : ['email'];

  try {
    const result = await dispatchServerNotification({
      type: body.type as NotificationPayload['type'],
      recipient: {
        name: typeof recipient.name === 'string' ? recipient.name.slice(0, 100) : 'Website visitor',
        email,
        phone: typeof recipient.phone === 'string' ? recipient.phone.slice(0, 32) : undefined,
      },
      title: typeof body.title === 'string' ? body.title.slice(0, 180) : undefined,
      message: typeof body.message === 'string' ? body.message.slice(0, 4000) : undefined,
      data,
      channels,
    });
    sendJson(response, result.success ? 200 : 502, { ...result });
  } catch (error) {
    console.error('[Notifications] Dispatch failed:', error);
    sendJson(response, 502, { success: false, error: 'Notification could not be dispatched.' });
  }
}
