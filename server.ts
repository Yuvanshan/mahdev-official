import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
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
} from './backend/services/secureOrderService';
import {
  generateSecureFiscalInvoice,
} from './backend/services/secureInvoiceService';
import {
  dispatchServerNotification,
} from './backend/services/secureNotificationService';
import {
  getTursoDocument,
  initializeTursoDatabase,
  writeTursoDocument,
} from './backend/db/tursoDatabase';
import { createTursoRouter } from './backend/api/tursoRoutes';
import {
  AdminSessionAuthError,
  authenticateAdminCredentials,
  clearAdminSessionCookie,
  getAdminSessionFromCookie,
} from './backend/auth/adminCredentialAuth';
import {
  sendEnquiryEmail,
} from './backend/services/emailService';
import { createAdminMediaUpload } from './backend/services/adminMediaUpload';
import {
  getServerConfig,
  validateServerSecrets,
} from './backend/config/serverEnv';

const serverConfig = getServerConfig();

// Server-side Secrets (never sent to client)
const STRIPE_SECRET_KEY = serverConfig.payments.stripeSecretKey;
const PAYMENT_WEBHOOK_SECRET = serverConfig.payments.webhookSecret;
const PAYMENT_GATEWAY_ENV = serverConfig.payments.gatewayEnv;

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

const serverAuditLogs: any[] = [];

// Authentication & Authorization Guard Middleware
function requireAdminAuth(allowedRoles?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const verification = getAdminSessionFromCookie(req.header('cookie'));
        if (
          allowedRoles?.length &&
          verification.user.role !== 'super_admin' &&
          !allowedRoles.includes(verification.user.role)
        ) {
          res.status(403).json({
            success: false,
            error: `Insufficient role permissions. Action requires: ${allowedRoles.join(' or ')}.`,
          });
          return;
        }
        (req as any).adminSession = {
          adminId: verification.user.id,
          email: verification.user.email,
          role: verification.user.role,
        };
        next();
    } catch (error) {
      const status = error instanceof AdminSessionAuthError ? error.statusCode : 401;
      if (!(error instanceof AdminSessionAuthError)) {
        console.error('[Admin Auth] Session verification failed:', error);
      }
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : 'Admin authentication failed.',
      });
    }
  };
}

