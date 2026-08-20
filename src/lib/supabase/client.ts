// src/lib/supabase/client.ts
/**
 * BROWSER-SAFE Supabase Client — Anon Key Only
 *
 * Uses the public anon key. Safe to import in client components.
 * Row-Level Security (RLS) policies govern what this client can access.
 *
 * This client should only be used for:
 *  - Reading public catalog data (products, variants, media)
 *  - Anonymous operations permitted by RLS policies
 *
 * For any operation that requires elevated privileges (writing orders,
 * updating inventory, managing customers), use the server-only client
 * via an API Route Handler instead.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser-safe Supabase client with anon key.
 * Subject to Supabase Row-Level Security policies.
 */
export const supabaseClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default supabaseClient;
