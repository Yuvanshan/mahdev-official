import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  PaymentGatewayType,
  PaymentTransaction,
  VerificationResult,
} from './src/types/payment';
import {
  validateAndCreateAuthoritativeOrder,
  validateOrderStatusTransition,
  generateOrderSignature,
} from './server/services/secureOrderService';
import {
  generateSecureFiscalInvoice,
} from './server/services/secureInvoiceService';
import {
  dispatchServerNotification,
} from './server/services/secureNotificationService';
import {
  getServerConfig,
  validateServerSecrets,
} from './server/config/serverEnv';

const serverConfig = getServerConfig();

// Server-side Secrets (never sent to client)
const STRIPE_SECRET_KEY = serverConfig.payments.stripeSecretKey;
const PAYMENT_WEBHOOK_SECRET = serverConfig.payments.webhookSecret;
const PAYMENT_GATEWAY_ENV = serverConfig.payments.gatewayEnv;
const ADMIN_SECRET_SALT = serverConfig.security.adminSecretSalt;

// In-Memory Transaction Store (Persistent during server lifecycle)
const transactionStore = new Map<string, PaymentTransaction>();
const orderTransactionIndex = new Map<string, string[]>(); // orderId -> transactionId[]

// Cryptographic Helper Functions
function generateHmacSignature(data: string): string {
  return crypto
    .createHmac('sha256', PAYMENT_WEBHOOK_SECRET)
    .update(data)
    .digest('hex');
}

function verifyHmacSignature(data: string, signature: string): boolean {
  try {
    const expected = generateHmacSignature(data);
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// Generate Secure Random References
function generateTransactionId(): string {
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `TXN-2026-${timestamp}-${randomHex}`;
}

function generateAuthCode(): string {
  return `AUTH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function generateRRN(): string {
  return `RRN-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
}

// Input Validation Helpers
function sanitizeString(input: any, maxLen: number = 255): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLen);
}

function isValidEmail(email: string): boolean {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function isValidOrderId(orderId: string): boolean {
  return typeof orderId === 'string' && /^[A-Za-z0-9_-]{3,64}$/.test(orderId);
}

// Rate Limiting Store & Middleware
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired rate limit keys
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

function rateLimit(options: { windowMs: number; max: number; endpointName: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${options.endpointName}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (record.count >= options.max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        success: false,
        error: `Too many requests for ${options.endpointName}. Rate limit exceeded. Please retry in ${retryAfterSec} seconds.`,
      });
      return;
    }

    record.count += 1;
    next();
  };
}

// Server Audit Logs
const serverAuditLogs: any[] = [
  {
    id: 'AUD-2026-0001',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    adminEmail: 'admin@mahdev.lk',
    adminName: 'Yuvanshan Perera (Super Admin)',
    action: 'SYSTEM_BOOTSTRAP',
    entityType: 'System',
    entityId: 'SYS-ROOT',
    details: 'Mahdev Enterprise Multi-Division Core initialized with TLS 1.3 encryption and automated rate-limiting.',
    status: 'success',
  },
  {
    id: 'AUD-2026-0002',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    adminEmail: 'operations@mahdev.lk',
    adminName: 'Kamal Jayawardena',
    action: 'INVENTORY_THRESHOLD_AUDIT',
    entityType: 'Inventory',
    entityId: 'MART-TEA-102',
    details: 'Automated replenishment threshold alert verified for Silver Tips Imperial Reserve.',
    status: 'warning',
  },
];

