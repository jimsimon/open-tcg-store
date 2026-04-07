import { drizzle } from 'drizzle-orm/libsql';
import { databaseFile } from './drizzle.config';
import * as schema from './schema';
import * as relations from './relations';
export * from './schema';

// Use `let` so `reconnectTcgData` can reassign the binding. Note that ESM
// named exports are live bindings, so modules that import `tcgData` directly
// (e.g. `import { tcgData } from …`) will see the updated reference after
// reconnection. However, any consumer that captures the value in a local
// variable (e.g. `const db = tcgData`) will retain the stale reference.
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
