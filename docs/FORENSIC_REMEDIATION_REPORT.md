# McDaves Forensic Consistency Audit & Remediation Report

**Date:** 2026-08-18  
**Repository:** `mcdaves-starter` / `mcdaves-vto-forensic-fixed`  
**Status:** **REMEDIATION COMPLETE & VERIFIED**  
**Audit Scope:** Full repository forensic consistency inspection across all pages, components, layouts, metadata, constants, data schemas, API routes, and documentation.

---

## 1. Executive Summary

This forensic audit inspected the entire McDaves codebase to identify duplicated, hardcoded, contradictory, stale, and misleading business, service, product, marketing, and technical data. All identified issues have been refactored to consume a canonical **Single Source of Truth (SSOT)** configuration layer under `src/config/`.

### Key Issues Remediated
1. **Critical Customer-Facing Dummy Phone Number:** In `src/components/try-on/VTOExpressCheckoutDrawer.tsx`, the placeholder fake number (`https://wa.me/2348000000000`) was replaced with canonical `siteConfig.whatsappNumber` (`2348152346649`).
2. **Contact & Operating Hours Inconsistency:** Business hours were unified to `Monday – Friday, 9:00 AM – 5:00 PM` across `src/config/business.ts`, `site-config.ts`, `src/app/contact/page.tsx`, and JSON-LD schema.
3. **Turnaround & Delivery Timeline Contradictions:**
   - Standard lens replacement turnaround reconciled to `2–5 business days` across `/services/lens-replacement` and `HowItWorks.tsx`.
   - Delivery timelines standardized to `2–5 business days in Lagos; 5–10 business days nationwide` with Lagos pickup `Ready in 1–2 business days`.
   - Delivery fees unified to ₦2,500 standard fee, free delivery for orders ₦50,000 and above, and ₦0 pickup fee.
4. **Product Specification Conflicts:**
   - In `src/data/products.ts`, `lagos-aviator` sizes reconciled to `58□14-145`.
   - In `src/data/products.ts`, `ikoyi-cat-eye` sizes reconciled to `54□16-140`.
   - Material claims in `ProductDetailClient.tsx` made dynamic to reflect actual product materials.
5. **Hardcoded URLs & Staging Leaks:**
   - Staging portal URL `https://optisource-two.vercel.app/` centralized in `src/config/urls.ts` (`urlConfig.b2bOrderingSystemUrl`) and consumed via `ORDERING_SYSTEM_URL`.
   - Canonical base URL `https://mcdaves.com.ng` centralized in `src/config/urls.ts` and consumed across metadata and schema generators.
6. **Address Spelling Standardized:**
   - Address standardized to `4, Nnamdi Azikiwe Street, Lagos Island, Lagos, Nigeria` (display: `4, Nnamdi Azikiwe Street, Lagos, Nigeria`).

---

## 2. Before-and-After Remediation Matrix

| Category | Item | Pre-Remediation State | Post-Remediation (Canonical SSOT) | Verified Location |
| :--- | :--- | :--- | :--- | :--- |
| **Contact** | WhatsApp Checkout Drawer | Hardcoded `2348000000000` | Sourced from `siteConfig.whatsappNumber` (`2348152346649`) | `VTOExpressCheckoutDrawer.tsx:164` |
| **Contact** | Operating Hours | `Mon–Sat 8:00 AM – 6:00 PM` in `/contact` | Sourced from `siteConfig.hours` (`Monday – Friday, 9:00 AM – 5:00 PM`) | `contact/page.tsx:85` |
| **Contact** | Physical Address | `4, Nnamdi Azikwe Street` | `4, Nnamdi Azikiwe Street, Lagos, Nigeria` | `src/config/business.ts` |
| **Services** | Lens Turnaround | `5–7 day turnaround` vs `2–4 day` | Standardized to `2–5 day turnaround` | `HowItWorks.tsx:25`, `lens-replacement/page.tsx:185` |
| **Services** | Delivery Timelines | 4 differing versions | Standardized to `2–5 business days Lagos, 5–10 business days nationwide` | `src/config/services.ts`, `checkout/page.tsx:40`, `faq/page.tsx:53` |
| **Services** | Delivery Fee Structure | Divergent zone fees in drawer vs checkout | Standardized: ₦2,500 fee, Free ≥ ₦50k, Pickup ₦0 | `src/config/services.ts`, `checkout/page.tsx:41` |
| **Product** | Lagos Aviator Size | `sizes: 58□14-145` vs `frameSize: 58□14-135` | Unified to `58□14-145` (Admin & database dynamic) | `products.ts:80`, `products.ts:95` |
| **Product** | Ikoyi Cat-Eye Size | `sizes: 54□16-140` vs `frameSize: 50□16-140` | Unified to `54□16-140` (Admin & database dynamic) | `products.ts:111`, `products.ts:126` |
| **Product** | Spring Hinges Claim | `German engineered spring hinges` | Aligned to `Precision spring hinges` | `products.ts:53`, `repository.ts:45` |
| **Marketing** | Blanket Material Claim | Static "100% Genuine Handcrafted Acetate & Premium Alloys" | Dynamic: `100% Genuine {selectedVariant.effectiveMaterial}` | `ProductDetailClient.tsx:317` |
| **URLs** | Staging Vercel URL | Hardcoded in `Footer.tsx` & `b2b-products.ts` | Configurable: `urlConfig.b2bOrderingSystemUrl` | `src/config/urls.ts`, `Footer.tsx:37` |
| **URLs** | Canonical Domain | Hardcoded `https://mcdaves.com.ng` in 18+ files | Sourced from `urlConfig.productionBaseUrl` | `layout.tsx`, `our-story`, `pro/*`, `faq` |

