-- Migration 012: temporarily remove the VTO output-size publication gate.
-- Output size remains recorded for observability, but it no longer blocks
-- processing, review, approval, or publication.

ALTER TABLE public.vto_asset_calibrations
  DROP CONSTRAINT IF EXISTS vto_asset_calibrations_output_size_status_check;

-- The field is retained for historical/observability data and future reintroduction
-- of a size policy. No database constraint should require a size classification.
