import { join } from 'node:path';
import { defineConfig } from 'drizzle-kit';
import { workspaceRootSync } from 'workspace-root';

const fileName = 'tcg-data.sqlite';
const defaultPath = join(workspaceRootSync() ?? '', 'sqlite-data');

export const databasePath = process.env.TCG_DATA_DATABASE_PATH
  ? `file:${process.env.TCG_DATA_DATABASE_PATH}`
  : `file:${defaultPath}`;

export default defineConfig({
  out: './src/db/tcg-data/migrations',
  schema: './src/db/tcg-data/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: join(databasePath, fileName),
  },
});
