import { defineConfig } from "drizzle-kit";
import { workspaceRootSync } from "workspace-root";

export const databaseFile = `file:${workspaceRootSync()}/sqlite-data/otcgs.sqlite`

export default defineConfig({
  out: './src/db/otcgs',
  schema: "./src/db/otcgs/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseFile,
  },
});
