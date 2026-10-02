-- =============================================================================
-- Migration 015: Add customers.auth_user_id (Phase 1.11 — commit a of 2, EXPAND)
--
-- The RLS policies compared a Supabase auth UUID against the custom
-- `MC-XXXXX` customer id (`auth.uid()::text = id`), which can never match —
-- the policies silently returned nothing. This migration adds the correct
-- linkage column and backfills it, WITHOUT yet changing the policies
-- (expand/contract: the code can dual-read during the window).
--
-- Idempotent and safe to re-run.
-- =============================================================================

-- 1. Add the linkage column.
ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- 2. One auth user maps to at most one customer row.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_auth_user_id
    ON public.customers (auth_user_id)
    WHERE auth_user_id IS NOT NULL;

-- 3. Backfill explicitly for every existing customer, matching on email
--    (case-insensitive). Only unambiguous matches are linked; a customer
--    whose email matches no auth user keeps auth_user_id = NULL and is
--    therefore not readable by any authenticated user (fail closed).
UPDATE public.customers c
SET auth_user_id = u.id
FROM auth.users u
WHERE c.auth_user_id IS NULL
  AND c.email IS NOT NULL
  AND lower(c.email) = lower(u.email);

-- 4. Dual-read window: the application reads auth_user_id and falls back to
--    the legacy value until the policies are flipped in migration 016.
--    Verify the backfill before flipping:
--      SELECT count(*) FILTER (WHERE auth_user_id IS NULL) AS unlinked,
--             count(*) AS total
--      FROM public.customers;
