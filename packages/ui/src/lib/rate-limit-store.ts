/**
 * Framework-agnostic in-memory rate limit store.
 * Mirrors the RateLimitStore in packages/api/src/lib/rate-limit.ts — if
 * a shared package is introduced later, consolidate there.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStoreOptions {
  /** Maximum requests allowed within the window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of tracked keys before rejecting new clients (DDoS protection) */
  maxStoreSize?: number;
}

export class RateLimitStore {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly max: number;
  private readonly windowMs: number;
  private readonly maxStoreSize: number;

  constructor(options: RateLimitStoreOptions) {
    this.max = options.max;
    this.windowMs = options.windowMs;
    this.maxStoreSize = options.maxStoreSize ?? 100_000;

    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now >= entry.resetAt) this.store.delete(key);
      }
    }, this.windowMs);
    if (cleanupInterval.unref) cleanupInterval.unref();
  }

  /**
   * Check and increment the counter for a key.
   * Returns `{ allowed: true, count, resetAt }` if under the limit,
   * or `{ allowed: false, retryAfterSecs }` if the request should be rejected.
   */
  check(key: string): { allowed: true; count: number; resetAt: number } | { allowed: false; retryAfterSecs: number } {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      if (this.store.size >= this.maxStoreSize) {
        for (const [k, e] of this.store) {
          if (now >= e.resetAt) this.store.delete(k);
        }
        if (this.store.size >= this.maxStoreSize) {
          console.warn(`Rate limit store at max capacity (${this.maxStoreSize}), rejecting new clients`);
          return { allowed: false, retryAfterSecs: Math.ceil(this.windowMs / 1000) };
        }
      }
      entry = { count: 0, resetAt: now + this.windowMs };
      this.store.set(key, entry);
    }

    entry.count++;

    if (entry.count > this.max) {
      return { allowed: false, retryAfterSecs: Math.ceil((entry.resetAt - now) / 1000) };
    }

    return { allowed: true, count: entry.count, resetAt: entry.resetAt };
  }
}
