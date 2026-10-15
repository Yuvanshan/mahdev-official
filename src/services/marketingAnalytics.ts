type Gtag = (...args: unknown[]) => void;
interface MetaPixel {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: MetaPixel;
  loaded?: boolean;
  version?: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: MetaPixel;
    _fbq?: MetaPixel;
    doNotTrack?: string;
  }

  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

let initialized = false;
let googleMeasurementId = '';
let metaPixelId = '';
const MARKETING_SITE_HOST = new URL(
  import.meta.env?.VITE_APP_URL || 'https://mahdev-official.vercel.app'
).hostname;

function hasTrackingOptOut(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  const dnt = navigator.doNotTrack || window.doNotTrack;
  return dnt === '1' || dnt === 'yes' || navigator.globalPrivacyControl === true;
}

function initializeMarketingAnalytics(): void {
  if (initialized || typeof window === 'undefined' || hasTrackingOptOut()) return;
  const hostname = window.location.hostname;
  if (hostname !== MARKETING_SITE_HOST) return;

  googleMeasurementId = import.meta.env?.VITE_GA_MEASUREMENT_ID || '';
  metaPixelId = import.meta.env?.VITE_META_PIXEL_ID || '';
  const validGoogleId = /^G-[A-Z0-9]+$/i.test(googleMeasurementId);
  const validMetaId = /^\d{5,20}$/.test(metaPixelId);
  if (!validGoogleId && !validMetaId) {
    initialized = true;
    return;
  }

  if (validGoogleId) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', googleMeasurementId, { send_page_view: false });

    if (!document.getElementById('mahdev-ga4-script')) {
      const script = document.createElement('script');
      script.id = 'mahdev-ga4-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleMeasurementId)}`;
      document.head.appendChild(script);
    }
  }

  if (validMetaId) {
    const pixel: MetaPixel = (...args: unknown[]) => {
      pixel.callMethod
        ? pixel.callMethod(...args)
        : pixel.queue?.push(args);
    };
    pixel.push = pixel;
    pixel.loaded = true;
    pixel.version = '2.0';
    pixel.queue = [];
    window.fbq = pixel;
    window._fbq = pixel;
    pixel('init', metaPixelId);

    if (!document.getElementById('mahdev-meta-pixel-script')) {
      const script = document.createElement('script');
      script.id = 'mahdev-meta-pixel-script';
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
  }

  initialized = true;
}

export function trackMarketingEvent(
  type: string,
  path: string,
  metadata: Record<string, unknown> = {}
): void {
  if (hasTrackingOptOut()) return;
  initializeMarketingAnalytics();

  const gaEventNames: Record<string, string> = {
    page_view: 'page_view',
    division_view: 'view_item',
    product_view: 'view_item',
    service_view: 'view_item',
    add_to_cart: 'add_to_cart',
    checkout_started: 'begin_checkout',
    purchase_completed: 'purchase',
    booking_started: 'booking_started',
    booking_completed: 'generate_lead',
    contact_submitted: 'generate_lead',
    quote_requested: 'generate_lead',
  };
  const metaEventNames: Record<string, string> = {
    page_view: 'PageView',
    division_view: 'ViewContent',
    product_view: 'ViewContent',
    service_view: 'ViewContent',
    add_to_cart: 'AddToCart',
    checkout_started: 'InitiateCheckout',
    purchase_completed: 'Purchase',
    booking_started: 'Schedule',
    booking_completed: 'Schedule',
    contact_submitted: 'Contact',
    quote_requested: 'Lead',
  };
  const allowedParameters = [
    'currency',
    'value',
    'total',
    'price',
    'itemCount',
    'quantity',
    'productId',
    'productName',
    'serviceId',
    'serviceName',
    'division',
    'divisionName',
    'category',
    'title',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
  ];
  const parameters = Object.fromEntries(
    Object.entries(metadata).filter(
      ([key, value]) => allowedParameters.includes(key) &&
        (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    )
  );

  if (type === 'page_view') {
    parameters.page_path = path;
    parameters.page_location = `${window.location.origin}${window.location.pathname}`;
    parameters.page_title = typeof metadata.title === 'string' ? metadata.title : document.title;
  } else {
    parameters.page_path = path;
  }
  const monetaryValue = type === 'purchase_completed'
    ? metadata.total
    : type === 'checkout_started'
      ? metadata.cartTotal
      : metadata.itemTotal ?? metadata.price;
  if (typeof monetaryValue === 'number' && Number.isFinite(monetaryValue)) {
    parameters.value = monetaryValue;
  }
  if (type === 'purchase_completed' && typeof metadata.orderId === 'string') {
    parameters.transaction_id = metadata.orderId;
  }

  const gaEventName = gaEventNames[type];
  if (gaEventName && googleMeasurementId && window.gtag) {
    window.gtag('event', gaEventName, parameters);
  }

  const metaEventName = metaEventNames[type];
  if (metaEventName && metaPixelId && window.fbq) {
    const metaParameters: Record<string, string | number | boolean> = {};
    if (typeof monetaryValue === 'number' && Number.isFinite(monetaryValue)) {
      metaParameters.value = monetaryValue;
    }
    if (typeof metadata.currency === 'string') metaParameters.currency = metadata.currency;
    if (typeof metadata.productId === 'string') metaParameters.content_ids = metadata.productId;
    if (typeof metadata.productName === 'string') metaParameters.content_name = metadata.productName;
    window.fbq('track', metaEventName, metaParameters);
  }
}
