import { drizzle } from 'drizzle-orm/libsql';
import { databaseFile } from './drizzle.config';
import * as schema from './schema';
import * as relations from './relations';
export * from './schema';

// Use `let` so ESM live bindings allow the export to be reassigned
// when reconnecting after a database file swap.
let tcgData = drizzle(databaseFile, {
  schema: {
    ...schema,
    ...relations,
  },
});

export { tcgData };

/**
 * Close the current tcgData connection and create a new one pointing
 * at the (potentially replaced) database file on disk.
 */
export function reconnectTcgData(): void {
  tcgData.$client.close();
  tcgData = drizzle(databaseFile, {
    schema: {
      ...schema,
      ...relations,
    },
  });
}
