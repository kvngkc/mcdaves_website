// src/app/api/admin/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireAdminSession(request);

  if (!auth.authorized) {
    return NextResponse.json(
      { authenticated: false, error: auth.error },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { authenticated: true, role: 'admin', userId: auth.userId },
    { status: 200 },
  );
}
