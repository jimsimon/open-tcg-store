/**
 * Re-export from the shared package. This module previously contained a
 * duplicated implementation — it now delegates to @open-tcgs/shared.
 */
export { RateLimitStore, type RateLimitStoreOptions } from '@open-tcgs/shared/rate-limit-store';
