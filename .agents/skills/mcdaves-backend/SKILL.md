---
name: mcdaves-backend
description: >-
  Use this skill when implementing or modifying API routes, server actions, Supabase DAL access, database mutations, authentication, authorization, payment webhooks, or server-side business logic.
---

# Staff Backend Engineer

You are responsible for the Next.js API Routes and the server-side Data Access Layer.

## Authority
- You OWN: `src/app/api/` (all API routes), `src/lib/commerce/repository.ts` (DAL), `src/lib/auth/`, `src/lib/security/`, `src/lib/email.ts`.
- You do NOT OWN: database schema/RPCs (database skill), security audits (security skill), business rules (commerce skill), frontend components (frontend skill).

## Key Repository Paths
- API routes: `src/app/api/`
  - Order intents: `src/app/api/order-intents/route.ts`
  - Orders: `src/app/api/orders/route.ts`
  - Payment init: `src/app/api/pay/initialize/route.ts`
  - Payment verify: `src/app/api/pay/verify/route.ts`
  - Paystack webhook: `src/app/api/webhooks/paystack/route.ts`
  - Admin auth: `src/app/api/admin/login/route.ts`, `logout/route.ts`, `session/route.ts`
- Data Access Layer: `src/lib/commerce/repository.ts`
- Admin auth: `src/lib/auth/admin-auth.ts`
- Rate limiter: `src/lib/security/rate-limiter.ts`
- Email service: `src/lib/email.ts`

## Crucial Enforcements

You must strictly enforce this execution flow:
```
Client → Server/API → RPC / Transaction → Database
```

You must **NEVER** permit:
```
React → insert() → insert() → update()
```

All invariants in `.agents/rules/invariants.md` apply. Do not restate them here.

## Guidelines
1. **Input Validation**: All API inputs validated with `zod` before any database operation.
2. **Error Propagation**: `throw new Error(...)` on database failures. Never `console.error` without throwing.
3. **Transaction Boundaries**: Multi-table mutations must use Supabase RPCs. Do not perform sequential inserts.
4. **Idempotency**: Webhooks must handle duplicate events safely. Check payment status before processing.
5. **Authorization**: Admin routes must call `requireAdminSession(request)`. Public routes must rate-limit via `checkRateLimit()`.

## Verification
- `npm run type-check` passes.
- API route returns correct status codes: 200/201 on success, 400 on validation failure, 401 on unauthorized, 429 on rate limit, 500 on server error.
- Error messages do not leak internal details (no stack traces, no SQL errors to client).
- Webhook endpoint verifies HMAC signature before trusting payload.

## When Things Go Wrong
- If a database operation fails: the error must propagate to the API consumer as a 500. Check `repository.ts` for error handling.
- If authentication fails: return 401 immediately. Do not proceed with the operation.
- If you need a new RPC: delegate to the `mcdaves-database` skill.
