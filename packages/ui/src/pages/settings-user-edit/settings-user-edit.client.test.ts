import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Declare mock variables via vi.hoisted() so they are available inside vi.mock() factories
// (vi.mock is hoisted to the top of the file and cannot reference module-scoped variables).
const {
  mockGetFullOrganization,
  mockGetSession,
  mockGetRole,
  mockUpdateMemberRole,
  mockCreateRole,
  mockDeleteRole,
  mockUpdateRole,
  mockFetch,
} = vi.hoisted(() => ({
  mockGetFullOrganization: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetRole: vi.fn(),
  mockUpdateMemberRole: vi.fn(),
  mockCreateRole: vi.fn(),
  mockDeleteRole: vi.fn(),
  mockUpdateRole: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('../../auth-client', () => ({
  authClient: {
    organization: {
      getFullOrganization: mockGetFullOrganization,
      getRole: mockGetRole,
      updateMemberRole: mockUpdateMemberRole,
      createRole: mockCreateRole,
      deleteRole: mockDeleteRole,
      updateRole: mockUpdateRole,
    },
    getSession: mockGetSession,
  },
}));

vi.stubGlobal('fetch', mockFetch);

import './settings-user-edit.client.ts';
import { OgsSettingsUserEditPage } from './settings-user-edit.client.ts';

// --- Helpers ---

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'manager',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function fakeOrg(members: Array<Record<string, unknown>> = []) {
  return {
    id: 'org-1',
    name: 'Test Store',
    slug: 'test-store',
    members,
  };
}

function fakeMember(overrides: Record<string, unknown> = {}) {
  return {
    id: 'member-1',
    userId: 'user-1',
    role: 'manager',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Poll until the element has finished loading (async data + Lit render). */
async function waitForLoaded(el: OgsSettingsUserEditPage, timeout = 2000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await el.updateComplete;
    const spinner = el.shadowRoot!.querySelector('.loading-container');
    if (!spinner) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('waitForLoaded timed out — element still loading');
}

function createElement(userId = 'user-1'): OgsSettingsUserEditPage {
  const el = document.createElement('ogs-settings-user-edit-page') as OgsSettingsUserEditPage;
  el.userId = userId;
  return el;
}

/**
 * Set up mockFetch to return user data for GET /api/users/:userId
 * and a 502 for anything else (store-memberships etc. are no longer used).
 */
function setupMockFetch(userData: Record<string, unknown> | null = fakeUser()) {
  mockFetch.mockImplementation(async (url: string) => {
    if (typeof url === 'string' && url.startsWith('/api/users/')) {
      if (userData) {
        return { ok: true, json: async () => userData };
      }
      return { ok: false, status: 404, json: async () => ({ error: 'User not found' }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
}

/**
 * Default beforeEach setup: the current user is an owner viewing a manager member.
 * This ensures the page renders the full permission editor UI.
 */
function setupDefaultMocks() {
  mockGetSession.mockResolvedValue({ data: { user: { id: 'current-user' } } });

  setupMockFetch(fakeUser());

  mockGetFullOrganization.mockResolvedValue({
    data: fakeOrg([
      fakeMember(),
      // Current user is an owner so they can edit the manager
      fakeMember({ id: 'member-current', userId: 'current-user', role: 'owner' }),
    ]),
  });

  mockGetRole.mockResolvedValue({ data: null });
  mockUpdateMemberRole.mockResolvedValue({ data: {} });
  mockCreateRole.mockResolvedValue({ data: {} });
  mockDeleteRole.mockResolvedValue({ data: {} });
  mockUpdateRole.mockResolvedValue({ data: {} });
}

// --- Tests ---

describe('ogs-settings-user-edit-page', () => {
  let element: OgsSettingsUserEditPage;

  beforeEach(async () => {
    setupDefaultMocks();

    element = createElement();
    document.body.appendChild(element);
    await waitForLoaded(element);
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  // --- Rendering ---

  test('should render the component', () => {
    expect(element).toBeInstanceOf(OgsSettingsUserEditPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header with user name', () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Edit User');
    expect(header?.textContent).toContain('John Doe');
  });

  test('should display the back link', () => {
    const backLink = element.shadowRoot!.querySelector('.back-link');
    expect(backLink).toBeTruthy();
    expect(backLink?.getAttribute('href')).toBe('/users');
  });

  test('should display user info card', () => {
    const infoGrid = element.shadowRoot!.querySelector('.user-info-grid');
    expect(infoGrid).toBeTruthy();

    const labels = Array.from(infoGrid!.querySelectorAll('.info-label')).map((el) => el.textContent?.trim());
    expect(labels).toContain('Name');
    expect(labels).toContain('Email');
    expect(labels).toContain('Created');
  });

  test('should display user name and email in info card', () => {
    const values = Array.from(element.shadowRoot!.querySelectorAll('.info-value')).map((el) => el.textContent?.trim());
    expect(values).toContain('John Doe');
    expect(values).toContain('john@example.com');
  });

  // --- Role & Permissions section ---

  test('should display role selector and permission grid for org members', () => {
    const roleSelector = element.shadowRoot!.querySelector('.role-selector');
    expect(roleSelector).toBeTruthy();

    const permGrid = element.shadowRoot!.querySelector('.permissions-grid');
    expect(permGrid).toBeTruthy();
  });

  test('should display 7 permission cards', () => {
    const cards = element.shadowRoot!.querySelectorAll('.permission-card');
    expect(cards.length).toBe(7);
  });

  test('should display correct permission area labels', () => {
    const labels = Array.from(element.shadowRoot!.querySelectorAll('.permission-card-label')).map((el) =>
      el.textContent?.trim(),
    );
    expect(labels).toContain('Inventory Management');
    expect(labels).toContain('Lot Management');
    expect(labels).toContain('Order Management');
    expect(labels).toContain('Dashboard & Transaction Log');
    expect(labels).toContain('Company Settings');
    expect(labels).toContain('Store Location Management');
    expect(labels).toContain('User Management');
  });

  test('should display footer actions with Cancel and Save buttons', () => {
    const footer = element.shadowRoot!.querySelector('.footer-actions');
    expect(footer).toBeTruthy();

    const buttons = footer!.querySelectorAll('wa-button');
    expect(buttons.length).toBe(2);

    const cancelBtn = footer!.querySelector('wa-button[variant="neutral"]');
    expect(cancelBtn?.getAttribute('href')).toBe('/users');

    const saveBtn = footer!.querySelector('wa-button[variant="brand"]');
    expect(saveBtn?.textContent).toContain('Save Changes');
  });

  // --- Not a member state ---

  test('should show not-a-member state when user is not in org', async () => {
    mockGetFullOrganization.mockResolvedValue({
      data: fakeOrg([]),
    });

    element.remove();
    element = createElement();
    document.body.appendChild(element);
    await waitForLoaded(element);

    const notMember = element.shadowRoot!.querySelector('.not-member-state');
    expect(notMember).toBeTruthy();
    expect(notMember?.textContent).toContain('Not a Member of This Store');
  });

  test('should not show permission grid when user is not a member', async () => {
    mockGetFullOrganization.mockResolvedValue({
      data: fakeOrg([]),
    });

    element.remove();
    element = createElement();
    document.body.appendChild(element);
    await waitForLoaded(element);

    const permGrid = element.shadowRoot!.querySelector('.permissions-grid');
    expect(permGrid).toBeFalsy();
  });

  // --- Loading & Error states ---

  test('should show loading spinner initially', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = createElement();
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should show error when user not found', async () => {
    setupMockFetch(null);

    element.remove();
    element = createElement();
    document.body.appendChild(element);
    await waitForLoaded(element);

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(callout).toBeTruthy();
    expect(callout?.textContent).toContain('User not found');
  });

  test('should show error on fetch rejection', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    mockGetFullOrganization.mockRejectedValueOnce(new Error('Network error'));

    element.remove();
    element = createElement();
    document.body.appendChild(element);
    await waitForLoaded(element);

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(callout).toBeTruthy();
  });

  // --- Permission defaults by role ---

  test('should enable manager-default permissions for a manager member', () => {
    // Manager has: inventory, lot, order, transactionLog, userManagement
    const enabledCards = element.shadowRoot!.querySelectorAll('.permission-card.enabled');
    expect(enabledCards.length).toBe(5);

    const enabledLabels = Array.from(enabledCards).map((card) =>
      card.querySelector('.permission-card-label')?.textContent?.trim(),
    );
    expect(enabledLabels).toContain('Inventory Management');
    expect(enabledLabels).toContain('Lot Management');
    expect(enabledLabels).toContain('Order Management');
    expect(enabledLabels).toContain('Dashboard & Transaction Log');
    expect(enabledLabels).toContain('User Management');
  });

  test('should show owner read-only state for an owner member', async () => {
    setupMockFetch(fakeUser({ role: 'owner' }));
    mockGetFullOrganization.mockResolvedValue({
      data: fakeOrg([
        fakeMember({ role: 'owner' }),
        fakeMember({ id: 'member-current', userId: 'current-user', role: 'owner' }),
      ]),
    });

    element.remove();
    element = createElement();
    document.body.appendChild(element);
    await waitForLoaded(element);

    // Owners get a read-only callout instead of the editable permission grid
    const permGrid = element.shadowRoot!.querySelector('.permissions-grid');
    expect(permGrid).toBeFalsy();

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="warning"]');
    expect(callout).toBeTruthy();
    expect(callout?.textContent).toContain('Owner permissions cannot be changed');
  });

  test('should enable member-default permissions for a member', async () => {
    setupMockFetch(fakeUser({ role: 'member' }));
    mockGetFullOrganization.mockResolvedValue({
      data: fakeOrg([
        fakeMember({ role: 'member' }),
        fakeMember({ id: 'member-current', userId: 'current-user', role: 'owner' }),
      ]),
    });

    element.remove();
    element = createElement();
    document.body.appendChild(element);
    await waitForLoaded(element);

    const enabledCards = element.shadowRoot!.querySelectorAll('.permission-card.enabled');
    expect(enabledCards.length).toBe(3);

    const enabledLabels = Array.from(enabledCards).map((card) =>
      card.querySelector('.permission-card-label')?.textContent?.trim(),
    );
    expect(enabledLabels).toContain('Inventory Management');
    expect(enabledLabels).toContain('Lot Management');
    expect(enabledLabels).toContain('Order Management');
  });

  // --- Custom role detection ---

  test('should enable override mode for custom roles', async () => {
    mockGetFullOrganization.mockResolvedValue({
      data: fakeOrg([
        fakeMember({ role: 'custom-member-1' }),
        fakeMember({ id: 'member-current', userId: 'current-user', role: 'owner' }),
      ]),
    });
    mockGetRole.mockResolvedValue({
      data: {
        id: 'role-1',
        role: 'custom-member-1',
        permission: { inventory: ['read'], transactionLog: ['read'] },
        organizationId: 'org-1',
      },
    });

    element.remove();
    element = createElement();
    document.body.appendChild(element);
    await waitForLoaded(element);

    const overrideSwitch = element.shadowRoot!.querySelector('.override-toggle wa-switch');
    expect(overrideSwitch).toBeTruthy();
    expect(overrideSwitch?.hasAttribute('checked')).toBe(true);
  });

  // --- Save behavior ---

  test('should call updateMemberRole on save with standard role', async () => {
    await (element as unknown as { handleSave: () => Promise<void> }).handleSave();
    await element.updateComplete;

    expect(mockUpdateMemberRole).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member-1',
        role: 'manager',
      }),
    );
  });

  test('should call createRole and updateMemberRole on save with custom permissions', async () => {
    // Enable overrides and toggle a non-standard combo
    const el = element as unknown as {
      overridePermissions: boolean;
      permissions: Record<string, string[]>;
      handleSave: () => Promise<void>;
    };
    el.overridePermissions = true;
    el.permissions = { inventory: ['read'] };
    await element.updateComplete;

    await el.handleSave();
    await element.updateComplete;

    expect(mockCreateRole).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'custom-member-1',
        permission: expect.objectContaining({ inventory: ['read'] }),
      }),
    );
    expect(mockUpdateMemberRole).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'member-1',
        role: 'custom-member-1',
      }),
    );
  });

  test('should delete old custom role when switching to standard role', async () => {
    // Simulate existing custom role
    const el = element as unknown as {
      existingCustomRoleName: string | null;
      handleSave: () => Promise<void>;
    };
    el.existingCustomRoleName = 'custom-member-1';
    await element.updateComplete;

    await el.handleSave();
    await element.updateComplete;

    expect(mockDeleteRole).toHaveBeenCalledWith(
      expect.objectContaining({
        roleName: 'custom-member-1',
      }),
    );
  });

  test('should show error on save rejection', async () => {
    mockUpdateMemberRole.mockRejectedValue(new Error('Permission denied'));

    await (element as unknown as { handleSave: () => Promise<void> }).handleSave();
    await element.updateComplete;

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(callout).toBeTruthy();
    expect(callout?.textContent).toContain('Permission denied');
  });

  test('should show error when updateMemberRole returns error response', async () => {
    mockUpdateMemberRole.mockResolvedValue({
      error: { message: 'You are not allowed to update this member' },
      data: null,
    });

    await (element as unknown as { handleSave: () => Promise<void> }).handleSave();
    await element.updateComplete;

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(callout).toBeTruthy();
    expect(callout?.textContent).toContain('You are not allowed to update this member');
  });

  test('should show error when createRole returns error response', async () => {
    mockCreateRole.mockResolvedValue({
      error: { message: 'Role name is already taken' },
      data: null,
    });

    const el = element as unknown as {
      overridePermissions: boolean;
      permissions: Record<string, string[]>;
      handleSave: () => Promise<void>;
    };
    el.overridePermissions = true;
    el.permissions = { inventory: ['read'] };
    await element.updateComplete;

    await el.handleSave();
    await element.updateComplete;

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(callout).toBeTruthy();
    expect(callout?.textContent).toContain('Role name is already taken');
  });

  // --- Permission switch disabled state ---

  test('permission switches should be disabled when override is off', () => {
    const switches = element.shadowRoot!.querySelectorAll('.permission-card wa-switch');
    expect(switches.length).toBe(7);

    for (const sw of switches) {
      expect(sw.hasAttribute('disabled')).toBe(true);
    }
  });

  // --- Data fetching ---

  test('should fetch user via /api/users/:userId endpoint', () => {
    expect(mockFetch).toHaveBeenCalledWith('/api/users/user-1', expect.objectContaining({ credentials: 'include' }));
  });

  test('should call organization.getFullOrganization', () => {
    expect(mockGetFullOrganization).toHaveBeenCalled();
  });

  // --- Manager guard ---

  test('should show manager-protected state when manager views another manager', async () => {
    // Current user is a manager, target user is also a manager
    mockGetSession.mockResolvedValue({ data: { user: { id: 'current-user' } } });
    mockGetFullOrganization.mockResolvedValue({
      data: fakeOrg([
        fakeMember({ role: 'manager' }),
        fakeMember({ id: 'member-current', userId: 'current-user', role: 'manager' }),
      ]),
    });

    element.remove();
    element = createElement();
    document.body.appendChild(element);
    await waitForLoaded(element);

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="warning"]');
    expect(callout).toBeTruthy();
    expect(callout?.textContent).toContain('You do not have permission to edit');

    // Should not show the permission grid
    const permGrid = element.shadowRoot!.querySelector('.permissions-grid');
    expect(permGrid).toBeFalsy();
  });
});
