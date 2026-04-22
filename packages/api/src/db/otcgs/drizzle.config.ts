import { join } from 'node:path';
import { defineConfig } from 'drizzle-kit';
import { workspaceRootSync } from 'workspace-root';

const fileName = 'otcgs.sqlite';
const defaultPath = join(workspaceRootSync() ?? '', 'sqlite-data');

export const databaseFile = process.env.OTCGS_DATABASE_PATH
  ? `file:${process.env.OTCGS_DATABASE_PATH}`
  : `file:${defaultPath}`;

/** Plain filesystem path (no `file:` prefix) for backup/copy operations */
export const databasePath = process.env.OTCGS_DATABASE_PATH || defaultPath;

export default defineConfig({
  out: './src/db/otcgs/migrations',
  schema: ['./src/db/otcgs/schema.ts'],
  dialect: 'sqlite',
  dbCredentials: {
    url: join(databasePath, fileName),
  },
});
