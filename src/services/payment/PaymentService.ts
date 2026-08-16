// src/services/payment/PaymentService.ts
// ─── Payment Abstraction Layer ────────────────────────────────────────────────
// This file defines the interface and types for all payment providers.
// Only add server-side implementations (no secret keys in client code).

// ─── Parameter & Result Types ─────────────────────────────────────────────────

export interface InitializePaymentParams {
  /** Customer email address */
  email: string;
  /** Amount in NGN (kobo conversion handled by the service) */
  amount: number;
  /** Unique reference string, e.g. MDV_{timestamp}_{random} */
  reference: string;
  /** URL Paystack redirects to after payment */
  callbackUrl: string;
  /** Optional structured metadata (order items, customer info, etc.) */
  metadata?: Record<string, unknown>;
}

export interface PaymentInitResult {
  /** Paystack-hosted checkout URL to redirect the customer to */
  authorizationUrl: string;
  /** Unique transaction reference (echoed from params or assigned by Paystack) */
  reference: string;
  /** Paystack access code (for inline JS if needed) */
  accessCode: string;
}

export interface PaymentVerificationResult {
  /** Transaction outcome */
  status: 'success' | 'failed' | 'pending' | 'abandoned';
  /** Transaction reference */
  reference: string;
  /** Amount paid, in NGN */
  amount: number;
  /** ISO timestamp when payment was completed */
  paidAt?: string;
  /** Payment channel: card, bank_transfer, ussd, etc. */
  channel?: string;
  /** Metadata passed at initialization (order items, customer info, etc.) */
  metadata?: Record<string, unknown>;
  /** Customer email from Paystack response */
  email?: string;
}

// ─── Service Interface ─────────────────────────────────────────────────────────

export interface PaymentService {
  /**
   * Initialize a transaction and obtain a hosted checkout URL.
   * Must only be called from server-side code (Route Handlers, Server Actions).
   */
  initializePayment(
    params: InitializePaymentParams,
  ): Promise<PaymentInitResult>;

  /**
   * Verify a transaction by its reference.
   * Must only be called from server-side code.
   */
  verifyPayment(reference: string): Promise<PaymentVerificationResult>;

  /**
   * Convert an NGN amount to kobo (×100) for Paystack API calls.
   * Paystack always expects amounts in the smallest currency unit.
   */
  formatAmount(amount: number): number;
}
