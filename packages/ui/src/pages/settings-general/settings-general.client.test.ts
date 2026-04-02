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
});
