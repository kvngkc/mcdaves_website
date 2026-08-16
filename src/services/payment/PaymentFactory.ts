// src/services/payment/PaymentFactory.ts
// ─── Payment Factory ───────────────────────────────────────────────────────────
// SERVER-ONLY: Reads PAYSTACK_SECRET_KEY from process.env.
// Import only inside Route Handlers or Server Actions.

import type { PaymentService } from './PaymentService';
import { PaystackService } from './PaystackService';

export type PaymentProvider = 'paystack';

/**
 * Returns a configured PaymentService for the given provider.
 * Throws immediately if the required environment variable is missing so
 * misconfiguration is caught at startup rather than at transaction time.
 */
export function createPaymentService(provider: PaymentProvider): PaymentService {
  if (provider === 'paystack') {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      throw new Error(
        '[PaymentFactory] PAYSTACK_SECRET_KEY is not set. ' +
          'Add it to .env.local (server-side only, never expose to the client).',
      );
    }

    return new PaystackService(secretKey);
  }

  // Exhaustive check — TypeScript will catch unsupported providers at build time.
  const _exhaustive: never = provider;
  throw new Error(`[PaymentFactory] Unknown payment provider: ${String(_exhaustive)}`);
}
