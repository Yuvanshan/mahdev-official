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
  sku?: string;
  imageUrl?: string;
  itemUrl?: string;
  productUrl?: string;
  price?: string | number;
  description?: string;
  location?: string;
  type?: 'gallery' | 'service' | 'portfolio' | 'product' | 'package' | 'booking' | 'general';
  bookingId?: string;
  packageName?: string;
  date?: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerNotes?: string;
  venue?: string;
}

export interface WhatsAppOrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  selectedVariant?: string;
  imageUrl?: string;
  itemUrl?: string;
}

export interface WhatsAppOrderPayload {
  orderId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  city?: string;
  notes?: string;
  items: WhatsAppOrderItem[];
  subtotal: number;
  shippingFee?: number;
  discount?: number;
  grandTotal: number;
}

/**
 * Derives a clean, lookup-friendly SKU code from titles when an explicit SKU is omitted
 */
export function deriveLookupSku(title?: string, divisionName?: string): string {
  const prefix = divisionName
    ? String(divisionName).replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase()
    : 'MDV';
  const cleanTitle = title
    ? String(title).replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()
    : 'ITEM';
  return `${prefix || 'MDV'}-${cleanTitle || 'REF'}`;
}

/**
 * Ensures an image URL is formatted as a direct JPEG link so WhatsApp unfurls the image preview
 */
