import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Declare mock variables via vi.hoisted() so they are available inside vi.mock() factories
// (vi.mock is hoisted to the top of the file and cannot reference module-scoped variables).
const { mockActiveStoreId, mockGetFullOrganization, mockGetSession, mockBanUser, mockUnbanUser, mockFetch } =
  vi.hoisted(() => ({
    mockActiveStoreId: { get: vi.fn().mockReturnValue('store-1'), set: vi.fn() },
    mockGetFullOrganization: vi.fn(),
    mockGetSession: vi.fn(),
    mockBanUser: vi.fn(),
    mockUnbanUser: vi.fn(),
    mockFetch: vi.fn(),
  }));

vi.mock('../../lib/store-context', () => ({
  activeStoreId: mockActiveStoreId,
  storeList: { get: vi.fn().mockReturnValue([]) },
  initActiveStoreFromCookie: vi.fn(),
  setActiveStoreCookie: vi.fn(),
}));

vi.mock('../../auth-client', () => ({
  authClient: {
    organization: {
      getFullOrganization: mockGetFullOrganization,
      setActive: vi.fn().mockResolvedValue({}),
      hasPermission: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
    admin: {
      banUser: mockBanUser,
      unbanUser: mockUnbanUser,
    },
    getSession: mockGetSession,
  },
}));

vi.stubGlobal('fetch', mockFetch);

import './settings-users.client.ts';
import { OgsSettingsUsersPage } from './settings-users.client.ts';

// --- Helpers ---

function fakeMember(overrides: Record<string, unknown> = {}) {
  return {
    id: 'member-1',
    userId: 'user-1',
    role: 'member',
    createdAt: '2025-01-01T00:00:00.000Z',
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      image: null,
      banned: false,
      banReason: null,
    },
    ...overrides,
  };
}

/** Poll until the element has finished loading (async data + Lit render). */
async function waitForLoaded(el: OgsSettingsUsersPage, timeout = 2000): Promise<void> {
  const deadline = Date.now() + timeout;
  // Wait for the loading state to finish by checking the shadow DOM
  while (Date.now() < deadline) {
    await el.updateComplete;
    const spinner = el.shadowRoot!.querySelector('.loading-container');
    if (!spinner) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('waitForLoaded timed out — element still loading');
}

// --- Tests ---

describe('ogs-settings-users-page', () => {
  let element: OgsSettingsUsersPage;

  beforeEach(async () => {
    mockActiveStoreId.get.mockReturnValue('store-1');

    mockGetSession.mockResolvedValue({ data: { user: { id: 'current-user' } } });

    mockGetFullOrganization.mockResolvedValue({
      data: {
        members: [
          fakeMember({
            id: 'member-1',
            userId: 'user-1',
            role: 'manager',
            user: {
              id: 'user-1',
              name: 'John Doe',
              email: 'john@example.com',
              image: null,
              banned: false,
              banReason: null,
            },
          }),
          fakeMember({
            id: 'member-2',
            userId: 'user-2',
            role: 'member',
            user: {
              id: 'user-2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              image: null,
              banned: false,
              banReason: null,
            },
          }),
          fakeMember({
            id: 'member-3',
            userId: 'user-3',
            role: 'member',
            user: {
              id: 'user-3',
              name: 'Bob Banned',
              email: 'bob@example.com',
              image: null,
              banned: true,
              banReason: 'Deactivated by admin',
            },
          }),
          fakeMember({
            id: 'member-current',
            userId: 'current-user',
            role: 'owner',
            user: {
              id: 'current-user',
              name: 'Admin',
              email: 'admin@example.com',
              image: null,
              banned: false,
              banReason: null,
            },
          }),
        ],
      },
    });

    // Default: no fetch calls expected during initial load (no more GET /api/users)
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    element = document.createElement('ogs-settings-users-page') as OgsSettingsUsersPage;
    document.body.appendChild(element);
    await waitForLoaded(element);
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  test('should render the component', () => {
    expect(element).toBeInstanceOf(OgsSettingsUsersPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header', () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('User Accounts');
  });

  test('should display the page description', () => {
    const desc = element.shadowRoot!.querySelector('.page-header p');
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toContain('Manage user accounts');
  });

  test('should display stats bar with user counts', () => {
    const statsBar = element.shadowRoot!.querySelector('.stats-bar');
    expect(statsBar).toBeTruthy();

    const statCards = statsBar!.querySelectorAll('.stat-card');
    expect(statCards.length).toBe(3); // Assigned, Active, Deactivated
  });

  test('should display Assigned Users section', () => {
    const sectionHeaders = element.shadowRoot!.querySelectorAll('.section-title');
    const titles = Array.from(sectionHeaders).map((h) => h.textContent?.trim());
    expect(titles).toContain('Assigned Users');
  });

  test('should display Assign a User section', () => {
    const sectionHeaders = element.shadowRoot!.querySelectorAll('.section-title');
    const titles = Array.from(sectionHeaders).map((h) => h.textContent?.trim());
    expect(titles).toContain('Assign a User');
  });

  test('should display assigned user table with correct columns', () => {
    const tables = element.shadowRoot!.querySelectorAll('table');
    expect(tables.length).toBeGreaterThanOrEqual(1);

    const headers = Array.from(tables[0].querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).toContain('Name');
    expect(headers).toContain('Email');
    expect(headers).toContain('Role');
    expect(headers).toContain('Status');
    expect(headers).toContain('Actions');
  });

  test('should hide deactivated users from assigned table by default', () => {
    const tables = element.shadowRoot!.querySelectorAll('table');
    const assignedRows = tables[0].querySelectorAll('tbody tr');
    // 4 members total, 1 banned (Bob) hidden = 3 visible
    expect(assignedRows.length).toBe(3);
  });

  test('should display role badges in assigned table', () => {
    const tables = element.shadowRoot!.querySelectorAll('table');
    const badges = tables[0].querySelectorAll('tbody wa-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  test('should display assign-by-email form with input and button', () => {
    const assignForm = element.shadowRoot!.querySelector('.assign-form');
    expect(assignForm).toBeTruthy();

    const emailInput = assignForm!.querySelector('wa-input[type="email"]');
    expect(emailInput).toBeTruthy();

    const assignBtn = assignForm!.querySelector('wa-button[variant="brand"]');
    expect(assignBtn).toBeTruthy();
    expect(assignBtn?.textContent).toContain('Assign');
  });

  test('should show no-store state when no store is selected', async () => {
    mockActiveStoreId.get.mockReturnValue(null);

    element.remove();
    element = document.createElement('ogs-settings-users-page') as OgsSettingsUsersPage;
    document.body.appendChild(element);
    await element.updateComplete;

    const noStoreState = element.shadowRoot!.querySelector('.no-store-state');
    expect(noStoreState).toBeTruthy();
    expect(noStoreState?.textContent).toContain('No Store Selected');
  });

  test('edit button links to user edit page at /users/:userId', () => {
    const editButtons = element.shadowRoot!.querySelectorAll('.actions-cell wa-button[href]');
    expect(editButtons.length).toBeGreaterThan(0);

    // Find an edit button for a non-owner member
    const editHrefs = Array.from(editButtons).map((b) => b.getAttribute('href'));
    expect(editHrefs).toContain('/users/user-2');
  });
});
