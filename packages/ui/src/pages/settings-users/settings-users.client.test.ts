import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the auth client
const mockListUsers = vi.fn();
const mockCreateUser = vi.fn();
const mockSetRole = vi.fn();
const mockBanUser = vi.fn();
const mockUnbanUser = vi.fn();

vi.mock('../../auth-client', () => ({
  authClient: {
    admin: {
      listUsers: mockListUsers,
      createUser: mockCreateUser,
      setRole: mockSetRole,
      banUser: mockBanUser,
      unbanUser: mockUnbanUser,
    },
  },
}));

// Mock the GraphQL execute function to prevent real fetch calls (e.g. loadStores)
vi.mock('../../lib/graphql', () => ({
  execute: vi.fn().mockResolvedValue({ data: { getEmployeeStoreLocations: [] } }),
}));

import './settings-users.client.ts';
import { OgsSettingsUsersPage } from './settings-users.client.ts';
import { execute } from '../../lib/graphql';

// --- Helpers ---

/** Poll until the element has finished loading (async data + Lit render). */
async function waitForLoaded(el: OgsSettingsUsersPage, timeout = 2000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (el.loading && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 10));
    await new Promise((r) => setTimeout(r, 10));
  }
  if (el.loading) throw new Error('waitForLoaded timed out — element still loading');
  await el.updateComplete;
}

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'employee',
    banned: false,
    banReason: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    isAnonymous: false,
    ...overrides,
  };
}

// --- Tests ---

describe('ogs-settings-users-page', () => {
  let element: OgsSettingsUsersPage;

  beforeEach(async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          fakeUser({ id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'manager' }),
          fakeUser({ id: 'user-2', name: 'Jane Smith', email: 'jane@example.com', role: 'employee' }),
          fakeUser({
            id: 'user-3',
            name: 'Bob Banned',
            email: 'bob@example.com',
            role: 'employee',
            banned: true,
            banReason: 'Deactivated by admin',
          }),
        ],
      },
    });

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
    expect(statCards.length).toBe(4); // Total, Active, Deactivated, Admins
  });

  test('should display correct total user count', () => {
    const statValues = element.shadowRoot!.querySelectorAll('.stat-value');
    const values = Array.from(statValues).map((v) => v.textContent?.trim());
    expect(values).toContain('3'); // Total users
  });

  test('should display filter bar with hide deactivated checkbox', () => {
    const filterBar = element.shadowRoot!.querySelector('.filter-bar');
    expect(filterBar).toBeTruthy();

    const checkbox = filterBar!.querySelector('wa-checkbox');
    expect(checkbox).toBeTruthy();
    expect(checkbox?.textContent).toContain('Hide deactivated users');
  });

  test('should display Add User button', () => {
    const addBtn = element.shadowRoot!.querySelector('.filter-bar wa-button[variant="brand"]');
    expect(addBtn).toBeTruthy();
    expect(addBtn?.textContent).toContain('Add User');
  });

  test('should display user table with correct columns', () => {
    const table = element.shadowRoot!.querySelector('table');
    expect(table).toBeTruthy();

    const headers = Array.from(table!.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).toContain('Name');
    expect(headers).toContain('Email');
    expect(headers).toContain('Role');
    expect(headers).toContain('Created');
    expect(headers).toContain('Status');
    expect(headers).toContain('Actions');
  });

  test('should hide deactivated users by default', () => {
    const rows = element.shadowRoot!.querySelectorAll('tbody tr');
    // Only 2 active users should be shown (Bob is banned)
    expect(rows.length).toBe(2);
  });

  test('should display Edit and Deactivate buttons for each user', () => {
    const actionCells = element.shadowRoot!.querySelectorAll('.actions-cell');
    expect(actionCells.length).toBe(2); // 2 active users

    const firstRowButtons = actionCells[0].querySelectorAll('wa-button');
    const buttonTexts = Array.from(firstRowButtons).map((b) => b.textContent?.trim());
    expect(buttonTexts).toContain('Edit');
    expect(buttonTexts).toContain('Deactivate');
  });

  test('should display role badges', () => {
    const badges = element.shadowRoot!.querySelectorAll('tbody wa-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  test('should show loading spinner initially', async () => {
    mockListUsers.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-settings-users-page') as OgsSettingsUsersPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should show error message on load failure', async () => {
    mockListUsers.mockRejectedValue(new Error('Auth error'));

    element.remove();
    element = document.createElement('ogs-settings-users-page') as OgsSettingsUsersPage;
    document.body.appendChild(element);
    await waitForLoaded(element);

    const errorCallout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(errorCallout).toBeTruthy();
    expect(errorCallout?.textContent).toContain('Auth error');
  });

  test('should show error message on store load failure', async () => {
    vi.mocked(execute).mockRejectedValue(new Error('Network error'));

    element.remove();
    element = document.createElement('ogs-settings-users-page') as OgsSettingsUsersPage;
    document.body.appendChild(element);
    await waitForLoaded(element);

    const errorCallout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(errorCallout).toBeTruthy();
    expect(errorCallout?.textContent).toContain('Network error');
  });

  test('should show empty state when no users', async () => {
    mockListUsers.mockResolvedValue({ data: { users: [] } });

    element.remove();
    element = document.createElement('ogs-settings-users-page') as OgsSettingsUsersPage;
    document.body.appendChild(element);
    await waitForLoaded(element);

    const emptyState = element.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No Users Found');
  });

  test('edit dialog footer buttons are present when dialog opens', async () => {
    const user = fakeUser({ id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'manager' });
    element.openEditDialog(user);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const footerButtons = element.shadowRoot!.querySelectorAll('wa-dialog wa-button[slot="footer"]');
    expect(footerButtons.length).toBeGreaterThanOrEqual(2);
  });

  test('should filter out anonymous users', async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          fakeUser({ id: 'user-1', name: 'Real User', isAnonymous: false }),
          fakeUser({ id: 'anon-1', name: 'Anonymous', isAnonymous: true }),
        ],
      },
    });

    element.remove();
    element = document.createElement('ogs-settings-users-page') as OgsSettingsUsersPage;
    document.body.appendChild(element);
    await waitForLoaded(element);

    const rows = element.shadowRoot!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1); // Only the non-anonymous user
  });
});
