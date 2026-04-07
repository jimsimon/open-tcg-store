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

const { mockOtcgs, mockIsDatabaseUpdating, mockSetDatabaseUpdating, mockClient } = vi.hoisted(() => ({
  mockOtcgs: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockIsDatabaseUpdating: vi.fn().mockReturnValue(false),
  mockSetDatabaseUpdating: vi.fn(),
  mockClient: { execute: vi.fn() },
}));

const { mockTcgData, mockReconnectTcgData } = vi.hoisted(() => ({
  mockTcgData: {
    select: vi.fn(),
  },
  mockReconnectTcgData: vi.fn(),
}));

vi.mock('./otcgs/index', () => ({
  otcgs: mockOtcgs,
  isDatabaseUpdating: mockIsDatabaseUpdating,
  setDatabaseUpdating: mockSetDatabaseUpdating,
  client: mockClient,
  tcgDataFilePath: '/fake/tcg-data.sqlite',
}));

vi.mock('./tcg-data/index', () => ({
  tcgData: mockTcgData,
  reconnectTcgData: mockReconnectTcgData,
}));

import { otcgs, isDatabaseUpdating, setDatabaseUpdating, client } from './index';
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

// ---------------------------------------------------------------------------
// Database update state management exports
// ---------------------------------------------------------------------------

describe('database update state management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isDatabaseUpdating is exported and callable', () => {
    expect(isDatabaseUpdating).toBeTypeOf('function');
    isDatabaseUpdating();
    expect(mockIsDatabaseUpdating).toHaveBeenCalled();
  });

  it('isDatabaseUpdating returns false by default', () => {
    mockIsDatabaseUpdating.mockReturnValue(false);
    expect(isDatabaseUpdating()).toBe(false);
  });

  it('setDatabaseUpdating is exported and callable', () => {
    expect(setDatabaseUpdating).toBeTypeOf('function');
    setDatabaseUpdating(true);
    expect(mockSetDatabaseUpdating).toHaveBeenCalledWith(true);
  });

  it('getOtcgsClient is exported and returns the client', () => {
    expect(client).toBeDefined();
    expect(client.execute).toBeTypeOf('function');
  });
});
