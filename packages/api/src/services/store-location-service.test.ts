import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function chainable(rows: unknown[] = []) {
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
  ]) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockOtcgs = vi.hoisted(() => {
  const mock = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    all: vi.fn(),
    transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        select: (...args: unknown[]) => mock.select(...args),
        insert: (...args: unknown[]) => mock.insert(...args),
        update: (...args: unknown[]) => mock.update(...args),
        delete: (...args: unknown[]) => mock.delete(...args),
        all: (...args: unknown[]) => mock.all(...args),
      };
      return fn(tx);
    }),
  };
  return mock;
});

const mockAuth = vi.hoisted(() => ({
  api: {
    listOrganizations: vi.fn(),
    getSession: vi.fn(),
    createOrganization: vi.fn(),
    updateOrganization: vi.fn(),
    deleteOrganization: vi.fn(),
    setActiveOrganization: vi.fn(),
  },
}));

vi.mock('../db', () => ({
  otcgs: mockOtcgs,
}));

vi.mock('../db/otcgs/store-hours-schema', () => ({
  storeHours: {
    id: 'store_hours.id',
    organizationId: 'store_hours.organization_id',
    dayOfWeek: 'store_hours.day_of_week',
    openTime: 'store_hours.open_time',
    closeTime: 'store_hours.close_time',
  },
}));

vi.mock('../auth', () => ({
  auth: mockAuth,
}));

vi.mock('drizzle-orm', () => {
  const sqlResult = () => ({ type: 'sql', as: vi.fn().mockReturnValue({ type: 'sql-alias' }) });
  const sqlFn = Object.assign(
    vi.fn((..._args: unknown[]) => sqlResult()),
    {
      raw: vi.fn(),
      join: vi.fn((..._args: unknown[]) => ({ type: 'sql-join' })),
    },
  );
  return {
    eq: vi.fn((...args: unknown[]) => ({ type: 'eq', args })),
    sql: sqlFn,
  };
});

// Import after mocks
import {
  getAllStoreLocations,
  getEmployeeStoreLocations,
  getStoreLocation,
  getActiveStoreLocation,
  addStoreLocation,
  updateStoreLocation,
  removeStoreLocation,
  setActiveStore,
} from './store-location-service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeOrg(overrides: Record<string, unknown> = {}) {
  return {
    id: 'org-1',
    name: 'Main Store',
    slug: 'main-store',
    street1: '123 Main St',
    street2: null,
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    phone: '555-1234',
    createdAt: 1704067200, // 2024-01-01 as unix timestamp
    ...overrides,
  };
}

function fakeHoursRows() {
  return [
    { dayOfWeek: 0, openTime: null, closeTime: null },
    { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00' },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00' },
  ];
}

