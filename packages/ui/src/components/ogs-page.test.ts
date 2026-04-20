import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { screen } from 'shadow-dom-testing-library';
import './ogs-page.ts';
import { OgsPage } from './ogs-page.ts';

// Mock the auth client
vi.mock('../auth-client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
  },
}));

const mockExecute = vi.fn().mockResolvedValue({
  data: { getShoppingCart: { items: [] } },
});

// Mock the graphql execute function to prevent network calls
vi.mock('../lib/graphql', () => ({
  execute: (...args: unknown[]) => mockExecute(...args),
}));

const TEST_STORE_ID = 'test-store-id';

describe('ogs-page', () => {
  let element: OgsPage;

  beforeEach(async () => {
    element = document.createElement('ogs-page') as OgsPage;
    // Set activeOrganizationId so storeUrl() can build valid store-scoped links
    element.activeOrganizationId = TEST_STORE_ID;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  test('renders page component with navigation and Browse link', async () => {
    element.canManageInventory = false;
    await element.updateComplete;

    const navContent = element.shadowRoot!.querySelector('.nav-content');
    expect(navContent).toBeTruthy();

    const browseLink = await screen.findByShadowText('Browse');
    expect(browseLink).toBeInTheDocument();
  });

  test('does not show Dashboard and Orders links for non-employee/admin users', async () => {
    element.canManageInventory = false;
    await element.updateComplete;

    const links = element.shadowRoot!.querySelectorAll('a.nav-link');
    const dashboardLink = Array.from(links).find((a) => a.textContent?.includes('Dashboard'));
    const ordersLink = Array.from(links).find((a) => a.textContent?.includes('Orders'));

    expect(dashboardLink).toBeFalsy();
    expect(ordersLink).toBeFalsy();
  });

  test('shows Dashboard and Orders links for employee role', async () => {
    element.canManageInventory = true;
    element.canViewDashboard = true;
    await element.updateComplete;

    const links = element.shadowRoot!.querySelectorAll('a.nav-link');
    const dashboardLink = Array.from(links).find((a) => a.textContent?.includes('Dashboard'));
    const ordersLink = Array.from(links).find((a) => a.textContent?.includes('Orders'));

    expect(dashboardLink).toBeTruthy();
    expect(ordersLink).toBeTruthy();
  });

  test('theme switcher is present', async () => {
    const themeButton = await screen.findByShadowRole('combobox', { name: /choose theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  describe('user menu - anonymous user', () => {
    beforeEach(async () => {
      // isAnonymous defaults to false, so we need to set it to true for anonymous tests
      element.isAnonymous = true;
      element.showUserMenu = true;
      await element.updateComplete;
    });

    test('avatar button renders inside a wa-dropdown', () => {
      const dropdown = element.shadowRoot!.querySelector('wa-dropdown');
      expect(dropdown).toBeTruthy();

      const avatarButton = dropdown!.querySelector('wa-button.avatar-button');
      expect(avatarButton).toBeTruthy();
    });

    test('dropdown shows "Sign In" option for anonymous users', () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));
      expect(signInItem).toBeTruthy();
    });

    test('dropdown does not show "Sign Out" option for anonymous users', () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signOutItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign Out'));
      expect(signOutItem).toBeFalsy();
    });

    test('clicking "Sign In" opens the auth dialog in sign-in mode', async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));

      signInItem!.click();
      await element.updateComplete;

      const authDialogEl = element.shadowRoot!.querySelector('ogs-auth-dialog')!;
      await authDialogEl.updateComplete;
      const dialog = authDialogEl.shadowRoot!.querySelector('wa-dialog');
      expect(dialog).toBeTruthy();
      expect(dialog!.hasAttribute('open')).toBe(true);
      expect(dialog!.getAttribute('label')).toBe('Sign In');
    });

    test('sign-in dialog shows email and password fields', async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));
      signInItem!.click();
      await element.updateComplete;

      const authDialogEl = element.shadowRoot!.querySelector('ogs-auth-dialog')!;
      await authDialogEl.updateComplete;
      const inputs = authDialogEl.shadowRoot!.querySelectorAll('wa-dialog wa-input');
      const labels = Array.from(inputs).map((input) => input.getAttribute('label'));

      expect(labels).toContain('Email');
      expect(labels).toContain('Password');
    });

    test('sign-in dialog does NOT show name or confirm password fields', async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));
      signInItem!.click();
      await element.updateComplete;

      const authDialogEl = element.shadowRoot!.querySelector('ogs-auth-dialog')!;
      await authDialogEl.updateComplete;
      const inputs = authDialogEl.shadowRoot!.querySelectorAll('wa-dialog wa-input');
      const labels = Array.from(inputs).map((input) => input.getAttribute('label'));

      expect(labels).not.toContain('Name');
      expect(labels).not.toContain('Confirm Password');
    });

    test('submit button says "Sign in" in sign-in mode', async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));
      signInItem!.click();
      await element.updateComplete;

      const authDialogEl = element.shadowRoot!.querySelector('ogs-auth-dialog')!;
      await authDialogEl.updateComplete;
      const footerButtons = authDialogEl.shadowRoot!.querySelectorAll('wa-dialog wa-button[slot="footer"]');
      const submitButton = Array.from(footerButtons).find((btn) => btn.getAttribute('variant') === 'brand');
      expect(submitButton?.textContent?.trim()).toBe('Sign in');
    });

    test('clicking "Sign up" link switches to sign-up mode', async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));
      signInItem!.click();
      await element.updateComplete;

      const authDialogEl = element.shadowRoot!.querySelector('ogs-auth-dialog')!;
      await authDialogEl.updateComplete;
      const toggleLink = authDialogEl.shadowRoot!.querySelector('.auth-toggle a');
      expect(toggleLink?.textContent?.trim()).toBe('Sign up');

      (toggleLink as HTMLElement).click();
      await authDialogEl.updateComplete;

      const dialog = authDialogEl.shadowRoot!.querySelector('wa-dialog');
      expect(dialog!.getAttribute('label')).toBe('Sign Up');
    });

    test('sign-up mode shows name, email, password, and confirm password fields', async () => {
      // Open dialog and switch to sign-up
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));
      signInItem!.click();
      await element.updateComplete;

      const authDialogEl = element.shadowRoot!.querySelector('ogs-auth-dialog')!;
      await authDialogEl.updateComplete;
      const toggleLink = authDialogEl.shadowRoot!.querySelector('.auth-toggle a');
      (toggleLink as HTMLElement).click();
      await authDialogEl.updateComplete;

      const inputs = authDialogEl.shadowRoot!.querySelectorAll('wa-dialog wa-input');
      const labels = Array.from(inputs).map((input) => input.getAttribute('label'));

      expect(labels).toContain('Name');
      expect(labels).toContain('Email');
      expect(labels).toContain('Password');
      expect(labels).toContain('Confirm Password');
    });

    test('submit button says "Sign up" in sign-up mode', async () => {
      // Open dialog and switch to sign-up
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));
      signInItem!.click();
      await element.updateComplete;

      const authDialogEl = element.shadowRoot!.querySelector('ogs-auth-dialog')!;
      await authDialogEl.updateComplete;
      const toggleLink = authDialogEl.shadowRoot!.querySelector('.auth-toggle a');
      (toggleLink as HTMLElement).click();
      await authDialogEl.updateComplete;

      const footerButtons = authDialogEl.shadowRoot!.querySelectorAll('wa-dialog wa-button[slot="footer"]');
      const submitButton = Array.from(footerButtons).find((btn) => btn.getAttribute('variant') === 'brand');
      expect(submitButton?.textContent?.trim()).toBe('Sign up');
    });

    test('clicking "Sign in" link in sign-up mode switches back to sign-in mode', async () => {
      // Open dialog and switch to sign-up
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));
      signInItem!.click();
      await element.updateComplete;

      const authDialogEl = element.shadowRoot!.querySelector('ogs-auth-dialog')!;
      await authDialogEl.updateComplete;
      let toggleLink = authDialogEl.shadowRoot!.querySelector('.auth-toggle a');
      (toggleLink as HTMLElement).click();
      await authDialogEl.updateComplete;

      // Now switch back to sign-in
      toggleLink = authDialogEl.shadowRoot!.querySelector('.auth-toggle a');
      expect(toggleLink?.textContent?.trim()).toBe('Sign in');

      (toggleLink as HTMLElement).click();
      await authDialogEl.updateComplete;

      const dialog = authDialogEl.shadowRoot!.querySelector('wa-dialog');
      expect(dialog!.getAttribute('label')).toBe('Sign In');
    });
  });

  describe('inventory navigation', () => {
    test('does not show inventory, dashboard, or orders links for non-employee/admin users', async () => {
      element.canManageInventory = false;
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll('a');
      const inventoryLinks = Array.from(links).filter(
        (a) => a.href.includes('/inventory/singles') || a.href.includes('/inventory/sealed'),
      );
      const dashboardLink = Array.from(links).find((a) =>
        a.getAttribute('href')?.includes(`/stores/${TEST_STORE_ID}/settings-dashboard`),
      );
      const ordersLink = Array.from(links).find((a) =>
        a.getAttribute('href')?.includes(`/stores/${TEST_STORE_ID}/orders`),
      );

      expect(inventoryLinks.length).toBe(0);
      expect(dashboardLink).toBeFalsy();
      expect(ordersLink).toBeFalsy();
    });

    test('shows inventory section with parent link and Singles/Sealed sub-links for employee role', async () => {
      element.canManageInventory = true;
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll('a');
      const inventoryParentLink = Array.from(links).find(
        (a) =>
          a.classList.contains('nav-link') && a.getAttribute('href') === `/stores/${TEST_STORE_ID}/inventory/singles`,
      );
      const inventorySinglesLink = Array.from(links).find(
        (a) =>
          a.classList.contains('nav-sub-link') &&
          a.getAttribute('href') === `/stores/${TEST_STORE_ID}/inventory/singles`,
      );
      const inventorySealedLink = Array.from(links).find(
        (a) =>
          a.classList.contains('nav-sub-link') &&
          a.getAttribute('href') === `/stores/${TEST_STORE_ID}/inventory/sealed`,
      );

      expect(inventoryParentLink).toBeTruthy();
      expect(inventoryParentLink!.textContent).toContain('Inventory');
      expect(inventorySinglesLink).toBeTruthy();
      expect(inventorySealedLink).toBeTruthy();
      expect(inventorySinglesLink!.textContent?.trim()).toBe('Singles');
      expect(inventorySealedLink!.textContent?.trim()).toBe('Sealed');
    });

    test('shows inventory section with Singles and Sealed links for admin role', async () => {
      element.canManageInventory = true;
      element.canAccessSettings = true;
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll('a.nav-sub-link');
      const inventorySinglesLink = Array.from(links).find(
        (a) => a.getAttribute('href') === `/stores/${TEST_STORE_ID}/inventory/singles`,
      );
      const inventorySealedLink = Array.from(links).find(
        (a) => a.getAttribute('href') === `/stores/${TEST_STORE_ID}/inventory/sealed`,
      );

      expect(inventorySinglesLink).toBeTruthy();
      expect(inventorySealedLink).toBeTruthy();
    });

    test('highlights Singles sub-link when activePage is inventory/singles', async () => {
      element.canManageInventory = true;
      element.activePage = 'inventory/singles';
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll('a.nav-sub-link');
      const singlesLink = Array.from(links).find(
        (a) => a.getAttribute('href') === `/stores/${TEST_STORE_ID}/inventory/singles`,
      );
      expect(singlesLink?.hasAttribute('current')).toBe(true);
    });

    test('highlights Sealed sub-link when activePage is inventory/sealed', async () => {
      element.canManageInventory = true;
      element.activePage = 'inventory/sealed';
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll('a.nav-sub-link');
      const sealedLink = Array.from(links).find(
        (a) => a.getAttribute('href') === `/stores/${TEST_STORE_ID}/inventory/sealed`,
      );
      expect(sealedLink?.hasAttribute('current')).toBe(true);
    });

    test('highlights Inventory parent link when activePage is inventory/singles', async () => {
      element.canManageInventory = true;
      element.activePage = 'inventory/singles';
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll('a.nav-link');
      const inventoryLink = Array.from(links).find((a) => a.textContent?.includes('Inventory'));
      expect(inventoryLink?.hasAttribute('current')).toBe(true);
    });
  });

  describe('fetchCart error handling', () => {
    test('renders without errors when fetchCart rejects', async () => {
      mockExecute.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const el = document.createElement('ogs-page') as OgsPage;
      document.body.appendChild(el);
      await el.updateComplete;

      // Component should still render successfully
      const navigation = el.shadowRoot!.querySelector('.nav-content');
      expect(navigation).toBeTruthy();

      el.remove();
    });

    test('does not update cartState when fetchCart rejects', async () => {
      mockExecute.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const el = document.createElement('ogs-page') as OgsPage;
      document.body.appendChild(el);
      await el.updateComplete;

      // Cart drawer component should be rendered
      const cartDrawer = el.shadowRoot!.querySelector('ogs-cart-drawer');
      expect(cartDrawer).toBeTruthy();
      await cartDrawer!.updateComplete;

      // Cart drawer's wa-drawer should exist in its shadow root
      const drawer = cartDrawer!.shadowRoot!.querySelector('wa-drawer');
      expect(drawer).toBeTruthy();

      // The empty cart message should be present inside the cart drawer
      const emptyMessage = cartDrawer!.shadowRoot!.querySelector('.cart-empty');
      expect(emptyMessage).toBeTruthy();

      el.remove();
    });
  });

  describe('user menu - authenticated user', () => {
    beforeEach(async () => {
      element.isAnonymous = false;
      element.userName = 'Test User';
      element.showUserMenu = true;
      await element.updateComplete;
    });

    test('dropdown shows user name', () => {
      const userLabel = element.shadowRoot!.querySelector('.dropdown-user-label');
      expect(userLabel).toBeTruthy();
      expect(userLabel!.textContent?.trim()).toBe('Test User');
    });

    test('dropdown shows "Sign Out" option', () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signOutItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign Out'));
      expect(signOutItem).toBeTruthy();
    });

    test('dropdown does not show "Sign In" option', () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll('wa-dropdown-item');
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes('Sign In'));
      expect(signInItem).toBeFalsy();
    });
  });
});
