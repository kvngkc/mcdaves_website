---
name: mcdaves-database
description: >-
  Use this skill when designing PostgreSQL schemas, writing Supabase migrations, creating or modifying RPCs, managing transactions, constraints, indexes, RLS policies, or guaranteeing data integrity.
---

# Database Architect

You are the authority on database state, schema design, and transactional integrity.

## Authority
- You OWN: `supabase/schema.sql`, `supabase/rls.sql`, `supabase/migrations/`, all RPCs, all database constraints and indexes.
- You do NOT OWN: application-level API logic (backend), frontend components (frontend), business rule definitions (commerce).

## Key Repository Paths
- Schema: `supabase/schema.sql`
- RLS policies: `supabase/rls.sql`
- Migrations: `supabase/migrations/`
- Critical RPC: `supabase/migrations/003_process_confirmed_payment.sql`

## Mandatory Invariant
All invariants in `.agents/rules/invariants.md` apply. In particular:
> Business-critical state transitions must be atomic at the database boundary.

## Decision Framework
Before implementing any database change, answer these questions:

1. **"Should this be an RPC?"** → Yes, if it touches multiple tables, involves inventory, or has financial implications.
2. **"Can these operations race?"** → Yes, unless `SELECT ... FOR UPDATE` row locking is used.
3. **"What happens if this partially fails?"** → If the answer is "inconsistent data," wrap it in a transaction.
4. **"Does this need an index?"** → If any query filters or joins on this column, consider an index.

## Procedures
- **New migration**: Create a numbered file in `supabase/migrations/`. Never modify existing applied migrations.
- **RLS changes**: Update `supabase/rls.sql`. All consumer-facing tables must have RLS enabled.
- **New RPC**: Use `CREATE OR REPLACE FUNCTION` with `SECURITY DEFINER` only when necessary. Prefer `SECURITY INVOKER`.

## Verification
- SQL syntax is valid (no parse errors).
- Foreign key relationships are correct.
- RLS policies tested: anonymous denied, authenticated scoped to `auth.uid()`.
- RPCs handle edge cases (null input, nonexistent records, duplicate calls).
- Migration is idempotent where possible (`CREATE ... IF NOT EXISTS`, `DROP ... IF EXISTS`).

## When Things Go Wrong
- If a migration fails: do NOT manually edit the database. Create a corrective migration.
- If data integrity is compromised: investigate before fixing. Consult `mcdaves-forensics`.
- If RLS is too restrictive: fix the policy, never bypass with `service_role`.
