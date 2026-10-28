export function trafficSourceLabel(metadata?: Record<string, unknown>): string {
  const campaignSource = typeof metadata?.utm_source === 'string' ? metadata.utm_source.trim() : '';
  if (/^(whatsapp|wa)$/i.test(campaignSource)) return 'WhatsApp';
  if (campaignSource) return campaignSource;

  const host = typeof metadata?.referrerHost === 'string'
    ? metadata.referrerHost.toLowerCase().replace(/^www\./, '')
    : '';
  if (
    host === 'wa.me' ||
    host === 'com.whatsapp' ||
    host === 'whatsapp' ||
    host === 'whatsapp.com' ||
    host === 'whatsapp.net' ||
    host.endsWith('.whatsapp.com') ||
    host.endsWith('.whatsapp.net') ||
    host.endsWith('.wa.me')
  ) return 'WhatsApp';
  return host || 'Direct';
}

export function isWhatsAppTraffic(metadata?: Record<string, unknown>): boolean {
  return trafficSourceLabel(metadata).toLowerCase() === 'whatsapp';
}
