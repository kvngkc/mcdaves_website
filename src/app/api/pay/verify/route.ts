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

      // 2. Record Payment and Create/Update Order
      const paymentRecord = await commerceRepository.recordPayment({
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

      // 3. Confirm Pending Order or Fallback
      let createdOrder = await commerceRepository.getOrderByPaymentReference(cleanRef);

      if (createdOrder) {
        // Order exists (created in initialize phase) -> confirm it
        createdOrder.status = 'CONFIRMED';
        createdOrder.paymentId = paymentRecord.id;
        createdOrder.updatedAt = new Date().toISOString();
        await commerceRepository.saveOrder(createdOrder);
      } else {
        // Fallback for legacy checkouts that didn't create a pending order
        const fallbackResult = await commerceRepository.createOrderFromConfirmedPayment({
          paymentReference: cleanRef,
          orderIntentId,
          customerId: finalCustomerId || 'MC-ONLINE',
        });
        createdOrder = fallbackResult.order;
      }

      // 4. Inventory is decremented in EXACTLY ONE place: the Paystack
      //    webhook (server-to-server, reliable) via processConfirmedPayment().
      //    This callback is a read/confirm path only — it must NOT call
      //    recordSale(), otherwise a payment that is both webhooked and
      //    callback-verified decrements stock twice.

      // 5. Send the confirmation email BEFORE returning.
      //
      //    This used to be a floating promise:
      //        import('@/lib/email').then(({ sendOrderConfirmationEmail }) => { ... })
      //    On serverless the instance can be frozen the moment the handler
      //    settles, so the send was frequently killed mid-flight — the
      //    customer paid and never got a confirmation, silently. Awaiting
      //    guarantees the send completes while the instance is alive, and
      //    the try/catch records a failure instead of losing it.
      //
      //    Deliberately NON-FATAL: the payment is already captured and the
      //    order already persisted above, so a mail failure must not turn a
      //    successful payment into an error response.
      if (createdOrder && createdOrder.customerId) {
        try {
          const customer = await commerceRepository.getCustomerById(createdOrder.customerId);
          if (customer && customer.email) {
            const { sendOrderConfirmationEmail } = await import('@/lib/email');
            await sendOrderConfirmationEmail(createdOrder, customer.email, customer.name);
          }
        } catch (emailErr) {
          console.error('[/api/pay/verify] Confirmation email failed (non-fatal):', emailErr);
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
