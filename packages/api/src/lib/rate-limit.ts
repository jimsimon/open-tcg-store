import type { Middleware } from 'koa';
import { RateLimitStore, type RateLimitStoreOptions } from '@open-tcgs/shared/rate-limit-store';

// Re-export the shared RateLimitStore for consumers that import from this module
export { RateLimitStore, type RateLimitStoreOptions };

// ---------------------------------------------------------------------------
// Koa middleware wrapper
// ---------------------------------------------------------------------------

interface RateLimitMiddlewareOptions extends RateLimitStoreOptions {
  /** Key extractor — defaults to IP address */
  keyFn?: (ctx: { ip: string; path: string }) => string;
  /** Optional message for rate limit responses */
  message?: string;
}

/** Koa rate-limiting middleware backed by a {@link RateLimitStore}. */
export function rateLimit(options: RateLimitMiddlewareOptions): Middleware {
  const { message = 'Too many requests, please try again later.' } = options;
  const keyFn = options.keyFn ?? ((ctx) => ctx.ip);
  const store = new RateLimitStore(options);

  return async (ctx, next) => {
    const key = keyFn(ctx);
    const result = store.check(key);

    if (!result.allowed) {
      ctx.status = 429;
      ctx.set('Retry-After', String(result.retryAfterSecs));
      ctx.body = { error: message };
      return;
    }

    // Set standard rate limit headers
    ctx.set('RateLimit-Limit', String(options.max));
    ctx.set('RateLimit-Remaining', String(Math.max(0, options.max - result.count)));
    ctx.set('RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    await next();
  };
}
