import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function so the component doesn't make real network requests.
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({ data: {} }),
}));

import './lot.client.ts';
import { OgsLotPage } from './lot.client.ts';
import { execute } from '../../lib/graphql.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockExecute = execute as ReturnType<typeof vi.fn>;

/** Reach into Lit reactive state that is marked `@state()` (private). */
// biome-ignore lint: test-only cast
type LotPageInternal = OgsLotPage & Record<string, any>;

function mockGetLotResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      getLot: {
        id: 1,
        name: 'Test Lot',
        description: 'A test lot',
        amountPaid: 10000,
        acquisitionDate: '2025-01-15',
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
            costBasis: 2500,
            costOverridden: false,
            marketValue: 10000,
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
            costBasis: 5000,
            costOverridden: false,
            marketValue: 15000,
          },
        ],
        totalMarketValue: 25000,
        totalCost: 10000,
        projectedProfitLoss: 15000,
        projectedProfitMargin: 60,
        ...overrides,
      },
    },
  };
}

async function createElement(props: Partial<Record<string, unknown>> = {}): Promise<LotPageInternal> {
  const el = document.createElement('ogs-lot-page') as LotPageInternal;
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

function addProductRow(element: LotPageInternal, isSingle: boolean) {
  element['addProductRow'](isSingle);
}

/** Simulate selecting a product from search results by directly calling the component method. */
function selectProductOnRow(element: LotPageInternal, isSingle: boolean, overrides: Record<string, unknown> = {}) {
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

interface ItemLike {
  clientId?: string;
  productId?: number | null;
  productName?: string;
  gameName?: string;
  setName?: string;
  rarity?: string | null;
  isSingle?: boolean;
  condition?: string;
  quantity?: number;
  costBasis?: number;
  costOverridden?: boolean;
  marketPrice?: number;
  searching?: boolean;
  searchTerm?: string;
  searchResults?: Array<{
    id: number;
    name: string;
    gameName: string;
    setName: string;
    rarity: string | null;
    isSingle: boolean;
    isSealed: boolean;
    marketPrice: number;
  }>;
}

let clientIdSeq = 0;
function makeItem(overrides: ItemLike = {}): Required<ItemLike> {
  clientIdSeq += 1;
  return {
    clientId: `test-${clientIdSeq}`,
    productId: clientIdSeq,
    productName: `Card ${clientIdSeq}`,
    gameName: 'Magic',
    setName: 'Alpha',
    rarity: 'Rare',
    isSingle: true,
    condition: 'NM',
    quantity: 1,
    costBasis: 0,
    costOverridden: false,
    marketPrice: 10,
    searching: false,
    searchTerm: '',
    searchResults: [],
    ...overrides,
  };
}

/**
 * Triggers the private `recalculateAutoCosts` method by calling it directly.
 * This mirrors what `selectProduct`, `updateItemField`, and the amountPaid input do.
 */
function recalculate(el: LotPageInternal) {
  el['recalculateAutoCosts']();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ogs-lot-page', () => {
  let element: LotPageInternal;

  afterEach(() => {
    element?.remove();
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

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
      return Promise.resolve({ data: {} });
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

  test('should not render the buy list checkbox', async () => {
    element = await createElement();
    const checkbox = element.shadowRoot!.querySelector('wa-checkbox');
    expect(checkbox).toBeFalsy();
  });

  // -----------------------------------------------------------------------
  // Table columns
  // -----------------------------------------------------------------------

  describe('singles table columns', () => {
    beforeEach(async () => {
      mockExecute.mockImplementation((_doc: unknown, vars?: Record<string, unknown>) => {
        if (vars && 'id' in vars) return Promise.resolve(mockGetLotResponse());
        return Promise.resolve({ data: {} });
      });

      element = await createElement({ lotId: '1' });
    });

    test('should render the table with correct column headers for singles', () => {
      const tables = element.shadowRoot!.querySelectorAll('table');
      expect(tables.length).toBeGreaterThanOrEqual(1);

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
      // Item has costBasis=2500 (cents), quantity=2, so total = 5000 cents = $50.00
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
      // marketValue=10000 (cents) / quantity=2 => marketPrice per unit = 5000 cents = $50.00
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
      // marketPrice per unit = 5000 (cents), quantity=2, so total = 10000 cents = $100.00
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
                  costBasis: 2000,
                  costOverridden: false,
                  marketValue: 15000,
                },
              ],
            }),
          );
        }
        return Promise.resolve({ data: {} });
      });

      element = await createElement({ lotId: '1' });

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

  // -----------------------------------------------------------------------
  // Cost override behavior (UI)
  // -----------------------------------------------------------------------

  describe('cost override behavior', () => {
    beforeEach(async () => {
      element = await createElement();
      element.amountPaid = 100;

      addProductRow(element, true);
      await element.updateComplete;
      selectProductOnRow(element, true);
      await element.updateComplete;
      await new Promise((r) => setTimeout(r, 50));
      await element.updateComplete;
    });

    test('should not mark cost as overridden when field is focused without changing value', async () => {
      const item = element.singlesItems[0];
      expect(item.productId).toBe(100);
      expect(item.costOverridden).toBe(false);
      const originalCostBasis = item.costBasis;

      const costInputs = element.shadowRoot!.querySelectorAll('.cost-wrapper wa-input');
      for (const input of costInputs) {
        input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      }
      await element.updateComplete;

      const itemAfterFocus = element.singlesItems[0];
      expect(itemAfterFocus.costOverridden).toBe(false);
      expect(itemAfterFocus.costBasis).toBe(originalCostBasis);
    });

    test('should mark cost as overridden when user changes value via input', async () => {
      const item = element.singlesItems[0];
      expect(item.costOverridden).toBe(false);

      element['overrideCost'](item.clientId, true, 5.0);
      await element.updateComplete;

      const itemAfterInput = element.singlesItems[0];
      expect(itemAfterInput.costOverridden).toBe(true);
      expect(itemAfterInput.costBasis).toBe(5.0);
    });

    test('should not show reset button when cost is not overridden', async () => {
      const resetBtn = element.shadowRoot!.querySelector('.reset-btn');
      expect(resetBtn).toBeFalsy();
    });

    test('should show reset button when cost is overridden', async () => {
      const item = element.singlesItems[0];
      element['overrideCost'](item.clientId, true, 5.0);
      await element.updateComplete;

      const resetBtn = element.shadowRoot!.querySelector('.reset-btn');
      expect(resetBtn).toBeTruthy();
    });

    test('should clear override when reset button is clicked', async () => {
      const item = element.singlesItems[0];
      element['overrideCost'](item.clientId, true, 5.0);
      await element.updateComplete;

      expect(element.singlesItems[0].costOverridden).toBe(true);

      const resetBtn = element.shadowRoot!.querySelector('.reset-btn') as HTMLElement;
      expect(resetBtn).toBeTruthy();
      resetBtn.click();
      await element.updateComplete;

      expect(element.singlesItems[0].costOverridden).toBe(false);
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

  // -----------------------------------------------------------------------
  // Save / validation
  // -----------------------------------------------------------------------

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
      return Promise.resolve({ data: {} });
    });

    element = await createElement({ lotId: '1' });
    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should display validation errors when saving incomplete lot', async () => {
    element = await createElement();

    const saveBtn = element.shadowRoot!.querySelector('.save-bar wa-button[variant="brand"]') as HTMLElement;
    saveBtn.click();
    await element.updateComplete;

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(callout).toBeTruthy();
    expect(callout?.textContent).toContain('Lot name is required');
  });

  // -----------------------------------------------------------------------
  // Market-price-weighted cost distribution
  // -----------------------------------------------------------------------

  describe('market-price-weighted cost distribution', () => {
    beforeEach(async () => {
      clientIdSeq = 0;
      element = document.createElement('ogs-lot-page') as LotPageInternal;
      document.body.appendChild(element);
      await element.updateComplete;
    });

    test('distributes cost proportionally by market price for a single item', () => {
      const item = makeItem({ marketPrice: 20, quantity: 1 });
      element.singlesItems = [item];
      element.amountPaid = 15;
      recalculate(element);

      expect(element.singlesItems[0].costBasis).toBe(15);
    });

    test('distributes cost proportionally across two items with different market prices', () => {
      const item1 = makeItem({ marketPrice: 30, quantity: 1 });
      const item2 = makeItem({ marketPrice: 10, quantity: 1 });
      element.singlesItems = [item1, item2];
      element.amountPaid = 20;
      recalculate(element);

      // Total market value = 30 + 10 = 40
      // item1: 30/40 * 20 = 15
      // item2: 10/40 * 20 = 5
      expect(element.singlesItems[0].costBasis).toBe(15);
      expect(element.singlesItems[1].costBasis).toBe(5);
    });

    test('accounts for quantity when distributing cost', () => {
      const item1 = makeItem({ marketPrice: 10, quantity: 3 });
      const item2 = makeItem({ marketPrice: 5, quantity: 2 });
      element.singlesItems = [item1, item2];
      element.amountPaid = 20;
      recalculate(element);

      // Total market value = (10*3) + (5*2) = 30 + 10 = 40
      // item1 row cost: 30/40 * 20 = 15, per unit: 15/3 = 5
      // item2 row cost: 10/40 * 20 = 5, per unit: 5/2 = 2.5
      expect(element.singlesItems[0].costBasis).toBe(5);
      expect(element.singlesItems[1].costBasis).toBe(2.5);
    });

    test('mixes singles and sealed items in cost distribution', () => {
      const single = makeItem({ marketPrice: 20, quantity: 1, isSingle: true });
      const sealed = makeItem({ marketPrice: 80, quantity: 1, isSingle: false });
      element.singlesItems = [single];
      element.sealedItems = [sealed];
      element.amountPaid = 50;
      recalculate(element);

      // Total market value = 20 + 80 = 100
      // single: 20/100 * 50 = 10
      // sealed: 80/100 * 50 = 40
      expect(element.singlesItems[0].costBasis).toBe(10);
      expect(element.sealedItems[0].costBasis).toBe(40);
    });

    test('rounds cost basis to two decimal places', () => {
      const item1 = makeItem({ marketPrice: 10, quantity: 1 });
      const item2 = makeItem({ marketPrice: 10, quantity: 1 });
      const item3 = makeItem({ marketPrice: 10, quantity: 1 });
      element.singlesItems = [item1, item2, item3];
      element.amountPaid = 10;
      recalculate(element);

      // 10/30 * 10 = 3.333... → rounded to 3.33
      expect(element.singlesItems[0].costBasis).toBe(3.33);
      expect(element.singlesItems[1].costBasis).toBe(3.33);
      expect(element.singlesItems[2].costBasis).toBe(3.33);
    });

    test('handles zero amount paid', () => {
      const item = makeItem({ marketPrice: 20, quantity: 1 });
      element.singlesItems = [item];
      element.amountPaid = 0;
      recalculate(element);

      expect(element.singlesItems[0].costBasis).toBe(0);
    });

    test('leaves cost at zero when all market prices are zero', () => {
      const item1 = makeItem({ marketPrice: 0, quantity: 2 });
      const item2 = makeItem({ marketPrice: 0, quantity: 3 });
      element.singlesItems = [item1, item2];
      element.amountPaid = 10;
      recalculate(element);

      // No market price data → cannot distribute proportionally, cost stays at 0
      expect(element.singlesItems[0].costBasis).toBe(0);
      expect(element.singlesItems[1].costBasis).toBe(0);
    });

    test('skips items without a productId', () => {
      const itemWithProduct = makeItem({ marketPrice: 10, quantity: 1 });
      const itemWithout = makeItem({ productId: null, marketPrice: 0, quantity: 1 });
      element.singlesItems = [itemWithProduct, itemWithout];
      element.amountPaid = 8;
      recalculate(element);

      expect(element.singlesItems[0].costBasis).toBe(8);
      expect(element.singlesItems[1].costBasis).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Cost overrides (calculation logic)
  // -----------------------------------------------------------------------

  describe('cost override calculations', () => {
    beforeEach(async () => {
      clientIdSeq = 0;
      element = document.createElement('ogs-lot-page') as LotPageInternal;
      document.body.appendChild(element);
      await element.updateComplete;
    });

    test('subtracts overridden item cost from budget before distributing', () => {
      const item1 = makeItem({ marketPrice: 20, quantity: 1, costBasis: 5, costOverridden: true });
      const item2 = makeItem({ marketPrice: 20, quantity: 1 });
      const item3 = makeItem({ marketPrice: 20, quantity: 1 });
      element.singlesItems = [item1, item2, item3];
      element.amountPaid = 25;
      recalculate(element);

      // Overridden total = 5
      // Remaining budget = 25 - 5 = 20
      // item2 and item3 have equal market prices → each gets 10
      expect(element.singlesItems[0].costBasis).toBe(5);
      expect(element.singlesItems[0].costOverridden).toBe(true);
      expect(element.singlesItems[1].costBasis).toBe(10);
      expect(element.singlesItems[2].costBasis).toBe(10);
    });

    test('distributes remaining budget by market price with overridden items excluded', () => {
      const overridden = makeItem({ marketPrice: 50, quantity: 1, costBasis: 10, costOverridden: true });
      const auto1 = makeItem({ marketPrice: 30, quantity: 1 });
      const auto2 = makeItem({ marketPrice: 10, quantity: 1 });
      element.singlesItems = [overridden, auto1, auto2];
      element.amountPaid = 30;
      recalculate(element);

      // Remaining = 30 - 10 = 20
      // Total auto market value = 30 + 10 = 40
      // auto1: 30/40 * 20 = 15
      // auto2: 10/40 * 20 = 5
      expect(element.singlesItems[0].costBasis).toBe(10);
      expect(element.singlesItems[1].costBasis).toBe(15);
      expect(element.singlesItems[2].costBasis).toBe(5);
    });

    test('handles multiple overridden items with quantities', () => {
      const overridden1 = makeItem({ marketPrice: 20, quantity: 2, costBasis: 3, costOverridden: true });
      const overridden2 = makeItem({ marketPrice: 10, quantity: 1, costBasis: 4, costOverridden: true });
      const auto = makeItem({ marketPrice: 15, quantity: 1 });
      element.singlesItems = [overridden1, overridden2, auto];
      element.amountPaid = 20;
      recalculate(element);

      // Overridden total = (3*2) + (4*1) = 10
      // Remaining = 20 - 10 = 10
      expect(element.singlesItems[0].costBasis).toBe(3);
      expect(element.singlesItems[1].costBasis).toBe(4);
      expect(element.singlesItems[2].costBasis).toBe(10);
    });

    test('overrideCost sets costOverridden flag and recalculates others', async () => {
      const item1 = makeItem({ marketPrice: 20, quantity: 1 });
      const item2 = makeItem({ marketPrice: 20, quantity: 1 });
      element.singlesItems = [item1, item2];
      element.amountPaid = 20;
      recalculate(element);

      expect(element.singlesItems[0].costBasis).toBe(10);
      expect(element.singlesItems[1].costBasis).toBe(10);

      element['overrideCost'](item1.clientId, true, 6);

      expect(element.singlesItems[0].costBasis).toBe(6);
      expect(element.singlesItems[0].costOverridden).toBe(true);

      // overrideCost uses a debounced recalculation, wait for it to fire
      await new Promise((r) => setTimeout(r, 350));

      expect(element.singlesItems[1].costBasis).toBe(14);
    });

    test('resetCost clears override and recalculates', () => {
      const item1 = makeItem({ marketPrice: 20, quantity: 1, costBasis: 6, costOverridden: true });
      const item2 = makeItem({ marketPrice: 20, quantity: 1 });
      element.singlesItems = [item1, item2];
      element.amountPaid = 20;
      recalculate(element);

      expect(element.singlesItems[1].costBasis).toBe(14);

      element['resetCost'](item1.clientId, true);

      expect(element.singlesItems[0].costOverridden).toBe(false);
      expect(element.singlesItems[0].costBasis).toBe(10);
      expect(element.singlesItems[1].costBasis).toBe(10);
    });
  });

  // -----------------------------------------------------------------------
  // Rendered cost display
  // -----------------------------------------------------------------------

  describe('rendered cost display', () => {
    beforeEach(async () => {
      clientIdSeq = 0;
      element = document.createElement('ogs-lot-page') as LotPageInternal;
      document.body.appendChild(element);
      await element.updateComplete;
    });

    test('shows summary totals', async () => {
      const item1 = makeItem({ marketPrice: 3000, quantity: 1 });
      const item2 = makeItem({ marketPrice: 1000, quantity: 1 });
      element.singlesItems = [item1, item2];
      element.amountPaid = 2000;
      recalculate(element);
      await element.updateComplete;

      const summaryItems = element.shadowRoot!.querySelectorAll('.summary-item');
      const values = Array.from(summaryItems).map((item) => {
        const label = item.querySelector('.label')?.textContent?.trim();
        const value = item.querySelector('.value')?.textContent?.trim();
        return { label, value };
      });

      const marketValue = values.find((v) => v.label === 'Total Market Value');
      const totalCost = values.find((v) => v.label === 'Total Cost');
      expect(marketValue?.value).toBe('$40.00');
      expect(totalCost?.value).toBe('$20.00');
    });

    test('shows reset button only on overridden items', async () => {
      const item1 = makeItem({ marketPrice: 20, quantity: 1, costBasis: 5, costOverridden: true });
      const item2 = makeItem({ marketPrice: 20, quantity: 1 });
      element.singlesItems = [item1, item2];
      element.amountPaid = 15;
      recalculate(element);
      await element.updateComplete;

      const resetBtns = element.shadowRoot!.querySelectorAll('.reset-btn');
      expect(resetBtns.length).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    beforeEach(async () => {
      clientIdSeq = 0;
      element = document.createElement('ogs-lot-page') as LotPageInternal;
      document.body.appendChild(element);
      await element.updateComplete;
    });

    test('handles a single item with quantity > 1', () => {
      const item = makeItem({ marketPrice: 10, quantity: 4 });
      element.singlesItems = [item];
      element.amountPaid = 20;
      recalculate(element);

      expect(element.singlesItems[0].costBasis).toBe(5);
    });

    test('handles many items with varying prices and quantities', () => {
      const items = [
        makeItem({ marketPrice: 100, quantity: 1 }),
        makeItem({ marketPrice: 50, quantity: 2 }),
        makeItem({ marketPrice: 25, quantity: 4 }),
      ];
      element.singlesItems = items;
      element.amountPaid = 150;
      recalculate(element);

      // Total market value = 100 + 100 + 100 = 300
      // item1: 100/300 * 150 / 1 = 50
      // item2: 100/300 * 150 / 2 = 25
      // item3: 100/300 * 150 / 4 = 12.5
      expect(element.singlesItems[0].costBasis).toBe(50);
      expect(element.singlesItems[1].costBasis).toBe(25);
      expect(element.singlesItems[2].costBasis).toBe(12.5);
    });

    test('handles zero quantity items gracefully', () => {
      const item1 = makeItem({ marketPrice: 10, quantity: 0 });
      const item2 = makeItem({ marketPrice: 10, quantity: 1 });
      element.singlesItems = [item1, item2];
      element.amountPaid = 10;
      recalculate(element);

      expect(element.singlesItems[0].costBasis).toBe(0);
      expect(element.singlesItems[1].costBasis).toBe(10);
    });

    test('no items means no recalculation errors', () => {
      element.singlesItems = [];
      element.sealedItems = [];
      element.amountPaid = 100;
      expect(() => recalculate(element)).not.toThrow();
    });

    test('all items overridden leaves no auto items to distribute to', () => {
      const item1 = makeItem({ marketPrice: 20, quantity: 1, costBasis: 8, costOverridden: true });
      const item2 = makeItem({ marketPrice: 10, quantity: 1, costBasis: 2, costOverridden: true });
      element.singlesItems = [item1, item2];
      element.amountPaid = 10;
      recalculate(element);

      expect(element.singlesItems[0].costBasis).toBe(8);
      expect(element.singlesItems[1].costBasis).toBe(2);
    });
  });
});
