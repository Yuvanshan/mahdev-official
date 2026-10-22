import type { IncomingMessage, ServerResponse } from 'node:http';

interface WebhookRequest extends IncomingMessage {
  method?: string;
  url?: string;
  body?: unknown;
}

interface WhatsAppInboundPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
}

// Keeps customer phone numbers out of the logs (GDPR); only the last 4 digits are shown.
function maskPhone(phone: string): string {
  return phone.length > 4 ? `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}` : '****';
}

// GET: Meta's one-time verification handshake when the webhook URL is saved.
// POST: inbound customer messages. Meta expects a 200 within a few seconds.
export default async function handler(req: WebhookRequest, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    const params = new URL(req.url || '/', 'http://localhost').searchParams;
    const mode = params.get('hub.mode');
    const token = params.get('hub.verify_token');
    const challenge = params.get('hub.challenge');

    if (verifyToken && mode === 'subscribe' && token === verifyToken && challenge) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(challenge);
      return;
    }

    if (!verifyToken) console.error('[WhatsApp Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set.');
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Forbidden');
    return;
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as WhatsAppInboundPayload;
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const fromPhone = message?.from;
    const text = message?.text?.body;

    if (text && fromPhone) {
      console.log(`[WhatsApp Inbound] from ${maskPhone(fromPhone)} (${text.length} chars)`);
      // TODO: process the message (e.g. Gemini AI reply or forward to the admin dashboard).
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'EVENT_RECEIVED' }));
    return;
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: 'Only GET and POST requests are supported.' }));
}
