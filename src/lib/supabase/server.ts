// src/lib/supabase/server.ts
/**
 * SERVER-ONLY Supabase Client — Service Role Access
 *
 * This module is intentionally marked server-only. It uses the service role key
 * and must NEVER be imported in client components, pages with 'use client', or
 * any module that could be bundled for the browser.
 */

import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only Supabase client with service role permissions.
 * Missing build-time configuration returns null so route modules can be bundled
 * safely; request-time callers must handle the unavailable client explicitly.
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
