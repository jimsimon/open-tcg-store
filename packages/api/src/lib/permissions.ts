import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/organization/access';
import { defaultStatements as adminDefaultStatements, adminAc } from 'better-auth/plugins/admin/access';

/**
 * Access control statement defining all permission resources and actions.
 * This is shared between the server (auth.ts) and client (auth-client.ts).
 *
 * All UI visibility and backend authorization are gated on permissions, not role names.
 * Roles are standard bundles of permissions. Adding a new role or changing what a
 * role can do never requires updating gate logic — only the role definition changes.
 *
 * We merge default statements from both the organization plugin (organization, member,
 * invitation, ac) and the admin plugin (user, session) so custom roles can include
 * permissions for the admin plugin's built-in endpoints (createUser, banUser, etc.).
 */
export const statement = {
  ...defaultStatements,
  ...adminDefaultStatements,
  inventory: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'cancel'],
  storeSettings: ['read', 'update'],
  storeLocations: ['create', 'read', 'update', 'delete'],
  userManagement: ['create', 'read', 'update', 'delete'],
  transactionLog: ['read'],
} as const;

export const ac = createAccessControl(statement);

/**
 * Owner role — full access to everything.
 * Maps to: Company owner / app admin.
 */
export const ownerRole = ac.newRole({
  // Admin plugin permissions (full access to user/session management endpoints)
  ...adminAc.statements,
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
  transactionLog: ['read'],
});

/**
 * Manager role (Store Manager) — can manage inventory, orders, and view transaction log
 * at assigned stores. No access to settings, user management, or admin-plugin endpoints.
 */
export const managerRole = ac.newRole({
  inventory: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'cancel'],
  transactionLog: ['read'],
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
 * Roles object for the organization and admin plugins.
 * Keys are role names stored in the database (user.role / member.role fields).
 * The organization plugin uses Object.keys(roles) for its pre-defined role set.
 */
export const roles = {
  owner: ownerRole,
  manager: managerRole,
  member: memberRole,
};
