import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import './settings-autoprice.client.ts';
import { OgsSettingsAutopricePage } from './settings-autoprice.client.ts';

// --- Tests ---

describe('ogs-settings-autoprice-page', () => {
  let element: OgsSettingsAutopricePage;

  beforeEach(async () => {
    element = document.createElement('ogs-settings-autoprice-page') as OgsSettingsAutopricePage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  test('should render the component', () => {
    expect(element).toBeInstanceOf(OgsSettingsAutopricePage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should display the page header', () => {
    const header = element.shadowRoot!.querySelector('.page-header h2');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Autoprice');
  });

  test('should display the page description', () => {
    const desc = element.shadowRoot!.querySelector('.page-header p');
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toContain('Automatically price your inventory');
  });

  test('should display the coming soon empty state', () => {
    const emptyState = element.shadowRoot!.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('Coming Soon');
  });

  test('should display feature list items', () => {
    const featureItems = element.shadowRoot!.querySelectorAll('.feature-item');
    expect(featureItems.length).toBe(4);

    const featureTexts = Array.from(featureItems).map((f) => f.textContent?.trim());
    expect(featureTexts).toContain('Market-based pricing');
    expect(featureTexts).toContain('Custom margin rules');
    expect(featureTexts).toContain('Scheduled repricing');
    expect(featureTexts).toContain('Price floor protection');
  });

  test('should display the empty state description', () => {
    const emptyState = element.shadowRoot!.querySelector('.empty-state');
    expect(emptyState?.textContent).toContain('automatically set prices');
    expect(emptyState?.textContent).toContain('market data');
  });

  test('should accept isAnonymous property', () => {
    element.isAnonymous = true;
    expect(element.isAnonymous).toBe(true);
  });

  test('should accept userName property', () => {
    element.userName = 'Test User';
    expect(element.userName).toBe('Test User');
  });
});
