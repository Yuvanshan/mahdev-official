import 'dotenv/config';
import express from 'express';
import apiRouter from './api';
import { runMigrations, runSeeders } from './db';
import { initializeTursoDatabase } from '../server/tursoDatabase';
import { createTursoRouter } from '../server/tursoRoutes';

const app = express();
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 4000);

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/api/database', createTursoRouter());
app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'mahdev-backend',
    mode: 'separated-backend',
    docs: '/api/health',
  });
});

async function start() {
  const migrationResult = await runMigrations();
  const seederResult = await runSeeders();

  console.log('[backend] migrations:', JSON.stringify(migrationResult));
  console.log('[backend] seeders:', JSON.stringify(seederResult));

  const hasTursoConfig = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
  if (hasTursoConfig) {
    await initializeTursoDatabase();
    console.log('[backend] Turso connected and initialized');
  } else {
    console.warn('[backend] TURSO_DATABASE_URL / TURSO_AUTH_TOKEN missing; using local seed fallback.');
  }

  app.listen(port, () => {
    console.log(`[backend] listening on http://localhost:${port}`);
  });
}

void start().catch((error) => {
  console.error('[backend] startup failed', error);
  process.exit(1);
});

export default app;
