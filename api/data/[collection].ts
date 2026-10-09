import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleTursoDatabaseRequest } from '../../backend/api/handlers/database.js';

interface CollectionRequest extends IncomingMessage {
  method?: string;
}

const ALLOWED_COLLECTION_NAME = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;

export default function collectionApi(req: CollectionRequest, res: ServerResponse): Promise<void> {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  const collection = decodeURIComponent(pathname.slice('/api/data/'.length));
  if (!ALLOWED_COLLECTION_NAME.test(collection)) {
    res.statusCode = 404;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'API resource not found.' }));
    return Promise.resolve();
  }
  return handleTursoDatabaseRequest(req, res, collection);
}
