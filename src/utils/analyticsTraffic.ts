export function trafficSourceLabel(metadata?: Record<string, unknown>): string {
  const campaignSource = typeof metadata?.utm_source === 'string' ? metadata.utm_source.trim() : '';
  const referrerHost = typeof metadata?.referrerHost === 'string' ? metadata.referrerHost.trim() : '';
  const source = (campaignSource || referrerHost)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/, 1)[0];

  if (!source || source === 'direct') return 'Direct';
  if (
    /^(whatsapp|wa|com\.whatsapp)$/.test(source) ||
    source === 'wa.me' ||
    source.endsWith('.wa.me') ||
    source === 'whatsapp.com' ||
    source.endsWith('.whatsapp.com') ||
    source === 'whatsapp.net' ||
    source.endsWith('.whatsapp.net')
  ) return 'WhatsApp';
  if (source === 'google' || /^google\./.test(source) || source.includes('.google.')) return 'Google';
  if (/^(facebook|fb|meta)$/.test(source) || /(^|\.)facebook\.com$/.test(source) || source === 'fb.com') return 'Facebook';
  if (/^(instagram|ig)$/.test(source) || /(^|\.)instagram\.com$/.test(source)) return 'Instagram';
  if (/^(youtube|youtu\.be)$/.test(source) || /(^|\.)youtube\.com$/.test(source)) return 'YouTube';
  if (source === 'tiktok' || /(^|\.)tiktok\.com$/.test(source)) return 'TikTok';
  if (source === 'linkedin' || /(^|\.)linkedin\.com$/.test(source)) return 'LinkedIn';
  if (source === 'twitter' || source === 'x' || source === 'x.com' || source === 't.co') return 'X';
  if (source === 'bing' || /(^|\.)bing\.com$/.test(source)) return 'Bing';

  return source.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function isWhatsAppTraffic(metadata?: Record<string, unknown>): boolean {
  return trafficSourceLabel(metadata).toLowerCase() === 'whatsapp';
}
