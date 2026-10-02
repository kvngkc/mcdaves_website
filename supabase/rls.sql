-- =============================================================================
-- McDaves Row-Level Security (RLS) Policies
-- =============================================================================
-- Run this in your Supabase SQL Editor AFTER running schema.sql
-- https://supabase.com/dashboard/project/uijncyzhguftcdonkcdg/sql
--
-- SECURITY MODEL:
--
--   Anonymous (public visitors):
--     - READ:  products (ACTIVE only), product_variants (ACTIVE only), product_media
--     - WRITE: NONE
--
--   Authenticated (Supabase Auth users):
--     - READ:  own customer profile, own orders, own order_intents
--     - WRITE: own customer profile (upsert)
--
--   Service Role (server-only API routes via SUPABASE_SERVICE_ROLE_KEY):
--     - ALL operations on ALL tables (bypasses RLS by design)
--
-- OWNERSHIP MODEL (Phase 1.11):
--   Ownership is keyed off customers.auth_user_id (a Supabase auth UUID),
--   NOT the custom MC-XXXXX customer id. The previous policies compared
--   auth.uid() against the custom id, which can never match and silently
--   returned nothing. See migrations 015 (add + backfill) and 016 (flip).
--
-- The service role key is NEVER exposed to the browser. All mutations
-- (create order, update inventory, record payment) go through server-side
-- API Route Handlers that use the service role client.
-- =============================================================================

-- ─── Step 1: Enable RLS on all tables ────────────────────────────────────────

ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_intents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;

-- ─── Step 2: PRODUCTS — Public read of active products only ──────────────────

DROP POLICY IF EXISTS "products_anon_read_active" ON public.products;
DROP POLICY IF EXISTS "products_service_all" ON public.products;

CREATE POLICY "products_anon_read_active"
  ON public.products
  FOR SELECT
  TO anon
  USING (status = 'ACTIVE');

-- ─── Step 3: PRODUCT VARIANTS — Public read of active variants only ──────────

DROP POLICY IF EXISTS "variants_anon_read_active" ON public.product_variants;

CREATE POLICY "variants_anon_read_active"
  ON public.product_variants
  FOR SELECT
  TO anon
  USING (status = 'ACTIVE');

-- ─── Step 4: PRODUCT MEDIA — Public read ─────────────────────────────────────

DROP POLICY IF EXISTS "media_anon_read" ON public.product_media;

CREATE POLICY "media_anon_read"
  ON public.product_media
  FOR SELECT
  TO anon
  USING (true);

-- ─── Step 5: CUSTOMERS — No public access; authenticated users own their row ─

DROP POLICY IF EXISTS "customers_no_anon_access" ON public.customers;

CREATE POLICY "customers_no_anon_access"
  ON public.customers
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Authenticated users can read/update their own customer record, keyed off
-- the Supabase auth UUID (auth_user_id), not the custom MC-XXXXX id.
DROP POLICY IF EXISTS "customers_auth_own_row" ON public.customers;
CREATE POLICY "customers_auth_own_row"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ─── Step 6: ORDER INTENTS — No public access ────────────────────────────────

DROP POLICY IF EXISTS "order_intents_no_anon_access" ON public.order_intents;

CREATE POLICY "order_intents_no_anon_access"
  ON public.order_intents
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

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

-- ─── Step 7: ORDERS — No public access ───────────────────────────────────────

DROP POLICY IF EXISTS "orders_no_anon_access" ON public.orders;

CREATE POLICY "orders_no_anon_access"
  ON public.orders
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

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

-- ─── Step 8: Verify RLS is enabled ───────────────────────────────────────────
-- Run this query to verify each table has RLS enabled and expected policies:
--
-- SELECT
--   tablename,
--   rowsecurity as rls_enabled,
--   policyname,
--   cmd as operation,
--   roles
-- FROM pg_tables
-- LEFT JOIN pg_policies ON pg_tables.tablename = pg_policies.tablename
-- WHERE pg_tables.schemaname = 'public'
--   AND pg_tables.tablename IN (
--     'products', 'product_variants', 'product_media',
--     'customers', 'order_intents', 'orders'
--   )
-- ORDER BY tablename, policyname;

-- ─── Step 9: PAYMENTS — No public access ─────────────────────────────────────

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_no_anon_access" ON public.payments;
CREATE POLICY "payments_no_anon_access"
  ON public.payments
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

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

-- ─── Step 10: LENS REQUESTS — No public access ───────────────────────────────

ALTER TABLE public.lens_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lens_requests_no_anon_access" ON public.lens_requests;
CREATE POLICY "lens_requests_no_anon_access"
  ON public.lens_requests
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

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

-- ─── Step 11: VTO ASSET CALIBRATIONS — Public read for active assets ─────────

ALTER TABLE public.vto_asset_calibrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vto_calibrations_anon_read" ON public.vto_asset_calibrations;
CREATE POLICY "vto_calibrations_anon_read"
  ON public.vto_asset_calibrations
  FOR SELECT
  TO anon
  USING (status IN ('APPROVED', 'PUBLISHED'));
