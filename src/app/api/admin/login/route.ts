// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * The storefront no longer issues its own admin session. Admin access is
 * established by the Supabase session (the same one the admin console uses);
 * this endpoint simply reports whether the caller already holds a valid
 * admin session.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdminSession(request);

  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { success: true, message: 'Authenticated successfully' },
    { status: 200 },
  );
}
