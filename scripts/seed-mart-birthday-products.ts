import dotenv from 'dotenv';
import { BIRTHDAY_PARTY_PRODUCTS } from '../frontend/src/data/catalog/birthdayPartyProducts';
import { BIRTHDAY_PARTY_CATEGORY } from '../frontend/src/data/catalog/birthdayPartyCategory';

dotenv.config({ path: process.env.MAHDEV_ENV_FILE || '.env' });

async function seedBirthdayProducts(): Promise<void> {
  const productIds = new Set(BIRTHDAY_PARTY_PRODUCTS.map((product) => product.id));
  if (BIRTHDAY_PARTY_PRODUCTS.length !== 150 || productIds.size !== 150) {
    throw new Error('Birthday starter catalog must contain exactly 150 products with unique IDs.');
  }

  const {
    initializeTursoDatabase,
    importMigratedDocuments,
  } = await import('../backend/db/tursoDatabase');

  await initializeTursoDatabase();
  const categoryResult = await importMigratedDocuments('categories', [
    { id: BIRTHDAY_PARTY_CATEGORY.id, data: { ...BIRTHDAY_PARTY_CATEGORY } },
  ]);
  const productsResult = await importMigratedDocuments(
    'products',
    BIRTHDAY_PARTY_PRODUCTS.map((product) => ({ id: product.id, data: { ...product } }))
  );

  console.info(
    `[Birthday catalog] Category inserted: ${categoryResult.inserted}; products inserted: ${productsResult.inserted}; ` +
      `existing IDs skipped: ${categoryResult.skipped + productsResult.skipped}. All products remain drafts.`
  );
}

seedBirthdayProducts().catch((error: unknown) => {
  console.error('[Birthday catalog] Seeding failed:', error);
  process.exitCode = 1;
});
