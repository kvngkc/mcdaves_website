-- =============================================================================
-- Migration 016: Flip RLS policies to auth_user_id (Phase 1.11 — commit b of 2, CONTRACT)
--
-- After the backfill in migration 015 has been verified, key the ownership
-- policies off customers.auth_user_id instead of the custom MC-XXXXX id.
-- The previous policies compared a Supabase auth UUID against the custom
-- customer id, which can never match — they silently returned nothing.
--
-- Idempotent and safe to re-run.
-- =============================================================================

-- ── CUSTOMERS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "customers_auth_own_row" ON public.customers;
CREATE POLICY "customers_auth_own_row"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ── ORDERS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_auth_own_row" ON public.orders;
CREATE POLICY "orders_auth_own_row"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = (
      SELECT c.auth_user_id FROM public.customers c WHERE c.id = orders.customer_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT c.auth_user_id FROM public.customers c WHERE c.id = orders.customer_id
    )
  );

-- ── ORDER INTENTS ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "order_intents_auth_own_row" ON public.order_intents;
CREATE POLICY "order_intents_auth_own_row"
  ON public.order_intents
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = (
      SELECT c.auth_user_id FROM public.customers c WHERE c.id = order_intents.customer_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT c.auth_user_id FROM public.customers c WHERE c.id = order_intents.customer_id
    )
  );

-- ── PAYMENTS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_auth_own_row" ON public.payments;
CREATE POLICY "payments_auth_own_row"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = (
      SELECT c.auth_user_id FROM public.customers c WHERE c.id = payments.customer_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT c.auth_user_id FROM public.customers c WHERE c.id = payments.customer_id
    )
  );

-- ── LENS REQUESTS ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "lens_requests_auth_own_row" ON public.lens_requests;
CREATE POLICY "lens_requests_auth_own_row"
  ON public.lens_requests
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = (
      SELECT c.auth_user_id FROM public.customers c WHERE c.id = lens_requests.customer_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT c.auth_user_id FROM public.customers c WHERE c.id = lens_requests.customer_id
    )
  );
