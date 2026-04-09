import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function so the component doesn't make real network requests.
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({ data: {} }),
}));

import './lot.client.ts';
import { OgsLotPage } from './lot.client.ts';
import { execute } from '../../lib/graphql.ts';

// --- Helpers ---

const mockExecute = execute as ReturnType<typeof vi.fn>;

function mockSupportedGamesResponse() {
  return {
    data: {
      getSupportedGames: [{ categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' }],
    },
  };
}

function mockBuyRatesResponse() {
  return {
    data: {
      getBuyRates: [{ id: 1, description: 'Bulk', rate: 0.3, type: 'percentage', rarity: 'Rare', sortOrder: 0 }],
    },
  };
}

function mockGetLotResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      getLot: {
        id: 1,
        name: 'Test Lot',
        description: 'A test lot',
        amountPaid: 100,
        acquisitionDate: '2025-01-15',
        useBuyListForCost: true,
        items: [
          {
            id: 10,
            productId: 200,
            productName: 'Black Lotus',
            gameName: 'Magic',
            setName: 'Alpha',
            rarity: 'Rare',
            isSingle: true,
            isSealed: false,
            condition: 'NM',
            quantity: 2,
            costBasis: 25,
            costOverridden: false,
            marketValue: 100,
          },
          {
            id: 11,
            productId: 300,
            productName: 'Booster Box',
            gameName: 'Magic',
            setName: 'Alpha',
            rarity: null,
            isSingle: false,
            isSealed: true,
            condition: null,
            quantity: 1,
            costBasis: 50,
            costOverridden: false,
            marketValue: 150,
          },
        ],
        totalMarketValue: 250,
        totalCost: 100,
        projectedProfitLoss: 150,
        projectedProfitMargin: 60,
        ...overrides,
      },
    },
  };
}

async function createElement(props: Partial<Record<string, unknown>> = {}): Promise<OgsLotPage> {
  const el = document.createElement('ogs-lot-page') as OgsLotPage;
  el.canManageLots = true;
  for (const [key, value] of Object.entries(props)) {
    (el as Record<string, unknown>)[key] = value;
  }
  document.body.appendChild(el);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 50));
  await el.updateComplete;
  return el;
}

function addProductRow(element: OgsLotPage, isSingle: boolean) {
  // Call the component's method directly to avoid shadow DOM boundary issues with wa-tab-panel
  element['addProductRow'](isSingle);
}

/** Simulate selecting a product from search results by directly calling the component method. */
function selectProductOnRow(element: OgsLotPage, isSingle: boolean, overrides: Record<string, unknown> = {}) {
  const items = isSingle ? element['singlesItems'] : element['sealedItems'];
  const lastItem = items[items.length - 1];
  if (!lastItem) throw new Error('No items to select product for');

  const product = {
    id: 100,
    name: 'Test Card',
    gameName: 'Magic',
    setName: 'Alpha',
    rarity: 'Rare',
    isSingle,
    isSealed: !isSingle,
    marketPrice: 10.0,
    ...overrides,
  };

  element['selectProduct'](lastItem.clientId, product, isSingle);
}

// --- Tests ---

