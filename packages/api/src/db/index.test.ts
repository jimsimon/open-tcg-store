import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the database layer to avoid requiring real SQLite files.
// Follows the same pattern as service tests (e.g. settings-service.test.ts).
// ---------------------------------------------------------------------------

function chainable(rows: unknown[] = []) {
  const chain = Object.assign(Promise.resolve(rows), {} as Record<string, unknown>);
  for (const method of [
    'select',
    'from',
    'where',
    'limit',
    'offset',
    'insert',
    'update',
    'delete',
    'set',
    'values',
    'returning',
    'orderBy',
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

let selectChain: ReturnType<typeof chainable>;

const mockOtcgs = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const mockTcgData = vi.hoisted(() => ({
  select: vi.fn(),
}));

vi.mock('./otcgs/index', () => ({
  otcgs: mockOtcgs,
}));

vi.mock('./tcg-data/index', () => ({
  tcgData: mockTcgData,
}));

import { otcgs } from './index';
import { user } from './otcgs/auth-schema';

describe('database exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectChain = chainable([]);
    mockOtcgs.select.mockImplementation(() => selectChain);
  });

  it('otcgs select returns an array', async () => {
    const result = await otcgs.select().from(user).limit(1);
    expect(Array.isArray(result)).toBe(true);
  });

  it('otcgs select returns defined result', async () => {
    const result = await otcgs.select().from(user).limit(1);
    expect(result).toBeDefined();
  });

  it('otcgs is exported from the barrel', () => {
    expect(otcgs).toBeDefined();
    expect(otcgs.select).toBeTypeOf('function');
    expect(otcgs.insert).toBeTypeOf('function');
    expect(otcgs.update).toBeTypeOf('function');
    expect(otcgs.delete).toBeTypeOf('function');
  });
});