---

## 3. Brand Architecture Matrix

| Entity | Role | Relationship | Customer Type | Canonical URL / Route |
| :--- | :--- | :--- | :--- | :--- |
| **McDaves** / **McDaves Optical** | Parent Brand & Optical Enterprise (Est. 1997) | Parent / Originating Business | General / Corporate | `https://mcdaves.com.ng` |
| **Sightly** | Consumer Eyewear Collection | B2C Eyewear Brand by McDaves | B2C Consumers | `https://mcdaves.com.ng/shop` |
| **McDaves Optical Supplies** / **McDaves Pro** | Optical Materials & Lab Wholesale | Dedicated B2B Division | Optical Labs, Opticians, Practices | `https://mcdaves.com.ng/pro` |
| **OptiSource** | Digital B2B Ordering & Prescription Portal | Dedicated Trade Platform | Trade Account Holders | Configurable B2B URL |

---

## 4. Single Source of Truth (SSOT) Architecture

```
src/config/
├── index.ts          # Central SSOT re-exports
├── business.ts       # Brand identity, legal names, contact numbers, structured hours, address
├── services.ts       # Service tiers, turnaround times, delivery fees, return & warranty policies
├── products.ts       # Reconciled canonical Sightly product catalog and optical specifications
└── urls.ts           # Production domain, B2B ordering portal URL, URL helper functions
```

`src/data/site-config.ts` imports and re-exports directly from `src/config/` to maintain 100% backward compatibility for all existing imports.

---

## 5. Verification Test Results

### 1. Automated Business Consistency Test Suite (`scripts/validate-business-consistency.js`)
```text
🔍 [1/5] Checking for forbidden dummy/placeholder numbers in src/ ...
  ✅ PASS: Zero instances of dummy placeholder phone 2348000000000 across entire src/

🔍 [2/5] Checking for hardcoded staging URL leaks in UI components ...
  ✅ PASS: Zero hardcoded raw staging URLs in UI components (must consume canonical config)

🔍 [3/5] Validating SSOT business configuration completeness ...
  ✅ PASS: Canonical business.ts config file exists
  ✅ PASS: Canonical WhatsApp/Phone number is 2348152346649
  ✅ PASS: Canonical address is 4, Nnamdi Azikiwe Street
  ✅ PASS: Canonical operating hours structured
  ✅ PASS: Canonical email is mcdavesopticals@gmail.com

🔍 [4/5] Validating Services & Delivery Configuration ...
  ✅ PASS: Canonical services.ts config file exists
  ✅ PASS: Standard delivery fee is ₦2,500
  ✅ PASS: Free delivery threshold is ₦50,000
  ✅ PASS: Standard delivery timeline is 2–5 business days

🔍 [5/5] Validating Product Sizing Specification Formats ...
  ✅ PASS: Product catalog file exists
  ✅ PASS: Found 7 valid optical dimension specifications

─────────────────────────────────────────────────────────────────
Audit Summary: 13 assertions passed, 0 failed.
✅ ALL FORENSIC CONSISTENCY CHECKS PASSED PERFECTLY!
```

### 2. TypeScript Compilation Check
- `tsc --noEmit` on `mcdaves-starter`: **PASSED (0 errors)**.
- `tsc --noEmit` on `mcdaves-admin`: **PASSED (0 errors)**.

### 3. VTO Pipeline Test Suite (`scripts/test_vto_pipeline.js`)
- 12/12 automated assertions: **PASSED (0 errors)**.

### 4. Production Next.js Build (`next build`)
- 32 static & dynamic routes compiled clean: **PASSED (0 errors)**.
