import { defineConfig } from "drizzle-kit";

export const databaseFile = `file:${process.cwd()}/sqlite-data/pokemon.sqlite`

export default defineConfig({
  out: './src/db/pokemon',
  schema: "./src/db/pokemon/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseFile,
  },
});
