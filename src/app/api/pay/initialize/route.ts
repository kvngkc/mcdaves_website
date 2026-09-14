// ─── POST /api/pay/initialize ─────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { createPaymentService } from '@/services/payment';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import { deliveryConfig } from '@/config/services';
import { generateOrderId } from '@/lib/commerce/id-generator';
import { verifyTurnstileToken } from '@/lib/security/turnstile';

export const dynamic = 'force-dynamic';

const CartItemSchema = z.object({ productId: z.string(), variantId: z.string(), variantSku: z.string(), name: z.string().optional(), quantity: z.number().int().positive(), price: z.number().positive().optional(), color: z.string().nullable().optional() });
const InitializeSchema = z.object({ email: z.string().email({ message: 'A valid email address is required.' }), amount: z.number().positive().optional(), items: z.array(CartItemSchema).optional(), deliveryMethod: z.enum(['door', 'pickup']).optional().default('door'), metadata: z.record(z.unknown()).optional(), turnstileToken: z.string().optional() });
type InitializeBody = z.infer<typeof InitializeSchema>;
function generateReference(): string { return `MCD_PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`; }

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request); const rateLimit = checkRateLimit(`pay-init:${clientIp}`, { maxRequests: 15, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many payment initialization attempts. Please wait a minute before retrying.' }, { status: 429 });

  let body: InitializeBody;
  try {
    const parsed = InitializeSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    body = parsed.data;
    if (!(await verifyTurnstileToken(body.turnstileToken))) return NextResponse.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 400 });
  } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const { commerceRepository } = await import('@/lib/commerce/repository');
  let authoritativeSubtotal = 0; const validatedItems: any[] = [];
  if (body.items && body.items.length > 0) {
    for (const item of body.items) {
      let unitPrice: number; let variantName: string; let sku: string;
      if (item.variantId) {
        const variant = await commerceRepository.getVariantById(item.variantId);
        if (!variant) return NextResponse.json({ error: `Variant ID ${item.variantId} not found in database. Cannot authorize checkout.` }, { status: 400 });
        unitPrice = variant.effectivePrice; variantName = variant.name; sku = variant.sku;
        const availableUnits = variant.unitsInStock ?? 10;
        if (availableUnits < item.quantity) return NextResponse.json({ error: `Insufficient stock for "${variantName}". Available: ${availableUnits}, requested: ${item.quantity}.` }, { status: 400 });
      } else {
        const product = (await commerceRepository.getProductById(item.productId)) || (await commerceRepository.getProductBySlug(item.productId));
        if (!product) return NextResponse.json({ error: `Product ${item.productId} not found in database. Cannot authorize checkout.` }, { status: 400 });
        unitPrice = product.defaultPrice; variantName = product.name; sku = 'MCD-FRAME';
      }
      authoritativeSubtotal += unitPrice * item.quantity;
      validatedItems.push({ productId: item.productId, variantId: item.variantId, variantSku: sku, name: variantName, quantity: item.quantity, unitPrice, totalPrice: unitPrice * item.quantity, color: item.color || null });
    }
  } else if (body.amount) authoritativeSubtotal = body.amount;
  else return NextResponse.json({ error: 'Either items array or valid amount is required to initialize payment.' }, { status: 400 });

  const isPickup = body.deliveryMethod === 'pickup';
  const deliveryFee = isPickup ? deliveryConfig.lagosPickupFee : authoritativeSubtotal >= deliveryConfig.freeThreshold ? 0 : deliveryConfig.standardFee;
  const authoritativeTotal = authoritativeSubtotal + deliveryFee;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host') || 'localhost:3000'}`;
  const callbackUrl = `${baseUrl}/payment/callback`; const reference = generateReference();

  try {
    const customer = await commerceRepository.findOrCreateCustomer({ phone: (body.metadata?.customerPhone as string) || '0000000000', name: (body.metadata?.customerName as string) || 'Online Checkout', email: body.email });
    const orderId = generateOrderId();
    await commerceRepository.saveOrder({ id: orderId, customerId: customer.id, paymentReference: reference, items: validatedItems.length > 0 ? validatedItems : (body.metadata?.orderItems as any[]) || [], subtotal: authoritativeSubtotal, shippingFee: deliveryFee, totalAmount: authoritativeTotal, currency: 'NGN', status: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  } catch (err) { console.error('[/api/pay/initialize] Failed to save pending order:', err); return NextResponse.json({ error: 'Failed to create pending order.' }, { status: 500 }); }

  try {
    const paymentService = createPaymentService('paystack'); const enrichedMetadata: Record<string, any> = { ...(body.metadata || {}), deliveryMethod: body.deliveryMethod, subtotal: authoritativeSubtotal, deliveryFee, authoritativeTotal }; delete enrichedMetadata.orderItems;
    const result = await paymentService.initializePayment({ email: body.email, amount: authoritativeTotal, reference, callbackUrl, metadata: enrichedMetadata });
    return NextResponse.json({ authorizationUrl: result.authorizationUrl, reference: result.reference, accessCode: result.accessCode, amount: authoritativeTotal, subtotal: authoritativeSubtotal, deliveryFee }, { status: 200 });
  } catch (err) { console.error('[/api/pay/initialize]', err instanceof Error ? err.message : err); return NextResponse.json({ error: 'Payment initialization failed. Please try again.' }, { status: 500 }); }
}
