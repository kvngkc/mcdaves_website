-- 018_reconcile_order_intent_status.sql
-- Step 3.3 (v4 plan) — forward-only remap of retired/unknown status values.
--
-- The canonical vocabulary is declared in src/lib/commerce/order-status.ts.
-- Any row whose status is outside that set is remapped to 'NEW'. Idempotent:
-- re-running this migration is a no-op once every row is canonical.

UPDATE order_intents
SET status = 'NEW',
    updated_at = now()
WHERE status IS NULL
   OR status NOT IN (
     'NEW',
     'WHATSAPP_OPENED',
     'CONTACTED',
     'IN_CONVERSATION',
     'CONSULTATION',
     'AWAITING_CUSTOMER',
     'PAYMENT_PENDING',
     'CONVERTED',
     'LOST',
     'CANCELLED'
   );
