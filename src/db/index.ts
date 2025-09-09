import { drizzle } from "drizzle-orm/libsql";
import { databaseFile as otcgsDatabaseFile } from './otcgs/drizzle.config';
import { databaseFile as mtgDatabaseFile } from './mtg/drizzle.config';
import { databaseFile as pokemonDatabaseFile } from './pokemon/drizzle.config';

export const magic = drizzle(mtgDatabaseFile)
export const otcgs = drizzle(otcgsDatabaseFile)
export const pokemon = drizzle(pokemonDatabaseFile)