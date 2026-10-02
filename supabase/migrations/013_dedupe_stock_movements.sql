-- =============================================================================
-- Migration 013: Dedupe/backfill stock_movements (Phase 1.3 — commit a of 2)
--
-- Historical double-decrements (webhook + callback) wrote duplicate
-- (reference, variant_id, reason) rows into stock_movements. Collapse them to
-- a single row so the unique constraint in migration 014 can be created.
--
-- This migration is idempotent and safe to re-run.
-- =============================================================================

-- 1. Collapse exact duplicates: keep the earliest row per
--    (reference, variant_id, reason) and delete the rest.
WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY reference, variant_id, reason
            ORDER BY created_at ASC, id ASC
        ) AS rn
    FROM public.stock_movements
    WHERE reference IS NOT NULL
)
DELETE FROM public.stock_movements sm
USING ranked r
WHERE sm.id = r.id
  AND r.rn > 1;

-- 2. Backfill NULL references with a deterministic synthetic value derived
--    from the row id, so every row participates in the idempotency key and
--    the constraint in migration 014 is meaningful for the whole table.
UPDATE public.stock_movements
SET reference = 'legacy:' || id::text
WHERE reference IS NULL;
