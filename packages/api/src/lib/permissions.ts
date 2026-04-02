import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/organization/access';

/**
 * Access control statement defining all permission resources and actions.
 * This is shared between the server (auth.ts) and client (auth-client.ts).
 *
 * All UI visibility and backend authorization are gated on permissions, not role names.
 * Roles are standard bundles of permissions. Adding a new role or changing what a
 * role can do never requires updating gate logic — only the role definition changes.
 */
export const statement = {
  ...defaultStatements,
  inventory: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'cancel'],
  storeSettings: ['read', 'update'],
  storeLocations: ['create', 'read', 'update', 'delete'],
  userManagement: ['create', 'read', 'update', 'delete'],
} as const;

export const ac = createAccessControl(statement);

/**
 * Owner role — full access to everything.
 * Maps to: Company owner / app admin.
 */
export const ownerRole = ac.newRole({
  // Default org permissions (owner has full control)
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  // Dynamic access control management
  ac: ['create', 'read', 'update', 'delete'],
  // Custom app permissions
  inventory: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'cancel'],
  storeSettings: ['read', 'update'],
  storeLocations: ['create', 'read', 'update', 'delete'],
  userManagement: ['create', 'read', 'update', 'delete'],
});

/**
 * Admin role (Store Manager) — can manage inventory and orders at assigned stores,
 * read-only access to settings and user management. Can manage members and invitations.
 */
export const adminRole = ac.newRole({
  // Default org permissions (admin can manage members/invitations, not delete org)
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  // Dynamic access control (read-only for store managers)
  ac: ['read'],
  // Custom app permissions
  inventory: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'cancel'],
  storeSettings: ['read'],
  storeLocations: ['read'],
  userManagement: ['read'],
});

/**
 * Member role (Employee) — can manage inventory and orders at assigned stores.
 * No access to settings, user management, or org administration.
 */
export const memberRole = ac.newRole({
  // No default org permissions (members can't manage other members/invitations)
  // Custom app permissions
  inventory: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'cancel'],
});

/**
 * Roles object for the organization plugin.
 * Keys must match better-auth's built-in role names: owner, admin, member.
 */
export const roles = {
  owner: ownerRole,
  admin: adminRole,
  member: memberRole,
};
