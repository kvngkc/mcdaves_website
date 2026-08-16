// src/app/api/admin/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 },
  );

  clearAdminSessionCookie(response);
  return response;
}
