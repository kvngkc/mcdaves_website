// src/lib/supabase/server.ts
/** SERVER-ONLY Supabase client. Missing deployment secrets fail at request time, not during Next.js route collection. */

import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/**
 * Server-only client with service-role permissions when deployment secrets are
 * available. Preview builds without those secrets remain buildable; callers
 * that require database access must handle the null client explicitly.
 */
export const supabaseServer: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export default supabaseServer;
