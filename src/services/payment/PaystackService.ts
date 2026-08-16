// src/services/payment/PaystackService.ts
// ─── Paystack Implementation ───────────────────────────────────────────────────
// SERVER-ONLY: Uses PAYSTACK_SECRET_KEY from process.env.
// Never import this module in client components or pages marked 'use client'.

import type {
  PaymentService,
  InitializePaymentParams,
  PaymentInitResult,
  PaymentVerificationResult,
} from './PaymentService';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// ─── Raw Paystack API Response Shapes ─────────────────────────────────────────

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;          // 'success' | 'failed' | 'pending' | 'abandoned'
    reference: string;
    amount: number;          // in kobo
    paid_at: string | null;
    channel: string;
    metadata: Record<string, unknown> | null;
    customer: {
      email: string;
    };
  };
}

// ─── PaystackService ───────────────────────────────────────────────────────────

export class PaystackService implements PaymentService {
  private readonly secretKey: string;
  private readonly headers: HeadersInit;

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error('[PaystackService] Secret key is required.');
    }
    this.secretKey = secretKey;
    this.headers = {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /** Convert NGN amount to kobo (×100) */
  formatAmount(amount: number): number {
    return Math.round(amount * 100);
  }

  /** Initialize a Paystack transaction → returns hosted checkout URL */
  async initializePayment(
    params: InitializePaymentParams,
  ): Promise<PaymentInitResult> {
    const { email, amount, reference, callbackUrl, metadata } = params;

    const body = {
      email,
      amount: this.formatAmount(amount), // kobo
      reference,
      callback_url: callbackUrl,
      ...(metadata ? { metadata } : {}),
    };

    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `[PaystackService] initializePayment failed (${res.status}): ${text}`,
      );
    }

    const json = (await res.json()) as PaystackInitResponse;

    if (!json.status) {
      throw new Error(
        `[PaystackService] initializePayment error: ${json.message}`,
      );
    }

    return {
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
      accessCode: json.data.access_code,
    };
  }

  /** Verify a completed transaction by reference */
  async verifyPayment(reference: string): Promise<PaymentVerificationResult> {
    if (!reference) {
      throw new Error('[PaystackService] verifyPayment: reference is required.');
    }

    const res = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: this.headers,
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `[PaystackService] verifyPayment failed (${res.status}): ${text}`,
      );
    }

    const json = (await res.json()) as PaystackVerifyResponse;

    if (!json.status) {
      throw new Error(
        `[PaystackService] verifyPayment error: ${json.message}`,
      );
    }

    const { data } = json;
    const validStatuses = ['success', 'failed', 'pending', 'abandoned'] as const;
    type ValidStatus = (typeof validStatuses)[number];
    const status: ValidStatus = validStatuses.includes(data.status as ValidStatus)
      ? (data.status as ValidStatus)
      : 'failed';

    return {
      status,
      reference: data.reference,
      amount: data.amount / 100, // kobo → NGN
      paidAt: data.paid_at ?? undefined,
      channel: data.channel ?? undefined,
      metadata: data.metadata ?? undefined,
      email: data.customer?.email ?? undefined,
    };
  }
}