const testHeaders = { authorization: 'Bearer test-token' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('store-location-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getAllStoreLocations
  // -----------------------------------------------------------------------
  describe('getAllStoreLocations', () => {
    it('should return all store locations with hours', async () => {
      mockOtcgs.all.mockResolvedValue([fakeOrg()]);

      // Hours query for each org
      const hoursChain = chainable(fakeHoursRows());
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await getAllStoreLocations();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('org-1');
      expect(result[0].name).toBe('Main Store');
      expect(result[0].hours).toHaveLength(3);
    });

    it('should return empty array when no organizations exist', async () => {
      mockOtcgs.all.mockResolvedValue([]);

      const result = await getAllStoreLocations();

      expect(result).toEqual([]);
    });

    it('should return multiple locations each with their own hours', async () => {
      mockOtcgs.all.mockResolvedValue([fakeOrg({ id: 'org-1' }), fakeOrg({ id: 'org-2', name: 'Branch Store' })]);

      let callIdx = 0;
      mockOtcgs.select.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return chainable(fakeHoursRows());
        return chainable([{ dayOfWeek: 1, openTime: '10:00', closeTime: '18:00' }]);
      });

      const result = await getAllStoreLocations();

      expect(result).toHaveLength(2);
      expect(result[0].hours).toHaveLength(3);
      expect(result[1].hours).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // getEmployeeStoreLocations
  // -----------------------------------------------------------------------
  describe('getEmployeeStoreLocations', () => {
    it('should return store locations the user has access to', async () => {
      mockAuth.api.listOrganizations.mockResolvedValue([
        {
          id: 'org-1',
          name: 'Main Store',
          slug: 'main-store',
          street1: '123 Main St',
          street2: null,
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          phone: '555-1234',
          createdAt: new Date('2024-01-01'),
        },
      ]);

      const hoursChain = chainable(fakeHoursRows());
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await getEmployeeStoreLocations(testHeaders);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Main Store');
      expect(mockAuth.api.listOrganizations).toHaveBeenCalledWith({ headers: testHeaders });
    });

    it('should return empty array when user has no organizations', async () => {
      mockAuth.api.listOrganizations.mockResolvedValue([]);

      const result = await getEmployeeStoreLocations(testHeaders);

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getStoreLocation
  // -----------------------------------------------------------------------
  describe('getStoreLocation', () => {
    it('should return a store location by ID', async () => {
      mockOtcgs.all.mockResolvedValue([fakeOrg()]);

      const hoursChain = chainable(fakeHoursRows());
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await getStoreLocation('org-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('org-1');
      expect(result!.name).toBe('Main Store');
    });

    it('should return null when store location not found', async () => {
      mockOtcgs.all.mockResolvedValue([]);

      const result = await getStoreLocation('nonexistent');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getActiveStoreLocation
  // -----------------------------------------------------------------------
  describe('getActiveStoreLocation', () => {
    it('should return the active store location for the user', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        session: { activeOrganizationId: 'org-1' },
      });
      mockOtcgs.all.mockResolvedValue([fakeOrg()]);

      const hoursChain = chainable(fakeHoursRows());
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await getActiveStoreLocation(testHeaders);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('org-1');
    });

    it('should return null when no session exists', async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const result = await getActiveStoreLocation(testHeaders);

      expect(result).toBeNull();
    });

    it('should return null when session has no active organization', async () => {
      mockAuth.api.getSession.mockResolvedValue({
        session: { activeOrganizationId: null },
      });

      const result = await getActiveStoreLocation(testHeaders);

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // addStoreLocation
  // -----------------------------------------------------------------------
  describe('addStoreLocation', () => {
    it('should create a new store location via auth API and insert hours', async () => {
      mockAuth.api.createOrganization.mockResolvedValue({
        id: 'org-new',
        name: 'New Store',
        slug: 'new-store',
        createdAt: new Date('2026-01-01'),
      });

      const insertChain = chainable([]);
      mockOtcgs.insert.mockImplementation(() => insertChain);

      // getHoursForOrg after insert
      const hoursChain = chainable([{ dayOfWeek: 1, openTime: '09:00', closeTime: '17:00' }]);
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await addStoreLocation(
        {
          name: 'New Store',
          slug: 'new-store',
          street1: '456 Oak Ave',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
          hours: [{ dayOfWeek: 1, openTime: '09:00', closeTime: '17:00' }],
        },
        testHeaders,
      );

      expect(result.id).toBe('org-new');
      expect(result.name).toBe('New Store');
      expect(result.hours).toHaveLength(1);
      expect(mockAuth.api.createOrganization).toHaveBeenCalled();
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should create a store location with hours that have undefined openTime/closeTime', async () => {
      mockAuth.api.createOrganization.mockResolvedValue({
        id: 'org-new',
        name: 'Closed Store',
        slug: 'closed-store',
        createdAt: new Date('2026-01-01'),
      });

      const insertChain = chainable([]);
      mockOtcgs.insert.mockImplementation(() => insertChain);

      const hoursChain = chainable([{ dayOfWeek: 0, openTime: null, closeTime: null }]);
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await addStoreLocation(
        {
          name: 'Closed Store',
          slug: 'closed-store',
          street1: '789 Elm',
          city: 'Detroit',
          state: 'MI',
          zip: '48201',
          // Hours with undefined openTime/closeTime — exercises ?? null branches
          hours: [{ dayOfWeek: 0 }],
        },
        testHeaders,
      );

      expect(result.hours).toHaveLength(1);
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should create a store location without hours', async () => {
      mockAuth.api.createOrganization.mockResolvedValue({
        id: 'org-new',
        name: 'Store Without Hours',
        slug: 'no-hours',
        createdAt: new Date('2026-01-01'),
      });

      // getHoursForOrg returns empty
      const hoursChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await addStoreLocation(
        {
          name: 'Store Without Hours',
          slug: 'no-hours',
          street1: '789 Elm St',
          city: 'Detroit',
          state: 'MI',
          zip: '48201',
        },
        testHeaders,
      );

      expect(result.hours).toEqual([]);
      // insert should NOT be called for hours (only for org creation through auth)
      expect(mockOtcgs.insert).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // updateStoreLocation
  // -----------------------------------------------------------------------
  describe('updateStoreLocation', () => {
    it('should update organization and replace hours', async () => {
      mockAuth.api.updateOrganization.mockResolvedValue({});

      const deleteChain = chainable([]);
      mockOtcgs.delete.mockImplementation(() => deleteChain);

      const insertChain = chainable([]);
      mockOtcgs.insert.mockImplementation(() => insertChain);

      // getStoreLocation after update
      mockOtcgs.all.mockResolvedValue([fakeOrg({ name: 'Updated Store' })]);
      const hoursChain = chainable([{ dayOfWeek: 1, openTime: '10:00', closeTime: '18:00' }]);
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await updateStoreLocation(
        {
          id: 'org-1',
          name: 'Updated Store',
          hours: [{ dayOfWeek: 1, openTime: '10:00', closeTime: '18:00' }],
        },
        testHeaders,
      );

      expect(result.name).toBe('Updated Store');
      expect(mockAuth.api.updateOrganization).toHaveBeenCalled();
      // Should delete old hours and insert new ones
      expect(mockOtcgs.delete).toHaveBeenCalled();
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should update organization without changing hours when hours is undefined', async () => {
      mockAuth.api.updateOrganization.mockResolvedValue({});

      mockOtcgs.all.mockResolvedValue([fakeOrg({ name: 'Name Only Update' })]);
      const hoursChain = chainable(fakeHoursRows());
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await updateStoreLocation({ id: 'org-1', name: 'Name Only Update' }, testHeaders);

      expect(result.name).toBe('Name Only Update');
      // Should NOT delete or insert hours
      expect(mockOtcgs.delete).not.toHaveBeenCalled();
      expect(mockOtcgs.insert).not.toHaveBeenCalled();
    });

    it('should update all address fields including nullable street2 and phone', async () => {
      mockAuth.api.updateOrganization.mockResolvedValue({});

      mockOtcgs.all.mockResolvedValue([
        fakeOrg({
          name: 'Full Update',
          street1: '999 New St',
          street2: 'Suite B',
          city: 'Austin',
          state: 'TX',
          zip: '73301',
          phone: '555-9999',
        }),
      ]);
      const hoursChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await updateStoreLocation(
        {
          id: 'org-1',
          name: 'Full Update',
          street1: '999 New St',
          street2: 'Suite B',
          city: 'Austin',
          state: 'TX',
          zip: '73301',
          phone: '555-9999',
        },
        testHeaders,
      );

      expect(result.name).toBe('Full Update');
      expect(mockAuth.api.updateOrganization).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            data: expect.objectContaining({
              name: 'Full Update',
              street1: '999 New St',
              street2: 'Suite B',
              city: 'Austin',
              state: 'TX',
              zip: '73301',
              phone: '555-9999',
            }),
          }),
        }),
      );
    });

    it('should handle null street2 and phone by converting to empty string', async () => {
      mockAuth.api.updateOrganization.mockResolvedValue({});

      mockOtcgs.all.mockResolvedValue([fakeOrg()]);
      const hoursChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => hoursChain);

      await updateStoreLocation(
        {
          id: 'org-1',
          street2: null,
          phone: null,
        },
        testHeaders,
      );

      expect(mockAuth.api.updateOrganization).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            data: expect.objectContaining({
              street2: '',
              phone: '',
            }),
          }),
        }),
      );
    });

    it('should replace hours with entries that have undefined openTime/closeTime', async () => {
      mockAuth.api.updateOrganization.mockResolvedValue({});

      const deleteChain = chainable([]);
      mockOtcgs.delete.mockImplementation(() => deleteChain);

      const insertChain = chainable([]);
      mockOtcgs.insert.mockImplementation(() => insertChain);

      mockOtcgs.all.mockResolvedValue([fakeOrg()]);
      const hoursChain = chainable([{ dayOfWeek: 0, openTime: null, closeTime: null }]);
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await updateStoreLocation(
        {
          id: 'org-1',
          // Hours with undefined openTime/closeTime — exercises ?? null branches
          hours: [{ dayOfWeek: 0 }],
        },
        testHeaders,
      );

      expect(result).toBeDefined();
      expect(mockOtcgs.delete).toHaveBeenCalled();
      expect(mockOtcgs.insert).toHaveBeenCalled();
    });

    it('should clear all hours when hours is empty array', async () => {
      mockAuth.api.updateOrganization.mockResolvedValue({});

      const deleteChain = chainable([]);
      mockOtcgs.delete.mockImplementation(() => deleteChain);

      mockOtcgs.all.mockResolvedValue([fakeOrg()]);
      const hoursChain = chainable([]);
      mockOtcgs.select.mockImplementation(() => hoursChain);

      const result = await updateStoreLocation(
        {
          id: 'org-1',
          hours: [],
        },
        testHeaders,
      );

      expect(result).toBeDefined();
      // Should delete old hours but NOT insert new ones (empty array)
      expect(mockOtcgs.delete).toHaveBeenCalled();
      expect(mockOtcgs.insert).not.toHaveBeenCalled();
    });

    it('should throw when store location not found after update', async () => {
      mockAuth.api.updateOrganization.mockResolvedValue({});
      mockOtcgs.all.mockResolvedValue([]);

      await expect(updateStoreLocation({ id: 'nonexistent' }, testHeaders)).rejects.toThrow(
        'Store location not found after update',
      );
    });
  });

  // -----------------------------------------------------------------------
  // removeStoreLocation
  // -----------------------------------------------------------------------
  describe('removeStoreLocation', () => {
    it('should remove a store location when more than one exists', async () => {
      // Count check: 2 organizations
      mockOtcgs.all.mockResolvedValue([{ count: 2 }]);

      const deleteChain = chainable([]);
      mockOtcgs.delete.mockImplementation(() => deleteChain);
      mockAuth.api.deleteOrganization.mockResolvedValue({});

      const result = await removeStoreLocation('org-1', testHeaders);

      expect(result).toBe(true);
      expect(mockOtcgs.delete).toHaveBeenCalled();
      expect(mockAuth.api.deleteOrganization).toHaveBeenCalledWith({
        body: { organizationId: 'org-1' },
        headers: testHeaders,
      });
    });

    it('should throw when trying to remove the last store location', async () => {
      // Count check: only 1 organization
      mockOtcgs.all.mockResolvedValue([{ count: 1 }]);

      await expect(removeStoreLocation('org-1', testHeaders)).rejects.toThrow('Cannot remove the last store location');
    });
  });

  // -----------------------------------------------------------------------
  // setActiveStore
  // -----------------------------------------------------------------------
  describe('setActiveStore', () => {
    it('should set the active organization via auth API', async () => {
      mockAuth.api.setActiveOrganization.mockResolvedValue({});

      await setActiveStore('org-1', testHeaders);

      expect(mockAuth.api.setActiveOrganization).toHaveBeenCalledWith({
        body: { organizationId: 'org-1' },
        headers: testHeaders,
      });
    });
  });
});
