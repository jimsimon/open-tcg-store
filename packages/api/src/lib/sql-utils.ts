import { sql, type SQL, type Column } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Pagination constants
// ---------------------------------------------------------------------------

/** Maximum number of items a client may request per page. */
export const MAX_PAGE_SIZE = 200;

/** Default page size when not specified by the client. */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Normalize pagination parameters, clamping page size to the allowed maximum
 * and defaulting unspecified values.
 */
export function normalizePagination(pagination?: { page?: number | null; pageSize?: number | null } | null) {
  const page = Math.max(1, pagination?.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, pagination?.pageSize ?? DEFAULT_PAGE_SIZE));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

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
