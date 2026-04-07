import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockAssertPermission,
  mockGetUserId,
  mockGetAllStoreLocations,
  mockGetStoreLocation,
  mockGetActiveStoreLocation,
  mockGetEmployeeStoreLocations,
  mockAddStoreLocation,
  mockUpdateStoreLocation,
  mockRemoveStoreLocation,
  mockSetActiveStore,
} = vi.hoisted(() => ({
  mockAssertPermission: vi.fn(),
  mockGetUserId: vi.fn().mockReturnValue('user-1'),
  mockGetAllStoreLocations: vi.fn(),
  mockGetStoreLocation: vi.fn(),
  mockGetActiveStoreLocation: vi.fn(),
  mockGetEmployeeStoreLocations: vi.fn(),
  mockAddStoreLocation: vi.fn(),
  mockUpdateStoreLocation: vi.fn(),
  mockRemoveStoreLocation: vi.fn(),
  mockSetActiveStore: vi.fn(),
}));

vi.mock('../../../lib/assert-permission', () => ({
  assertPermission: mockAssertPermission,
  getUserId: mockGetUserId,
}));

vi.mock('../../../services/store-location-service', () => ({
  getAllStoreLocations: mockGetAllStoreLocations,
  getStoreLocation: mockGetStoreLocation,
  getActiveStoreLocation: mockGetActiveStoreLocation,
  getEmployeeStoreLocations: mockGetEmployeeStoreLocations,
  addStoreLocation: mockAddStoreLocation,
  updateStoreLocation: mockUpdateStoreLocation,
  removeStoreLocation: mockRemoveStoreLocation,
  setActiveStore: mockSetActiveStore,
}));

import { getAllStoreLocations as _getAll } from './Query/getAllStoreLocations';
import { getStoreLocation as _getOne } from './Query/getStoreLocation';
import { getActiveStoreLocation as _getActive } from './Query/getActiveStoreLocation';
import { getEmployeeStoreLocations as _getEmployee } from './Query/getEmployeeStoreLocations';
import { addStoreLocation as _add } from './Mutation/addStoreLocation';
import { updateStoreLocation as _update } from './Mutation/updateStoreLocation';
import { removeStoreLocation as _remove } from './Mutation/removeStoreLocation';
import { setActiveStoreLocation as _setActive } from './Mutation/setActiveStoreLocation';

const getAllStoreLocations = _getAll as (...args: unknown[]) => Promise<unknown>;
const getStoreLocation = _getOne as (...args: unknown[]) => Promise<unknown>;
const getActiveStoreLocation = _getActive as (...args: unknown[]) => Promise<unknown>;
const getEmployeeStoreLocations = _getEmployee as (...args: unknown[]) => Promise<unknown>;
const addStoreLocation = _add as (...args: unknown[]) => Promise<unknown>;
const updateStoreLocation = _update as (...args: unknown[]) => Promise<unknown>;
const removeStoreLocation = _remove as (...args: unknown[]) => Promise<unknown>;
const setActiveStoreLocation = _setActive as (...args: unknown[]) => Promise<unknown>;

function ctx() {
  return {
    auth: { user: { id: 'user-1' }, session: { activeOrganizationId: 'org-1' } },
    req: { headers: { authorization: 'Bearer token' } },
  };
}

describe('store-locations resolvers', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAllStoreLocations', () => {
    it('should delegate to service', async () => {
      mockGetAllStoreLocations.mockResolvedValue([{ id: 'org-1' }]);
      const result = await getAllStoreLocations(null, {}, ctx());
      expect(result).toEqual([{ id: 'org-1' }]);
    });
  });

  describe('getStoreLocation', () => {
    it('should delegate with id arg', async () => {
      mockGetStoreLocation.mockResolvedValue({ id: 'org-1' });
      const result = await getStoreLocation(null, { id: 'org-1' }, ctx());
      expect(mockGetStoreLocation).toHaveBeenCalledWith('org-1');
      expect(result).toEqual({ id: 'org-1' });
    });
  });

  describe('getActiveStoreLocation', () => {
    it('should require authentication and pass headers to service', async () => {
      mockGetActiveStoreLocation.mockResolvedValue({ id: 'org-1' });
      await getActiveStoreLocation(null, {}, ctx());
      expect(mockGetUserId).toHaveBeenCalledWith(expect.objectContaining({ auth: expect.anything() }));
      expect(mockGetActiveStoreLocation).toHaveBeenCalledWith(
        expect.objectContaining({ authorization: 'Bearer token' }),
      );
    });
  });

  describe('getEmployeeStoreLocations', () => {
    it('should require authentication and pass headers to service', async () => {
      mockGetEmployeeStoreLocations.mockResolvedValue([]);
      await getEmployeeStoreLocations(null, {}, ctx());
      expect(mockGetUserId).toHaveBeenCalledWith(expect.objectContaining({ auth: expect.anything() }));
      expect(mockGetEmployeeStoreLocations).toHaveBeenCalledWith(
        expect.objectContaining({ authorization: 'Bearer token' }),
      );
    });
  });

  describe('addStoreLocation', () => {
    it('should check permissions and delegate', async () => {
      const input = { name: 'New', slug: 'new', street1: '123', city: 'A', state: 'IL', zip: '60601' };
      mockAddStoreLocation.mockResolvedValue({ id: 'org-new' });

      await addStoreLocation(null, { input }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { storeLocations: ['create'] });
      expect(mockAddStoreLocation).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authorization: 'Bearer token' }),
      );
    });
  });

  describe('updateStoreLocation', () => {
    it('should check permissions and delegate', async () => {
      const input = { id: 'org-1', name: 'Updated' };
      mockUpdateStoreLocation.mockResolvedValue({ id: 'org-1', name: 'Updated' });

      await updateStoreLocation(null, { input }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { storeLocations: ['update'] });
      expect(mockUpdateStoreLocation).toHaveBeenCalledWith(
        input,
        expect.objectContaining({ authorization: 'Bearer token' }),
      );
    });
  });

  describe('removeStoreLocation', () => {
    it('should check permissions and delegate', async () => {
      mockRemoveStoreLocation.mockResolvedValue(true);

      await removeStoreLocation(null, { id: 'org-1' }, ctx());

      expect(mockAssertPermission).toHaveBeenCalledWith(expect.anything(), { storeLocations: ['delete'] });
      expect(mockRemoveStoreLocation).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ authorization: 'Bearer token' }),
      );
    });
  });

  describe('setActiveStoreLocation', () => {
    it('should require authentication and delegate to service', async () => {
      mockSetActiveStore.mockResolvedValue(undefined);

      const result = await setActiveStoreLocation(null, { organizationId: 'org-1' }, ctx());

      expect(mockGetUserId).toHaveBeenCalledWith(expect.objectContaining({ auth: expect.anything() }));
      expect(mockSetActiveStore).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ authorization: 'Bearer token' }),
      );
      expect(result).toBe(true);
    });
  });
});
