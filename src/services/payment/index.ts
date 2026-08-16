// src/services/payment/index.ts
// ─── Payment Module Barrel Exports ────────────────────────────────────────────

export type {
  PaymentService,
  InitializePaymentParams,
  PaymentInitResult,
  PaymentVerificationResult,
} from './PaymentService';

export { PaystackService } from './PaystackService';

export { createPaymentService } from './PaymentFactory';
export type { PaymentProvider } from './PaymentFactory';
