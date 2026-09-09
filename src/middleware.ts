// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { globalApiRateLimiter } from './lib/security/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Global API Rate Limiting (DDoS Protection)
  if (pathname.startsWith('/api/')) {
    if (globalApiRateLimiter) {
      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      const { success } = await globalApiRateLimiter.limit(ip);
      
      if (!success) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
  }

  // 2. Admin Routing Guard:
  // The admin console is strictly hosted in the dedicated 'mcdaves-admin' repository.
  // Any attempt to access /admin or /admin/* on the client storefront must be routed to the home page.
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  // 3. Obsolete / Legacy Route Redirects
  if (
    pathname === '/services/repairs' ||
    pathname === '/services/repairs/' ||
    pathname === '/services/frame-repair' ||
    pathname === '/services/frame-repair/'
  ) {
    return NextResponse.redirect(new URL('/services/lens-replacement', request.url), 301);
  }

  if (pathname === '/pro/quote' || pathname === '/pro/quote/') {
    return NextResponse.redirect(new URL('/pro/catalog', request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin',
    '/admin/:path*',
    '/services/repairs/:path*',
    '/services/frame-repair/:path*',
    '/pro/quote/:path*',
  ],
};

