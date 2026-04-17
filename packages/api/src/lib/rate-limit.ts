import type { Middleware } from 'koa';

interface RateLimitOptions {
  /** Maximum requests allowed within the window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key extractor — defaults to IP address */
  keyFn?: (ctx: { ip: string; path: string }) => string;
  /** Optional message for rate limit responses */
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter middleware for Koa.
 * Not shared across processes — suitable for single-instance deployments.
 */
// Maximum number of keys in the rate limit store. If exceeded during a request,
// oldest entries are not individually evicted — the periodic cleanup handles that.
// This cap prevents unbounded memory growth under DDoS with many unique IPs.
const MAX_STORE_SIZE = 100_000;

export function rateLimit(options: RateLimitOptions): Middleware {
  const { max, windowMs, message = 'Too many requests, please try again later.' } = options;
  const keyFn = options.keyFn ?? ((ctx) => ctx.ip);
  const store = new Map<string, RateLimitEntry>();

  // Periodically clean up expired entries to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, windowMs);

  // Allow the timer to not keep the process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return async (ctx, next) => {
    const key = keyFn(ctx);
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now >= entry.resetAt) {
      // Guard against unbounded Map growth from DDoS with many unique keys
      if (store.size >= MAX_STORE_SIZE) {
        // Evict expired entries first
        for (const [k, e] of store) {
          if (now >= e.resetAt) store.delete(k);
        }
        // If still over limit, reject the request to protect memory
        if (store.size >= MAX_STORE_SIZE) {
          ctx.status = 429;
          ctx.set('Retry-After', String(Math.ceil(windowMs / 1000)));
          ctx.body = { error: message };
          return;
        }
      }
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Set standard rate limit headers
    ctx.set('RateLimit-Limit', String(max));
    ctx.set('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    ctx.set('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      ctx.status = 429;
      ctx.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      ctx.body = { error: message };
      return;
    }

    await next();
  };
}
