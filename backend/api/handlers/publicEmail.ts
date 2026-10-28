import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendEnquiryEmail } from '../../services/emailService.js';
import { isPublicEmailRequestAllowed } from '../publicEmailRateLimit.js';

interface PublicEmailRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function field(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export default async function handler(
  request: PublicEmailRequest,
  response: ServerResponse
): Promise<void> {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { success: false, error: 'Only POST requests are supported.' });
    return;
  }
  if (!(await isPublicEmailRequestAllowed(request))) {
    sendJson(response, 429, { success: false, error: 'Too many email requests. Please try again shortly.' });
    return;
  }
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    sendJson(response, 400, { success: false, error: 'A valid inquiry payload is required.' });
    return;
  }

  const body = request.body as Record<string, unknown>;
  const senderName = field(body.fullName || body.name, 100) || 'Website Visitor';
  const senderEmail = field(body.email, 254);
  const senderPhone = field(body.phone, 32);
  const message = field(body.message || body.requirements || body.notes, 4000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail) || !message) {
    sendJson(response, 400, { success: false, error: 'A valid email address and inquiry message are required.' });
    return;
  }

  try {
    const result = await sendEnquiryEmail({
      senderName,
      senderEmail,
      senderPhone,
      division: field(body.division, 80),
      service: field(body.service || body.serviceName, 120),
      subject: field(body.subject, 180) || 'Website inquiry',
      message,
      referenceId: field(body.referenceId || body.id, 80),
      preferredDate: field(body.preferredDate || body.date, 80),
      budget: field(body.budget, 80),
      receivedAt: new Date().toISOString(),
    });
    if (!result.delivered) {
      sendJson(response, 503, {
        success: false,
        error: result.notice || 'Inquiry was recorded, but email delivery is not configured.',
        referenceId: field(body.referenceId || body.id, 80),
      });
      return;
    }
    sendJson(response, 200, {
      success: true,
      referenceId: field(body.referenceId || body.id, 80),
      // The team mailbox address is not returned to visitors.
    });
  } catch (error) {
    console.error('[Public Email] Inquiry delivery failed:', error);
    sendJson(response, 502, { success: false, error: 'The inquiry email could not be delivered.' });
  }
}
