import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getSupportedGames: [
        { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
        { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
      ],
    },
  }),
}));

import './settings-buyrates.client.ts';
import { OgsSettingsBuyRatesPage } from './settings-buyrates.client.ts';
import { execute } from '../../lib/graphql.ts';

const mockExecute = execute as ReturnType<typeof vi.fn>;

// --- Default mock data ---

function setupDefaultMock() {
  mockExecute.mockImplementation((query: { toString: () => string }) => {
    const queryStr = String(query);
    if (queryStr.includes('GetSupportedGames')) {
      return Promise.resolve({
        data: {
          getSupportedGames: [
            { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
            { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
          ],
        },
      });
    }
    if (queryStr.includes('GetDistinctRarities')) {
      return Promise.resolve({
        data: { getDistinctRarities: ['Common', 'Rare'] },
      });
    }
    if (queryStr.includes('GetBuyRates')) {
      return Promise.resolve({
        data: {
          getBuyRates: [
            { id: 1, description: 'Common', rate: 0.01, type: 'fixed', rarity: 'Common', hidden: false, sortOrder: 0 },
            { id: 2, description: 'Rare', rate: 0.05, type: 'fixed', rarity: 'Rare', hidden: false, sortOrder: 1 },
          ],
        },
      });
    }
    return Promise.resolve({ data: {} });
  });
}

// --- Tests ---

describe('ogs-settings-buyrates-page', () => {
  let element: OgsSettingsBuyRatesPage;

  beforeEach(async () => {
    setupDefaultMock();
    element = document.createElement('ogs-settings-buyrates-page') as OgsSettingsBuyRatesPage;
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
    expect(element).toBeInstanceOf(OgsSettingsBuyRatesPage);
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
    expect(desc?.textContent).toContain('Configure buy rate tables');
  });

  test('should display game selector dropdown with all supported games', () => {
    const select = element.shadowRoot!.querySelector('wa-select[label="Game"]');
    expect(select).toBeTruthy();
    const options = select!.querySelectorAll('wa-option');
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain('Magic: The Gathering');
    expect(options[1].textContent).toContain('Pokemon');
  });

  test('should display buy rate entries in the table', () => {
    const tables = element.shadowRoot!.querySelectorAll('.rate-table');
    const allRows = Array.from(tables).flatMap((t) => Array.from(t.querySelectorAll('tbody tr')));
    expect(allRows.length).toBeGreaterThanOrEqual(1);
  });

  test('should display Add Row button', () => {
    const addBtn = element.shadowRoot!.querySelector('wa-button[variant="neutral"]');
    expect(addBtn).toBeTruthy();
    expect(addBtn?.textContent).toContain('Add Row');
  });

  test('should display Save Buy Rates button', () => {
    const saveBtn = element.shadowRoot!.querySelector('wa-button[variant="brand"]');
    expect(saveBtn).toBeTruthy();
    expect(saveBtn?.textContent).toContain('Save Buy Rates');
  });

  test('should not display delete button for rarity default rows', () => {
    // Rarity default rows should not have delete buttons
    const rateActionsContainers = element.shadowRoot!.querySelectorAll('.rate-actions');
    // With only rarity defaults, all .rate-actions should be empty (no trash buttons)
    const deleteButtons = element.shadowRoot!.querySelectorAll('.rate-actions wa-button');
    // Default mock only has rarity-default entries, so no delete buttons expected
    expect(rateActionsContainers.length).toBeGreaterThanOrEqual(0);
    expect(deleteButtons.length).toBe(0);
  });

  test('should show empty state when no supported games', async () => {
    mockExecute.mockResolvedValue({
      data: { getSupportedGames: [] },
    });

    element.remove();
    element = document.createElement('ogs-settings-buyrates-page') as OgsSettingsBuyRatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 100));
    await element.updateComplete;

    const callout = element.shadowRoot!.querySelector('wa-callout[variant="neutral"]');
    expect(callout).toBeTruthy();
    expect(callout?.textContent).toContain('No supported games configured');
    expect(callout?.textContent).toContain('General Settings');
  });

  test('should show loading spinner initially', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-settings-buyrates-page') as OgsSettingsBuyRatesPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should show error message on load failure', async () => {
    mockExecute.mockRejectedValue(new Error('Network error'));

    element.remove();
    element = document.createElement('ogs-settings-buyrates-page') as OgsSettingsBuyRatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 100));
    await element.updateComplete;

    const errorCallout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(errorCallout).toBeTruthy();
    expect(errorCallout?.textContent).toContain('Network error');
  });

  test('should show rarity default rows when game has rarities but no saved buy rates', async () => {
    mockExecute.mockImplementation((query: { toString: () => string }) => {
      const queryStr = String(query);
      if (queryStr.includes('GetSupportedGames')) {
        return Promise.resolve({
          data: {
            getSupportedGames: [{ categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' }],
          },
        });
      }
      if (queryStr.includes('GetDistinctRarities')) {
        return Promise.resolve({
          data: { getDistinctRarities: ['Common', 'Uncommon'] },
        });
      }
      return Promise.resolve({ data: { getBuyRates: [] } });
    });

    element.remove();
    element = document.createElement('ogs-settings-buyrates-page') as OgsSettingsBuyRatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 100));
    await element.updateComplete;

    // Should display a table with rarity default rows even when no buy rates are saved
    const sectionLabel = element.shadowRoot!.querySelector('.rarity-section-label');
    expect(sectionLabel).toBeTruthy();
    expect(sectionLabel?.textContent).toContain('Rarity Defaults');
  });
});
