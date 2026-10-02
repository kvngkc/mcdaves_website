// src/app/api/webhooks/paystack/route.ts
/**
 * POST /api/webhooks/paystack — Server-to-server Paystack Webhook Handler
 *
 * Verifies the Paystack HMAC-SHA512 signature in constant time, re-verifies the
 * transaction with Paystack's verify API and asserts the amount matches the
 * expected order total BEFORE confirming the order or touching stock, then
 * performs the single inventory decrement for the order.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { commerceRepository } from '@/lib/commerce/repository';
import { createPaymentService } from '@/services/payment';

export const dynamic = 'force-dynamic';

/**
 * Constant-time comparison of two hex digests. `crypto.timingSafeEqual`
 * requires equal-length buffers, so a length mismatch is rejected up front
 * (a length mismatch is not secret-dependent and leaks nothing useful).
 */
function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Amounts are compared in NGN with a 1-kobo tolerance for float noise. */
function amountsMatch(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    const secret =
      process.env.PAYSTACK_WEBHOOK_SECRET ||
      process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      console.error('[Paystack Webhook] PAYSTACK_SECRET_KEY / PAYSTACK_WEBHOOK_SECRET not configured.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-paystack-signature header' }, { status: 401 });
    }

    // Verify HMAC-SHA512 signature in constant time (no timing-dependent exit).
    const computedHash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (!safeEqualHex(computedHash, signature)) {
      console.warn('[Paystack Webhook] Signature verification failed.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Only process charge.success events
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const declaredAmount = data.amount / 100; // kobo -> NGN
      const metadata = data.metadata || {};
      const orderIntentId = metadata.orderIntentId as string | undefined;
      const customerId = (metadata.customerId as string | undefined) || 'MC-ONLINE';
      const variantId = metadata.variantId as string | undefined;

      // ── Re-verify the transaction with Paystack and assert the amount ──
      // Never trust the webhook payload's amount: fetch the authoritative
      // transaction from Paystack and compare it to the expected order total.
      const paymentService = createPaymentService('paystack');
      const verified = await paymentService.verifyPayment(reference);

      if (verified.status !== 'success') {
        console.warn(
          `[Paystack Webhook] Transaction ${reference} is not successful (status=${verified.status}); ignoring.`,
        );
        return NextResponse.json({ status: 'ignored' }, { status: 200 });
      }

      const verifiedAmount = verified.amount;

      // The expected total is the pending order's total when it exists,
      // otherwise the amount Paystack itself reports.
      const existingOrder = await commerceRepository.getOrderByPaymentReference(reference);
      const expectedTotal = existingOrder?.totalAmount ?? verifiedAmount;

      if (!amountsMatch(verifiedAmount, expectedTotal) || !amountsMatch(declaredAmount, verifiedAmount)) {
        console.error(
          `[Paystack Webhook] Amount mismatch for ${reference}: ` +
            `declared=${declaredAmount}, verified=${verifiedAmount}, expected=${expectedTotal}. ` +
            `Refusing to fulfil.`,
        );
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      // 1. Atomic Payment Processing via PostgreSQL RPC (handles idempotency natively)
      const items: Record<string, unknown>[] = [];
      if (metadata.orderItems && Array.isArray(metadata.orderItems)) {
        metadata.orderItems.forEach((item: Record<string, unknown>) => {
          items.push({
            ...item,
            quantity: item.quantity ? Number(item.quantity) : 1,
          });
        });
      } else if (variantId) {
        items.push({
          variantId: metadata.variantId || 'custom-item',
          quantity: metadata.quantity ? Number(metadata.quantity) : 1,
        });
      }

      const processResult = await commerceRepository.processConfirmedPayment({
        paymentReference: reference,
        orderIntentId,
        customerId,
        amount: verifiedAmount,
        currency: 'NGN',
        channel: data.channel,
        paidAt: data.paid_at,
        gatewayResponse: data,
        items,
        subtotal: verifiedAmount,
        shippingFee: 0,
        totalAmount: verifiedAmount,
      });

      // 2. Single inventory decrement. process_confirmed_payment decrements
      //    only when it creates the order (legacy/fallback path). When the
      //    pending order already existed it skips its internal decrement, so
      //    record the sale here — exactly once, never twice.
      if (existingOrder && processResult.orderId) {
        const confirmed = await commerceRepository.getOrderById(processResult.orderId);
        if (confirmed && confirmed.items && confirmed.items.length > 0) {
          await commerceRepository.recordSale(
            confirmed.id,
            confirmed.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
          );
        }
      }

      console.log(`[Paystack Webhook] Successfully processed confirmed order for reference ${reference}. Order ID: ${processResult.orderId}`);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook processing error';
    console.error('[Paystack Webhook] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
