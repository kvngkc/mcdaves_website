// src/lib/auth/admin-auth.ts
/**
 * Unified admin authorization (Step 3.4, v4 plan).
 *
 * Both apps authorise admin actions through the same Supabase session + role
 * check. The legacy shared-passkey / HMAC path is removed — no passkey remains
 * as a bypass. One audit trail records every admin mutation with the acting
 * user.
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase/service';

export const ADMIN_COOKIE_NAME = 'mcdaves_sb_access_token';
export const ADMIN_CSRF_COOKIE = 'mcdaves_admin_csrf';

export type AdminRole = 'admin' | 'manager' | 'staff';

export interface AuthResult {
  authorized: boolean;
  role?: AdminRole;
  error?: string;
  user?: any;
}

function readRole(user: any): AdminRole | undefined {
  return (user?.app_metadata?.role ?? user?.user_metadata?.role) as AdminRole | undefined;
}

/**
 * Authorises a request against the Supabase session + role model.
 * The session token is read from the httpOnly cookie (or a Bearer header for
 * API tooling) and validated server-side with the service client.
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: AdminRole[],
): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value ?? bearerToken;

  if (!token) return { authorized: false, error: 'Unauthorized: No session token found.' };
  if (!supabase) return { authorized: false, error: 'Internal Server Error: Database client missing' };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { authorized: false, error: 'Unauthorized: Invalid or expired session.' };
  }

  const role = readRole(data.user);
  if (!role || !allowedRoles.includes(role)) {
    return { authorized: false, error: 'Forbidden: Insufficient permissions.' };
  }

  return { authorized: true, role, user: data.user };
}

export async function requireAdminSession(req: NextRequest): Promise<AuthResult> {
  return requireRole(req, ['admin']);
}
export async function requireManagerOrHigher(req: NextRequest): Promise<AuthResult> {
  return requireRole(req, ['admin', 'manager']);
}
export async function requireStaffOrHigher(req: NextRequest): Promise<AuthResult> {
  return requireRole(req, ['admin', 'manager', 'staff']);
}

/**
 * One audit trail for both apps (Step 3.4). Records every admin mutation with
 * the acting user. Best-effort: a logging failure never blocks the mutation.
 */
export async function recordAdminAudit(entry: {
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('admin_audit_log').insert({
    actor_id: entry.actorId ?? null,
    actor_email: entry.actorEmail ?? null,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) console.error('[admin-audit] failed to record entry:', error.message);
}
