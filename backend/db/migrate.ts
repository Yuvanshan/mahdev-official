import { runMigrations } from './index';

async function main() {
  const result = await runMigrations();
  console.log('[db:migrate]', JSON.stringify(result, null, 2));
}

void main().catch((error) => {
  console.error('[db:migrate] failed', error);
  process.exit(1);
});
