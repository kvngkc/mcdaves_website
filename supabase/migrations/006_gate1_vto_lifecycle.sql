-- Migration: 006_gate1_vto_lifecycle.sql
-- Goal: Update the CHECK constraint on vto_asset_calibrations.status to enforce the new state machine.

-- Drop the existing constraint (postgres auto-generates the name based on table and column usually, or we can find it, but it's likely vto_asset_calibrations_status_check)
ALTER TABLE public.vto_asset_calibrations
  DROP CONSTRAINT IF EXISTS vto_asset_calibrations_status_check;

-- Add the new constraint
ALTER TABLE public.vto_asset_calibrations
  ADD CONSTRAINT vto_asset_calibrations_status_check 
  CHECK (status IN ('UPLOADED', 'PROCESSING', 'VALIDATED', 'CALIBRATED', 'REVIEW_REQUIRED', 'APPROVED', 'PUBLISHED', 'PROCESSING_FAILED', 'VALIDATION_FAILED', 'CALIBRATION_FAILED', 'REJECTED', 'ARCHIVED'));

-- Change default to UPLOADED
ALTER TABLE public.vto_asset_calibrations
  ALTER COLUMN status SET DEFAULT 'UPLOADED';

-- Add storage_bucket and storage_path columns
ALTER TABLE public.vto_asset_calibrations
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Remove fabricated default dimensions
ALTER TABLE public.vto_asset_calibrations
  ALTER COLUMN frame_width_mm DROP NOT NULL,
  ALTER COLUMN frame_width_mm DROP DEFAULT,
  ALTER COLUMN lens_width_mm DROP DEFAULT,
  ALTER COLUMN bridge_width_mm DROP DEFAULT,
  ALTER COLUMN temple_length_mm DROP DEFAULT,
  ALTER COLUMN bridge_x DROP NOT NULL,
  ALTER COLUMN bridge_x DROP DEFAULT,
  ALTER COLUMN bridge_y DROP NOT NULL,
  ALTER COLUMN bridge_y DROP DEFAULT,
  ALTER COLUMN bridge_z DROP NOT NULL,
  ALTER COLUMN bridge_z DROP DEFAULT;

-- Enforce rule: Uncalibrated assets cannot be published
ALTER TABLE public.vto_asset_calibrations
  ADD CONSTRAINT vto_asset_calibrations_published_check 
  CHECK (
    status != 'PUBLISHED' OR (
      frame_width_mm IS NOT NULL AND 
      lens_width_mm IS NOT NULL AND 
      bridge_width_mm IS NOT NULL AND 
      temple_length_mm IS NOT NULL AND 
      bridge_x IS NOT NULL AND 
      bridge_y IS NOT NULL AND 
      bridge_z IS NOT NULL
    )
  );
