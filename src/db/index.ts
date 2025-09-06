import { drizzle } from "drizzle-orm/libsql";
import { databaseFile as otcgsDatabaseFile } from './otcgs/drizzle.config';
import { databaseFile as mtgDatabaseFile } from './mtg/drizzle.config';

export const mtg = drizzle(mtgDatabaseFile)
export const otcgs = drizzle(otcgsDatabaseFile)