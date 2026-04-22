import { join } from 'node:path';
import { defineConfig } from 'drizzle-kit';
import { workspaceRootSync } from 'workspace-root';

const fileName = 'otcgs.sqlite';
const defaultPath = join(workspaceRootSync() ?? '', 'sqlite-data');
const databasePath = process.env.OTCGS_DATABASE_PATH ?? defaultPath;

export const databaseFilePath = join(databasePath, fileName);
export const databaseFile = `file:${databaseFilePath}`;

export default defineConfig({
  out: './src/db/otcgs/migrations',
  schema: ['./src/db/otcgs/schema.ts'],
  dialect: 'sqlite',
  dbCredentials: {
    url: databaseFile,
  },
});
