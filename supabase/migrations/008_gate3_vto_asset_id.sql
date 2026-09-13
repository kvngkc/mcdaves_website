-- =============================================================================
-- Migration 008: Gate 3 - VTO Asset Identity
-- Establishes vto_asset_id as the authoritative FK to vto_asset_calibrations
-- =============================================================================

-- 1. Add vto_asset_id to product_variants with ON DELETE RESTRICT
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS vto_asset_id TEXT REFERENCES public.vto_asset_calibrations(asset_id) ON DELETE RESTRICT;

-- 2. Create performance index
CREATE INDEX IF NOT EXISTS idx_variants_vto_asset_id ON public.product_variants(vto_asset_id);

-- Note: product_variants.glb_path is deliberately NOT dropped in this migration.
-- It remains structurally intact but will be read-ignored by application logic.
-- A subsequent cleanup gate will drop it once the application is proven migrated.
