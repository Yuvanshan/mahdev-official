/**
 * WhatsApp Inquiry Utility for Mahdev Enterprise & Child Divisions
 * Official WhatsApp Contact: 0750928078 (Sri Lanka +94 75 092 8078)
 */

export const MAHDEV_WHATSAPP_NUMBER = '94750928078'; // WhatsApp international format
export const MAHDEV_DISPLAY_PHONE = '075 092 8078';

export interface WhatsAppInquiryOptions {
  title: string;
  category?: string;
  divisionName?: string;
  imageUrl?: string;
  price?: string | number;
  description?: string;
  location?: string;
  type?: 'gallery' | 'service' | 'portfolio' | 'product' | 'general';
}

/**
 * Builds a formatted WhatsApp text message with image link and inquiry details
 */
export function buildWhatsAppMessage(options: WhatsAppInquiryOptions): string {
  const lines: string[] = [];

  lines.push('👋 *Hello Mahdev Group,*');
  lines.push('');
  lines.push(`I would like to inquire regarding: *${options.title}*`);

  if (options.divisionName) {
    lines.push(`🏢 *Division:* ${options.divisionName}`);
  }

  if (options.category) {
    lines.push(`🏷️ *Category:* ${options.category}`);
  }

  if (options.price) {
    const formattedPrice =
      typeof options.price === 'number'
        ? `LKR ${options.price.toLocaleString()}`
        : options.price;
    lines.push(`💰 *Reference Price:* ${formattedPrice}`);
  }

  if (options.location) {
    lines.push(`📍 *Location:* ${options.location}`);
  }

  if (options.description) {
    const cleanDesc = options.description.length > 180
      ? options.description.slice(0, 180) + '...'
      : options.description;
    lines.push(`📝 *Details:* ${cleanDesc}`);
  }

  // Include direct image reference so WhatsApp preview renders or owner can view
  if (options.imageUrl && options.imageUrl.trim() !== '') {
    lines.push('');
    lines.push(`📸 *Reference Image / Photo:*`);
    lines.push(options.imageUrl);
  }

  lines.push('');
  lines.push('Kindly provide availability, booking details, and quotation. Thank you!');

  return lines.join('\n');
}

/**
 * Returns the complete wa.me URL for the inquiry
 */
export function getWhatsAppInquiryUrl(options: WhatsAppInquiryOptions): string {
  const message = buildWhatsAppMessage(options);
  return `https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Opens the WhatsApp inquiry directly in a new window or app
 */
export function openWhatsAppInquiry(options: WhatsAppInquiryOptions): void {
  const url = getWhatsAppInquiryUrl(options);
  window.open(url, '_blank', 'noopener,noreferrer');
}
