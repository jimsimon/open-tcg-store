import { drizzle } from "drizzle-orm/libsql";
import { otcgsDatabaseFile, mtgDatabaseFile } from '../../drizzle.config';

export const mtg = drizzle(mtgDatabaseFile)
export const otcgs = drizzle(otcgsDatabaseFile)