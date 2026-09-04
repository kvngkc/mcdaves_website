import { NextResponse } from 'next/server';
import { createAuthServerClient } from '@/lib/supabase/auth';

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  
  return NextResponse.redirect(new URL('/account/login', request.url), {
    status: 302,
  });
}
