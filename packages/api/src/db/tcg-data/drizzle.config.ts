import { defineConfig } from "drizzle-kit";
import { workspaceRootSync } from "workspace-root";

export const databaseFile = `file:${workspaceRootSync()}/sqlite-data/tcg-data.sqlite`

export default defineConfig({
  out: './src/db/tcg-data',
  schema: "./src/db/tcg-data/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseFile,
  },
});
