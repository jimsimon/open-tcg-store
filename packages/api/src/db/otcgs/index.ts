import { drizzle } from "drizzle-orm/libsql";
import { databaseFile } from "./drizzle.config";
import { databaseFile as tcgDataDatabaseFile } from "../tcg-data/drizzle.config";
import * as schema from "./schema";
import * as relations from "./relations";
import * as tcgDataSchema from "../tcg-data/schema";
import * as tcgDataRelations from "../tcg-data/relations";
import { sql } from "drizzle-orm";
export * from "./schema";

const otcgs = drizzle(databaseFile, {
  schema: {
    ...schema,
    ...tcgDataSchema,
    ...relations,
    ...tcgDataRelations,
  },
});
otcgs.run(sql`ATTACH_DATABASE '${tcgDataDatabaseFile}' AS tcg_data;`);
export { otcgs };
