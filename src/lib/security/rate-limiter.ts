// src/lib/security/rate-limiter.ts
/**
 * In-Memory Sliding-Window Rate Limiter for Serverless / Next.js Route Handlers.
 * Provides protection against brute-force and endpoint spam.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const buckets = new Map<string, number[]>();

// Cleanup stale buckets periodically
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of buckets.entries()) {
    const valid = timestamps.filter((t) => now - t < 10 * 60 * 1000);
    if (valid.length === 0) {
      buckets.delete(key);
    } else {
      buckets.set(key, valid);
    }
  }
}

/**
 * Checks if a request identified by `key` (e.g., `${prefix}:${clientIp}`) is within rate limits.
 * Returns `true` if allowed, `false` if rate limit exceeded.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60 * 1000 },
): { allowed: boolean; remaining: number; resetMs: number } {
  cleanup();

  const now = Date.now();
  const timestamps = buckets.get(key) || [];
  const windowStart = now - config.windowMs;

  const active = timestamps.filter((t) => t > windowStart);

  if (active.length >= config.maxRequests) {
    const oldest = active[0];
    const resetMs = oldest + config.windowMs - now;
    return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
  }

  active.push(now);
  buckets.set(key, active);

  return {
    allowed: true,
    remaining: config.maxRequests - active.length,
    resetMs: config.windowMs,
  };
}

/**
 * Extracts a client IP from Next.js request headers.
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return 'anonymous-client';
}
