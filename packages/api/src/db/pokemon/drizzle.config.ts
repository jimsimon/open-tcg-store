import { defineConfig } from "drizzle-kit";
import { workspaceRootSync } from "workspace-root";

export const databaseFile = `file:${workspaceRootSync()}/sqlite-data/pokemon.sqlite`;

export default defineConfig({
  out: "./src/db/pokemon",
  schema: "./src/db/pokemon/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseFile,
  },
});
