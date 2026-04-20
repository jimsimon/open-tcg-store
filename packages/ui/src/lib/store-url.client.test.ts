import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { mockActiveStoreId } = vi.hoisted(() => ({
  mockActiveStoreId: { get: vi.fn().mockReturnValue(null), set: vi.fn() },
}));

vi.mock('./store-context', () => ({
  activeStoreId: mockActiveStoreId,
  storeList: { get: vi.fn().mockReturnValue([]) },
  initActiveStoreFromCookie: vi.fn(),
  setActiveStoreCookie: vi.fn(),
}));

// Import after mocks are set up
import { getStoreIdFromUrl, storeUrl } from './store-url';

describe('store-url', () => {
  let originalPathname: string;

  beforeEach(() => {
    originalPathname = window.location.pathname;
    mockActiveStoreId.get.mockReturnValue(null);
  });

  afterEach(() => {
    // Restore original pathname
    window.history.replaceState(null, '', originalPathname);
    vi.clearAllMocks();
  });

  // --- getStoreIdFromUrl ---

  describe('getStoreIdFromUrl', () => {
    test('should extract store ID from a store-scoped URL', () => {
      window.history.replaceState(null, '', '/stores/abc-123/events');
      expect(getStoreIdFromUrl()).toBe('abc-123');
    });

    test('should extract store ID from a deeply nested store-scoped URL', () => {
      window.history.replaceState(null, '', '/stores/my-store/inventory/singles/42');
      expect(getStoreIdFromUrl()).toBe('my-store');
    });

    test('should return null for a non-store-scoped URL', () => {
      window.history.replaceState(null, '', '/settings/general');
      expect(getStoreIdFromUrl()).toBe(null);
    });

    test('should return null for the root URL', () => {
      window.history.replaceState(null, '', '/');
      expect(getStoreIdFromUrl()).toBe(null);
    });

    test('should return null for /stores without a store ID segment', () => {
      window.history.replaceState(null, '', '/stores');
      expect(getStoreIdFromUrl()).toBe(null);
    });

    test('should cache result for the same pathname', () => {
      window.history.replaceState(null, '', '/stores/cached-id/events');
      const first = getStoreIdFromUrl();
      const second = getStoreIdFromUrl();
      expect(first).toBe('cached-id');
      expect(second).toBe('cached-id');
    });

    test('should invalidate cache when pathname changes', () => {
      window.history.replaceState(null, '', '/stores/first-id/events');
      expect(getStoreIdFromUrl()).toBe('first-id');

      window.history.replaceState(null, '', '/stores/second-id/products');
      expect(getStoreIdFromUrl()).toBe('second-id');
    });
  });

  // --- storeUrl ---

  describe('storeUrl', () => {
    test('should build store URL from the current URL store ID', () => {
      window.history.replaceState(null, '', '/stores/url-store/events');
      expect(storeUrl('/products/singles')).toBe('/stores/url-store/products/singles');
    });

    test('should fall back to activeStoreId signal when URL has no store ID', () => {
      window.history.replaceState(null, '', '/settings/general');
      mockActiveStoreId.get.mockReturnValue('signal-store');
      expect(storeUrl('/events')).toBe('/stores/signal-store/events');
    });

    test('should prefer URL store ID over activeStoreId signal', () => {
      window.history.replaceState(null, '', '/stores/url-store/events');
      mockActiveStoreId.get.mockReturnValue('signal-store');
      expect(storeUrl('/products')).toBe('/stores/url-store/products');
    });

    test('should return raw path with console warning when no store context is available', () => {
      window.history.replaceState(null, '', '/settings/general');
      mockActiveStoreId.get.mockReturnValue(null);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(storeUrl('/events')).toBe('/events');
      expect(warnSpy).toHaveBeenCalledWith('storeUrl called without a store context:', '/events');

      warnSpy.mockRestore();
    });

    test('should handle paths with dynamic segments', () => {
      window.history.replaceState(null, '', '/stores/my-store/events');
      expect(storeUrl('/events/42')).toBe('/stores/my-store/events/42');
      expect(storeUrl('/lots/new')).toBe('/stores/my-store/lots/new');
      expect(storeUrl('/inventory/singles/99')).toBe('/stores/my-store/inventory/singles/99');
    });
  });
});
