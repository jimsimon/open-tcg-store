/**
 * Framework-agnostic in-memory rate limit store.
 * Tracks request counts per key with automatic expiry and DDoS-safe size caps.
 * Not shared across processes — suitable for single-instance deployments.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitStoreOptions {
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

    // Periodically clean up expired entries to prevent memory leaks
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
      // Guard against unbounded Map growth from DDoS with many unique keys
      if (this.store.size >= this.maxStoreSize) {
        // Evict expired entries first
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
