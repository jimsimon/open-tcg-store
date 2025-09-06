import { defineConfig } from "drizzle-kit";

export const otcgsDatabaseFile = 'file:./src/db/data/otcgs.sqlite'
export const mtgDatabaseFile = 'file:./src/db/data/mtg.sqlite'

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  dialect: "sqlite",
  dbCredentials: {
    url: otcgsDatabaseFile,
  },
});
