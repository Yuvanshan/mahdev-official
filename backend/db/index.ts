import fs from 'node:fs/promises';
import path from 'node:path';

export interface MigrationDefinition {
  name: string;
  up: () => Promise<void>;
}

export interface SeedDefinition {
  name: string;
  run: () => Promise<void>;
}

export interface DatabaseState {
  migrations: string[];
  seeders: string[];
  updatedAt: string;
}

const statePath = path.resolve(process.cwd(), 'backend', '.db-state.json');

async function ensureStateFile(): Promise<DatabaseState> {
  const initialState: DatabaseState = {
    migrations: [],
    seeders: [],
    updatedAt: new Date().toISOString(),
  };

  try {
    const current = await fs.readFile(statePath, 'utf8');
    const parsed = JSON.parse(current) as Partial<DatabaseState>;
    return {
      migrations: Array.isArray(parsed.migrations) ? parsed.migrations : [],
      seeders: Array.isArray(parsed.seeders) ? parsed.seeders : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(initialState, null, 2));
    return initialState;
  }
}

async function writeState(state: DatabaseState): Promise<void> {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2));
}

const migrations: MigrationDefinition[] = [
  {
    name: '001_create_core_tables',
    up: async () => {
      const dir = path.resolve(process.cwd(), 'backend', 'data');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, 'schema.json'),
        JSON.stringify(
          {
            version: 1,
            tables: ['users', 'products', 'orders', 'settings'],
            createdAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
    },
  },
];

const seeders: SeedDefinition[] = [
  {
    name: '001_seed_default_users',
    run: async () => {
      const dir = path.resolve(process.cwd(), 'backend', 'data');
      await fs.mkdir(dir, { recursive: true });
      const seedDocument = {
        users: [
          { id: 'user_admin', name: 'Mahdev Admin', role: 'admin', email: 'admin@mahdev.lk' },
          { id: 'user_customer', name: 'Demo Customer', role: 'customer', email: 'customer@mahdev.lk' },
        ],
        products: [
          { id: 'prod_001', name: 'Mahdev Enterprise Starter', price: 1999, inventory: 25 },
          { id: 'prod_002', name: 'Mahdev Smart Business Kit', price: 4999, inventory: 12 },
        ],
        settings: {
          appName: 'Mahdev Enterprise',
          currency: 'LKR',
          maintenanceMode: false,
        },
      };
      await fs.writeFile(path.join(dir, 'seed.json'), JSON.stringify(seedDocument, null, 2));
    },
  },
];

export async function runMigrations(): Promise<{ executed: string[]; skipped: string[] }> {
  const state = await ensureStateFile();
  const executed: string[] = [];
  const skipped: string[] = [];

  for (const migration of migrations) {
    if (state.migrations.includes(migration.name)) {
      skipped.push(migration.name);
      continue;
    }

    await migration.up();
    state.migrations.push(migration.name);
    executed.push(migration.name);
  }

  await writeState(state);
  return { executed, skipped };
}

export async function runSeeders(): Promise<{ executed: string[]; skipped: string[] }> {
  const state = await ensureStateFile();
  const executed: string[] = [];
  const skipped: string[] = [];

  for (const seeder of seeders) {
    if (state.seeders.includes(seeder.name)) {
      skipped.push(seeder.name);
      continue;
    }

    await seeder.run();
    state.seeders.push(seeder.name);
    executed.push(seeder.name);
  }

  await writeState(state);
  return { executed, skipped };
}

export async function getDatabaseStatus() {
  const state = await ensureStateFile();
  return {
    migrations: state.migrations.length,
    seeders: state.seeders.length,
    status: 'ready',
    updatedAt: state.updatedAt,
  };
}

export async function listSeededData(collection: 'users' | 'products' | 'settings') {
  const filePath = path.resolve(process.cwd(), 'backend', 'data', 'seed.json');
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed[collection] ?? [];
  } catch {
    return [];
  }
}

export { migrations, seeders };