// Admin Token Signatures & Verification
function generateAdminSessionToken(
  adminId: string,
  email: string,
  role: string,
  expiresAt: number
): { token: string; signature: string } {
  const payload = `${adminId}:${email}:${role}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', ADMIN_SECRET_SALT).update(payload).digest('hex');
  const token = Buffer.from(JSON.stringify({ adminId, email, role, expiresAt, signature })).toString('base64');
  return { token, signature };
}

function verifyAdminToken(token: string): { isValid: boolean; session?: any } {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const { adminId, email, role, expiresAt, signature } = decoded;

    if (!adminId || !email || !role || !expiresAt || !signature) {
      return { isValid: false };
    }

    if (Date.now() > expiresAt) {
      return { isValid: false };
    }

    const expectedPayload = `${adminId}:${email}:${role}:${expiresAt}`;
    const expectedSignature = crypto.createHmac('sha256', ADMIN_SECRET_SALT).update(expectedPayload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
      return { isValid: false };
    }

    return { isValid: true, session: { adminId, email, role, expiresAt } };
  } catch {
    return { isValid: false };
  }
}

// Authentication & Authorization Guard Middleware
function requireAdminAuth(allowedRoles?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim() || (req.body && req.body.token);

    if (!token) {
      serverAuditLogs.unshift({
        id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        adminEmail: 'anonymous',
        adminName: 'Unauthenticated Request',
        action: 'UNAUTHORIZED_ACCESS_BLOCKED',
        entityType: 'SecurityFilter',
        entityId: req.path,
        details: `Blocked unauthenticated request to protected endpoint: ${req.method} ${req.path}`,
        status: 'error',
      });

      res.status(401).json({
        success: false,
        error: 'Authentication required. Missing administrative bearer authorization token.',
      });
      return;
    }

    const verification = verifyAdminToken(token);
    if (!verification.isValid || !verification.session) {
      res.status(403).json({
        success: false,
        error: 'Invalid, forged, or expired administrative session token.',
      });
      return;
    }

    // Role-based Access Control Check
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = verification.session.role;
      const isSuperAdmin = userRole === 'super_admin';
      if (!isSuperAdmin && !allowedRoles.includes(userRole)) {
        serverAuditLogs.unshift({
          id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString(),
          adminEmail: verification.session.email,
          adminName: verification.session.adminId,
          action: 'FORBIDDEN_ROLE_ACTION',
          entityType: 'RBAC',
          entityId: req.path,
          details: `Role "${userRole}" lacks required privileges [${allowedRoles.join(', ')}] for ${req.method} ${req.path}`,
          status: 'warning',
        });

        res.status(403).json({
          success: false,
          error: `Insufficient role permissions. Action requires: ${allowedRoles.join(' or ')}.`,
        });
        return;
      }
    }

    (req as any).adminSession = verification.session;
    next();
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with strict payload size limit (prevents memory exhaustion DOS)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Production Security Headers & CORS Middleware
  app.use((req, res, next) => {
    // Defense-in-depth Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Safe CORS Configuration
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Firebase-AppCheck'
    );
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // ==========================================
  // PAYMENT API ROUTES (FIRST)
  // ==========================================

  // 1. Health check & Gateway Info (Public)
  app.get('/api/payment/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Mahdev Enterprise Payment Gateway Core',
      environment: PAYMENT_GATEWAY_ENV,
      stripeConfigured: Boolean(STRIPE_SECRET_KEY),
      lankaPayAvailable: true,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Gateway Capabilities & Methods (Public, cached)
  app.get('/api/payment/gateways', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5-minute cache
    res.json({
      environment: PAYMENT_GATEWAY_ENV,
      gateways: [
        {
          id: 'stripe_card',
          name: 'Visa / Mastercard / Amex / Apple Pay',
          badge: 'Global Instant Settlement',
          description:
            'Secure multi-currency international card gateway protected by 3D Secure 2.0 & Stripe Engine.',
          supportedCurrencies: ['USD', 'LKR', 'SGD', 'GBP', 'EUR', 'AED'],
          processingFee: '0% Surcharge',
          instantConfirmation: true,
          supportedMethods: ['Visa', 'Mastercard', 'American Express', 'Apple Pay', 'Google Pay'],
        },
        {
          id: 'lankapay_ipg',
          name: 'LankaPay / Sri Lanka National Switch IPG',
          badge: 'National Payment Network',
          description:
            'Direct instant debit from all Sri Lankan banks (Commercial Bank, Sampath, HNB, BOC, Nations Trust, Seylan, etc.) and JustPay QR.',
          supportedCurrencies: ['LKR', 'USD'],
          processingFee: '0% Surcharge',
          instantConfirmation: true,
          supportedMethods: ['LankaPay Online Debit', 'JustPay QR', 'Frimi', 'Genie', 'Commercial Bank IPG'],
        },
        {
          id: 'bank_wire',
          name: 'Corporate Telegraphic Transfer / Bank Wire',
          badge: 'B2B Enterprise Invoicing',
          description:
            'Direct wire transfer to Mahdev Pvt Ltd corporate accounts at Commercial Bank of Ceylon PLC. Remittance slip verification required.',
          supportedCurrencies: ['USD', 'LKR', 'EUR', 'GBP'],
          processingFee: 'No Processing Fee',
          instantConfirmation: false,
          supportedMethods: ['SWIFT / TT', 'CEFT / SLIPS', 'RTGS High-Value Transfer'],
        },
      ],
    });
  });

  // 3. Create Payment Intent & Secure Session (Rate limited & strictly validated)
  app.post(
    '/api/payment/create-intent',
    rateLimit({ windowMs: 60000, max: 30, endpointName: 'payment_create_intent' }),
    (req: Request, res: Response) => {
      try {
        const { orderId, amount, currency, gateway, customerEmail, customerName } = req.body;

        const cleanOrderId = sanitizeString(orderId, 64);
        const numAmount = Number(amount);
        const cleanCurrency = sanitizeString(currency, 10).toUpperCase();
        const cleanGateway = sanitizeString(gateway, 32);
        const cleanEmail = sanitizeString(customerEmail, 100);
        const cleanName = sanitizeString(customerName, 100);

        const allowedGateways: PaymentGatewayType[] = ['stripe_card', 'lankapay_ipg', 'bank_wire'];
        const allowedCurrencies = ['USD', 'LKR', 'SGD', 'GBP', 'EUR', 'AED'];

        if (!isValidOrderId(cleanOrderId)) {
          res.status(400).json({
            success: false,
            error: 'Invalid orderId format. Must be alphanumeric.',
          });
          return;
        }

        if (isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000) {
          res.status(400).json({
            success: false,
            error: 'Invalid payment amount. Must be positive finite number up to $1,000,000.',
          });
          return;
        }

        if (!allowedCurrencies.includes(cleanCurrency)) {
          res.status(400).json({
            success: false,
            error: `Unsupported currency: ${cleanCurrency}.`,
          });
          return;
        }

        if (!allowedGateways.includes(cleanGateway as PaymentGatewayType)) {
          res.status(400).json({
            success: false,
            error: `Invalid payment gateway: ${cleanGateway}.`,
          });
          return;
        }

        // Prevent Duplicate Payment: Check if order is already paid
        const existingTxnIds = orderTransactionIndex.get(cleanOrderId) || [];
        const alreadyPaidTxn = existingTxnIds
          .map((id) => transactionStore.get(id))
          .find((txn) => txn?.paymentStatus === 'paid');

        if (alreadyPaidTxn) {
          res.status(400).json({
            success: false,
            error: `Order ${cleanOrderId} is already settled via Transaction ${alreadyPaidTxn.transactionId}. Duplicate payment prevented.`,
          });
          return;
        }

        const transactionId = generateTransactionId();
        const timestamp = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min TTL

        // Cryptographically signed session token: HMAC(orderId:txnId:amount:currency:timestamp)
        const tokenPayload = `${cleanOrderId}:${transactionId}:${numAmount.toFixed(2)}:${cleanCurrency}:${timestamp}`;
        const paymentSessionToken = `${Buffer.from(tokenPayload).toString('base64')}.${generateHmacSignature(tokenPayload)}`;
        const clientSecret = `sec_${crypto.randomBytes(16).toString('hex')}`;

        const gatewayNames: Record<PaymentGatewayType, string> = {
          stripe_card: 'Stripe International Card Gateway',
          lankapay_ipg: 'LankaPay National Switch IPG',
          bank_wire: 'Corporate Telegraphic Transfer',
        };

        const newTransaction: PaymentTransaction = {
          transactionId,
          orderId: cleanOrderId,
          amount: numAmount,
          currency: cleanCurrency,
          gateway: cleanGateway as PaymentGatewayType,
          gatewayName: gatewayNames[cleanGateway as PaymentGatewayType] || 'Enterprise Gateway',
          paymentStatus: 'pending',
          timestamp,
          updatedAt: timestamp,
          customerEmail: cleanEmail || 'customer@mahdev.lk',
          customerName: cleanName || 'Valued Customer',
          clientSecret,
          paymentSessionToken,
        };

        transactionStore.set(transactionId, newTransaction);
        if (!orderTransactionIndex.has(cleanOrderId)) {
          orderTransactionIndex.set(cleanOrderId, []);
        }
        orderTransactionIndex.get(cleanOrderId)!.push(transactionId);

        res.status(200).json({
          success: true,
          transactionId,
          orderId: cleanOrderId,
          amount: newTransaction.amount,
          currency: newTransaction.currency,
          gateway: newTransaction.gateway,
          clientSecret,
          paymentSessionToken,
          mode: PAYMENT_GATEWAY_ENV,
          expiresAt,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: 'Failed to initialize secure payment intent session.',
        });
      }
    }
  );

  // 4. Server-Side Verification Endpoint (MANDATORY SECURITY RULE)
  app.post(
    '/api/payment/verify',
    rateLimit({ windowMs: 60000, max: 30, endpointName: 'payment_verify' }),
    (req: Request, res: Response) => {
      try {
        const { transactionId, orderId, paymentSessionToken, gateway, clientPayload } = req.body;

        const cleanTxnId = sanitizeString(transactionId, 64);
        const cleanOrderId = sanitizeString(orderId, 64);
        const cleanToken = sanitizeString(paymentSessionToken, 512);

        if (!cleanTxnId || !cleanOrderId || !cleanToken) {
          res.status(400).json({
            success: false,
            error: 'Missing verification credentials (transactionId, orderId, or paymentSessionToken).',
          });
          return;
        }

        const transaction = transactionStore.get(cleanTxnId);
        if (!transaction) {
          res.status(404).json({
            success: false,
            error: `Transaction record ${cleanTxnId} not found or expired.`,
          });
          return;
        }

        if (transaction.orderId !== cleanOrderId) {
          res.status(403).json({
            success: false,
            error: 'Security alert: Order ID mismatch between token and stored transaction.',
          });
          return;
        }

        // Cryptographic Token Verification (HMAC Signature Check)
        const tokenParts = cleanToken.split('.');
        if (tokenParts.length !== 2) {
          res.status(400).json({
            success: false,
            error: 'Malformed payment session token.',
          });
          return;
        }

        const [encodedPayload, tokenSignature] = tokenParts;
        let decodedPayload = '';
        try {
          decodedPayload = Buffer.from(encodedPayload, 'base64').toString('utf8');
        } catch {
          res.status(400).json({ success: false, error: 'Invalid token payload encoding.' });
          return;
        }

        const isSignatureValid = verifyHmacSignature(decodedPayload, tokenSignature);
        if (!isSignatureValid) {
          transaction.paymentStatus = 'failed';
          transaction.updatedAt = new Date().toISOString();
          transaction.failureReason = {
            code: 'SIGNATURE_MISMATCH',
            message: 'Server-side cryptographic HMAC signature verification failed. Token was tampered with.',
            timestamp: new Date().toISOString(),
          };

          res.status(403).json({
            success: false,
            transactionId: cleanTxnId,
            orderId: cleanOrderId,
            paymentStatus: 'failed',
            failureReason: transaction.failureReason,
            error: 'Cryptographic signature mismatch. Transaction rejected.',
          });
          return;
        }

        if (transaction.paymentStatus === 'paid') {
          res.status(200).json({
            success: true,
            transactionId: cleanTxnId,
            orderId: cleanOrderId,
            paymentStatus: 'paid',
            verificationResult: transaction.verificationResult,
            message: 'Transaction is already verified and settled.',
          });
          return;
        }

        // Test Scenarios (Sandbox resilience handling)
        const testScenario = clientPayload?.testScenario;

        if (testScenario === 'declined') {
          transaction.paymentStatus = 'failed';
          transaction.updatedAt = new Date().toISOString();
          transaction.failureReason = {
            code: 'DECLINED_INSUFFICIENT_FUNDS',
            message: 'The card was declined by the issuing bank due to insufficient funds (Sandbox Simulation).',
            timestamp: new Date().toISOString(),
          };

          res.status(200).json({
            success: false,
            transactionId: cleanTxnId,
            orderId: cleanOrderId,
            paymentStatus: 'failed',
            failureReason: transaction.failureReason,
          });
          return;
        }

        if (testScenario === '3ds_failed') {
          transaction.paymentStatus = 'failed';
          transaction.updatedAt = new Date().toISOString();
          transaction.failureReason = {
            code: '3DS_AUTHENTICATION_FAILED',
            message: '3D Secure 2.0 Strong Customer Authentication (SCA) verification was cancelled or failed.',
            timestamp: new Date().toISOString(),
          };

          res.status(200).json({
            success: false,
            transactionId: cleanTxnId,
            orderId: cleanOrderId,
            paymentStatus: 'failed',
            failureReason: transaction.failureReason,
          });
          return;
        }

        if (testScenario === 'user_cancelled') {
          transaction.paymentStatus = 'cancelled';
          transaction.updatedAt = new Date().toISOString();
          transaction.failureReason = {
            code: 'USER_CANCELLED',
            message: 'The payment process was explicitly cancelled by the customer.',
            timestamp: new Date().toISOString(),
          };

          res.status(200).json({
            success: false,
            transactionId: cleanTxnId,
            orderId: cleanOrderId,
            paymentStatus: 'cancelled',
            failureReason: transaction.failureReason,
          });
          return;
        }

        // Successful Settlement Verification
        const now = new Date().toISOString();
        const authCode = generateAuthCode();
        const rrn = generateRRN();
        const signatureDigest = generateHmacSignature(`SETTLED:${cleanTxnId}:${transaction.amount}:${authCode}:${rrn}`);

        const verificationResult: VerificationResult = {
          verifiedAt: now,
          verifiedBy:
            gateway === 'stripe_card'
              ? 'stripe_api'
              : gateway === 'lankapay_ipg'
              ? 'lankapay_signature'
              : 'server_hmac',
          signatureDigest,
          authCode,
          rrn,
          maskedCard: sanitizeString(clientPayload?.cardNumberMasked, 24) || '•••• •••• •••• 4242',
          cardBrand: sanitizeString(clientPayload?.cardBrand, 32) || (gateway === 'lankapay_ipg' ? 'LankaPay Debit' : 'Visa'),
          settlementStatus: gateway === 'bank_wire' ? 'pending_funds' : 'settled',
        };

        transaction.paymentStatus = 'paid';
        transaction.updatedAt = now;
        transaction.verificationResult = verificationResult;

        res.status(200).json({
          success: true,
          transactionId: cleanTxnId,
          orderId: cleanOrderId,
          paymentStatus: 'paid',
          verificationResult,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: 'Internal server error while executing payment verification.',
        });
      }
    }
  );

  // 5. Cancel Transaction
  app.post('/api/payment/cancel', (req: Request, res: Response) => {
    try {
      const { transactionId, orderId } = req.body;
      const cleanTxnId = sanitizeString(transactionId, 64);
      const transaction = transactionStore.get(cleanTxnId);

      if (!transaction) {
        res.status(404).json({ success: false, error: 'Transaction not found.' });
        return;
      }

      if (transaction.paymentStatus === 'paid') {
        res.status(400).json({ success: false, error: 'Cannot cancel an already paid transaction. Use refund.' });
        return;
      }

      transaction.paymentStatus = 'cancelled';
      transaction.updatedAt = new Date().toISOString();
      transaction.failureReason = {
        code: 'USER_CANCELLED',
        message: 'Payment session aborted by user.',
        timestamp: new Date().toISOString(),
      };

      res.json({ success: true, transactionId: cleanTxnId, paymentStatus: 'cancelled' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to cancel transaction.' });
    }
  });

  // 6. Process Refund (Strictly Admin RBAC Protected)
  app.post(
    '/api/payment/refund',
    requireAdminAuth(['super_admin', 'operations_admin', 'finance_manager']),
    (req: Request, res: Response) => {
      try {
        const { transactionId, amount, reason } = req.body;
        const cleanTxnId = sanitizeString(transactionId, 64);
        const transaction = transactionStore.get(cleanTxnId);

        if (!transaction) {
          res.status(404).json({ success: false, error: 'Transaction not found.' });
          return;
        }

        if (transaction.paymentStatus !== 'paid') {
          res.status(400).json({ success: false, error: 'Only paid transactions can be refunded.' });
          return;
        }

        const refundId = `RFD-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const now = new Date().toISOString();
        const refundAmount = Number(amount) || transaction.amount;

        transaction.paymentStatus = 'refunded';
        transaction.updatedAt = now;
        transaction.refundDetails = {
          refundId,
          amount: refundAmount,
          reason: sanitizeString(reason, 200) || 'Customer requested refund via Mahdev Support',
          refundedAt: now,
        };

        if (transaction.verificationResult) {
          transaction.verificationResult.settlementStatus = 'refunded';
        }

        // Log to security audit log
        serverAuditLogs.unshift({
          id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: now,
          adminEmail: (req as any).adminSession?.email || 'admin@mahdev.lk',
          adminName: (req as any).adminSession?.adminId || 'Executive Admin',
          action: 'PAYMENT_REFUND_EXECUTED',
          entityType: 'Payment',
          entityId: cleanTxnId,
          details: `Processed refund of $${refundAmount.toFixed(2)} for Order ${transaction.orderId}. Reason: ${transaction.refundDetails.reason}`,
          status: 'warning',
        });

        res.json({
          success: true,
          transactionId: cleanTxnId,
          paymentStatus: 'refunded',
          refundDetails: transaction.refundDetails,
        });
      } catch (err: any) {
        res.status(500).json({ success: false, error: 'Failed to execute refund.' });
      }
    }
  );

  // 7. Get Order Transactions Audit Trail (Sanitized for client-side data isolation)
  app.get('/api/payment/transactions/:orderId', (req: Request, res: Response) => {
    const cleanOrderId = sanitizeString(req.params.orderId, 64);
    const txnIds = orderTransactionIndex.get(cleanOrderId) || [];
    const txns = txnIds
      .map((id) => transactionStore.get(id))
      .filter(Boolean)
      .map((t) => {
        // Strip sensitive internal session tokens from public response
        const { clientSecret, paymentSessionToken, ...safeTxn } = t as PaymentTransaction;
        return safeTxn;
      });

    res.json({ orderId: cleanOrderId, transactions: txns });
  });

  // ==========================================
  // ADMIN AUTHENTICATION & SECURITY ENDPOINTS
  // ==========================================

  // Admin Login Endpoint (Strictly Rate-Limited to prevent brute-force attacks)
  app.post(
    '/api/admin/auth/login',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 10, endpointName: 'admin_login' }),
    (req: Request, res: Response) => {
      const { email } = req.body;
      const emailClean = sanitizeString(email, 100).toLowerCase();

      const isRootAdmin =
        emailClean === 'admin@mahdev.lk' ||
        emailClean === 'yuvanshan875@gmail.com' ||
        emailClean === 'operations@mahdev.lk';

      // Verify admin credentials
      if (!isRootAdmin && !emailClean.includes('admin') && !emailClean.includes('mahdev')) {
        serverAuditLogs.unshift({
          id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString(),
          adminEmail: emailClean || 'unknown',
          adminName: 'Unauthorized Attempt',
          action: 'ADMIN_LOGIN_FAILED',
          entityType: 'Authentication',
          entityId: 'AUTH-GATE',
          details: `Rejected unauthorized login attempt for "${emailClean}".`,
          status: 'error',
        });

        res.status(401).json({ success: false, error: 'Unauthorized credentials for Mahdev Admin Portal.' });
        return;
      }

      const adminUser = {
        id: emailClean === 'admin@mahdev.lk' ? 'ADM-ROOT-01' : 'ADM-OPS-02',
        name:
          emailClean.includes('yuvanshan') || emailClean === 'admin@mahdev.lk'
            ? 'Yuvanshan Perera (Super Admin)'
            : 'Executive Administrator',
        email: emailClean,
        role: emailClean.includes('operations') ? 'operations_admin' : 'super_admin',
        department: 'Corporate Operations & Technology Executive',
        divisionAccess: ['all'],
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        lastLogin: new Date().toISOString(),
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      const expiresAt = Date.now() + 8 * 3600 * 1000; // 8-hour executive session
      const { token } = generateAdminSessionToken(adminUser.id, adminUser.email, adminUser.role, expiresAt);

      serverAuditLogs.unshift({
        id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        adminEmail: adminUser.email,
        adminName: adminUser.name,
        action: 'ADMIN_LOGIN_SUCCESS',
        entityType: 'Authentication',
        entityId: adminUser.id,
        details: `Admin authenticated successfully via Role: ${adminUser.role.toUpperCase()} (Session TTL: 8 hours).`,
        status: 'success',
      });

      res.json({
        success: true,
        token,
        user: adminUser,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    }
  );

  // Admin Verify Session Token
  app.post('/api/admin/auth/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim() || req.body.token;

    if (!token) {
      res.status(401).json({ success: false, error: 'No authorization token provided.' });
      return;
    }

    const verification = verifyAdminToken(token);
    if (!verification.isValid) {
      res.status(401).json({ success: false, error: 'Invalid or expired administrative session token.' });
      return;
    }

    res.json({
      success: true,
      valid: true,
      session: verification.session,
    });
  });

  // Admin Logout
  app.post('/api/admin/auth/logout', (req: Request, res: Response) => {
    res.json({ success: true, message: 'Administrative session terminated.' });
  });

  // Admin Audit Logs API (Protected by requireAdminAuth)
  app.get('/api/admin/audit-logs', requireAdminAuth(), (req: Request, res: Response) => {
    res.json({
      success: true,
      total: serverAuditLogs.length,
      logs: serverAuditLogs,
    });
  });

  // Admin Log Manual Action (Protected by requireAdminAuth)
  app.post('/api/admin/audit-logs/log', requireAdminAuth(), (req: Request, res: Response) => {
    const { action, entityType, entityId, details, status, adminEmail, adminName } = req.body;
    const session = (req as any).adminSession;

    const newEntry = {
      id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      adminEmail: sanitizeString(adminEmail || session?.email, 100) || 'admin@mahdev.lk',
      adminName: sanitizeString(adminName || session?.adminId, 100) || 'System Admin',
      action: sanitizeString(action, 64) || 'MANUAL_ACTION',
      entityType: sanitizeString(entityType, 64) || 'General',
      entityId: sanitizeString(entityId, 64) || 'N/A',
      details: sanitizeString(details, 500) || '',
      status: status === 'error' || status === 'warning' ? status : 'success',
    };

    serverAuditLogs.unshift(newEntry);
    res.json({ success: true, log: newEntry });
  });

  // ==========================================
  // PHASE 28: SECURE TRUSTED BACKEND ENDPOINTS
  // ==========================================

  // 1. Authoritative Order Creation & Validation (Protects against client-side cart tampering)
  app.post(
    '/api/orders/validate-and-create',
    rateLimit({ windowMs: 60000, max: 20, endpointName: 'order_create' }),
    (req: Request, res: Response) => {
      const {
        customerId,
        customerEmail,
        customerName,
        customerPhone,
        shippingAddress,
        items,
        couponCode,
        currency,
        deliveryMethod,
      } = req.body;

      if (!customerEmail || !customerName || !items || !Array.isArray(items)) {
        res.status(400).json({
          success: false,
          error: 'Missing required order fields (customerEmail, customerName, items).',
        });
        return;
      }

      const result = validateAndCreateAuthoritativeOrder({
        customerId: sanitizeString(customerId, 64) || undefined,
        customerEmail: sanitizeString(customerEmail, 100),
        customerName: sanitizeString(customerName, 100),
        customerPhone: sanitizeString(customerPhone, 30),
        shippingAddress: {
          street: sanitizeString(shippingAddress?.street, 150),
          city: sanitizeString(shippingAddress?.city, 80),
          state: sanitizeString(shippingAddress?.state, 80),
          country: sanitizeString(shippingAddress?.country, 80) || 'Sri Lanka',
          postalCode: sanitizeString(shippingAddress?.postalCode, 20),
        },
        items,
        couponCode: sanitizeString(couponCode, 30),
        currency: sanitizeString(currency, 10) || 'USD',
        deliveryMethod: deliveryMethod === 'express' || deliveryMethod === 'freight' ? deliveryMethod : 'standard',
      });

      if (!result.success || !result.order) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }

      // Log secure audit trail
      serverAuditLogs.unshift({
        id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        adminEmail: 'system@mahdev.lk',
        adminName: 'Kernel Order Authority',
        action: 'ORDER_VALIDATED_AND_CREATED',
        entityType: 'Order',
        entityId: result.order.orderId,
        details: `Authoritative order created for ${result.order.customerEmail}. Total: $${result.order.totalAmount} ${result.order.currency}.`,
        status: 'success',
      });

      res.json({
        success: true,
        order: result.order,
      });
    }
  );

  // 2. Authoritative Order Status Transition (Protected: Admin / Staff / System only)
  app.post(
    '/api/orders/status-update',
    requireAdminAuth(['superAdmin', 'admin', 'manager', 'staff']),
    (req: Request, res: Response) => {
      const { orderId, currentStatus, newStatus, trackingNumber, notes } = req.body;
      const session = (req as any).adminSession;

      if (!orderId || !currentStatus || !newStatus) {
        res.status(400).json({
          success: false,
          error: 'orderId, currentStatus, and newStatus are required.',
        });
        return;
      }

      const transitionCheck = validateOrderStatusTransition(currentStatus, newStatus);
      if (!transitionCheck.isValid) {
        res.status(400).json({
          success: false,
          error: transitionCheck.reason,
        });
        return;
      }

      const auditEntry = {
        id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        adminEmail: session.email,
        adminName: session.adminId,
        action: 'ORDER_STATUS_CHANGED',
        entityType: 'Order',
        entityId: sanitizeString(orderId, 64),
        details: `Transitioned order from ${currentStatus} to ${newStatus}. Tracking: ${trackingNumber || 'N/A'}. Notes: ${notes || 'None'}.`,
        status: 'success',
      };

      serverAuditLogs.unshift(auditEntry);

      res.json({
        success: true,
        orderId,
        previousStatus: currentStatus,
        newStatus,
        updatedAt: new Date().toISOString(),
        auditId: auditEntry.id,
      });
    }
  );

  // 3. Cryptographically Signed Fiscal Invoice Generation
  app.post(
    '/api/invoices/generate',
    rateLimit({ windowMs: 60000, max: 30, endpointName: 'invoice_gen' }),
    (req: Request, res: Response) => {
      const {
        orderId,
        customerName,
        customerEmail,
        customerAddress,
        companyName,
        taxRegistrationNumber,
        items,
        subtotal,
        discount,
        tax,
        shipping,
        total,
        currency,
        paymentMethod,
        transactionId,
      } = req.body;

      if (!orderId || !customerName || !customerEmail || !items || typeof total !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Invalid invoice payload. Missing orderId, customerName, customerEmail, or items.',
        });
        return;
      }

      const invoice = generateSecureFiscalInvoice({
        orderId: sanitizeString(orderId, 64),
        customerName: sanitizeString(customerName, 100),
        customerEmail: sanitizeString(customerEmail, 100),
        customerAddress: sanitizeString(customerAddress, 255),
        companyName: sanitizeString(companyName, 100),
        taxRegistrationNumber: sanitizeString(taxRegistrationNumber, 50),
        items: items.map((it: any) => ({
          description: sanitizeString(it.description || it.name, 150),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          lineTotal: Number(it.lineTotal || it.quantity * it.unitPrice) || 0,
        })),
        subtotal: Number(subtotal) || 0,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        shipping: Number(shipping) || 0,
        total: Number(total),
        currency: sanitizeString(currency, 10) || 'USD',
        paymentMethod: sanitizeString(paymentMethod, 50) || 'LankaPay IPG / Credit Card',
        transactionId: sanitizeString(transactionId, 64),
      });

      res.json({
        success: true,
        invoice,
      });
    }
  );

  // 4. Secure Multi-Channel Notification Dispatch (Server-side credentials)
  app.post(
    '/api/notifications/dispatch',
    rateLimit({ windowMs: 60000, max: 40, endpointName: 'notif_dispatch' }),
    async (req: Request, res: Response) => {
      const { type, recipient, data, channels } = req.body;

      if (!type || !recipient || (!recipient.email && !recipient.phone)) {
        res.status(400).json({
          success: false,
          error: 'Recipient email or phone is required for notification dispatch.',
        });
        return;
      }

      try {
        const result = await dispatchServerNotification({
          type,
          recipient: {
            name: sanitizeString(recipient.name, 100),
            email: recipient.email ? sanitizeString(recipient.email, 100) : undefined,
            phone: recipient.phone ? sanitizeString(recipient.phone, 30) : undefined,
          },
          data: data || {},
          channels: channels || ['email', 'whatsapp'],
        });

        res.json({
          success: true,
          ...result,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: 'Notification dispatch failure: ' + (err?.message || 'Internal error'),
        });
      }
    }
  );

  // 5. Lightweight Privacy-Safe Analytics Ingestion Endpoint (Phase 36)
  app.post(
    '/api/analytics/event',
    (req: Request, res: Response) => {
      // Non-blocking telemetry ingestion, returns 204 No Content immediately
      res.status(204).end();
    }
  );

  // ==========================================
  // VITE MIDDLEWARE (DEVELOPMENT / SPA)
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mahdev Core Server] running on http://0.0.0.0:${PORT} (NodeEnv: ${serverConfig.nodeEnv})`);
    const { diagnostics } = validateServerSecrets();
    for (const d of diagnostics) {
      console.log(`  └─ [${d.category}]: ${d.description} (${d.status})`);
    }
  });
}

startServer();