describe('ogs-lot-page', () => {
  let element: OgsLotPage;

  beforeEach(() => {
    // Default: mock supported-games then buy-rates calls for connectedCallback
    mockExecute.mockImplementation((_doc: unknown, vars?: Record<string, unknown>) => {
      if (vars && 'categoryId' in vars) return Promise.resolve(mockBuyRatesResponse());
      // GetSupportedGames (no vars or empty vars)
      return Promise.resolve(mockSupportedGamesResponse());
    });
  });

  afterEach(() => {
    element?.remove();
    vi.clearAllMocks();
  });

  test('should render the component', async () => {
    element = await createElement();
    expect(element).toBeInstanceOf(OgsLotPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display "Add Lot" header for new lot', async () => {
    element = await createElement();
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header?.textContent).toContain('Add Lot');
  });

  test('should display "Edit Lot" header when lotId is set', async () => {
    mockExecute.mockImplementation((_doc: unknown, vars?: Record<string, unknown>) => {
      if (vars && 'id' in vars) return Promise.resolve(mockGetLotResponse());
      if (vars && 'categoryId' in vars) return Promise.resolve(mockBuyRatesResponse());
      return Promise.resolve(mockSupportedGamesResponse());
    });

    element = await createElement({ lotId: '1' });
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header?.textContent).toContain('Edit Lot');
  });

  test('should display the lot details form with required fields', async () => {
    element = await createElement();
    const nameInput = element.shadowRoot!.querySelector('wa-input[label="Lot Name"]');
    expect(nameInput).toBeTruthy();

    const descInput = element.shadowRoot!.querySelector('wa-textarea[label="Description"]');
    expect(descInput).toBeTruthy();

    const amountPaidInput = element.shadowRoot!.querySelector('wa-input[label="Amount Paid"]');
    expect(amountPaidInput).toBeTruthy();

    const dateInput = element.shadowRoot!.querySelector('wa-input[label="Acquisition Date"]');
    expect(dateInput).toBeTruthy();
  });

  test('should display summary section with profit/loss values', async () => {
    element = await createElement();
    const summaryItems = element.shadowRoot!.querySelectorAll('.summary-item');
    expect(summaryItems.length).toBe(4);

    const labels = Array.from(summaryItems).map((si) => si.querySelector('.label')?.textContent?.trim());
    expect(labels).toContain('Total Market Value');
    expect(labels).toContain('Total Cost');
    expect(labels).toContain('Projected Profit/Loss');
    expect(labels).toContain('Projected Margin');
  });

  test('should display Singles and Sealed tabs', async () => {
    element = await createElement();
    const tabs = element.shadowRoot!.querySelectorAll('wa-tab[slot="nav"]');
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('Singles');
    expect(tabs[1].textContent).toContain('Sealed');
  });

  test('should show empty state when no products added', async () => {
    element = await createElement();
    const empty = element.shadowRoot!.querySelector('.empty-table');
    expect(empty).toBeTruthy();
    expect(empty?.textContent).toContain('No products added yet');
  });

  describe('singles table columns', () => {
    beforeEach(async () => {
      mockExecute.mockImplementation((_doc: unknown, vars?: Record<string, unknown>) => {
        if (vars && 'id' in vars) return Promise.resolve(mockGetLotResponse());
        if (vars && 'categoryId' in vars) return Promise.resolve(mockBuyRatesResponse());
        return Promise.resolve(mockSupportedGamesResponse());
      });

      element = await createElement({ lotId: '1' });
    });

    test('should render the table with correct column headers for singles', () => {
      const tables = element.shadowRoot!.querySelectorAll('table');
      expect(tables.length).toBeGreaterThanOrEqual(1);

      // The first table should be the singles table
      const headers = Array.from(tables[0].querySelectorAll('th')).map((th) => th.textContent?.trim());
      expect(headers).toContain('Product');
      expect(headers).toContain('Game');
      expect(headers).toContain('Set');
      expect(headers).toContain('Rarity');
      expect(headers).toContain('Condition');
      expect(headers).toContain('Qty');
      expect(headers).toContain('Unit Cost');
      expect(headers).toContain('Cost Total');
      expect(headers).toContain('Unit Market');
      expect(headers).toContain('Market Total');
    });

    test('should display per-unit cost in "Unit Cost" column', () => {
      const table = element.shadowRoot!.querySelector('table')!;
      const headers = Array.from(table.querySelectorAll('th'));
      const unitCostIdx = headers.findIndex((th) => th.textContent?.trim() === 'Unit Cost');
      expect(unitCostIdx).toBeGreaterThan(-1);

      // The cost cell contains a wa-input with the per-unit costBasis value
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
      const costCell = rows[0].querySelectorAll('td')[unitCostIdx];
      const costInput = costCell.querySelector('wa-input');
      expect(costInput).toBeTruthy();
    });

    test('should display "Cost Total" column with quantity * costBasis', () => {
      const table = element.shadowRoot!.querySelector('table')!;
      const headers = Array.from(table.querySelectorAll('th'));
      const costTotalIdx = headers.findIndex((th) => th.textContent?.trim() === 'Cost Total');
      expect(costTotalIdx).toBeGreaterThan(-1);

      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
      const costTotalCell = rows[0].querySelectorAll('td')[costTotalIdx];
      // Item has costBasis=25, quantity=2, so total = $50.00
      expect(costTotalCell.textContent?.trim()).toBe('$50.00');
    });

    test('should display per-unit market price in "Unit Market" column', () => {
      const table = element.shadowRoot!.querySelector('table')!;
      const headers = Array.from(table.querySelectorAll('th'));
      const unitMarketIdx = headers.findIndex((th) => th.textContent?.trim() === 'Unit Market');
      expect(unitMarketIdx).toBeGreaterThan(-1);

      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
      const unitMarketCell = rows[0].querySelectorAll('td')[unitMarketIdx];
      // marketValue=100 / quantity=2 => marketPrice per unit = $50.00
      expect(unitMarketCell.textContent?.trim()).toBe('$50.00');
    });

    test('should display "Market Total" column with quantity * marketPrice', () => {
      const table = element.shadowRoot!.querySelector('table')!;
      const headers = Array.from(table.querySelectorAll('th'));
      const marketTotalIdx = headers.findIndex((th) => th.textContent?.trim() === 'Market Total');
      expect(marketTotalIdx).toBeGreaterThan(-1);

      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
      const marketTotalCell = rows[0].querySelectorAll('td')[marketTotalIdx];
      // marketPrice per unit = 50, quantity=2, so total = $100.00
      expect(marketTotalCell.textContent?.trim()).toBe('$100.00');
    });
  });

  describe('sealed table columns', () => {
    test('should render the sealed table without Rarity and Condition columns', async () => {
      mockExecute.mockImplementation((_doc: unknown, vars?: Record<string, unknown>) => {
        if (vars && 'id' in vars) {
          return Promise.resolve(
            mockGetLotResponse({
              items: [
                {
                  id: 11,
                  productId: 300,
                  productName: 'Booster Box',
                  gameName: 'Magic',
                  setName: 'Alpha',
                  rarity: null,
                  isSingle: false,
                  isSealed: true,
                  condition: null,
                  quantity: 3,
                  costBasis: 20,
                  costOverridden: false,
                  marketValue: 150,
                },
              ],
            }),
          );
        }
        if (vars && 'categoryId' in vars) return Promise.resolve(mockBuyRatesResponse());
        return Promise.resolve(mockSupportedGamesResponse());
      });

      element = await createElement({ lotId: '1' });

      // Find the sealed tab panel table
      const tabPanels = element.shadowRoot!.querySelectorAll('wa-tab-panel');
      const sealedPanel = Array.from(tabPanels).find((p) => p.getAttribute('name') === 'sealed');
      expect(sealedPanel).toBeTruthy();

      const table = sealedPanel!.querySelector('table');
      expect(table).toBeTruthy();

      const headers = Array.from(table!.querySelectorAll('th')).map((th) => th.textContent?.trim());
      expect(headers).not.toContain('Rarity');
      expect(headers).not.toContain('Condition');
      expect(headers).toContain('Unit Cost');
      expect(headers).toContain('Cost Total');
      expect(headers).toContain('Unit Market');
      expect(headers).toContain('Market Total');
    });
  });

  describe('cost and market totals with no product', () => {
    test('should display dashes for cost total and market total when no product selected', async () => {
      element = await createElement();

      // Programmatically add a row without a product
      const addBtn = element.shadowRoot!.querySelector('wa-button[size="small"]') as HTMLElement;
      addBtn.click();
      await element.updateComplete;

      const table = element.shadowRoot!.querySelector('table');
      expect(table).toBeTruthy();

      const headers = Array.from(table!.querySelectorAll('th'));
      const costTotalIdx = headers.findIndex((th) => th.textContent?.trim() === 'Cost Total');
      const marketTotalIdx = headers.findIndex((th) => th.textContent?.trim() === 'Market Total');

      const row = table!.querySelector('tbody tr')!;
      const cells = row.querySelectorAll('td');
      expect(cells[costTotalIdx].textContent?.trim()).toBe('-');
      expect(cells[marketTotalIdx].textContent?.trim()).toBe('-');
    });
  });

  describe('cost override behavior', () => {
    beforeEach(async () => {
      element = await createElement();

      // Ensure useBuyListForCost is on (default)
      element['useBuyListForCost'] = true;
      element['amountPaid'] = 100;

      // Add a product row and select a product
      addProductRow(element, true);
      await element.updateComplete;
      selectProductOnRow(element, true);
      await element.updateComplete;
      // Allow async buy-rate loading and re-renders to settle
      await new Promise((r) => setTimeout(r, 50));
      await element.updateComplete;
    });

    test('should not mark cost as overridden when field is focused without changing value', async () => {
      // Verify the item starts as not overridden
      const item = element['singlesItems'][0];
      expect(item.productId).toBe(100);
      expect(item.costOverridden).toBe(false);
      const originalCostBasis = item.costBasis;

      // Target only cost inputs (inside .cost-wrapper) rather than all wa-input elements,
      // so this test stays precise if @focus handlers are added to other fields.
      const costInputs = element.shadowRoot!.querySelectorAll('.cost-wrapper wa-input');
      for (const input of costInputs) {
        input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      }
      await element.updateComplete;

      // The item should still NOT be overridden — the old @focus handler was removed
      const itemAfterFocus = element['singlesItems'][0];
      expect(itemAfterFocus.costOverridden).toBe(false);
      expect(itemAfterFocus.costBasis).toBe(originalCostBasis);
    });

    test('should mark cost as overridden when user changes value via input', async () => {
      const item = element['singlesItems'][0];
      expect(item.costOverridden).toBe(false);

      // Directly call overrideCost to simulate what the @input handler does
      element['overrideCost'](item.clientId, true, 5.0);
      await element.updateComplete;

      const itemAfterInput = element['singlesItems'][0];
      expect(itemAfterInput.costOverridden).toBe(true);
      expect(itemAfterInput.costBasis).toBe(5.0);
    });

    test('should not show reset button when cost is not overridden', async () => {
      const resetBtn = element.shadowRoot!.querySelector('.reset-btn');
      expect(resetBtn).toBeFalsy();
    });

    test('should show reset button when cost is overridden and useBuyListForCost is on', async () => {
      const item = element['singlesItems'][0];
      element['overrideCost'](item.clientId, true, 5.0);
      await element.updateComplete;

      const resetBtn = element.shadowRoot!.querySelector('.reset-btn');
      expect(resetBtn).toBeTruthy();
    });

    test('should not show reset button when useBuyListForCost is off even if overridden', async () => {
      const item = element['singlesItems'][0];
      element['overrideCost'](item.clientId, true, 5.0);
      await element.updateComplete;

      element['useBuyListForCost'] = false;
      await element.updateComplete;

      const resetBtn = element.shadowRoot!.querySelector('.reset-btn');
      expect(resetBtn).toBeFalsy();
    });

    test('should clear override when reset button is clicked', async () => {
      const item = element['singlesItems'][0];
      element['overrideCost'](item.clientId, true, 5.0);
      await element.updateComplete;

      expect(element['singlesItems'][0].costOverridden).toBe(true);

      const resetBtn = element.shadowRoot!.querySelector('.reset-btn') as HTMLElement;
      expect(resetBtn).toBeTruthy();
      resetBtn.click();
      await element.updateComplete;

      expect(element['singlesItems'][0].costOverridden).toBe(false);
    });

    test('should render cost input inside a flex wrapper', async () => {
      const costWrapper = element.shadowRoot!.querySelector('.cost-cell .cost-wrapper');
      expect(costWrapper).toBeTruthy();

      const costInput = costWrapper?.querySelector('wa-input');
      expect(costInput).toBeTruthy();
    });

    test('should not have readonly attribute on cost input', async () => {
      const html = element.shadowRoot!.innerHTML;
      expect(html).toContain('cost-cell');
      const costCellMatch = html.match(/cost-cell[\s\S]*?<\/td>/);
      expect(costCellMatch).toBeTruthy();
      expect(costCellMatch![0]).not.toContain('readonly');
    });
  });

  test('should show Save and Cancel buttons', async () => {
    element = await createElement();
    const saveBar = element.shadowRoot!.querySelector('.save-bar');
    expect(saveBar).toBeTruthy();

    const buttons = saveBar!.querySelectorAll('wa-button');
    const texts = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(texts.some((t) => t?.includes('Cancel'))).toBe(true);
    expect(texts.some((t) => t?.includes('Save Lot'))).toBe(true);
  });

  test('should show loading spinner when loading a lot', async () => {
    mockExecute.mockImplementation((_doc: unknown, vars?: Record<string, unknown>) => {
      if (vars && 'id' in vars) return new Promise(() => {}); // never resolves
      if (vars && 'categoryId' in vars) return Promise.resolve(mockBuyRatesResponse());
      return Promise.resolve(mockSupportedGamesResponse());
    });

    element = await createElement({ lotId: '1' });
    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should display validation errors when saving incomplete lot', async () => {
    element = await createElement();

    // Click save with empty form
    const saveBtn = element.shadowRoot!.querySelector('.save-bar wa-button[variant="brand"]') as HTMLElement;
    saveBtn.click();
    await element.updateComplete;

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(callout).toBeTruthy();
    expect(callout?.textContent).toContain('Lot name is required');
  });
});
