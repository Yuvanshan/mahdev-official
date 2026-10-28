import express, { Router, type Request, type Response } from 'express';
import {
  getDatabaseStatus,
  listCustomersForAdmin,
  listPublicCollection,
} from '../db/index.js';
import {
  AdminSessionAuthError,
  requireAdminSession,
} from '../auth/adminCredentialAuth.js';
import {
  ADMIN_MEDIA_CHUNK_BYTES,
  createAdminMediaUpload,
  forwardAdminMediaUploadChunk,
} from '../services/adminMediaUpload.js';
import careerCvHandler from './handlers/careers/cv.js';
import careerStatusHandler from './handlers/careers/status.js';
import careerApplicationHandler from './handlers/careers/application.js';
import publicSnapshotHandler, { publicInlineMediaHandler } from './handlers/publicSnapshot.js';
import analyticsHandler from './handlers/analytics.js';
import whatsappWebhookHandler from './handlers/whatsappWebhook.js';
import orderConfirmationsHandler from './handlers/orderConfirmations.js';
import accountCheckHandler from './handlers/accountCheck.js';
import { isFromThisSite } from '../security/sameSite.js';
import adminCustomersHandler from './handlers/admin/customers.js';
import { sanitizePublicSettingsDocument } from './tursoRoutes.js';
import adminLoginHandler from './handlers/admin/auth/login.js';
import adminLogoutHandler from './handlers/admin/auth/logout.js';

const apiRouter = Router();

apiRouter.post(
  '/careers/cv',
  express.raw({ limit: '10mb', type: () => true }),
  async (req: Request, res: Response) => {
    await careerCvHandler(req, res);
  }
);
apiRouter.get('/careers/cv', async (req: Request, res: Response) => {
  await careerCvHandler(req, res);
});
apiRouter.get('/careers/status', async (req: Request, res: Response) => {
  await careerStatusHandler(req, res);
});
apiRouter.delete('/careers/application', async (req: Request, res: Response) => {
  await careerApplicationHandler(req, res);
});

// Admin customer list (assigns readable customer IDs) and customer delete.
apiRouter.all('/admin/customers', async (req: Request, res: Response) => {
  await adminCustomersHandler(req, res);
});

apiRouter.all('/webhook/whatsapp', async (req: Request, res: Response) => {
  await whatsappWebhookHandler(req, res);
});

// Design order confirmation links (admin create/share, customer confirm).
apiRouter.all(/^\/order-confirmations(\/.*)?$/, async (req: Request, res: Response) => {
  await orderConfirmationsHandler(req, res);
});

// Is this email / phone / NIC already registered? (sign-up, Book online, password reset)
apiRouter.post('/account/check', async (req: Request, res: Response) => {
  // Same as the serverless API: only this website's own pages are answered.
  if (!isFromThisSite(req)) {
    res.status(404).json({ success: false, error: 'Not found.' });
    return;
  }
  await accountCheckHandler(req, res);
});

apiRouter.post('/analytics', (req: Request, res: Response) => {
  void analyticsHandler(req, res);
});

apiRouter.get('/public/media/:file', (req: Request, res: Response) => {
  void publicInlineMediaHandler(req, res);
});

apiRouter.get('/public/snapshot', (req: Request, res: Response) => {
  void publicSnapshotHandler(req, res);
});

apiRouter.get('/health', async (_req, res) => {
  try {
    const database = await getDatabaseStatus();
    res.json({
      success: true,
      service: 'mahdev-backend',
      status: 'ok',
      database,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'mahdev-backend',
      status: 'unavailable',
      error: error instanceof Error ? error.message : 'Database connection failed.',
    });
  }
});

apiRouter.post('/upload/media', async (req: Request, res: Response) => {
  try {
    await requireAdminSession(req.header('cookie'));
    const upload = await createAdminMediaUpload(req.body || {});
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, ...upload });
  } catch (error) {
    const status = error instanceof AdminSessionAuthError
      ? error.statusCode
      : error instanceof SyntaxError ||
        (error instanceof Error && /Unsupported media type|Media size/.test(error.message))
        ? 400
        : 503;
    if (status === 503) console.error('[AdminMediaUpload] Could not initialize secure upload:', error);
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Could not initialize media upload.',
    });
  }
});

apiRouter.put(
  '/upload/media',
  express.raw({ limit: ADMIN_MEDIA_CHUNK_BYTES, type: () => true }),
  async (req: Request, res: Response) => {
    try {
      await requireAdminSession(req.header('cookie'));
      if (!Buffer.isBuffer(req.body)) {
        res.status(400).json({ success: false, error: 'Media upload chunk is required.' });
        return;
      }
      const result = await forwardAdminMediaUploadChunk({
        uploadUrl: req.header('x-upload-session'),
        contentRange: req.header('content-range'),
        contentType: req.header('content-type'),
        body: req.body,
      });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, ...result });
    } catch (error) {
      const status = error instanceof AdminSessionAuthError
        ? error.statusCode
        : error instanceof Error && /Invalid|exceeds the server limit/.test(error.message)
          ? 400
          : 502;
      if (status === 502) console.error('[AdminMediaUpload] Could not forward upload chunk:', error);
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : 'Could not upload media chunk.',
      });
    }
  }
);

// Same handler as the serverless API, so both use the shared database-backed login limits.
apiRouter.post('/admin/auth/login', async (req: Request, res: Response) => {
  await adminLoginHandler(req, res);
});

apiRouter.get('/admin/auth/verify', async (req: Request, res: Response) => {
  try {
    const session = await requireAdminSession(req.header('cookie'));
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
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Admin authentication failed.',
    });
  }
});

// Same handler as the serverless API: signing out also ends earlier sessions.
apiRouter.post('/admin/auth/logout', async (req: Request, res: Response) => {
  await adminLogoutHandler(req, res);
});

apiRouter.get('/db/status', async (_req, res) => {
  try {
    // Database details are for administrators only.
    await requireAdminSession(_req.header('cookie'));
    const status = await getDatabaseStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    const status = error instanceof AdminSessionAuthError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Database status unavailable';
    res.status(status).json({ success: false, error: message });
  }
});

apiRouter.get('/users', async (_req, res) => {
  try {
    await requireAdminSession(_req.header('cookie'));
    const records = await listCustomersForAdmin();
    res.json({
      success: true,
      data: records.map((record) => ({ ...record.data, id: record.id })),
    });
  } catch (error) {
    const status = error instanceof AdminSessionAuthError ? error.statusCode : 503;
    const message = error instanceof Error ? error.message : 'Users unavailable';
    res.status(status).json({ success: false, error: message });
  }
});

apiRouter.get('/products', async (_req, res) => {
  try {
    const records = await listPublicCollection('products');
    res.json({
      success: true,
      data: records.map((record) => ({ ...record.data, id: record.id })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Products unavailable';
    res.status(503).json({ success: false, error: message });
  }
});

apiRouter.get('/settings', async (_req, res) => {
  try {
    const records = await listPublicCollection('settings');
    res.json({
      success: true,
      // Same filtering as public database reads: private fields (e.g. super admin) removed.
      data: records.map(sanitizePublicSettingsDocument).map((record) => ({ ...record.data, id: record.id })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Settings unavailable';
    res.status(503).json({ success: false, error: message });
  }
});

export default apiRouter;
