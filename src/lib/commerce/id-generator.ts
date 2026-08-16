// src/lib/commerce/id-generator.ts
/**
 * Human-readable ID Generator for McDaves Eyewear
 * Generates memorable, unambiguous references for customers, intents, and orders.
 */

// Characters excluding ambiguous ones like 0/O, 1/I/L
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function randomChars(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length);
    result += CHARSET[randomIndex];
  }
  return result;
}

/**
 * Generates a human-readable McDaves Customer ID, e.g. "MC-7K4P2"
 */
export function generateCustomerId(): string {
  return `MC-${randomChars(5)}`;
}

/**
 * Generates an Order Intent Reference, e.g. "ORD-INT-2026-00481"
 */
export function generateOrderIntentId(): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(10000 + Math.random() * 90000);
  return `ORD-INT-${year}-${sequence}`;
}

/**
 * Generates a Confirmed Order Reference, e.g. "ORD-2026-00102"
 */
export function generateOrderId(): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${year}-${sequence}`;
}

/**
 * Generates a Lens Request ID, e.g. "LNS-2026-00341"
 */
export function generateLensRequestId(): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(10000 + Math.random() * 90000);
  return `LNS-${year}-${sequence}`;
}
