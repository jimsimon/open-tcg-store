import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
const client = new PGlite("./src/db/pgdata");
export const db = drizzle({ client });
