// src/app/api/order-intents/route.ts
/**
 * POST /api/order-intents — Create customer profile & order intent with price snapshot
 * GET  /api/order-intents — List order intents for CRM / Admin Panel
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { commerceRepository } from '@/lib/commerce/repository';
import { requireAdminSession } from '@/lib/auth/admin-auth';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

const CreateIntentSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(6, 'Valid phone number is required'),
    email: z.string().email().optional().or(z.literal('')),
  }),
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().positive().default(1),
  source: z
    .enum(['whatsapp_cta', 'vto_cta', 'direct', 'cart'])
    .default('whatsapp_cta'),
  notes: z.string().optional(),
  lensRequest: z
    .object({
      option: z.enum(['plano', 'upload', 'whatsapp', 'values']),
      prescriptionValues: z
        .object({
          sphereOD: z.string().optional(),
          cylOD: z.string().optional(),
          axisOD: z.string().optional(),
          sphereOS: z.string().optional(),
          cylOS: z.string().optional(),
          axisOS: z.string().optional(),
          pd: z.string().optional(),
        })
        .optional(),
      customerNotes: z.string().optional(),
    })
    .optional(),
  vtoSessionRef: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Check Rate Limit (max 10 submissions per minute per IP)
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`order-intent:${clientIp}`, {
      maxRequests: 10,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before submitting again.' },
        { status: 429 },
      );
    }

    const json = await request.json();
    const parsed = CreateIntentSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { customer, variantId, quantity, source, notes, lensRequest, vtoSessionRef } =
      parsed.data;

    const result = await commerceRepository.createOrderIntent({
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || undefined,
      },
      variantId,
      quantity,
      source,
      notes,
      lensRequest: lensRequest
        ? {
            option: lensRequest.option,
            prescriptionValues: lensRequest.prescriptionValues,
            customerNotes: lensRequest.customerNotes,
            verificationState: 'CUSTOMER_SUBMITTED',
          }
        : undefined,
      vtoSessionRef,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create order intent';
    console.error('[/api/order-intents POST]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    let intents = commerceRepository.getAllOrderIntents();

    if (status && status !== 'ALL') {
      intents = intents.filter((i) => i.status === status);
    }

    if (search) {
      intents = intents.filter(
        (i) =>
          i.id.toLowerCase().includes(search) ||
          i.customerName.toLowerCase().includes(search) ||
          i.customerPhone.includes(search) ||
          i.customerId.toLowerCase().includes(search) ||
          i.productName.toLowerCase().includes(search) ||
          i.variantName.toLowerCase().includes(search),
      );
    }

    return NextResponse.json({ intents }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve order intents';
    console.error('[/api/order-intents GET]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
