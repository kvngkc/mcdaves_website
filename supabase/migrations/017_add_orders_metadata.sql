-- 017_add_orders_metadata.sql
-- Step 3.1 (v4 plan) — EXPAND half of the expand/contract pair.
--
-- Adds an inert `metadata` JSONB column to `orders` so the storefront checkout
-- can persist prescription fields (prescriptionOption / prescriptionFileUrl)
-- that the admin console reads. Forward-only: the column is additive and the
-- backfill is idempotent, so re-running this migration is safe.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill existing rows from the legacy columns when they exist and are
-- populated. Idempotent: only touches rows whose metadata is still empty.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'prescription_option'
  ) THEN
    UPDATE orders
    SET metadata = jsonb_strip_nulls(
      jsonb_build_object(
        'prescriptionOption', prescription_option,
        'prescriptionFileUrl', prescription_file_url
      )
    )
    WHERE metadata = '{}'::jsonb
      AND (prescription_option IS NOT NULL OR prescription_file_url IS NOT NULL);
  END IF;
END $$;

-- Supports containment lookups on the metadata payload.
CREATE INDEX IF NOT EXISTS idx_orders_metadata_gin
  ON orders USING gin (metadata);
