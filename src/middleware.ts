// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 1. Obsolete route redirects
  if (pathname === '/services/repairs' || pathname === '/services/repairs/' || pathname === '/services/frame-repair' || pathname === '/services/frame-repair/') {
    return NextResponse.redirect(new URL('/services/lens-replacement', request.url), 301);
  }

  if (pathname === '/pro/quote' || pathname === '/pro/quote/') {
    return NextResponse.redirect(new URL('/pro/catalog', request.url), 301);
  }

  // 2. Admin Domain & Route Guard
  if (pathname.startsWith('/admin')) {
    // If accessed on the public production website (mcdaves.com.ng / www.mcdaves.com.ng)
    // rather than the dedicated private admin domain (iamadmin.mcdaves.com.ng) or local dev
    const isPublicProductionDomain =
      host.includes('mcdaves.com.ng') && !host.startsWith('iamadmin.');

    if (isPublicProductionDomain) {
      // Safely redirect to public home
      return NextResponse.redirect(new URL('/', request.url), 302);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/services/repairs/:path*',
    '/services/frame-repair/:path*',
    '/pro/quote/:path*',
  ],
};
