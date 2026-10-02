import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/auth';

const DEFAULT_NEXT = '/account/orders';

/**
 * Only accept a `next` value that is a same-origin, absolute path:
 * it must start with a single `/` and must not start with `//`
 * (protocol-relative) or `/\` (browser-normalised to `//`).
 * Anything else falls back to the default destination.
 */
function safeNextPath(raw: string | null): string {
  if (!raw) return DEFAULT_NEXT;
  if (!raw.startsWith('/')) return DEFAULT_NEXT;
  if (raw.startsWith('//') || raw.startsWith('/\\')) return DEFAULT_NEXT;
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createAuthServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Build the redirect with the URL API so the path can never escape
      // the site's own origin.
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    new URL('/account/login?error=Invalid%20or%20expired%20link', origin),
  );
}
