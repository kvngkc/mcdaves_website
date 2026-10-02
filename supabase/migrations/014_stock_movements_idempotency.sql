-- =============================================================================
-- Migration 014: Idempotency constraint on stock_movements (Phase 1.3 — commit b of 2)
--
-- Adds a unique constraint on (reference, variant_id, reason) so a replayed
-- decrement for the same key is rejected as a duplicate (belt-and-braces for
-- the double-decrement fixed in 1.2).
--
-- CONCURRENT-SAFE: the index is built with CREATE INDEX CONCURRENTLY, then
-- attached as a constraint. This takes no long ACCESS EXCLUSIVE lock on the
-- live table.
--
-- ⚠️ CREATE INDEX CONCURRENTLY cannot run inside a transaction block. Run this
--    migration with the transaction disabled, e.g.:
--      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 014_stock_movements_idempotency.sql
--    (Supabase CLI: mark the file `-- supabase: no-transaction`.)
-- =============================================================================

-- 1. Build the unique index concurrently (no long table lock).
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_stock_movements_idempotency
    ON public.stock_movements (reference, variant_id, reason);

-- 2. Attach the index as a real constraint. Because the index was built
--    CONCURRENTLY and is already valid, this is a metadata-only operation
--    (no full-table validation scan, no long lock).
ALTER TABLE public.stock_movements
    ADD CONSTRAINT uq_stock_movements_idempotency
    UNIQUE USING INDEX uq_stock_movements_idempotency;
