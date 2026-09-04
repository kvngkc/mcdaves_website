---
description: System architecture boundaries for McDaves.
---

# McDaves Architecture Rules

1. **Separation of Concerns**: The frontend (`src/app`, `src/components`) must exclusively handle presentation and client-side routing.
2. **Data Access Layer**: All database interactions must pass through `src/lib/commerce/repository.ts`. UI components must NEVER call Supabase directly for mutations.
3. **Transactional Boundaries**: Any operation touching Inventory and Payments simultaneously must execute via a Supabase RPC to ensure database-level atomicity.
4. **VTO Isolation**: The Virtual Try-On lab (`src/vto-lab`) must remain fully decoupled from ecommerce state.
