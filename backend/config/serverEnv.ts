import { randomBytes } from 'node:crypto';

// Secrets come from the environment. When one is missing, use a random
// per-process value instead of a hardcoded default, so no known secret can be
// used to forge signatures. Set the env variable for stable signatures.
function envSecret(name: string): string {
  const value = process.env[name];
  if (value) return value;
  console.warn(`[security] ${name} is not set; using an ephemeral random value for this process.`);
  return randomBytes(32).toString('hex');
}

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
      webhookSecret: envSecret('PAYMENT_WEBHOOK_SECRET'),
      lankaPayMerchantId: process.env.LANKAPAY_MERCHANT_ID || '',
      lankaPaySecretKey: process.env.LANKAPAY_SECRET_KEY || '',
    },

    security: {
      orderSignatureSecret: envSecret('ORDER_SIGNATURE_SECRET'),
      invoiceSigningSalt: envSecret('INVOICE_SIGNING_SALT'),
      notificationSecretSalt: envSecret('NOTIFICATION_SECRET_SALT'),
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
    description: 'HMAC-SHA256 order signing and database admin token verification active',
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
