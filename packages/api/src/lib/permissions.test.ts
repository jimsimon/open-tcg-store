import { describe, it, expect } from 'vitest';
import { statement, ac, ownerRole, adminRole, memberRole, roles } from './permissions';

// ---------------------------------------------------------------------------
// Tests — verify the permission definitions are correct and complete.
// These tests guard against accidental permission regressions.
// ---------------------------------------------------------------------------

describe('permissions', () => {
  // -----------------------------------------------------------------------
  // statement
  // -----------------------------------------------------------------------
  describe('statement', () => {
    it('should define inventory resource with CRUD actions', () => {
      expect(statement.inventory).toEqual(['create', 'read', 'update', 'delete']);
    });

    it('should define order resource with create, read, update, cancel actions', () => {
      expect(statement.order).toEqual(['create', 'read', 'update', 'cancel']);
    });

    it('should define storeSettings resource with read, update actions', () => {
      expect(statement.storeSettings).toEqual(['read', 'update']);
    });

    it('should define storeLocations resource with CRUD actions', () => {
      expect(statement.storeLocations).toEqual(['create', 'read', 'update', 'delete']);
    });

    it('should define userManagement resource with CRUD actions', () => {
      expect(statement.userManagement).toEqual(['create', 'read', 'update', 'delete']);
    });

    it('should include default organization statements', () => {
      // better-auth default statements include these keys
      expect(statement).toHaveProperty('organization');
      expect(statement).toHaveProperty('member');
      expect(statement).toHaveProperty('invitation');
    });
  });

  // -----------------------------------------------------------------------
  // access control instance
  // -----------------------------------------------------------------------
  describe('ac', () => {
    it('should be defined', () => {
      expect(ac).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // ownerRole
  // -----------------------------------------------------------------------
  describe('ownerRole', () => {
    it('should be defined', () => {
      expect(ownerRole).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // adminRole
  // -----------------------------------------------------------------------
  describe('adminRole', () => {
    it('should be defined', () => {
      expect(adminRole).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // memberRole
  // -----------------------------------------------------------------------
  describe('memberRole', () => {
    it('should be defined', () => {
      expect(memberRole).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // roles mapping
  // -----------------------------------------------------------------------
  describe('roles', () => {
    it('should map owner, admin, and member role names', () => {
      expect(roles).toEqual({
        owner: ownerRole,
        admin: adminRole,
        member: memberRole,
      });
    });

    it('should have exactly three roles', () => {
      expect(Object.keys(roles)).toHaveLength(3);
    });
  });
});
