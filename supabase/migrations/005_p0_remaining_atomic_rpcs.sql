-- =============================================================================
-- Migration 005: Remaining P0 Atomic RPCs
-- Purpose: Safely update order status and allow bulk inventory restocking.
-- =============================================================================

-- 1. Create dispatch_order RPC
CREATE OR REPLACE FUNCTION public.dispatch_order(p_order_id TEXT)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status FROM public.orders WHERE id = p_order_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Order not found'::TEXT;
        RETURN;
    END IF;

    IF v_status != 'CONFIRMED' THEN
        RETURN QUERY SELECT false, 'Only CONFIRMED orders can be dispatched'::TEXT;
        RETURN;
    END IF;

    UPDATE public.orders SET status = 'DISPATCHED', updated_at = timezone('utc'::text, now()) WHERE id = p_order_id;
    RETURN QUERY SELECT true, 'Order dispatched successfully'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispatch_order(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_order(TEXT) TO authenticated;

-- 2. Create import_inventory_batch RPC
-- Expects p_items to be a JSON array: [{"variant_id": "...", "quantity": 10}]
CREATE OR REPLACE FUNCTION public.import_inventory_batch(p_items JSONB)
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
    IF jsonb_array_length(p_items) = 0 THEN
        RETURN QUERY SELECT false, 'No items provided'::TEXT;
        RETURN;
    END IF;

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_id := item->>'variant_id';
        v_qty := (item->>'quantity')::INTEGER;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Restock quantity must be positive for variant %', v_id;
        END IF;

        SELECT units_in_stock INTO v_current_stock
        FROM public.product_variants
        WHERE id = v_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Variant % not found', v_id;
        END IF;

        UPDATE public.product_variants
        SET 
            units_in_stock = v_current_stock + v_qty,
            in_stock = true,
            stock_level = CASE 
                WHEN (v_current_stock + v_qty) <= 3 THEN 'low'
                ELSE 'high'
            END,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_id;

        INSERT INTO public.stock_ledgers (variant_id, change_amount, reason, reference_id)
        VALUES (v_id, v_qty, 'RESTOCK', 'BATCH_IMPORT');
    END LOOP;

    RETURN QUERY SELECT true, 'Batch import successful'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.import_inventory_batch(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.import_inventory_batch(JSONB) TO authenticated;
