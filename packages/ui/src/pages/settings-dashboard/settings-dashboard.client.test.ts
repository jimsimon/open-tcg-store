import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({ data: null }),
}));

vi.mock('../../lib/store-context.ts', () => ({
  activeStoreId: { get: () => 'test-org-id', set: vi.fn() },
  storeList: { get: () => [], set: vi.fn() },
  initActiveStoreFromCookie: vi.fn(),
  setActiveStoreCookie: vi.fn(),
  getActiveStoreId: () => 'test-org-id',
}));

import './settings-dashboard.client';
import { SettingsDashboardPage } from './settings-dashboard.client';
import { execute } from '../../lib/graphql.ts';

const mockExecute = execute as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockSalesData = {
  getDashboardSales: {
    summary: {
      totalRevenue: 1234567,
      totalCost: 823400,
      totalProfit: 411167,
      profitMargin: 33.3,
      orderCount: 42,
    },
    dataPoints: [
      { label: 'Jan 1', revenue: 100000, cost: 60000, profit: 40000, orderCount: 5 },
      { label: 'Jan 2', revenue: 120000, cost: 70000, profit: 50000, orderCount: 7 },
    ],
    granularity: 'day',
  },
};

const mockBestSellers = {
  getDashboardBestSellers: [
    { productId: 1, productName: 'Product A', totalQuantity: 125, totalRevenue: 123456 },
    { productId: 2, productName: 'Product B', totalQuantity: 98, totalRevenue: 98765 },
  ],
};

const mockInventorySummary = {
  getDashboardInventorySummary: {
    totalSkus: 156,
    totalUnits: 2340,
    totalCostValue: 4567800,
    totalRetailValue: 6789000,
  },
};

const mockOrderStatus = {
  getDashboardOrderStatus: {
    open: 12,
    completed: 118,
    cancelled: 12,
    total: 142,
  },
};

const mockOpenOrders = {
  getDashboardOpenOrders: [
    {
      id: 1,
      orderNumber: 'ORD-20250405-0001',
      customerName: 'John Smith',
      totalAmount: 4567,
      itemCount: 3,
      createdAt: new Date().toISOString(),
    },
  ],
};

function mockAllData() {
  let callIndex = 0;
  mockExecute.mockImplementation(() => {
    const responses = [
      { data: mockSalesData },
      { data: mockBestSellers },
      { data: mockInventorySummary },
      { data: mockOrderStatus },
      { data: mockOpenOrders },
    ];
    return Promise.resolve(responses[callIndex++] || { data: null });
  });
}

function mockEmptyData() {
  mockExecute.mockResolvedValue({ data: null });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ogs-settings-dashboard-page', () => {
  let element: SettingsDashboardPage;

  afterEach(() => {
    element?.remove();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  async function createElement() {
    element = document.createElement('ogs-settings-dashboard-page') as SettingsDashboardPage;
    element.activeOrganizationId = 'test-org-id';
    document.body.appendChild(element);
    await element.updateComplete;
    // Wait for async data fetching
    await new Promise((r) => setTimeout(r, 100));
    await element.updateComplete;
  }

  test('renders dashboard title', async () => {
    mockEmptyData();
    await createElement();

    const title = element.shadowRoot!.querySelector('.page-header h2');
    expect(title).toBeTruthy();
    expect(title!.textContent).toBe('Dashboard');
  });

  test('renders date preset buttons', async () => {
    mockEmptyData();
    await createElement();

    const buttons = element.shadowRoot!.querySelectorAll('wa-button-group[label="Date range"] wa-button');
    expect(buttons.length).toBe(4);

    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels).toContain('Today');
    expect(labels).toContain('This Week');
    expect(labels).toContain('This Month');
    expect(labels).toContain('This Year');
  });

  test('renders all card sections', async () => {
    mockAllData();
    await createElement();

    const cards = element.shadowRoot!.querySelectorAll('wa-card');
    expect(cards.length).toBeGreaterThanOrEqual(4);

    const cardHeaders = Array.from(cards).map(
      (card) => card.querySelector('[slot="header"]')?.textContent?.trim() || '',
    );

    // Header text may include button text, so check with includes
    expect(cardHeaders.some((h) => h.includes('Sales'))).toBe(true);
    expect(cardHeaders.some((h) => h.includes('Best Sellers'))).toBe(true);
    expect(cardHeaders.some((h) => h.includes('Order Status'))).toBe(true);
    expect(cardHeaders.some((h) => h.includes('Inventory Summary'))).toBe(true);
  });

  test('displays empty states when no data', async () => {
    mockEmptyData();
    await createElement();

    const emptyStates = element.shadowRoot!.querySelectorAll('.empty-state');
    expect(emptyStates.length).toBeGreaterThanOrEqual(4);
  });

  test('displays sales data when available', async () => {
    mockAllData();
    await createElement();

    const statValues = element.shadowRoot!.querySelectorAll('.stat-value');
    const statTexts = Array.from(statValues).map((el) => el.textContent?.trim());

    // Should contain the formatted revenue value
    expect(statTexts.some((t) => t?.includes('12,345'))).toBe(true);
  });

  test('displays best sellers when available', async () => {
    mockAllData();
    await createElement();

    const bestSellerItems = element.shadowRoot!.querySelectorAll('.best-seller-item');
    expect(bestSellerItems.length).toBe(2);

    const names = Array.from(element.shadowRoot!.querySelectorAll('.best-seller-name')).map((el) =>
      el.textContent?.trim(),
    );
    expect(names).toContain('Product A');
    expect(names).toContain('Product B');
  });

  test('renders best seller sort toggle', async () => {
    mockEmptyData();
    await createElement();

    const sortButtons = element.shadowRoot!.querySelectorAll('wa-button-group[label="Sort by"] wa-button');
    expect(sortButtons.length).toBe(2);

    const labels = Array.from(sortButtons).map((b) => b.textContent?.trim());
    expect(labels).toContain('By Quantity');
    expect(labels).toContain('By Revenue');
  });
});
