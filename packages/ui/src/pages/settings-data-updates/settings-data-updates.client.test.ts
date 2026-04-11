import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../lib/graphql.ts', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getDataUpdateStatus: {
        currentVersion: '2026-04-05T12:00:00.000Z',
        latestVersion: null,
        updateAvailable: false,
        isUpdating: false,
      },
    },
  }),
}));

import './settings-data-updates.client.ts';
import { OgsSettingsDataUpdatesPage } from './settings-data-updates.client.ts';
import { execute } from '../../lib/graphql.ts';

const mockExecute = execute as ReturnType<typeof vi.fn>;

function setupDefaultMock(overrides: Record<string, unknown> = {}) {
  mockExecute.mockResolvedValue({
    data: {
      getDataUpdateStatus: {
        currentVersion: '2026-04-05T12:00:00.000Z',
        latestVersion: null,
        updateAvailable: false,
        isUpdating: false,
        ...overrides,
      },
    },
  });
}

describe('ogs-settings-data-updates-page', () => {
  let element: OgsSettingsDataUpdatesPage;

  beforeEach(async () => {
    setupDefaultMock();
    element = document.createElement('ogs-settings-data-updates-page') as OgsSettingsDataUpdatesPage;
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
    expect(element).toBeInstanceOf(OgsSettingsDataUpdatesPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header', () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Card Data Updates');
  });

  test('should display the page description', () => {
    const desc = element.shadowRoot!.querySelector('.page-header p');
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toContain('Manage your TCG product database');
  });

  test('should display Database Status section', () => {
    const sections = element.shadowRoot!.querySelectorAll('.section-header h3');
    const sectionTexts = Array.from(sections).map((s) => s.textContent?.trim());
    expect(sectionTexts).toContain('Database Status');
  });

  test('should display formatted creation date', () => {
    const statusValues = element.shadowRoot!.querySelectorAll('.status-value');
    const texts = Array.from(statusValues).map((el) => el.textContent?.trim());
    // ISO timestamp "2026-04-05T12:00:00.000Z" should be formatted as a locale date
    // In test environment (likely en-US), this should contain "Apr" and "2026"
    expect(texts.some((t) => t?.includes('2026'))).toBe(true);
  });

  test('should display up-to-date callout when no update available', () => {
    const successCallout = element.shadowRoot!.querySelector('wa-callout[variant="success"]');
    expect(successCallout).toBeTruthy();
    expect(successCallout?.textContent).toContain('up to date');
  });

  test('should display Update Now button', () => {
    const updateBtn = element.shadowRoot!.querySelector('.action-bar wa-button[variant="brand"]');
    expect(updateBtn).toBeTruthy();
    expect(updateBtn?.textContent).toContain('Update Now');
  });

  test('should disable Update Now button when no update available', () => {
    const updateBtn = element.shadowRoot!.querySelector('.action-bar wa-button[variant="brand"]');
    expect(updateBtn).toBeTruthy();
    expect(updateBtn?.hasAttribute('disabled')).toBe(true);
  });

  test('should not show Update Available column when up to date', () => {
    const statusItems = element.shadowRoot!.querySelectorAll('.status-item');
    // Only the "Last Updated" item should be present
    expect(statusItems.length).toBe(1);
    const label = statusItems[0].querySelector('.status-label');
    expect(label?.textContent).toContain('Last Updated');
  });

  test('should show update available callout when update exists', async () => {
    setupDefaultMock({
      latestVersion: 'tcg-data-abc123def456abc123def456abc123def456abc123def456abc123def456ab',
      updateAvailable: true,
    });
    element.remove();
    element = document.createElement('ogs-settings-data-updates-page') as OgsSettingsDataUpdatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const warningCallout = element.shadowRoot!.querySelector('wa-callout[variant="warning"]');
    expect(warningCallout).toBeTruthy();
    expect(warningCallout?.textContent).toContain('new card data update is available');
  });

  test('should show Update Available column when update exists', async () => {
    setupDefaultMock({
      latestVersion: 'tcg-data-abc123def456abc123def456abc123def456abc123def456abc123def456ab',
      updateAvailable: true,
    });
    element.remove();
    element = document.createElement('ogs-settings-data-updates-page') as OgsSettingsDataUpdatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const statusItems = element.shadowRoot!.querySelectorAll('.status-item');
    expect(statusItems.length).toBe(2);
    const labels = Array.from(statusItems).map((el) => el.querySelector('.status-label')?.textContent?.trim());
    expect(labels).toContain('Last Updated');
    expect(labels).toContain('Update Available');
  });

  test('should enable Update Now button when update available', async () => {
    setupDefaultMock({
      latestVersion: 'tcg-data-abc123def456abc123def456abc123def456abc123def456abc123def456ab',
      updateAvailable: true,
    });
    element.remove();
    element = document.createElement('ogs-settings-data-updates-page') as OgsSettingsDataUpdatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const updateBtn = element.shadowRoot!.querySelector('.action-bar wa-button[variant="brand"]');
    expect(updateBtn).toBeTruthy();
    expect(updateBtn?.hasAttribute('disabled')).toBe(false);
  });

  test('should make GraphQL call on load', () => {
    expect(mockExecute).toHaveBeenCalled();
  });

  test('should show loading spinner initially', async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));
    element.remove();
    element = document.createElement('ogs-settings-data-updates-page') as OgsSettingsDataUpdatesPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));
    const spinner = element.shadowRoot!.querySelector('wa-spinner');
    expect(spinner).toBeTruthy();
  });

  test('should show error message on load failure', async () => {
    mockExecute.mockRejectedValue(new Error('Network error'));
    element.remove();
    element = document.createElement('ogs-settings-data-updates-page') as OgsSettingsDataUpdatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const errorCallout = element.shadowRoot!.querySelector('wa-callout[variant="danger"]');
    expect(errorCallout).toBeTruthy();
    expect(errorCallout?.textContent).toContain('Network error');
  });

  test('should format ISO timestamp as readable date', () => {
    const statusValues = element.shadowRoot!.querySelectorAll('.status-value');
    const texts = Array.from(statusValues).map((el) => el.textContent?.trim());
    // ISO timestamp should be formatted via toLocaleDateString, containing year 2026
    expect(texts.some((t) => t?.includes('2026'))).toBe(true);
  });

  test('should format tcg-data hash tag as truncated hash', async () => {
    setupDefaultMock({
      latestVersion: 'tcg-data-abc123def456abc123def456abc123def456abc123def456abc123def456ab',
      updateAvailable: true,
    });
    element.remove();
    element = document.createElement('ogs-settings-data-updates-page') as OgsSettingsDataUpdatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const statusValues = element.shadowRoot!.querySelectorAll('.status-value');
    const texts = Array.from(statusValues).map((el) => el.textContent?.trim());
    // Should show truncated hash (first 12 chars)
    expect(texts).toContain('abc123def456');
  });

  test('should still format legacy version tags', async () => {
    setupDefaultMock({
      currentVersion: 'initial-db-20260405',
      latestVersion: 'initial-db-20260406',
      updateAvailable: true,
    });
    element.remove();
    element = document.createElement('ogs-settings-data-updates-page') as OgsSettingsDataUpdatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const statusValues = element.shadowRoot!.querySelectorAll('.status-value');
    const texts = Array.from(statusValues).map((el) => el.textContent?.trim());
    // Legacy tag "initial-db-20260405" should be formatted as "2026-04-05"
    expect(texts).toContain('2026-04-05');
    expect(texts).toContain('2026-04-06');
  });

  test('should display Unknown for null version', async () => {
    setupDefaultMock({
      currentVersion: null,
      latestVersion: null,
    });
    element.remove();
    element = document.createElement('ogs-settings-data-updates-page') as OgsSettingsDataUpdatesPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const statusValues = element.shadowRoot!.querySelectorAll('.status-value');
    const texts = Array.from(statusValues).map((el) => el.textContent?.trim());
    // Only "Last Updated" column visible (latestVersion is null and updateAvailable is false)
    expect(texts.filter((t) => t === 'Unknown').length).toBe(1);
  });
});
