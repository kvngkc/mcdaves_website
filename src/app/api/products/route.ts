// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { commerceRepository } from '@/lib/commerce/repository';
import { requireAdminSession } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const products = commerceRepository.getAllProducts();
  return NextResponse.json({ products }, { status: 200 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'CREATE_VARIANT') {
      const variant = commerceRepository.createVariant(body.variant);
      return NextResponse.json({ success: true, variant }, { status: 201 });
    }

    if (action === 'ADD_MEDIA') {
      const media = commerceRepository.addProductMedia(body.media);
      return NextResponse.json({ success: true, media }, { status: 201 });
    }

    const product = commerceRepository.createProduct(body.product);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating catalog item';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'UPDATE_VARIANT') {
      const updated = commerceRepository.updateVariant(body.variant);
      return NextResponse.json({ success: true, variant: updated }, { status: 200 });
    }

    const updated = commerceRepository.updateProduct(body.product);
    return NextResponse.json({ success: true, product: updated }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating catalog item';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = requireAdminSession(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'product' | 'variant' | 'media'
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
    }

    if (type === 'variant') {
      commerceRepository.deleteVariant(id);
      return NextResponse.json({ success: true, message: `Variant ${id} deleted` });
    }

    if (type === 'media') {
      commerceRepository.deleteProductMedia(id);
      return NextResponse.json({ success: true, message: `Media ${id} deleted` });
    }

    commerceRepository.deleteProduct(id);
    return NextResponse.json({ success: true, message: `Product ${id} deleted` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error deleting item';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
