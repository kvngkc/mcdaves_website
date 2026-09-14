-- Migration 009: Gate 4 - durable VTO backend pipeline state
-- Source and derived GLBs remain in Storage. Postgres stores lifecycle, provenance,
-- hashes, sizes, processor versions, and safe-cleanup evidence.

ALTER TABLE public.vto_asset_calibrations
  ADD COLUMN IF NOT EXISTS source_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS derived_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS source_content_hash TEXT,
  ADD COLUMN IF NOT EXISTS derived_content_hash TEXT,
  ADD COLUMN IF NOT EXISTS source_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS derived_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS output_size_status TEXT,
  ADD COLUMN IF NOT EXISTS processor_version TEXT,
  ADD COLUMN IF NOT EXISTS calibration_version INTEGER,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_deleted_at TIMESTAMPTZ;

ALTER TABLE public.vto_asset_calibrations
  DROP CONSTRAINT IF EXISTS vto_asset_calibrations_output_size_status_check;

ALTER TABLE public.vto_asset_calibrations
  ADD CONSTRAINT vto_asset_calibrations_output_size_status_check
  CHECK (output_size_status IS NULL OR output_size_status IN ('PASS', 'REVIEW_REQUIRED', 'FAIL'));

CREATE INDEX IF NOT EXISTS idx_vto_calibrations_source_path
  ON public.vto_asset_calibrations(source_storage_path);

CREATE INDEX IF NOT EXISTS idx_vto_calibrations_processing_status
  ON public.vto_asset_calibrations(status, processing_started_at);

-- Publication is only valid when a verified derived object exists and the source
-- lifecycle has reached a terminal safe state.
ALTER TABLE public.vto_asset_calibrations
  DROP CONSTRAINT IF EXISTS vto_asset_calibrations_published_derivative_check;

ALTER TABLE public.vto_asset_calibrations
  ADD CONSTRAINT vto_asset_calibrations_published_derivative_check
  CHECK (
    status != 'PUBLISHED' OR (
      derived_storage_path IS NOT NULL AND
      derived_content_hash IS NOT NULL AND
      derived_size_bytes IS NOT NULL AND
      output_size_status = 'PASS'
    )
  );
