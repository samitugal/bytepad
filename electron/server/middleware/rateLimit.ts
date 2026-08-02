import { Request, Response, NextFunction } from 'express';

// Basic in-memory sliding-window rate limiter, keyed by client IP.
// No external dependency required - suitable for a single-process local server.

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 60_000; // 1 minute window
  const max = options.max ?? 120; // 120 requests per window per IP

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
      });
      return;
    }

    next();
  };
}

// Periodically sweep expired buckets so memory doesn't grow unbounded.
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 5 * 60_000);
cleanupInterval.unref();

export default rateLimit;
