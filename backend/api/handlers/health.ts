import type { IncomingMessage, ServerResponse } from 'node:http';
import { checkTursoConnection } from '../../db/tursoDatabase';

interface HealthRequest extends IncomingMessage {
  method?: string;
}

export default async function handler(req: HealthRequest, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'Only GET requests are supported.' }));
    return;
  }

  try {
    await checkTursoConnection();
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, service: 'mahdev-backend', database: 'connected' }));
  } catch (error) {
    console.error('[Backend Health] Turso connection check failed:', error);
    res.statusCode = 503;
    res.end(JSON.stringify({
      success: false,
      service: 'mahdev-backend',
      database: 'unavailable',
      error: 'Turso is not configured or cannot be reached.',
    }));
  }
}
