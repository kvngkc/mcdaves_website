// src/app/api/webhooks/paystack/route.ts
/**
 * POST /api/webhooks/paystack — Server-to-server Paystack Webhook Handler
 * 
 * Verifies Paystack HMAC-SHA512 signature, ensures idempotent order creation,
 * performs atomic inventory decrement, and records payment status.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { commerceRepository } from '@/lib/commerce/repository';
import { supabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

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

    // Verify HMAC-SHA512 signature
    const computedHash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (computedHash !== signature) {
      console.warn('[Paystack Webhook] Signature verification failed.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Only process charge.success events
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const amount = data.amount / 100; // kobo -> NGN
      const metadata = data.metadata || {};
      const orderIntentId = metadata.orderIntentId as string | undefined;
      const customerId = (metadata.customerId as string | undefined) || 'MC-ONLINE';
      const variantId = metadata.variantId as string | undefined;
      const quantity = metadata.quantity ? Number(metadata.quantity) : 1;

      // 1. Idempotency Check: if order already exists for this payment reference, acknowledge without duplicate processing
      const existingOrder = await commerceRepository.getOrderByPaymentReference(reference);
      if (existingOrder) {
        console.log(`[Paystack Webhook] Order already confirmed for reference ${reference}. Skipping.`);
        return NextResponse.json({ status: 'success', message: 'Order already processed' }, { status: 200 });
      }

      // 2. Atomic Inventory Decrement via PostgreSQL RPC / Repository
      const itemsToDecrement: { variantId?: string; quantity: number }[] = [];
      if (metadata.orderItems && Array.isArray(metadata.orderItems)) {
        metadata.orderItems.forEach((item: any) => {
          if (item.variantId) {
            itemsToDecrement.push({
              variantId: item.variantId,
              quantity: item.quantity ? Number(item.quantity) : 1,
            });
          }
        });
      } else if (metadata.variantId) {
        itemsToDecrement.push({
          variantId: metadata.variantId,
          quantity: metadata.quantity ? Number(metadata.quantity) : 1,
        });
      }

      for (const item of itemsToDecrement) {
        if (item.variantId) {
          await commerceRepository.decrementVariantStock(item.variantId, item.quantity);
        }
      }

      // 3. Record Payment
      await commerceRepository.recordPayment({
        reference,
        orderIntentId,
        customerId,
        amount,
        status: 'PAID',
        channel: data.channel,
        paidAt: data.paid_at,
        gatewayResponse: data,
      });

      // 4. Create Confirmed Order
      await commerceRepository.createOrderFromConfirmedPayment({
        paymentReference: reference,
        orderIntentId,
        customerId,
      });

      console.log(`[Paystack Webhook] Successfully processed confirmed order for reference ${reference}.`);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook processing error';
    console.error('[Paystack Webhook] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
