-- Test database baseline schema.
-- Keep this schema deterministic and safe to apply to the isolated test project.
-- The test project must never be the production Supabase project.

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  default_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  category TEXT
);

CREATE TABLE IF NOT EXISTS public.vto_asset_calibrations (
  id TEXT PRIMARY KEY,
  asset_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UPLOADED',
  frame_width_mm NUMERIC NOT NULL DEFAULT 124,
  lens_width_mm NUMERIC,
  bridge_width_mm NUMERIC,
  temple_length_mm NUMERIC,
  bridge_x NUMERIC NOT NULL DEFAULT 0,
  bridge_y NUMERIC NOT NULL DEFAULT 0,
  bridge_z NUMERIC NOT NULL DEFAULT 0,
  measured_native_width NUMERIC NOT NULL DEFAULT 1,
  width_multiplier NUMERIC NOT NULL DEFAULT 1,
  rotation_offset_euler JSONB DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  source_glb_url TEXT NOT NULL,
  vto_glb_url TEXT NOT NULL,
  preview_images JSONB DEFAULT '[]'::jsonb,
  metadata_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  color_name TEXT,
  color_hex TEXT,
  vto_asset_id TEXT REFERENCES public.vto_asset_calibrations(asset_id) ON DELETE SET NULL,
  glb_path TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX IF NOT EXISTS idx_test_product_variants_product_id
  ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_test_product_variants_vto_asset_id
  ON public.product_variants(vto_asset_id);
