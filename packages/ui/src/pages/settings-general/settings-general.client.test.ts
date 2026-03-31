import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getStoreSettings: {
        storeName: 'Test TCG Store',
        street1: '123 Main St',
        street2: 'Suite 100',
        city: 'Detroit',
        state: 'MI',
        zip: '48226',
        ein: '12-3456789',
        salesTaxRate: 0.06,
      },
    },
  }),
}));

import './settings-general.client.ts';
import { OgsSettingsGeneralPage } from './settings-general.client.ts';
import { execute } from '../../lib/graphql.ts';

const mockExecute = execute as ReturnType<typeof vi.fn>;

// --- Tests ---

describe('ogs-settings-general-page', () => {
  let element: OgsSettingsGeneralPage;

  beforeEach(async () => {
    element = document.createElement('ogs-settings-general-page') as OgsSettingsGeneralPage;
    element.userRole = 'admin';
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
    expect(desc?.textContent).toContain('Configure your store information');
  });

  test('should load and display store settings', () => {
    expect(mockExecute).toHaveBeenCalled();

    const storeNameInput = element.shadowRoot!.querySelector('wa-input[label="Store Name"]');
    expect(storeNameInput).toBeTruthy();
  });

  test('should display Store Information section', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header h3');
    const sectionTexts = Array.from(sections).map((s) => s.textContent?.trim());
    expect(sectionTexts).toContain('Store Information');
  });

  test('should display Store Address section', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header h3');
    const sectionTexts = Array.from(sections).map((s) => s.textContent?.trim());
    expect(sectionTexts).toContain('Store Address');
  });

  test('should display Sales Tax section', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header h3');
    const sectionTexts = Array.from(sections).map((s) => s.textContent?.trim());
    expect(sectionTexts).toContain('Sales Tax');
  });

  test('should display EIN input field', () => {
    const einInput = element.shadowRoot!.querySelector('wa-input[label="EIN (Employer Identification Number)"]');
    expect(einInput).toBeTruthy();
  });

  test('should display address fields', () => {
    const street1 = element.shadowRoot!.querySelector('wa-input[label="Street Address"]');
    const street2 = element.shadowRoot!.querySelector('wa-input[label="Street Address 2"]');
    const city = element.shadowRoot!.querySelector('wa-input[label="City"]');
    const state = element.shadowRoot!.querySelector('wa-select[label="State"]');
    const zip = element.shadowRoot!.querySelector('wa-input[label="ZIP Code"]');

    expect(street1).toBeTruthy();
    expect(street2).toBeTruthy();
    expect(city).toBeTruthy();
    expect(state).toBeTruthy();
    expect(zip).toBeTruthy();
  });

  test('should display sales tax rate as readonly', () => {
    const taxInput = element.shadowRoot!.querySelector('wa-input[label="Sales Tax Rate"]');
    expect(taxInput).toBeTruthy();
    expect(taxInput?.hasAttribute('readonly')).toBe(true);
  });

  test('should display tax info message', () => {
    const taxInfo = element.shadowRoot!.querySelector('.tax-info');
    expect(taxInfo).toBeTruthy();
    expect(taxInfo?.textContent).toContain('auto-populated based on your state');
  });

  test('should display Save Settings button', () => {
    const saveBtn = element.shadowRoot!.querySelector('.save-bar wa-button[variant="brand"]');
    expect(saveBtn).toBeTruthy();
    expect(saveBtn?.textContent).toContain('Save Settings');
  });

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

  test('should display state dropdown with US states', () => {
    const stateSelect = element.shadowRoot!.querySelector('wa-select[label="State"]');
    expect(stateSelect).toBeTruthy();

    const options = stateSelect!.querySelectorAll('wa-option');
    // 50 states + DC + "Select state" placeholder = 52
    expect(options.length).toBe(52);
  });
});
