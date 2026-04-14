import { sql, type SQL, type Column } from 'drizzle-orm';

/**
 * Escape SQL LIKE wildcard characters (% and _) in a search term using
 * backslash as the escape character.
 */
function escapeLikeWildcards(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&');
}

/**
 * Build a `column LIKE pattern ESCAPE '\'` SQL expression with properly
 * escaped wildcards in the search term. SQLite's LIKE has no default escape
 * character — without the explicit ESCAPE clause, backslash-escaped wildcards
 * are treated as literal characters and the escaping has no effect.
 *
 * @param mode - 'contains' wraps as `%term%` (default), 'startsWith' wraps as `term%`
 */
export function likeEscaped(column: Column | SQL, pattern: string, mode: 'contains' | 'startsWith' = 'contains'): SQL {
  const escaped = escapeLikeWildcards(pattern);
  const wrapped = mode === 'startsWith' ? `${escaped}%` : `%${escaped}%`;
  return sql`${column} LIKE ${wrapped} ESCAPE '\\'`;
}
