import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the GraphQL execute function
vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getIntegrationSettings: {
        stripe: { enabled: true, hasApiKey: true },
        shopify: { enabled: false, hasApiKey: false, shopDomain: null },
        quickbooks: { enabled: false, hasClientId: false, hasClientSecret: false },
      },
    },
  }),
}));

import './settings-integrations.client.ts';
import { OgsSettingsIntegrationsPage } from './settings-integrations.client.ts';
import { execute } from '../../lib/graphql.ts';

const mockExecute = execute as ReturnType<typeof vi.fn>;

// --- Tests ---

describe('ogs-settings-integrations-page', () => {
  let element: OgsSettingsIntegrationsPage;

  beforeEach(async () => {
    element = document.createElement('ogs-settings-integrations-page') as OgsSettingsIntegrationsPage;
    element.userRole = 'admin';
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  test('should render the component', () => {
    expect(element).toBeInstanceOf(OgsSettingsIntegrationsPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header', () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Integrations');
  });

  test('should display the page description', () => {
    const desc = element.shadowRoot!.querySelector('.page-header p');
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toContain('Connect third-party services');
  });

  test('should display three integration cards', () => {
    const cards = element.shadowRoot!.querySelectorAll('wa-card[appearance="outline"]');
    expect(cards.length).toBe(3);
  });

  test('should display Stripe integration card', () => {
    const titles = element.shadowRoot!.querySelectorAll('.integration-title-text h3');
    const titleTexts = Array.from(titles).map((t) => t.textContent?.trim());
    expect(titleTexts).toContain('Stripe');
  });

  test('should display Shopify integration card', () => {
    const titles = element.shadowRoot!.querySelectorAll('.integration-title-text h3');
    const titleTexts = Array.from(titles).map((t) => t.textContent?.trim());
    expect(titleTexts).toContain('Shopify');
  });

  test('should display QuickBooks integration card', () => {
    const titles = element.shadowRoot!.querySelectorAll('.integration-title-text h3');
    const titleTexts = Array.from(titles).map((t) => t.textContent?.trim());
    expect(titleTexts).toContain('QuickBooks');
  });

  test('should display enable/disable switches for each integration', () => {
    const switches = element.shadowRoot!.querySelectorAll('wa-switch');
    expect(switches.length).toBe(3);
  });

  test('should display Stripe API key input', () => {
    const apiKeyInput = element.shadowRoot!.querySelector('wa-input[label="API Key"][type="password"]');
    expect(apiKeyInput).toBeTruthy();
  });

  test('should display Shopify shop domain input', () => {
    const domainInput = element.shadowRoot!.querySelector('wa-input[label="Shop Domain"]');
    expect(domainInput).toBeTruthy();
  });

  test('should display QuickBooks Client ID input', () => {
    const clientIdInput = element.shadowRoot!.querySelector('wa-input[label="Client ID"]');
    expect(clientIdInput).toBeTruthy();
  });

  test('should display QuickBooks Client Secret input', () => {
    const clientSecretInput = element.shadowRoot!.querySelector('wa-input[label="Client Secret"]');
    expect(clientSecretInput).toBeTruthy();
  });

  test('should show key status indicators', () => {
    const keyStatuses = element.shadowRoot!.querySelectorAll('.key-status');
    expect(keyStatuses.length).toBeGreaterThan(0);
  });

  test('should show configured status for Stripe API key', () => {
    const configuredStatuses = element.shadowRoot!.querySelectorAll('.key-status.configured');
    expect(configuredStatuses.length).toBeGreaterThan(0);
    const stripeStatus = Array.from(configuredStatuses).find((s) => s.textContent?.includes('API key configured'));
    expect(stripeStatus).toBeTruthy();
  });

  test('should display save buttons for each integration', () => {
    const saveButtons = element.shadowRoot!.querySelectorAll('.integration-save wa-button');
    expect(saveButtons.length).toBe(3);

    const buttonTexts = Array.from(saveButtons).map((b) => b.textContent?.trim());
    expect(buttonTexts).toContain('Save Stripe Settings');
    expect(buttonTexts).toContain('Save Shopify Settings');
    expect(buttonTexts).toContain('Save QuickBooks Settings');
  });

  test('should show loading spinner initially', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement('ogs-settings-integrations-page') as OgsSettingsIntegrationsPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should show error message on load failure', async () => {
    mockExecute.mockRejectedValue(new Error('Failed to load'));

    element.remove();
    element = document.createElement('ogs-settings-integrations-page') as OgsSettingsIntegrationsPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const errorCallout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(errorCallout).toBeTruthy();
    expect(errorCallout?.textContent).toContain('Failed to load');
  });
});
