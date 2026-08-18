import { NextRequest, NextResponse } from 'next/server';
import { createPaymentService } from '@/services/payment';
import { commerceRepository } from '@/lib/commerce/repository';
import { supabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Extract reference from query string
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference') ?? searchParams.get('trxref');

  if (!reference || reference.trim() === '') {
    return NextResponse.json(
      { error: 'reference query parameter is required.' },
      { status: 400 },
    );
  }

  const cleanRef = reference.trim();

  // 2. Verify via PaystackService (server-side, uses secret key)
  try {
    const paymentService = createPaymentService('paystack');
    const result = await paymentService.verifyPayment(cleanRef);

    if (result.status === 'success') {
      const metadata = (result.metadata || {}) as Record<string, any>;
      const orderIntentId = metadata.orderIntentId as string | undefined;
      const customerId = metadata.customerId as string | undefined;
      const variantId = metadata.variantId as string | undefined;
      const quantity = metadata.quantity ? Number(metadata.quantity) : 1;

      // Automatically Decrement Stock in Supabase
      try {
        if (supabase && variantId) {
          const { data: vData } = await supabase
            .from('product_variants')
            .select('id, units_in_stock, in_stock')
            .eq('id', variantId)
            .single();

          if (vData) {
            const currentUnits = vData.units_in_stock ?? 10;
            const remainingUnits = Math.max(0, currentUnits - quantity);
            await supabase
              .from('product_variants')
              .update({
                units_in_stock: remainingUnits,
                in_stock: remainingUnits > 0,
                stock_level: remainingUnits === 0 ? 'out' : remainingUnits <= 3 ? 'low' : 'high',
              })
              .eq('id', variantId);
          }
        }
      } catch (invErr) {
        console.warn('[Inventory Sync] Notice updating variant inventory:', invErr);
      }

      // Record successful payment
      commerceRepository.recordPayment({
        reference: cleanRef,
        orderIntentId,
        customerId: customerId || 'MC-ONLINE',
        amount: result.amount,
        status: 'PAID',
        channel: result.channel,
        paidAt: result.paidAt,
        gatewayResponse: result.metadata,
      });

      // Create official confirmed order (converts OrderIntent to CONVERTED)
      let createdOrder;
      const existingOrder = commerceRepository.getOrderByPaymentReference(cleanRef);
      if (existingOrder) {
        createdOrder = existingOrder;
      } else {
        const orderResult = commerceRepository.createOrderFromConfirmedPayment({
          paymentReference: cleanRef,
          orderIntentId,
          customerId,
        });
        createdOrder = orderResult.order;
      }

      return NextResponse.json(
        {
          ...result,
          orderId: createdOrder.id,
          customerId: createdOrder.customerId,
          order: createdOrder,
        },
        { status: 200 },
      );
    }

    // Payment failed or abandoned
    commerceRepository.recordPayment({
      reference: cleanRef,
      customerId: 'MC-ONLINE',
      amount: result.amount,
      status: 'FAILED',
      channel: result.channel,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to verify payment.';
    console.error('[/api/pay/verify]', message);
    return NextResponse.json(
      { error: 'Payment verification failed. Please contact support.' },
      { status: 500 },
    );
  }
}
