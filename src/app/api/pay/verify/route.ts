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
      const metadata = (result.metadata || {}) as Record<string, unknown>;
      const orderIntentId = metadata.orderIntentId as string | undefined;
      // 1. Ensure Customer exists
      let finalCustomerId = metadata.customerId as string | undefined;
      if (!finalCustomerId && metadata.customerPhone && metadata.customerName) {
        const customer = await commerceRepository.findOrCreateCustomer({
          phone: metadata.customerPhone as string,
          name: metadata.customerName as string,
          email: result.email || undefined,
        });
        finalCustomerId = customer.id;
      } else if (!finalCustomerId && result.email) {
        const customer = await commerceRepository.findOrCreateCustomer({
          phone: '0000000000',
          name: 'Anonymous Checkout',
          email: result.email,
        });
        finalCustomerId = customer.id;
      }

      // 2. Record Payment and Create Order
      await commerceRepository.recordPayment({
        reference: cleanRef,
        orderIntentId,
        customerId: finalCustomerId || 'MC-ONLINE',
        amount: result.amount,
        currency: 'NGN',
        status: 'PAID',
        channel: result.channel,
        paidAt: result.paidAt,
        gatewayResponse: metadata,
      });

      const { order: createdOrder } = await commerceRepository.createOrderFromConfirmedPayment({
        paymentReference: cleanRef,
        orderIntentId,
        customerId: finalCustomerId || 'MC-ONLINE',
      });

      // Send confirmation email
      
      if (createdOrder && createdOrder.customerId) {
        const customer = await commerceRepository.getCustomerById(createdOrder.customerId);
        if (customer && customer.email) {
          import('@/lib/email').then(({ sendOrderConfirmationEmail }) => {
            sendOrderConfirmationEmail(createdOrder, customer.email!, customer.name);
          });
        }
      }

      return NextResponse.json(
        {
          ...result,
          orderId: createdOrder?.id,
          customerId: createdOrder?.customerId,
          order: createdOrder,
        },
        { status: 200 },
      );
    }

    // Payment failed or abandoned
    await commerceRepository.recordPayment({
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
