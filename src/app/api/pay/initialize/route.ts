// src/app/api/pay/initialize/route.ts
// ─── POST /api/pay/initialize ─────────────────────────────────────────────────
// SERVER-ONLY Route Handler — PAYSTACK_SECRET_KEY never reaches the client.
// Validates request, calculates authoritative price, checks stock, generates reference,
// calls Paystack, and returns checkout URL.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { createPaymentService } from '@/services/payment';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';
import { commerceRepository } from '@/lib/commerce/repository';
import { deliveryConfig } from '@/config/services';
import { generateOrderId } from '@/lib/commerce/id-generator';
import { verifyTurnstileToken } from '@/lib/security/turnstile';

export const dynamic = 'force-dynamic';

// ─── Zod Request Schema ───────────────────────────────────────────────────────

const CartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  variantSku: z.string(),
  name: z.string().optional(),
  quantity: z.number().int().positive(),
  price: z.number().positive().optional(),
  color: z.string().nullable().optional(),
});

const InitializeSchema = z.object({
  /** Customer email address */
  email: z.string().email({ message: 'A valid email address is required.' }),
  /** Optional client-supplied total in NGN for verification */
  amount: z.number().positive().optional(),
  /** Structured cart items for authoritative recalculation */
  items: z.array(CartItemSchema).optional(),
  /** Selected delivery method */
  deliveryMethod: z.enum(['door', 'pickup']).optional().default('door'),
  /** Optional structured metadata: customer name, address, prescription, etc. */
  metadata: z.record(z.unknown()).optional(),
  turnstileToken: z.string().optional(),
});

type InitializeBody = z.infer<typeof InitializeSchema>;

// ─── Cryptographically Secure Reference Generator ───────────────────────────

function generateReference(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `MCD_PAY_${timestamp}_${random}`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 0. Check Rate Limit (max 15 payment initializations per minute per IP)
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`pay-init:${clientIp}`, {
    maxRequests: 15,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many payment initialization attempts. Please wait a minute before retrying.' },
      { status: 429 },
    );
  }

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

    // Validate CAPTCHA
    const isValidToken = await verifyTurnstileToken(body.turnstileToken);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Security check failed. Please refresh and try again.' },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  // 2. Authoritative Price & Inventory Calculation
  let authoritativeSubtotal = 0;
  const validatedItems = [];

  if (body.items && body.items.length > 0) {
    for (const item of body.items) {
      let unitPrice: number;
      let variantName: string;
      let sku: string;

      // Look up variant if variantId provided
      if (item.variantId) {
        const variant = await commerceRepository.getVariantById(item.variantId);
        if (variant) {
          unitPrice = variant.effectivePrice; // effectivePrice is guaranteed to resolve from priceOverride or defaultPrice
          variantName = variant.name;
          sku = variant.sku;

          // Check stock
          const availableUnits = variant.unitsInStock ?? 10;
          if (availableUnits < item.quantity) {
            return NextResponse.json(
              {
                error: `Insufficient stock for "${variantName}". Available: ${availableUnits}, requested: ${item.quantity}.`,
              },
              { status: 400 },
            );
          }
        } else {
            return NextResponse.json(
              { error: `Variant ID ${item.variantId} not found in database. Cannot authorize checkout.` },
              { status: 400 }
            );
        }
      } else {
        // Fall back to product lookup
        const product =
          (await commerceRepository.getProductById(item.productId)) ||
          (await commerceRepository.getProductBySlug(item.productId));
        
        if (product) {
          unitPrice = product.defaultPrice;
          variantName = product.name;
          sku = 'MCD-FRAME';
        } else {
            return NextResponse.json(
              { error: `Product ${item.productId} not found in database. Cannot authorize checkout.` },
              { status: 400 }
            );
        }
      }

      authoritativeSubtotal += unitPrice * item.quantity;
      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        variantSku: sku,
        name: variantName,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        color: item.color || null,
      });
    }
  } else if (body.amount) {
    authoritativeSubtotal = body.amount;
  } else {
    return NextResponse.json(
      { error: 'Either items array or valid amount is required to initialize payment.' },
      { status: 400 },
    );
  }

  // Calculate authoritative delivery fee
  const isPickup = body.deliveryMethod === 'pickup';
  const deliveryFee = isPickup
    ? deliveryConfig.lagosPickupFee
    : authoritativeSubtotal >= deliveryConfig.freeThreshold
    ? 0
    : deliveryConfig.standardFee;

  const authoritativeTotal = authoritativeSubtotal + deliveryFee;

  // 3. Build callback URL (Paystack will redirect here after payment)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    `https://${request.headers.get('host') || 'localhost:3000'}`;
  const callbackUrl = `${baseUrl}/payment/callback`;

  // 4. Generate unique cryptographic reference
  const reference = generateReference();

  // 4.5 Save PENDING order to database to ensure items aren't lost in Paystack metadata
  try {
    const customer = await commerceRepository.findOrCreateCustomer({
      phone: (body.metadata?.customerPhone as string) || '0000000000',
      name: (body.metadata?.customerName as string) || 'Online Checkout',
      email: body.email,
    });

    const orderId = generateOrderId();
    await commerceRepository.saveOrder({
      id: orderId,
      customerId: customer.id,
      paymentReference: reference,
      items: validatedItems.length > 0 ? validatedItems : (body.metadata?.orderItems as any[]) || [],
      subtotal: authoritativeSubtotal,
      shippingFee: deliveryFee,
      totalAmount: authoritativeTotal,
      currency: 'NGN',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[/api/pay/initialize] Failed to save pending order:', err);
    return NextResponse.json(
      { error: 'Failed to create pending order.' },
      { status: 500 }
    );
  }

  // 5. Initialize payment via PaystackService (server-side, uses secret key)
  try {
    const paymentService = createPaymentService('paystack');
    const enrichedMetadata: Record<string, any> = {
      ...(body.metadata || {}),
      deliveryMethod: body.deliveryMethod,
      subtotal: authoritativeSubtotal,
      deliveryFee,
      authoritativeTotal,
    };
    // Ensure we delete orderItems from metadata to prevent Paystack payload size limits
    delete enrichedMetadata.orderItems;

    const result = await paymentService.initializePayment({
      email: body.email,
      amount: authoritativeTotal,
      reference,
      callbackUrl,
      metadata: enrichedMetadata,
    });

    return NextResponse.json(
      {
        authorizationUrl: result.authorizationUrl,
        reference: result.reference,
        accessCode: result.accessCode,
        amount: authoritativeTotal,
        subtotal: authoritativeSubtotal,
        deliveryFee,
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
