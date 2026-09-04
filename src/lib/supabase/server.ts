// src/lib/supabase/server.ts
/**
 * SERVER-ONLY Supabase Client — Service Role Access
 *
 * This module is intentionally marked server-only. It uses the service role key
 * and must NEVER be imported in client components, pages with 'use client', or
 * any module that could be bundled for the browser.
 *
 * Importing this file in a client component will throw a build-time error:
 *   "This module cannot be imported from a Client Component module"
 *
 * Use this client in:
 *  - API Route Handlers (app/api/**)
 *  - Server Components
 *  - Server Actions
 *
 * For browser-safe reads (public product catalog etc.), use src/lib/supabase/client.ts
 */

import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('[Supabase Server] NEXT_PUBLIC_SUPABASE_URL is not configured.');
}

if (!supabaseServiceKey) {
  throw new Error('[Supabase Server] SUPABASE_SERVICE_ROLE_KEY is not configured. Server-side DB access will fail.');
}

/**
 * Server-only Supabase client with service role permissions.
 * Bypasses Row-Level Security — only use where admin-level access is required.
 */
export const supabaseServer: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export default supabaseServer;
