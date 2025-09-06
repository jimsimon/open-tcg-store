import { defineConfig } from "drizzle-kit";

export const databaseFile = `file:${process.cwd()}/sqlite-data/mtg.sqlite`

export default defineConfig({
  out: './src/db/mtg',
  dialect: "sqlite",
  dbCredentials: {
    url: databaseFile,
  },
});
