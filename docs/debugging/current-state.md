# McDaves Platform — Verified Recovery State Checkpoint

> **Document Type:** Debugging & Forensic State Recovery Checkpoint  
> **Timestamp:** 2026-08-20T11:20:00+01:00  
> **Workspace Root:** `c:/Users/KC/Downloads/mcdaves-vto-forensic-fixed`  
> **Git Head (mcdaves-starter):** `9c73949` (`docs: update TESTING_DOCUMENT.md with hands-on tester walkthrough for user`)  
> **Git Head (mcdaves-admin):** `60d2d4c` (`chore(deploy): trigger fresh live admin build`)  
> **Recovery Status:** **VERIFIED CHECKPOINT — APPLICATION CODE FROZEN**  

---

## 1. Problem Statement

The platform underwent a comprehensive forensic audit revealing critical vulnerabilities in:
1. **Data Durability & Isolation**: An in-memory singleton `CommerceRepository` operated as the primary data store, using fire-and-forget `.then()` calls to Supabase, risking silent data loss on serverless cold starts.
2. **Security & Boundaries**: Lack of `server-only` boundary on Supabase database modules, absence of Supabase Row-Level Security (RLS) policies on core tables, and unvalidated client-side endpoints.
3. **Missing Persistence Entities**: Financial transactions (`payments`), prescription lens requests (`lens_requests`), and 3D VTO calibrations (`vto_asset_calibrations`) had no PostgreSQL table schema.
4. **Payment & Inventory Integrity**: Non-atomic read-then-write inventory decrements during webhook execution (TOCTOU race conditions) and client-supplied pricing at checkout.

---

## 2. Observed Symptoms & Failure Modes

* `CommerceRepository` in-memory maps reset to seed data on every cold start or redeployment in serverless environments.
* Client components importing `commerceRepository` pulled server database code and full seed datasets into the browser bundle.
* Supabase database tables (`products`, `variants`, `orders`, etc.) were open to anonymous read/write if accessed with the public anon key due to missing RLS.
* Payments and optical prescription requests existed purely in memory and were lost upon application process termination.
* Inventory updates during Paystack `charge.success` webhooks were vulnerable to race conditions under concurrent orders.

---

## 3. Confirmed Root Causes

* **[CONFIRMED] In-Memory Primary State**: `CommerceRepository` used `Map<string, T>` as the source of truth for reads, with un-awaited write-behind promises to Supabase.
* **[CONFIRMED] Incomplete Database Schema**: PostgreSQL schema in `supabase/schema.sql` lacked definitions for `payments`, `lens_requests`, and `vto_asset_calibrations`.
* **[CONFIRMED] Missing RLS Security**: No Row-Level Security policies existed in the repository schema to restrict anonymous access.
* **[CONFIRMED] Product ID Discrepancy**: Product IDs diverged between `src/data/products.ts` (`sightly-001`) and `src/lib/commerce/repository.ts` (`prod-sightly-001`).

---

## 4. Suspected / Unconfirmed Causes

* **[SUSPECTED] Checkout Price Manipulation**: Potential risk of client-supplied cart totals being passed to payment initialization without authoritative server-side recalculation against database variant prices.
* **[SUSPECTED] Concurrency Race Condition in Webhooks**: High-frequency simultaneous payments for low-stock items could cause overselling without a PostgreSQL atomic stored procedure (`decrement_variant_stock`).
* **[SUSPECTED] VTO Memory Leaks**: Long-running camera sessions with multiple model switches might accumulate un-disposed WebGL/Three.js geometries.

---

## 5. Evidence & Audit Artifacts

* **Session Transcript**: `C:\Users\KC\.gemini\antigravity-ide\brain\15c0d512-db49-47b6-8514-7c4ca7f2d786\.system_generated\logs\transcript.jsonl`
* **Forensic Audit Report**: `mcdaves-starter/FORENSIC_AUDIT_REPORT.md`
* **Remediation Report**: `mcdaves-starter/docs/FORENSIC_REMEDIATION_REPORT.md`
* **Implementation Plan**: `C:\Users\KC\.gemini\antigravity-ide\brain\15c0d512-db49-47b6-8514-7c4ca7f2d786\implementation_plan.md`
* **Architecture Decision Records**: `mcdaves-brain/12_DECISIONS/` (MCD-DEC-001 through MCD-DEC-008)

---

## 6. Current Implementation Status Matrix

| Subsystem / Change | Location | Present in Code? | Complete? | Verified? | Status |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Server/Client Supabase Split** | `src/lib/supabase/server.ts`, `client.ts`, `service.ts` | Yes | Yes | Yes (`tsc`) | **Complete (Phase 0)** |
| **Row-Level Security (RLS) SQL** | `supabase/rls.sql` | Yes | Yes | SQL File Ready | **Pending DB Execution** |
| **Schema Extensions (Payments, Lens, VTO)** | `supabase/migrations/001_phase0b_schema_extensions.sql` | Yes | Yes | SQL File Ready | **Pending DB Execution** |
| **Master Schema Updates** | `supabase/schema.sql` | Yes | Yes | Yes | **Complete (Phase 0B)** |
| **DAL Mappers (Payment, Lens, VTO)** | `src/lib/supabase/service.ts` | Yes | Yes | Yes (`tsc`) | **Complete (Phase 0B)** |
| **Repository Sync & Persistence** | `src/lib/commerce/repository.ts` | Yes | Yes | Yes (`tsc`) | **Complete (Phase 0B)** |
| **Product ID Alignment** | `src/data/products.ts` | Yes | Yes | Yes (`tsc`) | **Complete (Phase 0B)** |
| **Server-Side Price Authority** | `src/app/api/pay/initialize/route.ts` | Partial | No | No | **Pending (Phase 1)** |
| **PostgreSQL Atomic Inventory Function** | `supabase/migrations/` (RPC function) | No | No | No | **Pending (Phase 1)** |
| **Unified Payment Verification** | `src/app/api/pay/verify/route.ts` & webhook | Partial | No | No | **Pending (Phase 1)** |
| **Checkout Wizard Decomposition** | `src/app/checkout/page.tsx` | No | No | No | **Pending (Phase 1)** |

---

## 7. Reproduction & Verification Procedure

1. **Static Type Checking**:
   * `mcdaves-starter`: `npm run type-check` (`tsc --noEmit`) $\to$ **Exit code 0 (0 errors)**.
   * `mcdaves-admin`: `npm run type-check` (`tsc --noEmit`) $\to$ **Exit code 0 (0 errors)**.
2. **Business Consistency Validation**:
   * `node scripts/validate-business-consistency.js` $\to$ **13/13 assertions passed**.
3. **VTO Pipeline Test Suite**:
   * `node scripts/test_vto_pipeline.js` $\to$ **12/12 assertions passed**.

---

## 8. Remaining / Unresolved Issues

1. **Phase 1 Implementation Not Started**:
   * Authoritative server-side price calculation in `/api/pay/initialize`.
   * Atomic inventory decrement stored function (`decrement_variant_stock`).
   * Idempotent payment verification and reconciliation.
   * Modularization of 834-line `checkout/page.tsx`.
2. **Database SQL Migrations**:
   * `001_phase0b_schema_extensions.sql` and `rls.sql` need to be applied to the remote Supabase database instance.

---

## 9. Next Recommended Action

**DO NOT IMPLEMENT YET.** Present the recovery report to the user and obtain explicit authorization before proceeding with **Phase 1: Payment and Inventory Integrity**.
