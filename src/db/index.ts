import { drizzle } from "drizzle-orm/libsql";
import { databaseFile as otcgsDatabaseFile } from './otcgs/drizzle.config';
import { databaseFile as mtgDatabaseFile } from './mtg/drizzle.config';
import { databaseFile as pokemonDatabaseFile } from './pokemon/drizzle.config';
import * as otcgsSchema from './otcgs/schema'
import * as magicSchema from './mtg/schema'
import * as pokemonSchema from './pokemon'

export const magic = drizzle(mtgDatabaseFile, { schema: magicSchema })
export const otcgs = drizzle(otcgsDatabaseFile, { schema: otcgsSchema })
export const pokemon = drizzle(pokemonDatabaseFile, { schema: pokemonSchema })