-- =============================================================================
-- Migration 004: Stock Ledger and Atomic Record Sale RPC
-- Purpose: Ensures strict transactional integrity during inventory decrements
-- and records all stock movements into an immutable ledger.
--
-- GRANT ORDERING (load-bearing — do not re-open):
--   002_phase1_atomic_inventory.sql  revoked EXECUTE on the stock-decrement
--                                    function from PUBLIC/anon/authenticated,
--                                    leaving it callable by service_role only.
--   003_process_confirmed_payment.sql is the fulfilment path that runs as the
--                                    service role (server-to-server webhook).
--   004 (this file)                  must NOT widen that surface. record_sale()
--                                    is SECURITY DEFINER, so granting it to
--                                    `authenticated` would let any logged-in
--                                    user decrement arbitrary stock directly.
-- =============================================================================

-- 1. Create stock_ledgers table
CREATE TABLE IF NOT EXISTS public.stock_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id TEXT NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('SALE', 'RESTOCK', 'MANUAL_ADJUSTMENT', 'TRANSFER', 'REFUND')),
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (only service_role / internal backend can write)
ALTER TABLE public.stock_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" 
    ON public.stock_ledgers FOR SELECT 
    TO authenticated 
    USING (true);

-- 2. Create the record_sale RPC
-- Expects p_items to be a JSON array: [{"variant_id": "...", "quantity": 1}]
CREATE OR REPLACE FUNCTION public.record_sale(
    p_order_id TEXT,
    p_items JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
    v_id TEXT;
    v_qty INTEGER;
    v_current_stock INTEGER;
BEGIN
    -- 1. Validate input
    IF jsonb_array_length(p_items) = 0 THEN
        RETURN QUERY SELECT false, 'No items provided'::TEXT;
        RETURN;
    END IF;

    -- 2. Loop through and lock rows
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_id := item->>'variant_id';
        v_qty := (item->>'quantity')::INTEGER;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity % for variant %', v_qty, v_id;
        END IF;

        -- Lock the row
        SELECT units_in_stock INTO v_current_stock
        FROM public.product_variants
        WHERE id = v_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Variant % not found', v_id;
        END IF;

        IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for variant %. Requested: %, Available: %', v_id, v_qty, v_current_stock;
        END IF;

        -- Decrement stock
        UPDATE public.product_variants
        SET 
            units_in_stock = v_current_stock - v_qty,
            in_stock = (v_current_stock - v_qty > 0),
            stock_level = CASE 
                WHEN (v_current_stock - v_qty) = 0 THEN 'out'
                WHEN (v_current_stock - v_qty) <= 3 THEN 'low'
                ELSE 'high'
            END,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_id;

        -- Insert ledger record
        INSERT INTO public.stock_ledgers (variant_id, change_amount, reason, reference_id)
        VALUES (v_id, -v_qty, 'SALE', p_order_id);
    END LOOP;

    RETURN QUERY SELECT true, 'Sale recorded successfully'::TEXT;
END;
$$;

-- 3. Grant execution permissions.
--
-- record_sale() is SECURITY DEFINER and mutates stock, so it is an
-- inventory-write surface reserved for the trusted backend. It must NOT be
-- granted to `authenticated` (a logged-in customer could then decrement any
-- variant's stock) — only service_role (the server-to-server fulfilment path
-- from migration 003) may call it.
REVOKE EXECUTE ON FUNCTION public.record_sale(TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_sale(TEXT, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_sale(TEXT, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_sale(TEXT, JSONB) TO service_role;
