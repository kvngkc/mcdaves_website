-- Supabase SQL Schema for McDaves Eyewear & Optical Commerce Platform
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    collection TEXT NOT NULL DEFAULT 'sightly',
    category TEXT NOT NULL DEFAULT 'unisex',
    description TEXT NOT NULL DEFAULT '',
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    face_shape JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_price NUMERIC NOT NULL DEFAULT 35000,
    default_original_price NUMERIC,
    default_material TEXT NOT NULL DEFAULT 'Acetate',
    default_weight TEXT NOT NULL DEFAULT '22g',
    frame_width_mm INTEGER NOT NULL DEFAULT 140,
    lens_width_mm INTEGER NOT NULL DEFAULT 52,
    bridge_width_mm INTEGER NOT NULL DEFAULT 18,
    temple_length_mm INTEGER NOT NULL DEFAULT 140,
    frame_size TEXT NOT NULL DEFAULT '52□18-140',
    prescription_required BOOLEAN NOT NULL DEFAULT true,
    try_on_available BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    color_name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#000000',
    price_override NUMERIC,
    original_price_override NUMERIC,
    material_override TEXT,
    weight_override TEXT,
    specifications_override JSONB,
    description_override TEXT,
    vto_asset_id TEXT REFERENCES public.vto_asset_calibrations(asset_id) ON DELETE RESTRICT,
    glb_path TEXT, -- DEPRECATED: Retained physically but ignored by application logic. Use vto_asset_id.
    in_stock BOOLEAN NOT NULL DEFAULT true,
    stock_level TEXT NOT NULL DEFAULT 'high' CHECK (stock_level IN ('high', 'low', 'out')),
    units_in_stock INTEGER NOT NULL DEFAULT 10,
    hide_when_out_of_stock BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PRODUCT MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.product_media (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id TEXT REFERENCES public.product_variants(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'front' CHECK (type IN ('front', 'side', 'lifestyle', 'model', 'detail')),
    url TEXT NOT NULL,
    alt_text TEXT NOT NULL DEFAULT '',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ORDER INTENTS (CRM LEADS) TABLE
CREATE TABLE IF NOT EXISTS public.order_intents (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES public.customers(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    variant_sku TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_intent NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    lens_request_id TEXT,
    vto_session_ref TEXT,
    status TEXT NOT NULL DEFAULT 'NEW',
    source TEXT NOT NULL DEFAULT 'whatsapp_cta',
    notes TEXT,
    payment_link_url TEXT,
    whatsapp_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. CONFIRMED ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_intent_id TEXT,
    customer_id TEXT NOT NULL REFERENCES public.customers(id),
    payment_id TEXT,
    payment_reference TEXT UNIQUE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL,
    shipping_fee NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    shipping_address JSONB,
    customer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. PAYMENTS TABLE
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

-- 8. LENS REQUESTS (PRESCRIPTIONS) TABLE
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

-- 9. VTO ASSET CALIBRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.vto_asset_calibrations (
    id TEXT PRIMARY KEY,
    asset_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'VALIDATED', 'CALIBRATED', 'REVIEW_REQUIRED', 'APPROVED', 'PUBLISHED', 'PROCESSING_FAILED', 'VALIDATION_FAILED', 'CALIBRATION_FAILED', 'REJECTED', 'ARCHIVED')),
    frame_width_mm NUMERIC,
    lens_width_mm NUMERIC,
    bridge_width_mm NUMERIC,
    temple_length_mm NUMERIC,
    bridge_x NUMERIC,
    bridge_y NUMERIC,
    bridge_z NUMERIC,
    measured_native_width NUMERIC NOT NULL DEFAULT 1.0,
    width_multiplier NUMERIC NOT NULL DEFAULT 1.0,
    rotation_offset_euler JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
    source_glb_url TEXT NOT NULL,
    vto_glb_url TEXT NOT NULL,
    storage_bucket TEXT,
    storage_path TEXT,
    preview_images JSONB DEFAULT '[]'::jsonb,
    metadata_source TEXT DEFAULT 'McDaves VTO Automated Asset Ingestion Engine',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT vto_asset_calibrations_published_check CHECK (
      status != 'PUBLISHED' OR (
        frame_width_mm IS NOT NULL AND 
        lens_width_mm IS NOT NULL AND 
        bridge_width_mm IS NOT NULL AND 
        temple_length_mm IS NOT NULL AND 
        bridge_x IS NOT NULL AND 
        bridge_y IS NOT NULL AND 
        bridge_z IS NOT NULL
      )
    )
);

-- INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_vto_asset_id ON public.product_variants(vto_asset_id);
CREATE INDEX IF NOT EXISTS idx_order_intents_customer ON public.order_intents(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_intents_status ON public.order_intents(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_ref ON public.orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_lens_requests_customer ON public.lens_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_vto_calibrations_asset ON public.vto_asset_calibrations(asset_id);
CREATE INDEX IF NOT EXISTS idx_vto_calibrations_status ON public.vto_asset_calibrations(status);

