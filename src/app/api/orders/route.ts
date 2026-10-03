// src/app/api/orders/route.ts
/**
 * GET /api/orders — List confirmed orders for Admin Panel
 */

import { NextRequest, NextResponse } from 'next/server';
import { commerceRepository } from '@/lib/commerce/repository';
import { requireAdminSession } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requireAdminSession(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    let orders = await commerceRepository.getAllOrders();

    if (status && status !== 'ALL') {
      orders = orders.filter((o) => o.status === status);
    }

    if (search) {
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(search) ||
          (o.paymentReference ?? '').toLowerCase().includes(search) ||
          o.customerId.toLowerCase().includes(search) ||
          o.items.some(
            (item) =>
              item.productName.toLowerCase().includes(search) ||
              item.variantName.toLowerCase().includes(search) ||
              item.sku.toLowerCase().includes(search),
          ),
      );
    }

    return NextResponse.json({ orders }, { status: 200 });
  } catch (err: unknown) {
    console.error('[/api/orders GET]', err);
    const msg = err instanceof Error ? err.message : 'Failed to retrieve orders';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
