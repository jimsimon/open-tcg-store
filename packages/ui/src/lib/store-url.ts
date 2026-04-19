import { activeStoreId } from './store-context';

/**
 * Cached store ID extracted from the current URL pathname.
 * Invalidated when the pathname changes (e.g., after navigation).
 */
let cachedUrlStoreId: string | null = null;
let cachedPathname: string | null = null;

/**
 * Extract the store ID from the current URL pathname.
 * Returns the store ID if the URL matches `/stores/:storeId/...`, otherwise null.
 * The result is cached per-pathname to avoid re-parsing the regex on every call
 * during Lit render cycles (~15+ calls per render).
 */
export function getStoreIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;
  if (pathname === cachedPathname) return cachedUrlStoreId;

  const match = pathname.match(/^\/stores\/([^/]+)/);
  cachedUrlStoreId = match?.[1] ?? null;
  cachedPathname = pathname;
  return cachedUrlStoreId;
}

/**
 * Build a store-scoped URL path.
 *
 * Resolves the store ID from (in priority order):
 * 1. The current URL (for components already on a store-scoped page)
 * 2. The `activeStoreId` signal (for components on global pages, e.g. settings nav)
 *
 * @param path — The path segment after the store prefix, e.g. `/events` or `/lots/new`.
 *               Must start with `/`.
 * @returns The full store-scoped path, e.g. `/stores/abc123/events`.
 */
export function storeUrl(path: string): string {
  const storeId = getStoreIdFromUrl() || activeStoreId.get();
  if (!storeId) {
    console.warn('storeUrl called without a store context:', path);
    return path;
  }
  return `/stores/${storeId}${path}`;
}
