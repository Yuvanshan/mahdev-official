import express, { Router, type Request, type Response } from 'express';
import {
  getDatabaseStatus,
  listCustomersForAdmin,
  listPublicCollection,
} from '../db/index.js';
import {
  AdminSessionAuthError,
  authenticateAdminCredentials,
  clearAdminSessionCookie,
  getAdminSessionFromCookie,
} from '../auth/adminCredentialAuth.js';
import {
  ADMIN_MEDIA_CHUNK_BYTES,
  createAdminMediaUpload,
  forwardAdminMediaUploadChunk,
} from '../services/adminMediaUpload.js';

const apiRouter = Router();

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
      error: error instanceof Error ? error.message : 'Turso connection failed.',
    });
  }
});

apiRouter.post('/upload/media', async (req: Request, res: Response) => {
  try {
    getAdminSessionFromCookie(req.header('cookie'));
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
      getAdminSessionFromCookie(req.header('cookie'));
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

apiRouter.post('/admin/auth/login', (req: Request, res: Response) => {
  try {
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    const session = authenticateAdminCredentials(req.body?.email, req.body?.password, clientKey);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Set-Cookie', session.cookie);
    res.json({ success: true, user: session.user, expiresAt: session.expiresAt });
  } catch (error) {
    const status = error instanceof AdminSessionAuthError ? error.statusCode : 500;
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Admin sign-in failed.',
    });
  }
});

apiRouter.get('/admin/auth/verify', (req: Request, res: Response) => {
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
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Admin authentication failed.',
    });
  }
});

apiRouter.post('/admin/auth/logout', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', clearAdminSessionCookie());
  res.json({ success: true });
});

apiRouter.get('/db/status', async (_req, res) => {
  try {
    const status = await getDatabaseStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database status unavailable';
    res.status(500).json({ success: false, error: message });
  }
});

apiRouter.get('/users', async (_req, res) => {
  try {
    getAdminSessionFromCookie(_req.header('cookie'));
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
      data: records.map((record) => ({ ...record.data, id: record.id })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Settings unavailable';
    res.status(503).json({ success: false, error: message });
  }
});

export default apiRouter;
