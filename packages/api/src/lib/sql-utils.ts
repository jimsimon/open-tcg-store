/**
 * Escape SQL LIKE wildcard characters (% and _) in a search term.
 * Without this, user input containing these characters acts as wildcards,
 * e.g. searching "%" matches all records.
 */
export function escapeLikeWildcards(term: string): string {
  return term.replace(/[%_]/g, '\\$&');
}
