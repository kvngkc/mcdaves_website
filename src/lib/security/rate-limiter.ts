// src/lib/security/rate-limiter.ts
/**
 * Durable, serverless-safe rate limiting backed by Upstash Redis.
 *
 * The previous implementation used a module-level Map, which is ineffective on
 * serverless: each instance has its own memory, so limits are not shared and
 * the maps grow unbounded. This module uses @upstash/ratelimit (already a
 * dependency) and instantiates the limiter PER REQUEST — never as a
 * module-level singleton, which is incorrect on serverless.
 *
 * When Upstash is not configured (local dev), it falls back to a bounded
 * in-memory limiter so development is not blocked.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch (error) {
    console.warn('Failed to initialize Upstash Redis:', error);
    return null;
  }
}

/** Bounded in-memory fallback for local development only. */
const devBuckets = new Map<string, number[]>();
const DEV_MAX_KEYS = 10_000;

function devFallback(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  if (devBuckets.size > DEV_MAX_KEYS) devBuckets.clear();
  const timestamps = (devBuckets.get(key) || []).filter((t) => now - t < config.windowMs);
  if (timestamps.length >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, timestamps[0] + config.windowMs - now),
    };
  }
  timestamps.push(now);
  devBuckets.set(key, timestamps);
  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
    resetMs: config.windowMs,
  };
}

/**
 * Checks whether a request identified by `key` is within the limit.
 * The limiter is created per call (per request) — never cached at module scope.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60 * 1000 },
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    return devFallback(key, config);
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      config.maxRequests,
      `${Math.ceil(config.windowMs / 1000)} s`,
    ),
    analytics: false,
    prefix: 'mcdaves:ratelimit',
  });

  const { success, remaining, reset } = await limiter.limit(key);
  return {
    allowed: success,
    remaining,
    resetMs: Math.max(0, reset - Date.now()),
  };
}

/**
 * Per-account lockout in addition to per-IP limiting. Call with a stable
 * account identifier (e.g. `account:${userId}`) so a distributed attacker
 * cannot bypass the per-IP limit by rotating IPs.
 */
export async function checkAccountLockout(
  accountId: string,
  config: RateLimitConfig = { maxRequests: 5, windowMs: 15 * 60 * 1000 },
): Promise<RateLimitResult> {
  return checkRateLimit(`account:${accountId}`, config);
}

/**
 * Number of reverse proxies we operate in front of the app.
 *
 * The app sits behind exactly ONE trusted proxy (the platform edge), which
 * appends the real peer address as the LAST element of X-Forwarded-For.
 * Override only if you add another proxy hop of your own.
 */
const TRUSTED_PROXY_HOPS = (() => {
  const raw = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? '1', 10);
  return Number.isFinite(raw) && raw >= 1 ? raw : 1;
})();

/**
 * Extracts the client IP from Next.js request headers.
 *
 * SECURITY: X-Forwarded-For is a comma-separated list that a client can
 * pre-populate. The LEFTMOST entry is attacker-controlled, so using it as a
 * rate-limit key lets an attacker mint a new identity per request and bypass
 * the limit entirely. Only the address appended by our OWN trusted proxy is
 * meaningful: counting back TRUSTED_PROXY_HOPS from the right, we take the
 * entry at that position — the first hop we can actually vouch for.
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const chain = xForwardedFor
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (chain.length > 0) {
      // Walk from the trusted edge back toward the client and clamp: with
      // 1 trusted hop we take the rightmost proxy-appended entry, never the
      // client-supplied leftmost one.
      const index = Math.min(TRUSTED_PROXY_HOPS, chain.length) - 1;
      const trustedIndex = Math.max(0, chain.length - 1 - index);
      const ip = chain[trustedIndex];
      if (ip) return ip;
    }
  }
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return 'anonymous-client';
}
