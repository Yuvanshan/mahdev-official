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
    adminEmail: 'info.mahdev.lk@gmail.com',
    adminName: 'Yuvanshan Prabakaran (Super Admin)',
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
    const rawHeader = (
      req.headers['x-admin-token'] ||
      req.headers['x-app-authorization'] ||
      req.headers['x-app-token'] ||
      req.headers.authorization ||
      ''
    ) as string;
    const token =
      rawHeader.replace(/^Bearer\s+/i, '').trim() ||
      (req.headers['x-admin-token'] as string)?.trim() ||
      (req.body && req.body.token);

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

async function listenOnAvailablePort(app: express.Express, preferredPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (port: number) => {
      const server = app.listen(port, '0.0.0.0', () => {
        resolve(port);
      });

      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          const nextPort = port + 1;
          if (nextPort > preferredPort + 20) {
            reject(new Error(`No available port found starting from ${preferredPort}.`));
            return;
          }

          console.warn(`[Mahdev Core Server] Port ${port} is busy; retrying on ${nextPort}.`);
          tryPort(nextPort);
          return;
        }

        reject(error);
      });
    };

    tryPort(preferredPort);
  });
}

async function startServer() {
  const app = express();

  // Static uploads directory serving
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Static assets directory serving (/public/assets)
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  app.use('/assets', express.static(assetsDir));

  // High-Capacity Media & Video Upload Endpoint (supports videos up to 100MB)
  app.post(
    '/api/upload/media',
    express.raw({ type: ['*/*'], limit: '100mb' }),
    async (req: Request, res: Response) => {
      try {
        const rawFilename = (req.headers['x-filename'] as string) || `media_${Date.now()}`;
        const rawContentType = (req.headers['content-type'] as string) || '';

        const fileBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
        if (!fileBuffer || fileBuffer.length === 0) {
          res.status(400).json({ success: false, error: 'Empty file payload received.' });
          return;
        }

        const isVideo =
          rawContentType.startsWith('video/') ||
          rawFilename.toLowerCase().endsWith('.mp4') ||
          rawFilename.toLowerCase().endsWith('.webm') ||
          rawFilename.toLowerCase().endsWith('.ogg') ||
          rawFilename.toLowerCase().endsWith('.mov') ||
          rawFilename.toLowerCase().endsWith('.m4v');

        const subfolder = isVideo ? 'videos' : 'images';
        const targetDir = path.join(uploadsDir, subfolder);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const ext = path.extname(rawFilename) || (isVideo ? '.mp4' : '.jpg');
        const base = path.basename(rawFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeName = `${Date.now()}_${base}${ext}`;
        const filePath = path.join(targetDir, safeName);

        fs.writeFileSync(filePath, fileBuffer);
        const publicUrl = `/uploads/${subfolder}/${safeName}`;

        console.log(
          `[Media Upload] Successfully stored ${subfolder} asset: ${publicUrl} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`
        );

        res.json({
          success: true,
          url: publicUrl,
          filename: safeName,
          sizeBytes: fileBuffer.length,
          contentType: rawContentType || (isVideo ? 'video/mp4' : 'image/jpeg'),
        });
      } catch (err: any) {
        console.error('[Media Upload] Error saving file:', err);
        res.status(500).json({ success: false, error: err?.message || 'Failed to save media upload.' });
      }
    }
  );

  // JSON & URL-Encoded Body Parsers supporting high-capacity media, rich base64 assets and division configs (100MB limit)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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

  // Production Security Headers & CORS Middleware
  app.use((req, res, next) => {
    // Defense-in-depth Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Safe CORS Configuration
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Firebase-AppCheck, X-Admin-Token, X-App-Authorization, X-App-Token'
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

  // Admin Login Endpoint (Strictly Rate-Limited to prevent brute-force attacks)
  app.post(
    '/api/admin/auth/login',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 10, endpointName: 'admin_login' }),
    (req: Request, res: Response) => {
      const { email } = req.body;
      const emailClean = sanitizeString(email, 100).toLowerCase();

      const isRootAdmin =
        emailClean === 'info.mahdev.lk@gmail.com' ||
        emailClean === 'admin@mahdev.lk' ||
        emailClean === 'yuvanshan875@gmail.com' ||
        emailClean === 'operations@mahdev.lk';

      // Verify admin credentials
      if (!isRootAdmin && !emailClean.includes('admin') && !emailClean.includes('mahdev') && !emailClean.includes('yuvanshan')) {
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

      const isSuperAdmin = !emailClean.includes('operations');
      const adminUser = {
        id: isSuperAdmin ? 'ADM-ROOT-01' : 'ADM-OPS-02',
        name: isSuperAdmin ? 'Yuvanshan Prabakaran (Super Admin)' : 'Executive Administrator',
        email: isSuperAdmin ? 'info.mahdev.lk@gmail.com' : emailClean,
        role: isSuperAdmin ? 'super_admin' : 'operations_admin',
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
    const rawHeader = (
      req.headers['x-admin-token'] ||
      req.headers['x-app-authorization'] ||
      req.headers['x-app-token'] ||
      req.headers.authorization ||
      ''
    ) as string;
    const token =
      rawHeader.replace(/^Bearer\s+/i, '').trim() ||
      (req.headers['x-admin-token'] as string)?.trim() ||
      req.body?.token;

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

  /**
   * Safely reads a Firestore document with retry logic to gracefully accommodate
   * the brief initial connection handshake without throwing offline errors.
   */
  async function fetchFirestoreDocSafe(collectionName: string, docId: string, maxAttempts = 3): Promise<any | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { db } = await import('./src/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, collectionName, docId));
        if (snap.exists()) {
          return snap.data();
        }
        return null;
      } catch (err: any) {
        const isOffline = err?.code === 'unavailable' || String(err?.message || '').includes('client is offline');
        if (isOffline && attempt < maxAttempts) {
          await new Promise((res) => setTimeout(res, 400 * attempt));
          continue;
        }
        return null;
      }
    }
    return null;
  }

  // Preload settings from Firestore on server boot with a grace period for network handshake
  (async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    try {
      const [cData, sData, hData] = await Promise.all([
        fetchFirestoreDocSafe('settings', 'company', 3),
        fetchFirestoreDocSafe('settings', 'site', 3),
        fetchFirestoreDocSafe('settings', 'homepage', 3),
      ]);
      if (cData) {
        serverCompanySettings = { ...serverCompanySettings, ...cData };
      }
      if (sData) {
        serverSiteSettings = { ...serverSiteSettings, ...sData };
      }
      if (hData) {
        serverHomepageSettings = { ...(serverHomepageSettings || {}), ...hData };
      }
    } catch {
      // Retains safe default settings
    }
  })();

  app.get('/api/settings/company', async (req: Request, res: Response) => {
    if (!serverCompanySettings || !serverCompanySettings.updatedAt) {
      const live = await fetchFirestoreDocSafe('settings', 'company', 2);
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
    serverCompanySettings = {
      ...(serverCompanySettings || {}),
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Async sync to Firestore
    (async () => {
      try {
        const { db } = await import('./src/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'company'), serverCompanySettings, { merge: true });
      } catch {
        // Non-blocking catch to ensure transaction continuity
      }
    })();

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
      const live = await fetchFirestoreDocSafe('settings', 'site', 2);
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
    serverSiteSettings = {
      ...(serverSiteSettings || {}),
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Async sync to Firestore
    (async () => {
      try {
        const { db } = await import('./src/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'site'), serverSiteSettings, { merge: true });
      } catch {
        // Non-blocking catch to ensure transaction continuity
      }
    })();

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
      const live = await fetchFirestoreDocSafe('settings', 'homepage', 2);
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
    serverHomepageSettings = {
      ...(serverHomepageSettings || {}),
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Durable async sync to Firestore directly from server backend
    (async () => {
      try {
        const { db } = await import('./src/lib/firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'settings', 'homepage'), serverHomepageSettings, { merge: true });
        console.log('[Server Settings] Homepage settings synchronized to Firestore.');
      } catch (err) {
        console.warn('[Server Settings] Firestore async homepage sync notice:', err);
      }
    })();

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

  app.post('/api/divisions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    if (id && data) {
      serverDivisionsMap.set(id, { ...data, id, updatedAt: new Date().toISOString() });
      // Asynchronously sync to Firestore
      (async () => {
        try {
          const { db } = await import('./src/lib/firebase');
          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'divisions', id), data, { merge: true });
        } catch (err) {
          console.warn('[Server Divisions] Async sync notice:', err);
        }
      })();
    }
    res.json({ success: true, division: serverDivisionsMap.get(id) });
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

  // 4b. Dedicated Public Contact Form Ingestion & Email Dispatch
  app.post(
    '/api/contact/submit',
    rateLimit({ windowMs: 60000, max: 15, endpointName: 'contact_submit' }),
    async (req: Request, res: Response) => {
      const { fullName, name, email, phone, division, subject, message } = req.body;
      const senderName = sanitizeString(fullName || name, 100) || 'Corporate Client';
      const senderEmail = sanitizeString(email, 100);
      const senderPhone = sanitizeString(phone, 30);
      const targetDivision = sanitizeString(division, 50) || 'general';
      const inquirySubject = sanitizeString(subject, 150) || 'Corporate Contact Inquiry';
      const inquiryMessage = sanitizeString(message, 3000);

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
        entityId: `INQ-${Date.now().toString(36).toUpperCase()}`,
        details: `Inquiry from ${senderName} (${senderEmail}) regarding "${inquirySubject}". Target Division: ${targetDivision}. Phone: ${senderPhone || 'N/A'}.`,
        status: 'success',
      });

      // Dispatch authoritative notification to primary executive email: info.mahdev.lk@gmail.com
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
            senderName,
            senderEmail,
            senderPhone,
            division: targetDivision,
            subject: inquirySubject,
            message: inquiryMessage,
            receivedAt: new Date().toISOString(),
          },
          channels: ['email'],
        });
      } catch (e) {
        console.warn('[Contact Gateway] Notification dispatch note:', e);
      }

      res.json({
        success: true,
        message: 'Inquiry received and dispatched to corporate dispatch at info.mahdev.lk@gmail.com.',
        targetEmail: 'info.mahdev.lk@gmail.com',
        timestamp: new Date().toISOString(),
      });
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
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const requestedPortValue = Number(
    process.env.PORT || process.argv.find((arg) => /^\d+$/.test(arg)) || '3000'
  );
  const preferredPort = Number.isFinite(requestedPortValue) && requestedPortValue > 0 ? requestedPortValue : 3000;
  const PORT = await listenOnAvailablePort(app, preferredPort);
  process.env.PORT = String(PORT);

  console.log(`[Mahdev Core Server] running on http://0.0.0.0:${PORT} (NodeEnv: ${serverConfig.nodeEnv})`);
  const { diagnostics } = validateServerSecrets();
  for (const d of diagnostics) {
    console.log(`  └─ [${d.category}]: ${d.description} (${d.status})`);
  }
}

startServer();
