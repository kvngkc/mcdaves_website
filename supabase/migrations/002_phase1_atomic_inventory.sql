-- =============================================================================
-- Migration 002: Phase 1 Atomic Inventory Decrement Stored Procedure
-- Prevents race conditions / overselling during concurrent checkout & webhooks
-- =============================================================================

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
    p_variant_id TEXT,
    p_quantity INT
)
RETURNS TABLE (
    success BOOLEAN,
    remaining_stock INT,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_stock INT;
BEGIN
    -- 1. Select with row-level lock (FOR UPDATE) to prevent concurrent race conditions
    SELECT units_in_stock INTO v_current_stock
    FROM public.product_variants
    WHERE id = p_variant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0, 'Variant not found'::TEXT;
        RETURN;
    END IF;

    -- 2. Check for sufficient inventory
    IF v_current_stock < p_quantity THEN
        RETURN QUERY SELECT false, v_current_stock, 'Insufficient stock'::TEXT;
        RETURN;
    END IF;

    -- 3. Execute atomic decrement and update availability state
    UPDATE public.product_variants
    SET 
        units_in_stock = v_current_stock - p_quantity,
        in_stock = (v_current_stock - p_quantity > 0),
        stock_level = CASE 
            WHEN (v_current_stock - p_quantity) = 0 THEN 'out'
            WHEN (v_current_stock - p_quantity) <= 3 THEN 'low'
            ELSE 'high'
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_variant_id;

    RETURN QUERY SELECT true, (v_current_stock - p_quantity), 'Stock decremented successfully'::TEXT;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(TEXT, INT) TO authenticated;
