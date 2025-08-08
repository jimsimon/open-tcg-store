import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: "./src/db/pgdata",
  },
  driver: "pglite",
});
