import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function so the component doesn't make real network requests.
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getInventory: {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 25,
        totalPages: 0,
      },
    },
  }),
}));

import './inventory-singles.client.ts';
import { OgsInventorySinglesPage } from './inventory-singles.client.ts';
import { execute } from '../../lib/graphql.ts';

// --- Helpers ---

const mockExecute = execute as ReturnType<typeof vi.fn>;

function mockInventoryResponse(items: Record<string, unknown>[] = [], totalCount = 0, totalPages = 0) {
  return {
    data: {
      getInventory: {
        items,
        totalCount,
        page: 1,
        pageSize: 25,
        totalPages,
      },
    },
  };
}

function makeFakeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    productId: 100,
    productName: 'Black Lotus',
    gameName: 'Magic',
    setName: 'Alpha',
    rarity: 'Mythic Rare',
    isSingle: true,
    isSealed: false,
    condition: 'NM',
    quantity: 4,
    price: 50000,
    costBasis: 40000,
    acquisitionDate: '2024-01-15T00:00:00.000Z',
    notes: 'Graded',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    ...overrides,
  };
}

// --- Tests ---

describe('ogs-inventory-singles-page', () => {
  let element: OgsInventorySinglesPage;

  beforeEach(async () => {
    mockExecute.mockResolvedValue(mockInventoryResponse());

    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  test('should render the component', async () => {
    expect(element).toBeInstanceOf(OgsInventorySinglesPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the filter bar with Search, Game, and Condition filters', async () => {
    const searchInput = element.shadowRoot!.querySelector('wa-input[placeholder="Search by name..."]');
    expect(searchInput).toBeTruthy();

    const gameSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Game"]');
    expect(gameSelect).toBeTruthy();

    const conditionSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Condition"]');
    expect(conditionSelect).toBeTruthy();
  });

  test('should NOT display a Product Type filter', async () => {
    const typeSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Product Type"]');
    expect(typeSelect).toBeFalsy();
  });

  test('should display the action bar with Add, Import, Bulk Edit, Bulk Delete buttons', async () => {
    const actionBar = element.shadowRoot!.querySelector('.action-bar');
    expect(actionBar).toBeTruthy();

    const buttons = actionBar!.querySelectorAll('wa-button');
    const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());

    expect(buttonTexts).toContain('Add Single');
    expect(buttonTexts).toContain('Import');
    expect(buttonTexts).toContain('Bulk Edit');
    expect(buttonTexts).toContain('Bulk Delete');
  });

  test('should render the inventory table with Rarity and Condition columns', async () => {
    const items = [makeFakeItem()];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const table = element.shadowRoot!.querySelector('table');
    expect(table).toBeTruthy();

    const headers = Array.from(table!.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).toContain('Product');
    expect(headers).toContain('Game');
    expect(headers).toContain('Set');
    expect(headers).toContain('Rarity');
    expect(headers).toContain('Condition');
    expect(headers).toContain('Qty');
    expect(headers).toContain('Price');
    expect(headers).toContain('Cost Basis');
    expect(headers).toContain('Actions');
  });

  test('should open edit dialog with Condition field when edit button is clicked', async () => {
    const items = [makeFakeItem()];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const actionCells = element.shadowRoot!.querySelectorAll('.actions-cell');
    expect(actionCells.length).toBeGreaterThan(0);

    const editBtn = actionCells[0].querySelector('wa-button');
    editBtn!.click();
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector('wa-dialog[label="Edit Single"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.hasAttribute('open')).toBe(true);

    // Should have Condition select in the edit dialog
    const conditionSelect = dialog!.querySelector('wa-select[label="Condition"]');
    expect(conditionSelect).toBeTruthy();
  });

  test('should open bulk edit dialog with Condition field', async () => {
    const items = [makeFakeItem({ id: 1 })];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    // Select all items
    const headerCheckbox = element.shadowRoot!.querySelector('thead wa-checkbox');
    headerCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));
    await element.updateComplete;

    // Click bulk edit
    const actionBar = element.shadowRoot!.querySelector('.action-bar');
    const buttons = Array.from(actionBar!.querySelectorAll('wa-button'));
    const bulkEditBtn = buttons.find((b) => b.textContent?.trim().startsWith('Bulk Edit'));
    bulkEditBtn!.click();
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector('wa-dialog[label="Bulk Edit Singles"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.hasAttribute('open')).toBe(true);

    // Should have Condition select in the bulk edit dialog
    const conditionSelect = dialog!.querySelector('wa-select[label="Condition"]');
    expect(conditionSelect).toBeTruthy();
  });

  test('should show loading spinner when loading', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should display empty state when no items', async () => {
    const emptyState = element.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No singles found');
  });

  test('should display pagination controls when multiple pages', async () => {
    const items = Array.from({ length: 25 }, (_, i) => makeFakeItem({ id: i + 1, productName: `Card ${i + 1}` }));
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 50, 2));

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const pagination = element.shadowRoot!.querySelector('.pagination');
    expect(pagination).toBeTruthy();

    const paginationButtons = pagination!.querySelectorAll('wa-button');
    expect(paginationButtons.length).toBeGreaterThanOrEqual(3); // prev + page numbers + next

    // Previous/Next buttons use chevron icons instead of text
    const prevButton = pagination!.querySelector('wa-button:first-of-type wa-icon[name="chevron-left"]');
    const nextButton = pagination!.querySelector('wa-button:last-of-type wa-icon[name="chevron-right"]');
    expect(prevButton).toBeTruthy();
    expect(nextButton).toBeTruthy();
  });
});
