import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPaymentService } from '@/services/payment';
import { requireAdminSession } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

interface RouteProps { params: Promise<{ id: string }> }

const UpdateSchema = z.object({
  status: z.enum(['NEW','WHATSAPP_OPENED','CONTACTED','IN_CONVERSATION','CONSULTATION','AWAITING_CUSTOMER','CONVERTED','LOST','CANCELLED']).optional(),
  notes: z.string().optional(), generatePaymentLink: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: RouteProps): Promise<NextResponse> {
  const auth = requireAdminSession(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  const { commerceRepository } = await import('@/lib/commerce/repository');
  const { id } = await params;
  const intent = await commerceRepository.getOrderIntentById(id);
  if (!intent) return NextResponse.json({ error: 'Order intent not found' }, { status: 404 });
  const customer = await commerceRepository.getCustomerById(intent.customerId);
  const variant = await commerceRepository.getVariantById(intent.variantId);
  const lensRequest = intent.lensRequestId ? await commerceRepository.getLensRequestById(intent.lensRequestId) : null;
  return NextResponse.json({ intent, customer, variant, lensRequest }, { status: 200 });
}

export async function PATCH(request: NextRequest, { params }: RouteProps): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(request);
    if (!auth.authorized) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    const { commerceRepository } = await import('@/lib/commerce/repository');
    const { id } = await params;
    const intent = await commerceRepository.getOrderIntentById(id);
    if (!intent) return NextResponse.json({ error: 'Order intent not found' }, { status: 404 });
    const parsed = UpdateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid update payload', details: parsed.error.flatten() }, { status: 400 });

    let updatedIntent = intent;
    if (parsed.data.status) updatedIntent = await commerceRepository.updateOrderIntentStatus(id, parsed.data.status, parsed.data.notes);
    if (parsed.data.generatePaymentLink) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host') || 'localhost:3000'}`;
      const totalAmount = intent.priceAtIntent * intent.quantity;
      const paymentRef = `MDV_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const customerEmail = intent.customerEmail || `${intent.customerId.toLowerCase()}@mcdaves.customer`;
      const paymentService = createPaymentService('paystack');
      const initResult = await paymentService.initializePayment({
        email: customerEmail, amount: totalAmount, reference: paymentRef,
        callbackUrl: `${baseUrl}/payment/callback?reference=${paymentRef}`,
        metadata: { orderIntentId: intent.id, customerId: intent.customerId, customerName: intent.customerName, customerPhone: intent.customerPhone, productName: intent.productName, variantName: intent.variantName, variantSku: intent.variantSku, quantity: intent.quantity, priceAtIntent: intent.priceAtIntent },
      });
      await commerceRepository.recordPayment({ reference: paymentRef, orderIntentId: intent.id, customerId: intent.customerId, amount: totalAmount, status: 'PENDING', paystackAccessCode: initResult.accessCode });
      updatedIntent = await commerceRepository.setOrderIntentPaymentLink(id, initResult.authorizationUrl, paymentRef);
    }
    return NextResponse.json({ intent: updatedIntent }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update order intent';
    console.error('[/api/order-intents/[id] PATCH]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
