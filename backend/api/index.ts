import { Router, type Request, type Response } from 'express';
import {
  getDatabaseStatus,
  listCustomersForAdmin,
  listPublicCollection,
} from '../db';
import {
  AdminSessionAuthError,
  authenticateAdminCredentials,
  clearAdminSessionCookie,
  getAdminSessionFromCookie,
} from '../auth/adminCredentialAuth';

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
