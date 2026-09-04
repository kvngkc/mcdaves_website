-- =============================================================================
-- Migration 003: Phase 1 & 2 Transactional Commerce Core & Invariants
-- =============================================================================

-- 1. SEC-001: Revoke execution on decrement_variant_stock from public
REVOKE EXECUTE ON FUNCTION public.decrement_variant_stock(TEXT, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_variant_stock(TEXT, INT) FROM authenticated;

-- 2. Phase 2: Add CHECK constraint to prevent negative stock
ALTER TABLE public.product_variants
ADD CONSTRAINT positive_stock CHECK (units_in_stock >= 0);

-- 3. Phase 2: Create stock_movements ledger table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id TEXT NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    delta INT NOT NULL,
    reason TEXT NOT NULL,
    reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON public.stock_movements(variant_id);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_movements_no_anon_access" ON public.stock_movements;
CREATE POLICY "stock_movements_no_anon_access" ON public.stock_movements FOR ALL TO anon USING (false) WITH CHECK (false);

-- 4. Phase 1: Atomic `process_confirmed_payment` RPC
CREATE OR REPLACE FUNCTION public.process_confirmed_payment(
    p_payment_ref TEXT,
    p_order_intent_id TEXT,
    p_customer_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_channel TEXT,
    p_paid_at TIMESTAMPTZ,
    p_gateway_response JSONB,
    p_items JSONB,
    p_subtotal NUMERIC,
    p_shipping_fee NUMERIC,
    p_total_amount NUMERIC
)
RETURNS TABLE (
    success BOOLEAN,
    order_id TEXT,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id TEXT;
    v_payment_id TEXT;
    v_item JSONB;
    v_variant_id TEXT;
    v_quantity INT;
    v_current_stock INT;
    v_items_processed JSONB := '[]'::jsonb;
BEGIN
    -- 1. Idempotency Check
    IF EXISTS (SELECT 1 FROM public.orders WHERE payment_reference = p_payment_ref) THEN
        SELECT id INTO v_order_id FROM public.orders WHERE payment_reference = p_payment_ref;
        RETURN QUERY SELECT true, v_order_id, 'Order already processed'::TEXT;
        RETURN;
    END IF;

    -- Generate order ID early so we can use it in item IDs
    v_order_id := 'ord-' || replace(gen_random_uuid()::text, '-', '');

    -- 2. Inventory Check & Decrement
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_variant_id := v_item->>'variantId';
        v_quantity := (v_item->>'quantity')::INT;

        -- Ensure order items have IDs
        IF v_item->>'id' IS NULL THEN
            v_item := jsonb_set(v_item, '{id}', to_jsonb('item-' || v_order_id || '-' || gen_random_uuid()));
        END IF;
        IF v_item->>'orderId' IS NULL THEN
            v_item := jsonb_set(v_item, '{orderId}', to_jsonb(v_order_id));
        END IF;

        v_items_processed := v_items_processed || v_item;

        -- Skip dummy or custom items
        IF v_variant_id IS NOT NULL AND v_variant_id != 'custom-item' THEN
            SELECT units_in_stock INTO v_current_stock
            FROM public.product_variants
            WHERE id = v_variant_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Variant % not found', v_variant_id;
            END IF;

            IF v_current_stock < v_quantity THEN
                RAISE EXCEPTION 'Insufficient stock for variant %', v_variant_id;
            END IF;

            UPDATE public.product_variants
            SET 
                units_in_stock = v_current_stock - v_quantity,
                in_stock = (v_current_stock - v_quantity > 0),
                stock_level = CASE 
                    WHEN (v_current_stock - v_quantity) = 0 THEN 'out'
                    WHEN (v_current_stock - v_quantity) <= 3 THEN 'low'
                    ELSE 'high'
                END,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_variant_id;

            INSERT INTO public.stock_movements (variant_id, delta, reason, reference)
            VALUES (v_variant_id, -v_quantity, 'SALE', p_payment_ref);
        END IF;
    END LOOP;

    -- 3. Record Payment
    v_payment_id := 'pay-' || p_payment_ref;
    INSERT INTO public.payments (
        id, reference, order_intent_id, customer_id, amount, currency, status, channel, paid_at, gateway_response
    ) VALUES (
        v_payment_id, p_payment_ref, p_order_intent_id, p_customer_id, p_amount, p_currency, 'PAID', p_channel, p_paid_at, p_gateway_response
    ) ON CONFLICT (reference) DO NOTHING;

    -- 4. Create Order
    INSERT INTO public.orders (
        id, order_intent_id, customer_id, payment_id, payment_reference, items, subtotal, shipping_fee, total_amount, currency, status
    ) VALUES (
        v_order_id, p_order_intent_id, p_customer_id, v_payment_id, p_payment_ref, v_items_processed, p_subtotal, p_shipping_fee, p_total_amount, p_currency, 'CONFIRMED'
    );

    -- 5. Update Order Intent if exists
    IF p_order_intent_id IS NOT NULL THEN
        UPDATE public.order_intents
        SET status = 'CONVERTED', updated_at = timezone('utc'::text, now())
        WHERE id = p_order_intent_id;
    END IF;

    RETURN QUERY SELECT true, v_order_id, 'Payment and order processed successfully'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_confirmed_payment TO service_role;
