-- Goal: Add asset_content_hash to vto_asset_calibrations to bind durable storage hash to DB record identity.

ALTER TABLE public.vto_asset_calibrations
  ADD COLUMN IF NOT EXISTS asset_content_hash TEXT;
