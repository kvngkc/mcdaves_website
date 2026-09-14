// src/lib/supabase/server.ts
/**
 * SERVER-ONLY Supabase Client — Service Role Access
 *
 * This module is intentionally marked server-only. It uses the service role key
 * and must NEVER be imported in client components, pages with 'use client', or
 * any module that could be bundled for the browser.
 *
 * Configuration is resolved at module load time but is intentionally NOT
 * validated here. Next.js evaluates route modules during production builds,
 * and throwing here turns a missing runtime environment variable into a build
 * failure. Callers must check for a null client and return an appropriate
 * runtime configuration error instead.
 *
 * Use this client in:
 *  - API Route Handlers (app/api/**)
 *  - Server Components
 *  - Server Actions
 *
 * For browser-safe reads (public product catalog etc.), use
 * src/lib/supabase/client.ts
 */

import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only Supabase client with service role permissions.
 * Bypasses Row-Level Security — only use where admin-level access is required.
 *
 * null means the deployment is missing its server Supabase configuration.
 * That is a runtime configuration error, not a module-import/build error.
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
