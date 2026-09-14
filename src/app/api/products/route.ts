// src/app/api/products/route.ts
/** Product & Catalog Management API */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

const CreateProductSchema = z.object({
  id: z.string().min(1), slug: z.string().min(1), name: z.string().min(1), collection: z.literal('sightly').default('sightly'),
  category: z.enum(['men', 'women', 'unisex', 'sunglasses']).default('unisex'), description: z.string().default(''), features: z.array(z.string()).default([]),
  faceShape: z.array(z.enum(['round', 'oval', 'square', 'heart', 'diamond'])).default([]), defaultPrice: z.number().positive(), defaultOriginalPrice: z.number().positive().optional(),
  defaultMaterial: z.string().default('Acetate'), defaultWeight: z.string().default('22g'),
  defaultSpecifications: z.object({ frameWidthMm: z.number().default(140), lensWidthMm: z.number().default(52), bridgeWidthMm: z.number().default(18), templeLengthMm: z.number().default(140), frameSize: z.string().default('52□18-140') }).default({ frameWidthMm: 140, lensWidthMm: 52, bridgeWidthMm: 18, templeLengthMm: 140, frameSize: '52□18-140' }),
  prescriptionRequired: z.boolean().default(true), tryOnAvailable: z.boolean().default(true), status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
});

const CreateVariantSchema = z.object({
  id: z.string().min(1), productId: z.string().min(1), slug: z.string().min(1), name: z.string().min(1), sku: z.string().min(1), colorName: z.string().min(1), colorHex: z.string().default('#000000'),
  priceOverride: z.number().positive().optional(), originalPriceOverride: z.number().positive().optional(), materialOverride: z.string().optional(), weightOverride: z.string().optional(), specificationsOverride: z.record(z.unknown()).optional(), descriptionOverride: z.string().optional(), glbPath: z.string().optional(), inStock: z.boolean().default(true), stockLevel: z.enum(['high', 'low', 'out']).default('high'), unitsInStock: z.number().int().min(0).default(10), hideWhenOutOfStock: z.boolean().default(false), sortOrder: z.number().int().default(0), status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const CreateMediaSchema = z.object({ id: z.string().min(1), productId: z.string().min(1), variantId: z.string().optional(), type: z.enum(['front', 'side', 'lifestyle', 'model', 'detail']).default('front'), url: z.string().min(1), altText: z.string().default(''), isPrimary: z.boolean().default(false), sortOrder: z.number().int().default(0) });

export async function GET(): Promise<NextResponse> {
  const { getLiveStorefrontProducts } = await import('@/lib/commerce/storefront-catalog');
  return NextResponse.json({ products: await getLiveStorefrontProducts() }, { status: 200 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(req); if (!auth.authorized) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    const { commerceRepository } = await import('@/lib/commerce/repository');
    const body = await req.json();
    if (body.action === 'CREATE_VARIANT') { const parsed = CreateVariantSchema.safeParse(body.variant); if (!parsed.success) return NextResponse.json({ error: 'Invalid variant payload', details: parsed.error.flatten().fieldErrors }, { status: 400 }); return NextResponse.json({ success: true, variant: await commerceRepository.createVariant(parsed.data as any) }, { status: 201 }); }
    if (body.action === 'ADD_MEDIA') { const parsed = CreateMediaSchema.safeParse(body.media); if (!parsed.success) return NextResponse.json({ error: 'Invalid media payload', details: parsed.error.flatten().fieldErrors }, { status: 400 }); return NextResponse.json({ success: true, media: await commerceRepository.addProductMedia(parsed.data as any) }, { status: 201 }); }
    const parsed = CreateProductSchema.safeParse(body.product); if (!parsed.success) return NextResponse.json({ error: 'Invalid product payload', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    return NextResponse.json({ success: true, product: await commerceRepository.createProduct(parsed.data as any) }, { status: 201 });
  } catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Error creating catalog item' }, { status: 400 }); }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(req); if (!auth.authorized) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    const { commerceRepository } = await import('@/lib/commerce/repository'); const body = await req.json();
    if (body.action === 'UPDATE_VARIANT') { if (!body.variant?.id) return NextResponse.json({ error: 'Variant ID is required for updates' }, { status: 400 }); return NextResponse.json({ success: true, variant: await commerceRepository.updateVariant(body.variant) }); }
    if (!body.product?.id) return NextResponse.json({ error: 'Product ID is required for updates' }, { status: 400 });
    return NextResponse.json({ success: true, product: await commerceRepository.updateProduct(body.product) });
  } catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Error updating catalog item' }, { status: 400 }); }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(req); if (!auth.authorized) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    const { commerceRepository } = await import('@/lib/commerce/repository'); const { searchParams } = new URL(req.url); const type = searchParams.get('type'); const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    if (type === 'variant') { await commerceRepository.deleteVariant(id); return NextResponse.json({ success: true, message: `Variant ${id} deleted` }); }
    if (type === 'media') { await commerceRepository.deleteProductMedia(id); return NextResponse.json({ success: true, message: `Media ${id} deleted` }); }
    await commerceRepository.deleteProduct(id); return NextResponse.json({ success: true, message: `Product ${id} deleted` });
  } catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : 'Error deleting item' }, { status: 400 }); }
}
