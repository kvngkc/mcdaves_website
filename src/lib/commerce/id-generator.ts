// src/lib/commerce/id-generator.ts
/**
 * Human-readable ID Generator for McDaves Eyewear
 * Generates memorable, unambiguous references for customers, intents, and orders.
 *
 * SECURITY: all randomness comes from Node's CSPRNG (crypto), never
 * Math.random(), so identifiers are unpredictable and collision-resistant.
 */

import crypto from 'crypto';

// Characters excluding ambiguous ones like 0/O, 1/I/L
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Returns `length` characters drawn uniformly from CHARSET using a
 * cryptographically secure source. Rejection sampling avoids modulo bias.
 */
function randomChars(length: number): string {
  let result = '';
  const max = 256 - (256 % CHARSET.length); // largest multiple of charset size <= 256
  while (result.length < length) {
    const bytes = crypto.randomBytes(length * 2);
    for (const byte of bytes) {
      if (byte >= max) continue; // reject to avoid modulo bias
      result += CHARSET[byte % CHARSET.length];
      if (result.length === length) break;
    }
  }
  return result;
}

/**
 * Returns `length` cryptographically secure decimal digits.
 */
function randomDigits(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += crypto.randomInt(0, 10).toString();
  }
  return result;
}

/**
 * Generates a human-readable McDaves Customer ID, e.g. "MC-7K4P2Q"
 */
export function generateCustomerId(): string {
  return `MC-${randomChars(6)}`;
}

/**
 * Generates an Order Intent Reference, e.g. "ORD-INT-2026-00481927"
 */
export function generateOrderIntentId(): string {
  const year = new Date().getFullYear();
  return `ORD-INT-${year}-${randomDigits(8)}`;
}

/**
 * Generates a Confirmed Order Reference, e.g. "ORD-2026-00102934"
 */
export function generateOrderId(): string {
  const year = new Date().getFullYear();
  return `ORD-${year}-${randomDigits(8)}`;
}

/**
 * Generates a Lens Request ID, e.g. "LNS-2026-00341902"
 */
export function generateLensRequestId(): string {
  const year = new Date().getFullYear();
  return `LNS-${year}-${randomDigits(8)}`;
}
