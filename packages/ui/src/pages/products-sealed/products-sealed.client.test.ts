import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function so the component doesn't make real network requests.
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getProductListings: {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 25,
        totalPages: 0,
      },
    },
  }),
}));

// Mock the cart-state module
vi.mock('../../lib/cart-state.ts', () => ({
  cartState: { get: () => ({ items: [] }), set: vi.fn() },
}));

import './products-sealed.client.ts';
import { OgsProductsSealedPage } from './products-sealed.client.ts';
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
    if (queryStr.includes('GetSets')) {
      return Promise.resolve({
        data: { getSets: [] },
      });
    }
    return Promise.resolve({
      data: {
        getProductListings: {
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

function makeFakeSealedProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    name: 'Booster Box - Alpha',
    setName: 'Alpha',
    gameName: 'Magic',
    rarity: null,
    finishes: [],
    images: null,
    totalQuantity: 2,
    lowestPrice: '150.00',
    lowestPriceInventoryItemId: 10,
    ...overrides,
  };
}

// --- Tests ---

describe('ogs-products-sealed-page', () => {
  let element: OgsProductsSealedPage;

  beforeEach(async () => {
    setupDefaultMock();

    element = document.createElement('ogs-products-sealed-page') as OgsProductsSealedPage;
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
    expect(element).toBeInstanceOf(OgsProductsSealedPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header', async () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Sealed Products');
  });

  test('should display the filter bar with Search, Game, and Set filters', async () => {
    const searchInput = element.shadowRoot!.querySelector('wa-input[placeholder="Search products..."]');
    expect(searchInput).toBeTruthy();

    const gameSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Game"]');
    expect(gameSelect).toBeTruthy();

    const setSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Set"]');
    expect(setSelect).toBeTruthy();
  });

  test('should display Set filter (disabled without game) and NOT display Condition filter', async () => {
    const setSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Set"]');
    expect(setSelect).toBeTruthy();
    expect(setSelect?.hasAttribute('disabled')).toBe(true);

    const conditionSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Condition"]');
    expect(conditionSelect).toBeFalsy();
  });

  test('should display empty state when no products', async () => {
    const emptyState = element.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No sealed products found');
  });

  test('should render product cards when products exist', async () => {
    const items = [makeFakeSealedProduct()];
    setupDefaultMock(items, 1, 1);

    element.remove();
    element = document.createElement('ogs-products-sealed-page') as OgsProductsSealedPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const grid = element.shadowRoot!.querySelector('.products-grid');
    expect(grid).toBeTruthy();

    const cards = grid!.querySelectorAll('wa-card');
    expect(cards.length).toBe(1);

    const card = cards[0];
    expect(card.querySelector('.product-card-name')?.textContent).toContain('Booster Box - Alpha');
    expect(card.querySelector('.game-badge')?.textContent).toContain('Magic');
    expect(card.querySelector('.quantity-badge')).toBeTruthy();
    expect(card.querySelector('.product-price')).toBeTruthy();
    expect(card.querySelector('.product-card-link')).toBeTruthy();
  });

  test('should show loading spinner when loading', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-products-sealed-page') as OgsProductsSealedPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
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
    element = document.createElement('ogs-products-sealed-page') as OgsProductsSealedPage;
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
    element = document.createElement('ogs-products-sealed-page') as OgsProductsSealedPage;
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
