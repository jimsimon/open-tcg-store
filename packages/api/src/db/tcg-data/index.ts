import { drizzle } from "drizzle-orm/libsql";
import { databaseFile } from "./drizzle.config";
import * as schema from "./schema";
export * from "./schema";

export const tcgData = drizzle(databaseFile, { schema });
