import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { databaseFile } from './drizzle.config';
import { databaseFile as tcgDataDatabaseFile } from '../tcg-data/drizzle.config';
import * as schema from './schema';
import * as tcgDataSchema from '../tcg-data/schema';
import * as tcgDataRelations from '../tcg-data/relations';
import * as shoppingRelations from './shopping-relations';
import * as inventoryRelations from './inventory-relations';
import * as inventoryStockRelations from './inventory-stock-relations';
import * as orderRelations from './order-relations';

import * as transactionLogRelations from './transaction-log-relations';
import * as storeSupportedGameRelations from './store-supported-game-relations';
import * as buyRateRelations from './buy-rate-relations';
import * as lotRelations from './lot-relations';
import * as lotItemRelations from './lot-item-relations';
export * from './schema';

const client = createClient({ url: databaseFile });
// Strip the "file:" prefix for ATTACH DATABASE since it expects a plain file path
export const tcgDataFilePath = tcgDataDatabaseFile.replace(/^file:/, '');
await client.execute(`ATTACH DATABASE '${tcgDataFilePath}' AS tcg_data;`);

// Workaround: The libsql sqlite3 driver sets its internal connection to null
// when transaction() is called, causing a new connection to be lazily created
// on the next query — but that new connection won't have tcg_data ATTACHed.
// We patch transaction() to re-ATTACH after commit/rollback so the replacement
// connection is ready for cross-database queries.
// See: https://github.com/tursodatabase/libsql-client-ts — no upstream fix
// exists as of @libsql/client@0.17.2. Remove this workaround if the driver
// stops nulling the connection on transaction().
const REATTACH_MAX_RETRIES = 3;
const REATTACH_RETRY_DELAY_MS = 50;

async function ensureTcgDataAttached(): Promise<void> {
  for (let attempt = 1; attempt <= REATTACH_MAX_RETRIES; attempt++) {
    try {
      // Check whether tcg_data is already attached on the current connection.
      // If the driver is ever fixed upstream this avoids a redundant ATTACH.
      const result = await client.execute(`SELECT 1 FROM pragma_database_list WHERE name = 'tcg_data'`);
      if (result.rows.length > 0) return;

      await client.execute(`ATTACH DATABASE '${tcgDataFilePath}' AS tcg_data;`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // "already in use" means a concurrent path already re-ATTACHed — safe to ignore.
      if (message.includes('already in use')) return;

      if (attempt < REATTACH_MAX_RETRIES) {
        console.warn(`[otcgs] ATTACH tcg_data failed (attempt ${attempt}/${REATTACH_MAX_RETRIES}): ${message}`);
        await new Promise((r) => setTimeout(r, REATTACH_RETRY_DELAY_MS));
      } else {
        // All retries exhausted — log but do NOT throw so the original
        // commit/rollback result is not masked.
        console.error(
          `[otcgs] ATTACH tcg_data failed after ${REATTACH_MAX_RETRIES} attempts: ${message}. ` +
            'Cross-database queries will fail until the next successful ATTACH.',
        );
      }
    }
  }
}

const originalTransaction = client.transaction.bind(client);
client.transaction = async (mode?: 'write' | 'read' | 'deferred') => {
  const tx = await originalTransaction(mode);
  const originalCommit = tx.commit.bind(tx);
  const originalRollback = tx.rollback.bind(tx);
  tx.commit = async () => {
    await originalCommit();
    await ensureTcgDataAttached();
  };
  tx.rollback = async () => {
    await originalRollback();
    await ensureTcgDataAttached();
  };
  return tx;
};

const otcgs = drizzle(client, {
  schema: {
    ...schema,
    ...tcgDataSchema,
    ...tcgDataRelations,
    ...shoppingRelations,
    ...inventoryRelations,
    ...inventoryStockRelations,
    ...orderRelations,

    ...transactionLogRelations,
    ...storeSupportedGameRelations,
    ...buyRateRelations,
    ...lotRelations,
    ...lotItemRelations,
  },
});

// Apply pending migrations on startup (skipped during tests where push-based workflow is used)
if (process.env.NODE_ENV !== 'test') {
  const { applyMigrations } = await import('./migrator');
  await applyMigrations(otcgs, client);
}

export { client, otcgs };

// --- Database update state management ---

let _isDatabaseUpdating = false;

export function isDatabaseUpdating(): boolean {
  return _isDatabaseUpdating;
}

export function setDatabaseUpdating(value: boolean): void {
  _isDatabaseUpdating = value;
}
