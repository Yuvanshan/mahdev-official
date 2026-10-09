import type { IncomingMessage, ServerResponse } from 'node:http';

interface ApiRequest extends IncomingMessage {
  method?: string;
}

export default function handler(_req: ApiRequest, res: ServerResponse): void {
  res.statusCode = 404;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    success: false,
    error: 'API endpoint not found.',
  }));
}
