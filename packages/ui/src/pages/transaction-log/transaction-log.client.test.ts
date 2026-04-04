import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function so the component doesn't make real network requests.
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getTransactionLogs: {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 25,
        totalPages: 0,
      },
    },
  }),
}));

import './transaction-log.client.ts';
import { OgsTransactionLogPage } from './transaction-log.client.ts';
import { execute } from '../../lib/graphql.ts';

// --- Helpers ---

const mockExecute = execute as ReturnType<typeof vi.fn>;

function mockLogResponse(items: Record<string, unknown>[] = [], totalCount = 0, totalPages = 0) {
  return {
    data: {
      getTransactionLogs: {
        items,
        totalCount,
        page: 1,
        pageSize: 25,
        totalPages,
      },
    },
  };
}

function makeFakeLogEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    action: 'order.created',
    resourceType: 'order',
    resourceId: '42',
    details: '{"orderNumber":"ORD-20260101-0001","customerName":"Alice","totalAmount":25.50}',
    userName: 'Admin User',
    userEmail: 'admin@example.com',
    createdAt: '2026-03-15T10:30:00.000Z',
    ...overrides,
  };
}

// --- Tests ---

describe('ogs-transaction-log-page', () => {
  let element: OgsTransactionLogPage;

  beforeEach(async () => {
    mockExecute.mockResolvedValue(mockLogResponse());

    element = document.createElement('ogs-transaction-log-page') as OgsTransactionLogPage;
    element.canViewTransactionLog = true;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  test('should render the component', async () => {
    expect(element).toBeInstanceOf(OgsTransactionLogPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header', async () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent?.trim()).toBe('Transaction Log');
  });

  test('should display filter controls', async () => {
    const searchInput = element.shadowRoot!.querySelector('wa-input[placeholder="Search transactions..."]');
    expect(searchInput).toBeTruthy();

    const monthSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Month"]');
    expect(monthSelect).toBeTruthy();

    const yearSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Year"]');
    expect(yearSelect).toBeTruthy();

    const resourceTypeSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Resource Type"]');
    expect(resourceTypeSelect).toBeTruthy();
  });

  test('should display empty state when no entries', async () => {
    const emptyState = element.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No Transactions Found');
  });

  test('should render table with correct headers when data is loaded', async () => {
    const items = [makeFakeLogEntry()];
    mockExecute.mockResolvedValue(mockLogResponse(items, 1, 1));

    element.remove();
    element = document.createElement('ogs-transaction-log-page') as OgsTransactionLogPage;
    element.canViewTransactionLog = true;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const table = element.shadowRoot!.querySelector('table');
    expect(table).toBeTruthy();

    const headers = Array.from(table!.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).toContain('Timestamp');
    expect(headers).toContain('User');
    expect(headers).toContain('Action');
    expect(headers).toContain('Resource Type');
    expect(headers).toContain('Details');
  });

  test('should render log entries in the table', async () => {
    const items = [
      makeFakeLogEntry({ id: 1, action: 'order.created' }),
      makeFakeLogEntry({ id: 2, action: 'inventory.stock_added', resourceType: 'inventory' }),
    ];
    mockExecute.mockResolvedValue(mockLogResponse(items, 2, 1));

    element.remove();
    element = document.createElement('ogs-transaction-log-page') as OgsTransactionLogPage;
    element.canViewTransactionLog = true;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const rows = element.shadowRoot!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  test('should show loading spinner when loading', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-transaction-log-page') as OgsTransactionLogPage;
    element.canViewTransactionLog = true;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should display pagination controls when multiple pages', async () => {
    const items = Array.from({ length: 25 }, (_, i) => makeFakeLogEntry({ id: i + 1 }));
    mockExecute.mockResolvedValue(mockLogResponse(items, 50, 2));

    element.remove();
    element = document.createElement('ogs-transaction-log-page') as OgsTransactionLogPage;
    element.canViewTransactionLog = true;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const pagination = element.shadowRoot!.querySelector('.pagination');
    expect(pagination).toBeTruthy();

    const paginationButtons = pagination!.querySelectorAll('wa-button');
    expect(paginationButtons.length).toBeGreaterThanOrEqual(3);

    const prevButton = pagination!.querySelector('wa-button:first-of-type wa-icon[name="chevron-left"]');
    const nextButton = pagination!.querySelector('wa-button:last-of-type wa-icon[name="chevron-right"]');
    expect(prevButton).toBeTruthy();
    expect(nextButton).toBeTruthy();
  });
});
