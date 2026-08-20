-- =============================================================================
-- Migration 001: Phase 0B Schema Extensions
-- Adds PAYMENTS, LENS_REQUESTS, and VTO_ASSET_CALIBRATIONS tables
-- =============================================================================

-- 1. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    order_intent_id TEXT REFERENCES public.order_intents(id) ON DELETE SET NULL,
    customer_id TEXT NOT NULL REFERENCES public.customers(id),
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    channel TEXT,
    paid_at TIMESTAMPTZ,
    gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. LENS REQUESTS (PRESCRIPTIONS) TABLE
CREATE TABLE IF NOT EXISTS public.lens_requests (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES public.customers(id),
    option TEXT NOT NULL CHECK (option IN ('plano', 'upload', 'whatsapp', 'values')),
    prescription_values JSONB,
    file_url TEXT,
    verification_state TEXT NOT NULL DEFAULT 'CUSTOMER_SUBMITTED' CHECK (verification_state IN ('CUSTOMER_SUBMITTED', 'OPTICIAN_VERIFIED', 'REQUIRES_REVISION', 'REJECTED')),
    optician_notes TEXT,
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. VTO ASSET CALIBRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.vto_asset_calibrations (
    id TEXT PRIMARY KEY,
    asset_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('UPLOADED', 'INSPECTED', 'CALIBRATED', 'APPROVED', 'PUBLISHED', 'REJECTED')),
    frame_width_mm NUMERIC NOT NULL DEFAULT 124,
    lens_width_mm NUMERIC DEFAULT 52,
    bridge_width_mm NUMERIC DEFAULT 18,
    temple_length_mm NUMERIC DEFAULT 140,
    bridge_x NUMERIC NOT NULL DEFAULT 0,
    bridge_y NUMERIC NOT NULL DEFAULT 0,
    bridge_z NUMERIC NOT NULL DEFAULT 0,
    measured_native_width NUMERIC NOT NULL DEFAULT 1.0,
    width_multiplier NUMERIC NOT NULL DEFAULT 1.0,
    rotation_offset_euler JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
    source_glb_url TEXT NOT NULL,
    vto_glb_url TEXT NOT NULL,
    preview_images JSONB DEFAULT '[]'::jsonb,
    metadata_source TEXT DEFAULT 'McDaves VTO Automated Asset Ingestion Engine',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_lens_requests_customer ON public.lens_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_vto_calibrations_asset ON public.vto_asset_calibrations(asset_id);
CREATE INDEX IF NOT EXISTS idx_vto_calibrations_status ON public.vto_asset_calibrations(status);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.payments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lens_requests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vto_asset_calibrations  ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES
-- Payments & Lens Requests: Deny anonymous access
DROP POLICY IF EXISTS "payments_no_anon_access" ON public.payments;
CREATE POLICY "payments_no_anon_access"
  ON public.payments
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "lens_requests_no_anon_access" ON public.lens_requests;
CREATE POLICY "lens_requests_no_anon_access"
  ON public.lens_requests
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- VTO Calibrations: Public read for active assets
DROP POLICY IF EXISTS "vto_calibrations_anon_read" ON public.vto_asset_calibrations;
CREATE POLICY "vto_calibrations_anon_read"
  ON public.vto_asset_calibrations
  FOR SELECT
  TO anon
  USING (status IN ('APPROVED', 'PUBLISHED'));
