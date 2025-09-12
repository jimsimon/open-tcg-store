import { defineConfig } from "drizzle-kit";
import { workspaceRootSync } from "workspace-root";

export const databaseFile = `file:${workspaceRootSync()}/sqlite-data/mtg.sqlite`;

export default defineConfig({
  out: "./src/db/mtg",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseFile,
  },
});
