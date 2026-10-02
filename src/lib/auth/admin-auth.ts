// src/lib/auth/admin-auth.ts
/**
 * Server-Side Admin Authorization for the storefront API.
 *
 * The storefront's admin endpoints validate the SAME Supabase session/role as
 * the admin console — there is no separate shared-passkey path. A caller must
 * present a valid Supabase session whose user carries the `admin` role in
 * `app_metadata` (or `user_metadata` during the role-migration window).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const ADMIN_COOKIE_NAME = 'mcdaves_admin_session';

/**
 * Result of an admin authorization check.
 */
export interface AdminAuthResult {
  authorized: boolean;
  userId?: string;
  error?: string;
}

/**
 * Reads the `admin` role from app_metadata, falling back to user_metadata
 * during the role-migration window.
 */
function hasAdminRole(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): boolean {
  const appRole = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;
  return appRole === 'admin' || userRole === 'admin';
}

/**
 * Guard function for Next.js Route Handlers.
 *
 * Validates the caller's Supabase session and requires the `admin` role.
 * Returns the resolved user id on success.
 */
export async function requireAdminSession(
  request: NextRequest,
): Promise<AdminAuthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { authorized: false, error: 'Server auth is not configured.' };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Route handlers do not need to refresh cookies here.
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      authorized: false,
      error: 'Unauthorized: a valid Supabase session is required.',
    };
  }

  if (!hasAdminRole(user)) {
    return {
      authorized: false,
      error: 'Forbidden: the authenticated user is not an administrator.',
    };
  }

  return { authorized: true, userId: user.id };
}

/**
 * Clears the legacy passkey cookie (no longer used for authorization).
 */
export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
