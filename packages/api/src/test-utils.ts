import { vi } from 'vitest';

/**
 * Create a chainable mock that mimics a Drizzle ORM query builder.
 * Returns a Promise that resolves to `rows` while also exposing
 * common query-builder methods as vi.fn() stubs.
 */
export function chainable(rows: unknown[] = []) {
  const chain = Object.assign(Promise.resolve(rows), {} as Record<string, unknown>);
  for (const method of [
    'select',
    'from',
    'where',
    'limit',
    'offset',
    'innerJoin',
    'leftJoin',
    'insert',
    'update',
    'delete',
    'set',
    'values',
    'returning',
    'orderBy',
    'groupBy',
    'having',
    'onConflictDoUpdate',
    'onConflictDoNothing',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}
