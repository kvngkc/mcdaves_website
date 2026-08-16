// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPasskey,
  createAdminSessionToken,
  setAdminSessionCookie,
  checkLoginRateLimit,
} from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous-client';

    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 60 seconds before retrying.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { passkey } = body || {};

    if (!passkey || typeof passkey !== 'string') {
      return NextResponse.json(
        { error: 'Passkey is required' },
        { status: 400 },
      );
    }

    const isValid = verifyAdminPasskey(passkey);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid administrator credentials. Access denied.' },
        { status: 401 },
      );
    }

    const token = createAdminSessionToken();
    const response = NextResponse.json(
      { success: true, message: 'Authenticated successfully' },
      { status: 200 },
    );

    setAdminSessionCookie(response, token);
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Authentication processing failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
