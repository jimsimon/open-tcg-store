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
import * as storeHoursRelations from './store-hours-relations';
import * as transactionLogRelations from './transaction-log-relations';
import * as storeSupportedGameRelations from './store-supported-game-relations';
import * as buyRateRelations from './buy-rate-relations';
export * from './schema';

const client = createClient({ url: databaseFile });
// Strip the "file:" prefix for ATTACH DATABASE since it expects a plain file path
export const tcgDataFilePath = tcgDataDatabaseFile.replace(/^file:/, '');
await client.execute(`ATTACH DATABASE '${tcgDataFilePath}' AS tcg_data;`);

const otcgs = drizzle(client, {
  schema: {
    ...schema,
    ...tcgDataSchema,
    ...tcgDataRelations,
    ...shoppingRelations,
    ...inventoryRelations,
    ...inventoryStockRelations,
    ...orderRelations,
    ...storeHoursRelations,
    ...transactionLogRelations,
    ...storeSupportedGameRelations,
    ...buyRateRelations,
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
