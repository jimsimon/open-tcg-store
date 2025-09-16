import { drizzle } from "drizzle-orm/libsql";
import { databaseFile as otcgsDatabaseFile } from "./otcgs/drizzle.config";
import * as otcgsSchema from "./otcgs/schema";
export * from './otcgs/schema'

export const otcgs = drizzle(otcgsDatabaseFile, { schema: otcgsSchema });
