import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getPublicBuyRates: {
        games: [
          {
            categoryId: 1,
            gameName: 'Magic',
            gameDisplayName: 'Magic: The Gathering',
            entries: [
              { id: 1, description: 'Commons & Uncommons', rate: 0.01, sortOrder: 0 },
              { id: 2, description: 'Rares (Non-Holo)', rate: 0.02, sortOrder: 1 },
              { id: 3, description: 'Holos and Reverse Holos', rate: 0.05, sortOrder: 2 },
            ],
          },
          {
            categoryId: 3,
            gameName: 'Pokemon',
            gameDisplayName: 'Pokemon',
            entries: [
              { id: 4, description: 'Commons & Uncommons', rate: 0.01, sortOrder: 0 },
              { id: 5, description: 'Illustration Rares', rate: 1.0, sortOrder: 1 },
            ],
          },
        ],
      },
    },
  }),
}));

import './buy-rates.client.ts';
import { OgsBuyRatesPage } from './buy-rates.client.ts';
import { execute } from '../../lib/graphql.ts';

const mockExecute = execute as ReturnType<typeof vi.fn>;

// --- Tests ---

describe('ogs-buy-rates-page', () => {
  let element: OgsBuyRatesPage;

  beforeEach(async () => {
    mockExecute.mockResolvedValue({
      data: {
        getPublicBuyRates: {
          games: [
            {
              categoryId: 1,
              gameName: 'Magic',
              gameDisplayName: 'Magic: The Gathering',
              entries: [
                { id: 1, description: 'Commons & Uncommons', rate: 0.01, sortOrder: 0 },
                { id: 2, description: 'Rares (Non-Holo)', rate: 0.02, sortOrder: 1 },
                { id: 3, description: 'Holos and Reverse Holos', rate: 0.05, sortOrder: 2 },
              ],
            },
            {
              categoryId: 3,
              gameName: 'Pokemon',
              gameDisplayName: 'Pokemon',
              entries: [
                { id: 4, description: 'Commons & Uncommons', rate: 0.01, sortOrder: 0 },
                { id: 5, description: 'Illustration Rares', rate: 1.0, sortOrder: 1 },
              ],
            },
          ],
        },
      },
    });

    element = document.createElement('ogs-buy-rates-page') as OgsBuyRatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 100));
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  test('should render the component', () => {
    expect(element).toBeInstanceOf(OgsBuyRatesPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header', () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Buy Rates');
  });

  test('should display the page description', () => {
    const desc = element.shadowRoot!.querySelector('.page-header p');
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toContain('What we pay for your cards');
  });

  test('should display tabs for multiple games', () => {
    const tabs = element.shadowRoot!.querySelectorAll('wa-tab[slot="nav"]');
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('Magic: The Gathering');
    expect(tabs[1].textContent).toContain('Pokemon');
  });

  test('should display buy rate table with correct headers', () => {
    // Table may be inside a tab-panel; find any rate-table in the shadow DOM
    const tables = element.shadowRoot!.querySelectorAll('.rate-table');
    expect(tables.length).toBeGreaterThanOrEqual(1);
    const headers = tables[0].querySelectorAll('th');
    expect(headers.length).toBe(2);
    expect(headers[0].textContent).toContain('Card Type');
    expect(headers[1].textContent).toContain('Cost/Unit');
  });

  test('should display buy rate entries in the table', () => {
    // At least one table should have rows
    const tables = element.shadowRoot!.querySelectorAll('.rate-table');
    const allRows = Array.from(tables).flatMap((t) => Array.from(t.querySelectorAll('tbody tr')));
    expect(allRows.length).toBeGreaterThanOrEqual(1);
  });

  test('should format rate values with two decimal places', () => {
    const tables = element.shadowRoot!.querySelectorAll('.rate-table');
    const cells = Array.from(tables).flatMap((t) => Array.from(t.querySelectorAll('td:last-child')));
    const rateTexts = cells.map((c) => c.textContent?.trim());
    expect(rateTexts.some((r) => r === '0.01' || r === '0.02' || r === '0.05')).toBe(true);
  });

  test('should display description text in table rows', () => {
    const tables = element.shadowRoot!.querySelectorAll('.rate-table');
    const cells = Array.from(tables).flatMap((t) => Array.from(t.querySelectorAll('td:first-child')));
    const descriptions = cells.map((c) => c.textContent?.trim());
    expect(descriptions.some((d) => d === 'Commons & Uncommons' || d === 'Rares (Non-Holo)')).toBe(true);
  });

  test('should display buy rate entries in the table', () => {
    const rows = element.shadowRoot!.querySelectorAll('.rate-table tbody tr');
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  test('should format rate values with two decimal places', () => {
    const cells = element.shadowRoot!.querySelectorAll('.rate-table td:last-child');
    const rateTexts = Array.from(cells).map((c) => c.textContent?.trim());
    expect(rateTexts).toContain('0.01');
    expect(rateTexts).toContain('0.02');
    expect(rateTexts).toContain('0.05');
  });

  test('should display description text in table rows', () => {
    const cells = element.shadowRoot!.querySelectorAll('.rate-table td:first-child');
    const descriptions = Array.from(cells).map((c) => c.textContent?.trim());
    expect(descriptions).toContain('Commons & Uncommons');
    expect(descriptions).toContain('Rares (Non-Holo)');
  });

  test('should show empty state when no buy rates exist', async () => {
    mockExecute.mockResolvedValue({
      data: {
        getPublicBuyRates: {
          games: [],
        },
      },
    });

    element.remove();
    element = document.createElement('ogs-buy-rates-page') as OgsBuyRatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 100));
    await element.updateComplete;

    const emptyState = element.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('not currently buying any cards');
    expect(emptyState?.textContent).toContain('Check back soon');
  });

  test('should show single game without tabs', async () => {
    mockExecute.mockResolvedValue({
      data: {
        getPublicBuyRates: {
          games: [
            {
              categoryId: 1,
              gameName: 'Magic',
              gameDisplayName: 'Magic: The Gathering',
              entries: [{ id: 1, description: 'Commons', rate: 0.01, sortOrder: 0 }],
            },
          ],
        },
      },
    });

    element.remove();
    element = document.createElement('ogs-buy-rates-page') as OgsBuyRatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 100));
    await element.updateComplete;

    // Should NOT have tabs for a single game
    const tabs = element.shadowRoot!.querySelectorAll('wa-tab[slot="nav"]');
    expect(tabs.length).toBe(0);

    // Should still have the rate table
    const table = element.shadowRoot!.querySelector('.rate-table');
    expect(table).toBeTruthy();
  });

  test('should show loading spinner initially', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-buy-rates-page') as OgsBuyRatesPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should show error message on load failure', async () => {
    mockExecute.mockRejectedValue(new Error('Network error'));

    element.remove();
    element = document.createElement('ogs-buy-rates-page') as OgsBuyRatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 100));
    await element.updateComplete;

    const errorCallout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(errorCallout).toBeTruthy();
    expect(errorCallout?.textContent).toContain('Network error');
  });
});
