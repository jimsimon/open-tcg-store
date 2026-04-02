import { signal } from '@lit-labs/signals';
import Cookies from 'js-cookie';

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
}

/**
 * Reactive signal holding the list of stores available to the current user.
 * For authenticated users: stores they're a member of.
 * For anonymous users: all stores (public list).
 */
export const storeList = signal<StoreInfo[]>([]);

/**
 * Reactive signal holding the currently active store ID.
 * For authenticated users: from session's activeOrganizationId.
 * For anonymous users: from the ogs-selected-store cookie.
 */
export const activeStoreId = signal<string | null>(null);

const STORE_COOKIE = 'ogs-selected-store';

/**
 * Initialize the active store ID from the cookie (for anonymous users)
 * or from a server-provided value.
 */
export function initActiveStoreFromCookie() {
  const stored = Cookies.get(STORE_COOKIE);
  if (stored) {
    activeStoreId.set(stored);
  }
}

/**
 * Set the active store. For anonymous users, persists to cookie.
 * For authenticated users, the caller should also call
 * authClient.organization.setActive() to update the session.
 */
export function setActiveStoreCookie(storeId: string) {
  Cookies.set(STORE_COOKIE, storeId, { expires: 365, sameSite: 'lax' });
  activeStoreId.set(storeId);
}

/**
 * Get the current active store ID — either from the signal
 * (which may have been set from session or cookie).
 */
export function getActiveStoreId(): string | null {
  return activeStoreId.get();
}
