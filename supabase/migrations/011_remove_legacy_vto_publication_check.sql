-- Migration 011: remove the legacy VTO publication gate.
-- Publication is now gated by Gate 4 derived-asset verification, not fabricated
-- physical calibration dimensions. Keep the Gate 4 derivative constraint from
-- migration 009 as the authoritative database publication invariant.

ALTER TABLE public.vto_asset_calibrations
  DROP CONSTRAINT IF EXISTS vto_asset_calibrations_published_check;
