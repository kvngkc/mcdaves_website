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

      // 1. Atomic Payment Processing via PostgreSQL RPC (handles idempotency natively)
      const items: Record<string, unknown>[] = [];
      if (metadata.orderItems && Array.isArray(metadata.orderItems)) {
        metadata.orderItems.forEach((item: Record<string, unknown>) => {
          items.push({
            ...item,
            quantity: item.quantity ? Number(item.quantity) : 1,
          });
        });
      } else if (variantId) {      items.push({
          variantId: metadata.variantId || 'custom-item',
          quantity: metadata.quantity ? Number(metadata.quantity) : 1,
        });
      }

      const processResult = await commerceRepository.processConfirmedPayment({
        paymentReference: reference,
        orderIntentId,
        customerId,
        amount,
        currency: 'NGN',
        channel: data.channel,
        paidAt: data.paid_at,
        gatewayResponse: data,
        items,
        subtotal: amount,
        shippingFee: 0,
        totalAmount: amount,
      });

      // 2. Persist prescription metadata (Step 3.1).
      // The storefront checkout carries prescriptionOption / prescriptionFileUrl
      // in the Paystack charge metadata; the admin console reads them back from
      // orders.metadata. Written here — the single fulfilment path — so the
      // column and the storefront write land together.
      const prescriptionOption = metadata.prescriptionOption as string | undefined;
      const prescriptionFileUrl = metadata.prescriptionFileUrl as string | undefined;

      if (processResult?.orderId && (prescriptionOption || prescriptionFileUrl)) {
        const { error: metaError } = await supabase
          .from('orders')
          .update({
            metadata: {
              ...(prescriptionOption ? { prescriptionOption } : {}),
              ...(prescriptionFileUrl ? { prescriptionFileUrl } : {}),
            },
          })
          .eq('id', processResult.orderId);

        if (metaError) {
          console.error(
            `[Paystack Webhook] Failed to persist prescription metadata for order ${processResult.orderId}: ${metaError.message}`,
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
