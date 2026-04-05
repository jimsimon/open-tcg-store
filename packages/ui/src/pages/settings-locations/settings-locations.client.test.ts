import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../lib/graphql', () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getEmployeeStoreLocations: [
        {
          id: 'loc-1',
          name: 'Main Store',
          slug: 'main-store',
          street1: '123 Main St',
          street2: null,
          city: 'Novi',
          state: 'MI',
          zip: '48165',
          phone: null,
          hours: [],
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: 'loc-2',
          name: 'Second Store',
          slug: 'second-store',
          street1: '456 Oak Ave',
          street2: null,
          city: 'Detroit',
          state: 'MI',
          zip: '48201',
          phone: null,
          hours: [],
          createdAt: '2025-01-02T00:00:00.000Z',
        },
      ],
    },
  }),
}));

import './settings-locations.client.ts';
import { SettingsLocationsPage } from './settings-locations.client.ts';

const fakeLocation = {
  id: 'loc-1',
  name: 'Main Store',
  slug: 'main-store',
  street1: '123 Main St',
  street2: null,
  city: 'Novi',
  state: 'MI',
  zip: '48165',
  phone: null,
  hours: [],
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('ogs-settings-locations-page', () => {
  let element: SettingsLocationsPage;

  beforeEach(async () => {
    element = document.createElement('ogs-settings-locations-page') as SettingsLocationsPage;
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
    expect(element).toBeInstanceOf(SettingsLocationsPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test('add dialog footer buttons are present when dialog opens', async () => {
    element.showAddDialog = true;
    await element.updateComplete;

    const footerButtons = element.shadowRoot!.querySelectorAll('wa-dialog wa-button[slot="footer"]');
    expect(footerButtons.length).toBeGreaterThanOrEqual(2);
  });

  test('edit dialog footer buttons are present when dialog opens', async () => {
    element.openEditDialog(fakeLocation);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const footerButtons = element.shadowRoot!.querySelectorAll('wa-dialog wa-button[slot="footer"]');
    expect(footerButtons.length).toBeGreaterThanOrEqual(2);
  });

  test('remove dialog footer buttons are present when dialog opens', async () => {
    element.openRemoveDialog(fakeLocation);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const footerButtons = element.shadowRoot!.querySelectorAll('wa-dialog wa-button[slot="footer"]');
    expect(footerButtons.length).toBeGreaterThanOrEqual(2);
  });
});
