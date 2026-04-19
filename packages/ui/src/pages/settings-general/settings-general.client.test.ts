import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getStoreSettings: {
        companyName: 'Test TCG Store',
        ein: '12-3456789',
      },
    },
  }),
}));

import './settings-general.client.ts';
import { OgsSettingsGeneralPage } from './settings-general.client.ts';
import { execute } from '../../lib/graphql.ts';

const mockExecute = execute as ReturnType<typeof vi.fn>;

// --- Default mock data ---

function setupDefaultMock() {
  let callIndex = 0;
  mockExecute.mockImplementation(() => {
    callIndex++;
    // loadSettings calls Promise.all with [getStoreSettings, getAvailableGames, getSupportedGames]
    if (callIndex === 1) {
      return Promise.resolve({
        data: {
          getStoreSettings: {
            companyName: 'Test TCG Store',
            ein: '12-3456789',
          },
        },
      });
    }
    if (callIndex === 2) {
      return Promise.resolve({
        data: {
          getAvailableGames: [
            { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
            { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
            { categoryId: 5, name: 'OnePiece', displayName: 'One Piece Card Game' },
          ],
        },
      });
    }
    if (callIndex === 3) {
      return Promise.resolve({
        data: {
          getSupportedGames: [
            { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
            { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
          ],
        },
      });
    }
    return Promise.resolve({ data: {} });
  });
}

// --- Tests ---

describe('ogs-settings-general-page', () => {
  let element: OgsSettingsGeneralPage;

  beforeEach(async () => {
    setupDefaultMock();
    element = document.createElement('ogs-settings-general-page') as OgsSettingsGeneralPage;
    document.body.appendChild(element);
    await element.updateComplete;
    // Wait for async loadSettings to complete
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  test('should render the component', () => {
    expect(element).toBeInstanceOf(OgsSettingsGeneralPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header', () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('General Settings');
  });

  test('should display the page description', () => {
    const desc = element.shadowRoot!.querySelector('.page-header p');
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toContain('Configure your company information');
  });

  test('should load and display store settings', () => {
    expect(mockExecute).toHaveBeenCalled();

    const companyNameInput = element.shadowRoot!.querySelector('wa-input[label="Company Name"]');
    expect(companyNameInput).toBeTruthy();
  });

  test('should display Company Information section', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header h3');
    const sectionTexts = Array.from(sections).map((s) => s.textContent?.trim());
    expect(sectionTexts).toContain('Company Information');
  });

  test('should display EIN input field', () => {
    const einInput = element.shadowRoot!.querySelector('wa-input[label="EIN (Employer Identification Number)"]');
    expect(einInput).toBeTruthy();
  });

  test('should display Save Settings button', () => {
    const saveBtn = element.shadowRoot!.querySelector('.save-bar wa-button[variant="brand"]');
    expect(saveBtn).toBeTruthy();
    expect(saveBtn?.textContent).toContain('Save Settings');
  });

  // --- Supported Games section ---

  test('should display Supported Games section', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header h3');
    const sectionTexts = Array.from(sections).map((s) => s.textContent?.trim());
    expect(sectionTexts).toContain('Supported Games');
  });

  test('should display Supported Games description', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header');
    const gamesSection = Array.from(sections).find((s) =>
      s.querySelector('h3')?.textContent?.includes('Supported Games'),
    );
    const desc = gamesSection?.querySelector('p');
    expect(desc?.textContent).toContain('Select the trading card games');
  });

  test('should display checkboxes for available games', () => {
    const picker = element.shadowRoot!.querySelector('ogs-games-picker');
    const checkboxes = picker!.shadowRoot!.querySelectorAll('wa-checkbox');
    expect(checkboxes.length).toBe(3);
    const labels = Array.from(checkboxes).map((cb) => cb.textContent?.trim());
    expect(labels).toContain('Magic: The Gathering');
    expect(labels).toContain('Pokemon');
    expect(labels).toContain('One Piece Card Game');
  });

  test('should have supported games pre-checked', () => {
    const picker = element.shadowRoot!.querySelector('ogs-games-picker');
    const checkboxes = picker!.shadowRoot!.querySelectorAll('wa-checkbox');
    const checkedLabels = Array.from(checkboxes)
      .filter((cb) => cb.hasAttribute('checked'))
      .map((cb) => cb.textContent?.trim());
    expect(checkedLabels).toContain('Magic: The Gathering');
    expect(checkedLabels).toContain('Pokemon');
    expect(checkedLabels).not.toContain('One Piece Card Game');
  });

  test('should make at least three GraphQL calls on load', () => {
    // loadSettings calls Promise.all with 3 queries; re-renders may trigger additional calls
    expect(mockExecute.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  // --- Loading and error states ---

  test('should show loading spinner initially', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-settings-general-page') as OgsSettingsGeneralPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should show error message on load failure', async () => {
    mockExecute.mockRejectedValue(new Error('Network error'));

    element.remove();
    element = document.createElement('ogs-settings-general-page') as OgsSettingsGeneralPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const errorCallout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(errorCallout).toBeTruthy();
    expect(errorCallout?.textContent).toContain('Network error');
  });

  test('should show message when no available games', async () => {
    let callIndex = 0;
    mockExecute.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return Promise.resolve({
          data: { getStoreSettings: { companyName: 'Test', ein: '12-345' } },
        });
      }
      if (callIndex === 2) return Promise.resolve({ data: { getAvailableGames: [] } });
      if (callIndex === 3) return Promise.resolve({ data: { getSupportedGames: [] } });
      return Promise.resolve({ data: {} });
    });

    element.remove();
    element = document.createElement('ogs-settings-general-page') as OgsSettingsGeneralPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const picker = element.shadowRoot!.querySelector('ogs-games-picker');
    const checkboxes = picker!.shadowRoot!.querySelectorAll('wa-checkbox');
    expect(checkboxes.length).toBe(0);

    // Should show the "no game categories" message inside the picker
    expect(picker!.shadowRoot!.textContent).toContain('No game categories available');
  });
});