export function formatToJpegUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('data:')) return '';
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('unsplash.com')) {
      url.searchParams.set('fm', 'jpg');
      url.searchParams.set('q', '85');
      url.searchParams.set('auto', 'format');
      return url.toString();
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Resolves a direct canonical link for the item so the recipient can click and view it directly
 */
export function resolveItemDirectUrl(options: WhatsAppInquiryOptions, effectiveSku: string): string {
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://mahdev.lk';

  if (options.itemUrl) {
    if (options.itemUrl.startsWith('http')) return options.itemUrl;
    return `${origin}${options.itemUrl.startsWith('/') ? '' : '/'}${options.itemUrl}`;
  }
  if (options.productUrl) {
    if (options.productUrl.startsWith('http')) return options.productUrl;
    return `${origin}${options.productUrl.startsWith('/') ? '' : '/'}${options.productUrl}`;
  }

  if (options.type === 'product') {
    return `${origin}/catalog?sku=${encodeURIComponent(effectiveSku)}`;
  }
  if (options.type === 'service') {
    return `${origin}/services?sku=${encodeURIComponent(effectiveSku)}`;
  }
  if (options.type === 'package') {
    return `${origin}/services?packageSku=${encodeURIComponent(effectiveSku)}`;
  }
  if (options.type === 'portfolio') {
    return `${origin}/portfolio?sku=${encodeURIComponent(effectiveSku)}`;
  }
  if (options.type === 'gallery') {
    return `${origin}/gallery?sku=${encodeURIComponent(effectiveSku)}`;
  }
  if (options.type === 'booking') {
    return `${origin}/book`;
  }

  // If general division inquiry
  const targetDivision = (options.divisionName || '').trim().toLowerCase();
  if (targetDivision.includes('sws') || targetDivision.includes('event')) {
    return `${origin}/sws`;
  }
  if (targetDivision.includes('u1') || targetDivision.includes('cinema') || targetDivision.includes('studio')) {
    return `${origin}/u1`;
  }
  if (targetDivision.includes('it') || targetDivision.includes('tech') || targetDivision.includes('software')) {
    return `${origin}/it`;
  }
  if (targetDivision.includes('travel') || targetDivision.includes('safari')) {
    return `${origin}/travels`;
  }
  if (targetDivision.includes('mart')) {
    return `${origin}/mart`;
  }

  if (typeof window !== 'undefined' && window.location.href.startsWith('http')) {
    return window.location.href;
  }
  return `${origin}/catalog`;
}

/**
 * Builds a formatted WhatsApp text message with SKU, clickable direct link, and direct JPEG image URL
 */
export function buildWhatsAppMessage(options: WhatsAppInquiryOptions): string {
  const lines: string[] = [];
  const effectiveSku = options.sku || deriveLookupSku(options.title, options.divisionName);
  const isBooking = options.type === 'booking' || Boolean(options.bookingId || options.date || options.packageName);

  const targetDivision = (options.divisionName || '').trim();
  let divisionGreeting = 'Mahdev Group';
  const lowerDiv = targetDivision.toLowerCase();

  if (lowerDiv === 'sws' || lowerDiv.includes('sws') || lowerDiv.includes('event')) {
    divisionGreeting = 'SWS Event Management';
  } else if (lowerDiv === 'u1' || lowerDiv.includes('u1') || lowerDiv.includes('cinema') || lowerDiv.includes('studio')) {
    divisionGreeting = 'U1 Cinema & Studio';
  } else if (lowerDiv === 'it' || lowerDiv.includes('software') || lowerDiv.includes('tech') || lowerDiv.includes('cloud')) {
    divisionGreeting = 'Mahdev IT & Software';
  } else if (lowerDiv === 'travels' || lowerDiv.includes('travel') || lowerDiv.includes('tour') || lowerDiv.includes('safari')) {
    divisionGreeting = 'Mahdev Travels';
  } else if (lowerDiv === 'mart' || lowerDiv.includes('mart') || lowerDiv.includes('store') || lowerDiv.includes('shop')) {
    divisionGreeting = 'Mahdev Online Mart';
  } else if (targetDivision) {
    divisionGreeting = targetDivision;
  }

  if (isBooking) {
    lines.push(`🗓️ *NEW SERVICE BOOKING REQUEST — ${divisionGreeting.toUpperCase()}*`);
    lines.push('================================');
    if (options.bookingId) {
      lines.push(`🆔 *Booking Ref:* \`${options.bookingId}\``);
    }
    lines.push(`🎯 *Service Requested:* *${options.title}*`);
    lines.push(`🔢 *Service SKU:* \`${effectiveSku}\``);
    if (options.packageName) {
      lines.push(`📦 *Package Tier:* ${options.packageName}`);
    }
    if (options.date) {
      lines.push(`📅 *Date:* ${options.date}`);
    }
    if (options.time) {
      lines.push(`⏰ *Time Slot:* ${options.time}`);
    }
    if (options.location || options.venue) {
      lines.push(`📍 *Location / Venue:* ${options.location || options.venue}`);
    }
    if (options.customerName) {
      lines.push(`👤 *Client Name:* ${options.customerName}`);
    }
    if (options.customerPhone) {
      lines.push(`📞 *Client Contact:* ${options.customerPhone}`);
    }
    if (options.price !== undefined && options.price !== '') {
      const formattedPrice =
        typeof options.price === 'number'
          ? `Rs. ${options.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} (LKR)`
          : String(options.price);
      lines.push(`💰 *Rate:* ${formattedPrice}`);
    }
  } else {
    lines.push(`👋 *Hello ${divisionGreeting},*`);
    lines.push('');
    lines.push(`I would like to inquire regarding: *${options.title}*`);
    lines.push(`🔢 *SKU / Item Code:* \`${effectiveSku}\``);

    if (options.divisionName) {
      lines.push(`🏢 *Division:* ${options.divisionName}`);
    }

    if (options.category) {
      lines.push(`🏷️ *Category:* ${options.category}`);
    }

    if (options.price !== undefined && options.price !== '') {
      const formattedPrice =
        typeof options.price === 'number'
          ? `Rs. ${options.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} (LKR)`
          : String(options.price);
      lines.push(`💰 *Price:* ${formattedPrice}`);
    }

    if (options.location) {
      lines.push(`📍 *Location:* ${options.location}`);
    }

    if (options.description) {
      const cleanDesc =
        options.description.length > 200
          ? options.description.slice(0, 200) + '...'
          : options.description;
      lines.push(`📝 *Details:* ${cleanDesc}`);
    }
  }

  // Direct Product / Item Web Link
  const directLink = resolveItemDirectUrl(options, effectiveSku);
  if (directLink) {
    lines.push('');
    lines.push(`🔗 *View on Website:* ${directLink}`);
  }

  // Direct JPEG Image Link (WhatsApp generates a rich media card preview)
  const jpegUrl = formatToJpegUrl(options.imageUrl);
  if (jpegUrl) {
    lines.push(`🖼️ *Image Preview (JPEG):* ${jpegUrl}`);
  }

  if (options.customerNotes) {
    lines.push('');
    lines.push(`💬 *Client Note:* ${options.customerNotes}`);
  }

  lines.push('');
  lines.push('================================');
  lines.push('Please confirm availability, scheduling, and quote via WhatsApp (075 092 8078). Thank you!');

  return lines.join('\n');
}

/**
 * Builds an official WhatsApp Order message formatted with each item's SKU number and totals in LKR
 */
export function buildWhatsAppOrderMessage(payload: WhatsAppOrderPayload): string {
  const lines: string[] = [];
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://mahdev.lk';

  lines.push('🛒 *NEW ORDER REQUEST — MAHDEV ECOSYSTEM*');
  lines.push('================================');
  if (payload.orderId) {
    lines.push(`🆔 *Order Reference:* \`${payload.orderId}\``);
    lines.push(`🔗 *View / Track Order:* ${origin}/order/${payload.orderId}`);
  }
  lines.push(`👤 *Customer:* ${payload.customerName || 'Valued Customer'}`);
  lines.push(`📞 *Contact Phone:* ${payload.customerPhone || 'Not provided'}`);
  if (payload.deliveryAddress) {
    lines.push(`📍 *Delivery Address:* ${payload.deliveryAddress}${payload.city ? `, ${payload.city}` : ''}`);
  }
  lines.push('');
  lines.push('📦 *ORDERED ITEMS (WITH SKU NUMBERS):*');

  payload.items.forEach((item, index) => {
    const itemTotal = (item.price * item.quantity).toLocaleString('en-US', {
      minimumFractionDigits: 2,
    });
    const itemSku = item.sku || deriveLookupSku(item.name);
    const skuTag = `[SKU: \`${itemSku}\`]`;
    const itemDirectUrl = item.itemUrl || `${origin}/catalog?sku=${encodeURIComponent(itemSku)}`;

    let line = `${index + 1}. ${skuTag} *${item.name}*` +
      (item.selectedVariant ? ` (${item.selectedVariant})` : '') +
      `\n   • Qty: ${item.quantity} × Rs. ${item.price.toLocaleString()} = *Rs. ${itemTotal}*` +
      `\n   • Link: ${itemDirectUrl}`;

    const itemImg = formatToJpegUrl(item.imageUrl);
    if (itemImg) {
      line += `\n   • Photo: ${itemImg}`;
    }
    lines.push(line);
  });

  lines.push('');
  lines.push('💰 *FINANCIAL SUMMARY (LKR):*');
  lines.push(`• Subtotal: Rs. ${payload.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);

  if (payload.discount && payload.discount > 0) {
    lines.push(`• Savings / Discount: -Rs. ${payload.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  }

  if (payload.shippingFee !== undefined) {
    lines.push(
      `• Islandwide Delivery: ${
        payload.shippingFee === 0
          ? 'FREE'
          : `Rs. ${payload.shippingFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      }`
    );
  }

  lines.push(
    `👉 *GRAND TOTAL:* *Rs. ${payload.grandTotal.toLocaleString('en-US', {
      minimumFractionDigits: 2,
    })} (LKR)*`
  );

  if (payload.notes && payload.notes.trim() !== '') {
    lines.push('');
    lines.push(`📝 *Customer Notes:* ${payload.notes.trim()}`);
  }

  lines.push('================================');
  lines.push('Please confirm stock availability, order receipt, and estimated dispatch time. Thank you!');

  return lines.join('\n');
}

/**
 * Resolves the appropriate division greeting string for WhatsApp inquiries
 */
export function getDivisionGreeting(divisionIdOrName?: string): string {
  const targetDivision = (divisionIdOrName || '').trim();
  const lowerDiv = targetDivision.toLowerCase();

  if (lowerDiv === 'sws' || lowerDiv.includes('sws') || lowerDiv.includes('event')) {
    return 'SWS Event Management';
  } else if (lowerDiv === 'u1' || lowerDiv.includes('u1') || lowerDiv.includes('cinema') || lowerDiv.includes('studio')) {
    return 'U1 Cinema & Studio';
  } else if (lowerDiv === 'it' || lowerDiv.includes('software') || lowerDiv.includes('tech') || lowerDiv.includes('cloud')) {
    return 'Mahdev IT & Software';
  } else if (lowerDiv === 'travels' || lowerDiv.includes('travel') || lowerDiv.includes('tour') || lowerDiv.includes('safari')) {
    return 'Mahdev Travels';
  } else if (lowerDiv === 'mart' || lowerDiv.includes('mart') || lowerDiv.includes('store') || lowerDiv.includes('shop')) {
    return 'Mahdev Online Mart';
  } else if (targetDivision) {
    return targetDivision;
  }
  return 'Mahdev Group';
}

/**
 * Returns a direct division WhatsApp inquiry URL with dynamic greeting
 * e.g., "Hello SWS Event Management"
 */
export function getDivisionWhatsAppUrl(divisionIdOrName?: string, customNote?: string): string {
  const greeting = getDivisionGreeting(divisionIdOrName);
  const text = customNote
    ? `Hello ${greeting}, ${customNote}`
    : `Hello ${greeting}`;
  return `https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/**
 * Returns the complete wa.me URL for the inquiry
 */
export function getWhatsAppInquiryUrl(options: WhatsAppInquiryOptions): string {
  const message = buildWhatsAppMessage(options);
  return `https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Returns the complete wa.me URL for a direct order
 */
export function getWhatsAppOrderUrl(payload: WhatsAppOrderPayload): string {
  const message = buildWhatsAppOrderMessage(payload);
  return `https://wa.me/${MAHDEV_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Opens the WhatsApp inquiry directly in a new window or app
 */
export function openWhatsAppInquiry(options: WhatsAppInquiryOptions): void {
  const url = getWhatsAppInquiryUrl(options);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens the WhatsApp order directly in a new window or app
 */
export function openWhatsAppOrder(payload: WhatsAppOrderPayload): void {
  const url = getWhatsAppOrderUrl(payload);
  window.open(url, '_blank', 'noopener,noreferrer');
}
