import { runSeeders } from './index';

async function main() {
  const result = await runSeeders();
  console.log('[db:seed]', JSON.stringify(result, null, 2));
}

void main().catch((error) => {
  console.error('[db:seed] failed', error);
  process.exit(1);
});
