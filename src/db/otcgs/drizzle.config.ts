import { defineConfig } from "drizzle-kit";

export const databaseFile = `file:${process.cwd()}/sqlite-data/otcgs.sqlite`

export default defineConfig({
  out: './src/db/otcgs',
  schema: "./src/db/otcgs/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseFile,
  },
});
