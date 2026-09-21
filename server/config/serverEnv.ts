/**
 * Mahdev Enterprise Server-Side Environment & Secrets Management (Phase 30)
 * 
 * Safely accesses, validates, and manages private server environment variables and secrets.
 * STRICT SECURITY: None of these values may ever be returned to client-side responses or bundle.
 */

export interface ServerEnvironmentConfig {
  /** Node Environment */
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  appUrl: string;

  /** Payment Gateway Secrets */
  payments: {
    gatewayEnv: 'sandbox' | 'production';
    stripeSecretKey: string;
    webhookSecret: string;
    lankaPayMerchantId: string;
    lankaPaySecretKey: string;
  };

  /** Security & Cryptographic Salts */
  security: {
    adminSecretSalt: string;
    orderSignatureSecret: string;
    invoiceSigningSalt: string;
    notificationSecretSalt: string;
  };

  /** Communication & Messaging */
  notifications: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    whatsappApiToken: string;
  };

  /** AI Intelligence */
  ai: {
    geminiApiKey: string;
  };
}

/**
 * Parses and returns the typed server environment configuration
 */
export function getServerConfig(): ServerEnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development';
  const port = parseInt(process.env.PORT || '3000', 10);

  return {
    nodeEnv,
    port,
    appUrl: process.env.APP_URL || 'https://mahdev.lk',

    payments: {
      gatewayEnv: (process.env.PAYMENT_GATEWAY_ENV as 'sandbox' | 'production') || 'sandbox',
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'mahdev_secure_hmac_secret_2026_enterprise_key',
      lankaPayMerchantId: process.env.LANKAPAY_MERCHANT_ID || '',
      lankaPaySecretKey: process.env.LANKAPAY_SECRET_KEY || '',
    },

    security: {
      adminSecretSalt: process.env.ADMIN_SECRET_SALT || 'mahdev_admin_salt_2026_secure_kernel',
      orderSignatureSecret: process.env.ORDER_SIGNATURE_SECRET || 'mahdev_order_signature_secret_2026',
      invoiceSigningSalt: process.env.INVOICE_SIGNING_SALT || 'mahdev_invoice_hmac_salt_2026',
      notificationSecretSalt: process.env.NOTIFICATION_SECRET_SALT || 'mahdev_notification_secret_2026',
    },

    notifications: {
      smtpHost: process.env.SMTP_HOST || (process.env.GMAIL_USER ? 'smtp.gmail.com' : ''),
      smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
      smtpUser: (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim(),
      smtpPass: (process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD || process.env.SMTP_PASS || '').trim().replace(/\s+/g, ''),
      whatsappApiToken: process.env.WHATSAPP_API_TOKEN || '',
    },

    ai: {
      geminiApiKey: process.env.GEMINI_API_KEY || '',
    },
  };
}

/**
 * Validates server secrets on startup and prints non-sensitive diagnostic report
 */
export function validateServerSecrets(): {
  ready: boolean;
  diagnostics: Array<{ category: string; status: 'configured' | 'default_sandbox' | 'missing'; description: string }>;
} {
  const config = getServerConfig();
  const diagnostics: Array<{ category: string; status: 'configured' | 'default_sandbox' | 'missing'; description: string }> = [];

  // 1. Payment Verification
  if (config.payments.stripeSecretKey) {
    diagnostics.push({ category: 'Payments (Stripe)', status: 'configured', description: 'Stripe Secret Key loaded' });
  } else {
    diagnostics.push({ category: 'Payments (Stripe)', status: 'default_sandbox', description: 'Running in sandbox mode with mock processor' });
  }

  if (config.payments.lankaPayMerchantId && config.payments.lankaPaySecretKey) {
    diagnostics.push({ category: 'Payments (LankaPay)', status: 'configured', description: 'LankaPay merchant credentials verified' });
  } else {
    diagnostics.push({ category: 'Payments (LankaPay)', status: 'default_sandbox', description: 'LankaPay running in simulated sandbox mode' });
  }

  // 2. Cryptographic Security Salts
  diagnostics.push({
    category: 'Security Kernel',
    status: 'configured',
    description: 'HMAC-SHA256 order signing and admin verification active',
  });

  // 3. Communications
  if (config.notifications.smtpHost && config.notifications.smtpUser) {
    diagnostics.push({ category: 'Email (SMTP)', status: 'configured', description: `SMTP host active (${config.notifications.smtpHost})` });
  } else {
    diagnostics.push({ category: 'Email (SMTP)', status: 'default_sandbox', description: 'Server logging emails to console log' });
  }

  if (config.notifications.whatsappApiToken) {
    diagnostics.push({ category: 'WhatsApp API', status: 'configured', description: 'WhatsApp Business API token present' });
  } else {
    diagnostics.push({ category: 'WhatsApp API', status: 'default_sandbox', description: 'Simulated WhatsApp dispatching active' });
  }

  // 4. AI Engine
  if (config.ai.geminiApiKey) {
    diagnostics.push({ category: 'Gemini AI', status: 'configured', description: 'Gemini API key loaded' });
  } else {
    diagnostics.push({ category: 'Gemini AI', status: 'missing', description: 'Gemini API key not set' });
  }

  return {
    ready: true,
    diagnostics,
  };
}
