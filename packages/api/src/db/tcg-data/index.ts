import { drizzle } from "drizzle-orm/libsql";
import { databaseFile } from "./drizzle.config";
import * as schema from "./schema";
import * as relations from "./relations";
export * from "./schema";

export const tcgData = drizzle(databaseFile, { 
  schema: {
    ...schema,
    ...relations,
  }
});
