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

const mockSupportedGames = [
  { categoryId: 1, name: 'magic', displayName: 'Magic' },
  { categoryId: 2, name: 'pokemon', displayName: 'Pokemon' },
];

function setupDefaultMock(
  items: Record<string, unknown>[] = [],
  totalCount = 0,
  totalPages = 0,
  supportedGames = mockSupportedGames,
) {
  mockExecute.mockImplementation((query: { toString: () => string }) => {
    const queryStr = String(query);
    if (queryStr.includes('GetSupportedGames')) {
      return Promise.resolve({
        data: { getSupportedGames: supportedGames },
      });
    }
    return Promise.resolve({
      data: {
        getInventory: {
          items,
          totalCount,
          page: 1,
          pageSize: 25,
          totalPages,
        },
      },
    });
  });
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
    price: 50000,
    totalQuantity: 4,
    entryCount: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    ...overrides,
  };
}

// --- Tests ---

describe('ogs-inventory-singles-page', () => {
  let element: OgsInventorySinglesPage;

  beforeEach(async () => {
    setupDefaultMock();

    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    element.canManageInventory = true;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
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

  test('should display the action bar with Import button', async () => {
    const actionBar = element.shadowRoot!.querySelector('.action-bar');
    expect(actionBar).toBeTruthy();

    const buttons = actionBar!.querySelectorAll('wa-button');
    const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());

    expect(buttonTexts).toContain('Import');
  });

  test('should render the inventory table with Rarity and Condition columns', async () => {
    const items = [makeFakeItem()];
    setupDefaultMock(items, 1, 1);

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    element.canManageInventory = true;
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
    expect(headers).toContain('Entries');
  });

  test('should render clickable rows that navigate to detail page', async () => {
    const items = [makeFakeItem()];
    setupDefaultMock(items, 1, 1);

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    element.canManageInventory = true;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const clickableRows = element.shadowRoot!.querySelectorAll('.clickable-row');
    expect(clickableRows.length).toBeGreaterThan(0);
  });

  test('should show loading spinner when loading', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    element.canManageInventory = true;
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
    setupDefaultMock(items, 50, 2);

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    element.canManageInventory = true;
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

  test('should render game dropdown options from supported games', async () => {
    const gameSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Game"]');
    expect(gameSelect).toBeTruthy();

    const options = gameSelect!.querySelectorAll('wa-option');
    // "All Games" + the 2 supported games
    expect(options.length).toBe(3);
    expect(options[0].getAttribute('value')).toBe('');
    expect(options[0].textContent?.trim()).toBe('All Games');
    expect(options[1].getAttribute('value')).toBe('magic');
    expect(options[1].textContent?.trim()).toBe('Magic');
    expect(options[2].getAttribute('value')).toBe('pokemon');
    expect(options[2].textContent?.trim()).toBe('Pokemon');
  });

  test('should show only All Games option when no supported games configured', async () => {
    setupDefaultMock([], 0, 0, []);

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    element.canManageInventory = true;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const gameSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Game"]');
    expect(gameSelect).toBeTruthy();

    const options = gameSelect!.querySelectorAll('wa-option');
    expect(options.length).toBe(1);
    expect(options[0].textContent?.trim()).toBe('All Games');
  });

  test('should render all supported games when more than two are configured', async () => {
    const threeGames = [
      { categoryId: 1, name: 'magic', displayName: 'Magic' },
      { categoryId: 2, name: 'pokemon', displayName: 'Pokemon' },
      { categoryId: 5, name: 'yugioh', displayName: 'Yu-Gi-Oh' },
    ];
    setupDefaultMock([], 0, 0, threeGames);

    element.remove();
    element = document.createElement('ogs-inventory-singles-page') as OgsInventorySinglesPage;
    element.canManageInventory = true;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const gameSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Game"]');
    const options = gameSelect!.querySelectorAll('wa-option');
    // "All Games" + 3 supported games
    expect(options.length).toBe(4);
    expect(options[3].getAttribute('value')).toBe('yugioh');
    expect(options[3].textContent?.trim()).toBe('Yu-Gi-Oh');
  });
});
