/**
 * WhatsApp Business Cloud API sender (Server-side).
 *
 * Needs WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID. Meta only delivers
 * free-form text to customers who messaged the business in the last 24 hours;
 * for anyone else an approved template is required. Set
 * WHATSAPP_ORDER_TEMPLATE_NAME (and optionally WHATSAPP_TEMPLATE_LANGUAGE) to
 * send that template instead. Its body parameters are passed in order.
 */

import { getServerConfig } from '../config/serverEnv.js';
import { normaliseSriLankaPhone } from '../../src/utils/sriLankaIdentity.js';

const GRAPH_API_VERSION = 'v21.0';

export interface WhatsAppSendResult {
  delivered: boolean;
  notice?: string;
}

/** Digits-only international number (94771234567), or null when invalid. */
export function toWhatsAppNumber(phone: string): string | null {
  const local = normaliseSriLankaPhone(phone);
  if (local) return local.slice(1);
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/** wa.me click-to-chat link; always works, even without the Cloud API. */
export function whatsAppChatUrl(phone: string, text: string): string {
  const number = toWhatsAppNumber(phone) || '';
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export async function sendWhatsAppMessage(input: {
  phone: string;
  text: string;
  /** Body parameters for the approved template, when one is configured. */
  templateParams?: string[];
}): Promise<WhatsAppSendResult> {
  const token = getServerConfig().notifications.whatsappApiToken;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const to = toWhatsAppNumber(input.phone);
  if (!to) return { delivered: false, notice: 'The customer phone number is not a valid WhatsApp number.' };
  if (!token || !phoneNumberId) {
    return { delivered: false, notice: 'Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID to send WhatsApp messages automatically.' };
  }

  const templateName = process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
  const message = templateName
    ? {
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
          components: input.templateParams?.length
            ? [{ type: 'body', parameters: input.templateParams.map((text) => ({ type: 'text', text: text.slice(0, 1000) })) }]
            : [],
        },
      }
    : { type: 'text', text: { body: input.text.slice(0, 4096), preview_url: true } };

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, ...message }),
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return { delivered: true };
    const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
    console.error('[WhatsApp] Send failed:', response.status, body.error?.message);
    return { delivered: false, notice: body.error?.message || `WhatsApp API returned ${response.status}.` };
  } catch (error) {
    console.error('[WhatsApp] Send failed:', error);
    return { delivered: false, notice: 'WhatsApp API could not be reached.' };
  }
}
