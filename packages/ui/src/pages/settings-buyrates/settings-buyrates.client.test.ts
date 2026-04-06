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
  let callIndex = 0;
  mockExecute.mockImplementation(() => {
    callIndex++;
    if (callIndex === 1) {
      return Promise.resolve({
        data: {
          getSupportedGames: [
            { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
            { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
          ],
        },
      });
    }
    if (callIndex === 2) {
      return Promise.resolve({
        data: {
          getBuyRates: [
            { id: 1, description: 'Commons & Uncommons', rate: 0.01, sortOrder: 0 },
            { id: 2, description: 'Rares (Non-Holo)', rate: 0.02, sortOrder: 1 },
          ],
        },
      });
    }
    if (callIndex === 3) {
      return Promise.resolve({
        data: {
          getBuyRates: [{ id: 3, description: 'Holos and Reverse Holos', rate: 0.05, sortOrder: 0 }],
        },
      });
    }
    return Promise.resolve({ data: { getBuyRates: [] } });
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

  test('should display tabs for each supported game', () => {
    const tabs = element.shadowRoot!.querySelectorAll('wa-tab[slot="nav"]');
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('Magic: The Gathering');
    expect(tabs[1].textContent).toContain('Pokemon');
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

  test('should display delete button for each row', () => {
    const deleteButtons = element.shadowRoot!.querySelectorAll('.rate-actions wa-button');
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
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

  test('should show message when game has no buy rate entries', async () => {
    let callIndex = 0;
    mockExecute.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return Promise.resolve({
          data: {
            getSupportedGames: [{ categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' }],
          },
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

    const emptyText = element.shadowRoot!.querySelector('.tab-content p');
    expect(emptyText?.textContent).toContain('No buy rate entries yet');
  });
});
