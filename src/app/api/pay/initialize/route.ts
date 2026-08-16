// src/app/api/pay/initialize/route.ts
// ─── POST /api/pay/initialize ─────────────────────────────────────────────────
// SERVER-ONLY Route Handler — PAYSTACK_SECRET_KEY never reaches the client.
// Validates request, generates reference, calls Paystack, returns checkout URL.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPaymentService } from '@/services/payment';

export const dynamic = 'force-dynamic';

// ─── Zod Request Schema ───────────────────────────────────────────────────────

const InitializeSchema = z.object({
  /** Customer email address */
  email: z.string().email({ message: 'A valid email address is required.' }),
  /** Order total in NGN (not kobo — the service handles conversion) */
  amount: z
    .number({ required_error: 'amount is required.' })
    .positive({ message: 'amount must be a positive number.' }),
  /** Optional structured metadata: order items, customer name, address, etc. */
  metadata: z.record(z.unknown()).optional(),
});

type InitializeBody = z.infer<typeof InitializeSchema>;

// ─── Reference Generator ──────────────────────────────────────────────────────

function generateReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `MDV_${timestamp}_${random}`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse & validate request body
  let body: InitializeBody;
  try {
    const json = await request.json();
    const parsed = InitializeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  // 2. Build callback URL (Paystack will redirect here after payment)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `https://${request.headers.get('host') || 'localhost:3000'}`;
  const callbackUrl = `${baseUrl}/payment/callback`;

  // 3. Generate unique reference
  const reference = generateReference();

  // 4. Initialize payment via PaystackService (server-side, uses secret key)
  try {
    const paymentService = createPaymentService('paystack');
    const result = await paymentService.initializePayment({
      email: body.email,
      amount: body.amount,
      reference,
      callbackUrl,
      metadata: body.metadata,
    });

    return NextResponse.json(
      {
        authorizationUrl: result.authorizationUrl,
        reference: result.reference,
        accessCode: result.accessCode,
      },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to initialize payment.';
    console.error('[/api/pay/initialize]', message);
    return NextResponse.json(
      { error: 'Payment initialization failed. Please try again.' },
      { status: 500 },
    );
  }
}