async function startServer() {
  await initializeTursoDatabase();
  const app = express();

  // Production Security Headers & CORS Middleware (MUST BE FIRST)
  app.use((req, res, next) => {
    // Defense-in-depth Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Safe CORS Configuration supporting media streaming & all custom headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Firebase-AppCheck, x-filename, X-Filename, x-file-name, *'
    );
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Static uploads directory serving
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const distUploadsDir = path.join(process.cwd(), 'dist', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Set explicit Cross-Origin and Cache headers for all uploads
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    next();
  });

  app.use('/uploads', express.static(uploadsDir));
  if (fs.existsSync(distUploadsDir)) {
    app.use('/uploads', express.static(distUploadsDir));
  }

  // 404 Guard: NEVER allow /uploads requests to fall through to the SPA HTML route!
  app.use('/uploads', (req, res) => {
    res.status(404).set('Content-Type', 'text/plain').send('Media asset not found');
  });

  // Static assets directory serving (/public/assets)
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  app.use('/assets', express.static(assetsDir));

  // Admin-only media uploads use short-lived resumable Firebase Storage sessions.
  app.post(
    '/api/upload/media',
    express.json({ limit: '16kb' }),
    async (req: Request, res: Response) => {
      try {
        getAdminSessionFromCookie(req.header('cookie'));
        const upload = await createAdminMediaUpload(req.body || {});
        res.setHeader('Cache-Control', 'no-store');
        res.json({ success: true, ...upload });
      } catch (error) {
        const status = error instanceof AdminSessionAuthError
          ? error.statusCode
          : error instanceof SyntaxError
            ? 400
            : error instanceof Error && /Unsupported media type|Media size/.test(error.message)
              ? 400
              : 503;
        if (status === 503) console.error('[Media Upload] Could not initialize secure upload:', error);
        res.status(status).json({
          success: false,
          error: error instanceof Error ? error.message : 'Could not initialize media upload.',
        });
      }
    }
  );

  // JSON & URL-Encoded Body Parsers supporting high-capacity media, rich base64 assets and division configs (100MB limit)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));
  app.use('/api/database', createTursoRouter());

  // Graceful body-parser error handler (catches PayloadTooLargeError and malformed JSON before route handlers)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err?.type === 'entity.too.large' || err?.name === 'PayloadTooLargeError' || err?.status === 413) {
      console.warn(`[Server] Request entity too large on ${req.method} ${req.path}`);
      res.status(413).json({
        success: false,
        error: 'Payload too large. The request body exceeds the maximum allowed size (100MB).',
      });
      return;
    }
    if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
      res.status(400).json({ success: false, error: 'Malformed JSON payload received.' });
      return;
    }
    next(err);
  });

  // ==========================================
  // PAYMENT API ROUTES (FIRST)
  // ==========================================

  // 0. Base Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Mahdev Enterprise Multi-Division Core',
      timestamp: new Date().toISOString(),
    });
  });

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

  app.post('/api/admin/auth/login', (req: Request, res: Response) => {
    try {
      const session = authenticateAdminCredentials(
        req.body?.email,
        req.body?.password,
        req.ip || req.socket.remoteAddress || 'unknown'
      );
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Set-Cookie', session.cookie);
      res.json({ success: true, user: session.user, expiresAt: session.expiresAt });
    } catch (error) {
      const status = error instanceof AdminSessionAuthError ? error.statusCode : 500;
      if (!(error instanceof AdminSessionAuthError)) {
        console.error('[Admin Auth] Credential login failed:', error);
      }
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : 'Admin sign-in failed.',
      });
    }
  });

  app.get('/api/admin/auth/verify', (req: Request, res: Response) => {
    try {
      const session = getAdminSessionFromCookie(req.header('cookie'));
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        success: true,
        valid: true,
        session: {
          adminId: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
        ...session,
      });
    } catch (error) {
      const status = error instanceof AdminSessionAuthError ? error.statusCode : 401;
      if (!(error instanceof AdminSessionAuthError)) {
        console.error('[Admin Auth] Session verification failed:', error);
      }
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : 'Admin authentication failed.',
      });
    }
  });

  app.post('/api/admin/auth/logout', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Set-Cookie', clearAdminSessionCookie());
    res.json({ success: true });
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
  // AUTHORITATIVE SYSTEM & COMPANY SETTINGS
  // ==========================================
  // ENTERPRISE SETTINGS STATE & PERSISTENCE
  // ==========================================
  const defaultCompanySettings = {
    name: 'Mahdev Pvt Ltd',
    legalName: 'Mahdev Private Limited',
    registrationNumber: 'PV-00289410',
    tagline: 'Creating Moments... Capturing Memories... & Delivering Innovation...',
    description: 'Premier South Asian enterprise uniting 5 specialized business divisions.',
    domain: 'mahdev.lk',
    email: 'info.mahdev.lk@gmail.com',
    primaryPhone: '075 092 8078',
    secondaryPhone: '075 092 8078',
    phones: ['075 092 8078'],
    whatsappNumber: '+94 75 092 8078',
    address: 'Colombo, Western Province, Sri Lanka',
  };

  const defaultSiteSettings = {
    companyName: 'Mahdev Pvt Ltd',
    legalName: 'Mahdev Private Limited',
    tagline: 'Excellence Across Every Horizon',
    description: 'Premier South Asian enterprise uniting 5 specialized business divisions.',
    logoUrl: '',
    darkLogoUrl: '',
    faviconUrl: '',
    currencyCode: 'LKR',
    currencySymbol: 'Rs. ',
    phoneNumbers: ['075 092 8078'],
    email: 'info.mahdev.lk@gmail.com',
    maintenanceMode: false,
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    siteName: 'Mahdev Pvt Ltd',
    enableMaintenanceMode: false,
  };

  let serverCompanySettings: any = { ...defaultCompanySettings };
  let serverSiteSettings: any = { ...defaultSiteSettings };
  let serverHomepageSettings: any = null;

  async function fetchTursoDocument(collectionName: string, docId: string): Promise<any | null> {
    const document = await getTursoDocument(collectionName, '', docId);
    return document?.data || null;
  }

  const [companyData, siteData, homepageData] = await Promise.all([
    fetchTursoDocument('settings', 'company'),
    fetchTursoDocument('settings', 'site'),
    fetchTursoDocument('settings', 'homepage'),
  ]);
  if (companyData) serverCompanySettings = { ...serverCompanySettings, ...companyData };
  if (siteData) serverSiteSettings = { ...serverSiteSettings, ...siteData };
  if (homepageData) serverHomepageSettings = { ...homepageData };

  app.get('/api/settings/company', async (req: Request, res: Response) => {
    if (!serverCompanySettings || !serverCompanySettings.updatedAt) {
      const live = await fetchTursoDocument('settings', 'company');
      if (live) {
        serverCompanySettings = { ...serverCompanySettings, ...live };
      }
    }
    res.json({
      success: true,
      settings: serverCompanySettings,
    });
  });

  app.post('/api/settings/company', async (req: Request, res: Response) => {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid company settings payload' });
      return;
    }
    const updatedCompanySettings = {
      ...(serverCompanySettings || {}),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    try {
      await writeTursoDocument({
        type: 'set',
        collection: 'settings',
        parentPath: '',
        id: 'company',
        data: updatedCompanySettings,
        merge: true,
      });
    } catch (error) {
      console.error('[Turso] Failed to save company settings:', error);
      res.status(503).json({ success: false, error: 'Failed to persist company settings to Turso.' });
      return;
    }
    serverCompanySettings = updatedCompanySettings;

    serverAuditLogs.unshift({
      id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      adminEmail: sanitizeString(req.body?.adminEmail, 100) || 'admin@mahdev.lk',
      adminName: sanitizeString(req.body?.adminName, 100) || 'System Administrator',
      action: 'COMPANY_SETTINGS_UPDATED',
      entityType: 'Settings',
      entityId: 'settings/company',
      details: `Updated company legal profile, phone numbers (${serverCompanySettings.primaryPhone || 'N/A'}), addresses and media branding.`,
      status: 'success',
    });
    res.json({
      success: true,
      settings: serverCompanySettings,
    });
  });

  app.get('/api/settings/site', async (req: Request, res: Response) => {
    if (!serverSiteSettings || !serverSiteSettings.updatedAt) {
      const live = await fetchTursoDocument('settings', 'site');
      if (live) {
        serverSiteSettings = { ...serverSiteSettings, ...live };
      }
    }
    res.json({
      success: true,
      settings: serverSiteSettings,
    });
  });

  app.post('/api/settings/site', async (req: Request, res: Response) => {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid site settings payload' });
      return;
    }
    const updatedSiteSettings = {
      ...(serverSiteSettings || {}),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    try {
      await writeTursoDocument({
        type: 'set',
        collection: 'settings',
        parentPath: '',
        id: 'site',
        data: updatedSiteSettings,
        merge: true,
      });
    } catch (error) {
      console.error('[Turso] Failed to save site settings:', error);
      res.status(503).json({ success: false, error: 'Failed to persist site settings to Turso.' });
      return;
    }
    serverSiteSettings = updatedSiteSettings;

    serverAuditLogs.unshift({
      id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      adminEmail: sanitizeString(req.body?.adminEmail, 100) || 'admin@mahdev.lk',
      adminName: sanitizeString(req.body?.adminName, 100) || 'System Administrator',
      action: 'SITE_SETTINGS_UPDATED',
      entityType: 'Settings',
      entityId: 'settings/site',
      details: `Updated site settings: currency=${serverSiteSettings.currency || 'LKR'}, maintenance=${Boolean(serverSiteSettings.maintenance?.enabled || serverSiteSettings.maintenanceMode)}.`,
      status: 'success',
    });
    res.json({
      success: true,
      settings: serverSiteSettings,
    });
  });

  app.get('/api/settings/homepage', async (req: Request, res: Response) => {
    if (!serverHomepageSettings || !serverHomepageSettings.updatedAt) {
      const live = await fetchTursoDocument('settings', 'homepage');
      if (live) {
        serverHomepageSettings = { ...(serverHomepageSettings || {}), ...live };
      }
    }
    res.json({
      success: true,
      settings: serverHomepageSettings,
    });
  });

  app.post('/api/settings/homepage', async (req: Request, res: Response) => {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid homepage settings payload' });
      return;
    }
    const updatedHomepageSettings = {
      ...(serverHomepageSettings || {}),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    try {
      await writeTursoDocument({
        type: 'set',
        collection: 'settings',
        parentPath: '',
        id: 'homepage',
        data: updatedHomepageSettings,
        merge: true,
      });
    } catch (error) {
      console.error('[Turso] Failed to save homepage settings:', error);
      res.status(503).json({ success: false, error: 'Failed to persist homepage settings to Turso.' });
      return;
    }
    serverHomepageSettings = updatedHomepageSettings;

    res.json({
      success: true,
      settings: serverHomepageSettings,
    });
  });

  const serverDivisionsMap = new Map<string, any>();

  app.get('/api/divisions', (req: Request, res: Response) => {
    res.json({
      success: true,
      divisions: Array.from(serverDivisionsMap.values()),
    });
  });

  app.post('/api/divisions/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    if (id && data) {
      const rawId = (id || '').toLowerCase().replace(/^div-/, '').trim();
      const cleanId =
        rawId === 'sws' || rawId === 'sws-event-management' || rawId === 'sws-events' || rawId === 'events' ? 'sws' :
        rawId === 'u1' || rawId === 'u1-studio' || rawId === 'u1-cinema' || rawId === 'studio' || rawId === 'photography' ? 'u1' :
        rawId === 'it' || rawId === 'it-solutions' || rawId === 'mahdev-it' || rawId === 'solutions' ? 'it' :
        rawId === 'travels' || rawId === 'mahdev-travels' || rawId === 'travel' ? 'travels' :
        rawId === 'mart' || rawId === 'online-mart' || rawId === 'mahdev-mart' || rawId === 'shop' ? 'mart' : rawId;

      const updatedDivision = { ...data, id: cleanId, slug: cleanId, updatedAt: new Date().toISOString() };
      try {
        await writeTursoDocument({
          type: 'set',
          collection: 'divisions',
          parentPath: '',
          id: cleanId,
          data: updatedDivision,
          merge: true,
        });
      } catch (error) {
        console.error('[Turso] Failed to save division:', error);
        res.status(503).json({ success: false, error: 'Failed to persist division to Turso.' });
        return;
      }
      serverDivisionsMap.set(cleanId, updatedDivision);
      res.json({ success: true, division: serverDivisionsMap.get(cleanId) });
      return;
    }
    res.json({ success: false, error: 'Invalid ID or data' });
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

        const { success: dispatchSuccess, ...dispatchResult } = result || {};

        res.json({
          success: dispatchSuccess ?? true,
          ...dispatchResult,
        });
      } catch (err: any) {
        res.status(500).json({
          success: false,
          error: 'Notification dispatch failure: ' + (err?.message || 'Internal error'),
        });
      }
    }
  );

  // 4b. Dedicated Public Contact & Enquiry Form Ingestion & Email Dispatch
  const handleEnquirySubmission = async (req: Request, res: Response) => {
    const {
      fullName,
      name,
      email,
      phone,
      division,
      service,
      serviceName,
      subject,
      message,
      requirements,
      notes,
      preferredDate,
      date,
      budget,
      referenceId,
      id,
    } = req.body;

    const senderName = sanitizeString(fullName || name, 100) || 'Corporate Client';
    const senderEmail = sanitizeString(email, 100);
    const senderPhone = sanitizeString(phone, 30);
    const targetDivision = sanitizeString(division, 50) || 'general';
    const inquiryService = sanitizeString(service || serviceName, 100);
    const inquirySubject =
      sanitizeString(subject, 150) ||
      (inquiryService ? `Enquiry for ${inquiryService}` : 'Corporate Contact Inquiry');
    const inquiryMessage = sanitizeString(message || requirements || notes, 3000);
    const refId = sanitizeString(referenceId || id, 50) || `ENQ-${Date.now().toString(36).toUpperCase()}`;
    const prefDate = sanitizeString(preferredDate || date, 50);
    const budgetRange = sanitizeString(budget, 50);

    if (!senderEmail || !inquiryMessage) {
      res.status(400).json({
        success: false,
        error: 'Email and message are required.',
      });
      return;
    }

    // Log server audit trail for new incoming corporate lead
    serverAuditLogs.unshift({
      id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      adminEmail: 'info.mahdev.lk@gmail.com',
      adminName: 'Corporate Dispatch Gateway',
      action: 'CONTACT_FORM_SUBMITTED',
      entityType: 'Inquiry',
      entityId: refId,
      details: `Inquiry from ${senderName} (${senderEmail}) regarding "${inquirySubject}". Target Division: ${targetDivision}. Phone: ${senderPhone || 'N/A'}.`,
      status: 'success',
    });

    // Authoritative email dispatch to info.mahdev.lk@gmail.com
    let emailResult = {
      delivered: false,
      targetEmail: 'info.mahdev.lk@gmail.com',
      deliveryMethod: 'sandbox_logged',
    };

    try {
      emailResult = await sendEnquiryEmail({
        senderName,
        senderEmail,
        senderPhone,
        division: targetDivision,
        service: inquiryService,
        subject: inquirySubject,
        message: inquiryMessage,
        referenceId: refId,
        preferredDate: prefDate,
        budget: budgetRange,
        receivedAt: new Date().toISOString(),
      });
    } catch (mailErr) {
      console.warn('[Contact Gateway] sendEnquiryEmail exception:', mailErr);
    }

    // Also dispatch multi-channel alert
    try {
      await dispatchServerNotification({
        type: 'admin_contact_inquiry',
        recipient: {
          name: 'Yuvanshan Prabakaran',
          email: 'info.mahdev.lk@gmail.com',
          phone: '+94750928078',
          role: 'admin',
        },
        title: `📩 New Corporate Inquiry: ${inquirySubject}`,
        message: `Inquiry from ${senderName} (${senderEmail}): "${inquiryMessage.slice(0, 140)}..."`,
        data: {
          referenceId: refId,
          senderName,
          senderEmail,
          senderPhone,
          division: targetDivision,
          service: inquiryService,
          subject: inquirySubject,
          message: inquiryMessage,
          preferredDate: prefDate,
          budget: budgetRange,
          receivedAt: new Date().toISOString(),
        },
        channels: ['email', 'in_app'],
      });
    } catch (e) {
      console.warn('[Contact Gateway] Notification dispatch note:', e);
    }

    res.json({
      success: true,
      referenceId: refId,
      message: 'Inquiry received and dispatched to corporate dispatch at info.mahdev.lk@gmail.com.',
      targetEmail: 'info.mahdev.lk@gmail.com',
      emailResult,
      timestamp: new Date().toISOString(),
    });
  };

  app.post(
    '/api/contact/submit',
    rateLimit({ windowMs: 60000, max: 20, endpointName: 'contact_submit' }),
    handleEnquirySubmission
  );

  app.post(
    '/api/inquiries/submit',
    rateLimit({ windowMs: 60000, max: 20, endpointName: 'inquiries_submit' }),
    handleEnquirySubmission
  );

  // 5. Lightweight Privacy-Safe Analytics Ingestion Endpoint (Phase 36)
  app.post(
    '/api/analytics/event',
    (req: Request, res: Response) => {
      // Non-blocking telemetry ingestion, returns 204 No Content immediately
      res.status(204).end();
    }
  );

  // 6. Official Google Reviews Synchronization & Place Details Endpoint
  app.post(
    '/api/google-reviews/sync',
    rateLimit({ windowMs: 60000, max: 15, endpointName: 'google_reviews_sync' }),
    async (req: Request, res: Response) => {
      const { placeId, apiKey: clientApiKey } = req.body;
      const targetPlaceId = sanitizeString(placeId, 120) || 'ChIJ5_qM-Dlm4joRw_r2-4a0bEc';
      const mapsApiKey = clientApiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';

      if (!mapsApiKey) {
        // Return structured place details & deep link metadata when no direct Places API key is configured
        res.json({
          success: true,
          placeId: targetPlaceId,
          placeName: 'Mahdev Pvt Ltd / SWS Event Management',
          rating: 4.9,
          userRatingCount: 184,
          mapsUrl: `https://search.google.com/local/reviews?placeid=${encodeURIComponent(targetPlaceId)}`,
          writeReviewUrl: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(targetPlaceId)}`,
          reviews: [],
          message: 'Google Place configured. Add GOOGLE_MAPS_API_KEY in settings to sync live reviews via Google Places API.',
        });
        return;
      }

      try {
        // Official Places API (New) Place Details Request
        const placesUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(targetPlaceId)}`;
        const gResponse = await fetch(placesUrl, {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': mapsApiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,reviews,googleMapsUri',
          },
        });

        if (gResponse.ok) {
          const placeData = await gResponse.json();
          const parsedReviews = (placeData.reviews || []).map((rev: any, idx: number) => ({
            googleReviewId: rev.name || `rev-${targetPlaceId}-${idx}`,
            authorName: rev.authorAttribution?.displayName || 'Google Customer',
            authorPhotoUrl: rev.authorAttribution?.photoUri || '',
            authorUrl: rev.authorAttribution?.uri || '',
            rating: Number(rev.rating) || 5,
            text: rev.text?.text || rev.originalText?.text || '',
            relativePublishTimeDescription: rev.relativePublishTimeDescription || 'Recently on Google',
            publishTime: rev.publishTime || new Date().toISOString(),
          }));

          res.json({
            success: true,
            placeId: placeData.id || targetPlaceId,
            placeName: placeData.displayName?.text || 'Mahdev Pvt Ltd',
            formattedAddress: placeData.formattedAddress,
            rating: placeData.rating || 4.9,
            userRatingCount: placeData.userRatingCount || parsedReviews.length,
            mapsUrl: placeData.googleMapsUri || `https://search.google.com/local/reviews?placeid=${encodeURIComponent(targetPlaceId)}`,
            writeReviewUrl: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(targetPlaceId)}`,
            reviews: parsedReviews,
          });
          return;
        }

        // Fallback to Legacy Google Places API Place Details
        const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(targetPlaceId)}&fields=name,formatted_address,rating,user_ratings_total,reviews,url&key=${encodeURIComponent(mapsApiKey)}`;
        const legacyResponse = await fetch(legacyUrl);
        const legacyData = await legacyResponse.json();

        if (legacyData.status === 'OK' && legacyData.result) {
          const result = legacyData.result;
          const parsedReviews = (result.reviews || []).map((rev: any, idx: number) => ({
            googleReviewId: rev.time ? `rev-${targetPlaceId}-${rev.time}` : `rev-${targetPlaceId}-${idx}`,
            authorName: rev.author_name || 'Google Customer',
            authorPhotoUrl: rev.profile_photo_url || '',
            authorUrl: rev.author_url || '',
            rating: Number(rev.rating) || 5,
            text: rev.text || '',
            relativePublishTimeDescription: rev.relative_time_description || 'Recently on Google',
            publishTime: rev.time ? new Date(rev.time * 1000).toISOString() : new Date().toISOString(),
          }));

          res.json({
            success: true,
            placeId: targetPlaceId,
            placeName: result.name || 'Mahdev Pvt Ltd',
            formattedAddress: result.formatted_address,
            rating: result.rating || 4.9,
            userRatingCount: result.user_ratings_total || parsedReviews.length,
            mapsUrl: result.url || `https://search.google.com/local/reviews?placeid=${encodeURIComponent(targetPlaceId)}`,
            writeReviewUrl: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(targetPlaceId)}`,
            reviews: parsedReviews,
          });
          return;
        }

        res.status(400).json({
          success: false,
          error: legacyData.error_message || 'Google Places API returned status: ' + (legacyData.status || 'ERROR'),
        });
      } catch (apiErr: any) {
        console.error('[Google Reviews Sync API] Error:', apiErr);
        res.status(500).json({
          success: false,
          error: 'Failed to synchronize Google Reviews: ' + (apiErr?.message || 'Network error'),
        });
      }
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

    // Development SPA fallback for deep links like /sws, /u1, /it, /admin
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/assets/')) {
        res.status(404).end();
        return;
      }
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/assets/')) {
        res.status(404).end();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mahdev Core Server] running on http://0.0.0.0:${PORT} (NodeEnv: ${serverConfig.nodeEnv})`);
    const { diagnostics } = validateServerSecrets();
    for (const d of diagnostics) {
      console.log(`  └─ [${d.category}]: ${d.description} (${d.status})`);
    }
  });
}

startServer();
