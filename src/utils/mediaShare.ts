import { openWhatsAppInquiry, formatToJpegUrl, deriveLookupSku } from './whatsapp';

export interface MediaAssetSharePayload {
  id?: string;
  title: string;
  url: string;
  imageUrl?: string;
  category?: string;
  division?: string;
  divisionName?: string;
  type?: string;
  description?: string;
  dimensions?: string;
  fileSize?: string;
  sku?: string;
}

export interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard';
  message: string;
}

/**
 * Resolves a direct canonical share URL for a media asset
 */
export function getMediaAssetShareUrl(asset: MediaAssetSharePayload): string {
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://mahdev.lk';
  const effectiveSku = asset.sku || (asset.id ? `MED-${(asset.division || 'U1').toUpperCase()}-${asset.id.slice(-6).toUpperCase()}` : deriveLookupSku(asset.title, asset.division));
  
  return `${origin}/gallery?sku=${encodeURIComponent(effectiveSku)}&title=${encodeURIComponent(asset.title)}`;
}

/**
 * Shares a media asset using native Web Share API where supported, or copies the direct link to the clipboard.
 */
export async function shareMediaAsset(asset: MediaAssetSharePayload): Promise<ShareResult> {
  const shareUrl = getMediaAssetShareUrl(asset);
  const shareTitle = `${asset.title} | Mahdev Media Archive`;
  const shareText = asset.description
    ? `${asset.title}: ${asset.description}`
    : `Check out "${asset.title}" from Mahdev ${asset.division ? asset.division.toUpperCase() : 'Studio'} Archive!`;

  // 1. Try Native Web Share API (Mobile phones, modern tablets, supported browsers)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return {
        success: true,
        method: 'native',
        message: 'Media asset shared successfully!',
      };
    } catch (err: any) {
      // User cancelled share dialog (AbortError) - don't treat as error
      if (err?.name === 'AbortError') {
        return {
          success: false,
          method: 'native',
          message: 'Share cancelled',
        };
      }
      console.warn('[shareMediaAsset] Native share fallback to clipboard:', err);
    }
  }

  // 2. Fallback: Copy direct share link to clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return {
        success: true,
        method: 'clipboard',
        message: 'Share link copied to clipboard!',
      };
    } else {
      // Legacy document.execCommand fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return {
        success: true,
        method: 'clipboard',
        message: 'Share link copied to clipboard!',
      };
    }
  } catch (clipErr) {
    console.error('[shareMediaAsset] Clipboard copy error:', clipErr);
    return {
      success: false,
      method: 'clipboard',
      message: 'Could not copy link automatically.',
    };
  }
}

/**
 * Directly initiates a WhatsApp inquiry for any media asset across U1 Studio or any division
 */
export function inquireMediaAssetOnWhatsApp(asset: MediaAssetSharePayload): void {
  const effectiveSku = asset.sku || (asset.id ? `MED-${(asset.division || 'U1').toUpperCase()}-${asset.id.slice(-6).toUpperCase()}` : deriveLookupSku(asset.title, asset.division));
  
  let divisionName = 'U1 Cinema & Studio';
  const divLower = (asset.division || '').toLowerCase();
  if (divLower.includes('sws') || divLower.includes('event')) {
    divisionName = 'SWS Event Management';
  } else if (divLower.includes('it') || divLower.includes('software') || divLower.includes('tech')) {
    divisionName = 'Mahdev IT & Software';
  } else if (divLower.includes('travel') || divLower.includes('tour')) {
    divisionName = 'Mahdev Travels';
  } else if (divLower.includes('mart')) {
    divisionName = 'Mahdev Online Mart';
  } else if (asset.division) {
    divisionName = asset.division;
  }

  openWhatsAppInquiry({
    title: asset.title,
    sku: effectiveSku,
    category: asset.category || 'Studio Media Asset',
    divisionName,
    imageUrl: formatToJpegUrl(asset.url),
    itemUrl: getMediaAssetShareUrl(asset),
    description: asset.description || (asset.dimensions ? `Master Format: ${asset.dimensions}` : undefined),
    location: asset.dimensions ? `Resolution: ${asset.dimensions}` : undefined,
    type: 'media',
  });
}
