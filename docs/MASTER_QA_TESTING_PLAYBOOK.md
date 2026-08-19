# McDaves Platform — Master Manual & Automated QA Testing Playbook

> **Audit Standard:** NEPA × EFCC × Forensic Accounting QA Interrogation  
> **Golden Rule:** `Test → Record Failure → Group Failures → Diagnose → Fix → Regression Test`  
> **Valid Test Statuses:** `PASS` | `FAIL` | `BLOCKED` | `NOT TESTED`

---

## 📑 Test Session Index

1. [Session 1: Baseline, Homepage, Navigation & Static Pages](#session-1-baseline-homepage-navigation--static-pages)
2. [Session 2: Catalog & Product CRUD Lifecycle](#session-2-catalog--product-crud-lifecycle)
3. [Session 3: Storage Buckets & Image Pipeline](#session-3-storage-buckets--image-pipeline)
4. [Session 4: 3D Virtual Try-On (VTO) & Asset Resolution](#session-4-3d-virtual-try-on-vto--asset-resolution)
5. [Session 5: Commerce Engine, Cart & Checkout](#session-5-commerce-engine-cart--checkout)
6. [Session 6: Admin Operations, Security & Persistence](#session-6-admin-operations-security--persistence)
7. [Session 7: Mobile Responsiveness, Edge Cases & SEO](#session-7-mobile-responsiveness-edge-cases--seo)

---

## Session 1: Baseline, Homepage, Navigation & Static Pages

### Test Cases & Procedures

| Test ID | Area | Action / Procedure | Expected Result | Pass/Fail Criteria |
|---|---|---|---|---|
| **ENV-001** | Infrastructure | Open root URL (`/`) in clean browser window | Server responds with HTTP 200 within $< 2000\text{ms}$ | Status == 200, no unhandled hydration exceptions |
| **ENV-005** | Assets | Request `/favicon.ico` and `/manifest.json` | Both files resolve with HTTP 200 OK | Favicon & Manifest load cleanly |
| **ENV-009** | Routing | Directly navigate to all 15 core application routes | Every route responds with HTTP 200 or canonical 307/308 redirect | Zero 404s, 500s, or blank screens |
| **ENV-010** | Error Handling | Navigate to non-existent route `/probe-non-existent-404` | Renders custom branded 404 page with navigation back to `/shop` | Status == 404, branded UI displayed |
| **HOME-001** | Content | Inspect homepage hero headline and subhead | "Two Generations of Optical Precision in Lagos" rendered with proper contrast | Clear typography, no placeholder text |
| **HOME-009** | Catalog | Scroll to Featured Eyewear section | Product cards render high-res photos, title, price (₦), and Try-On button | All cards interactive with zero broken images |
| **HOME-012** | SSOT Contact | Check footer address and contact info | `4, Nnamdi Azikiwe Street, Lagos, Nigeria` & `+234 815 234 6649` | Matches `src/config/business.ts` exactly |
| **NAV-001-008** | Header Nav | Click each navigation link in header | Seamless routing to `/shop`, `/try-on`, `/services`, `/about`, `/contact`, `/faq`, `/pro` | URL updates, target page loads in $< 300\text{ms}$ |
| **STATIC-001-010** | Policy Pages | Navigate to `/about`, `/services`, `/privacy`, `/terms`, `/shipping-returns`, `/pro/order` | All policy documents render standardized Nigerian delivery rules (₦2,500 standard / Free $\ge$ ₦50,000) | Zero broken links or missing legal sections |

---

## Session 2: Catalog & Product CRUD Lifecycle

### Step-by-Step Manual Test Workflow

1. **Step 2.1 — Access Admin Catalog:**
   * Navigate to `http://localhost:3001` (or live admin domain) and open **Products & Catalog**.
2. **Step 2.2 — Create New Eyewear Frame:**
   * Click **+ New Product**.
   * Enter: Name: `Victoria Island Classic`, Slug: `victoria-island-classic`, Category: `Unisex`, Price: `₦48,000`, Material: `Handcrafted Mazzucchelli Acetate`, Frame Size: `52□19-145`.
3. **Step 2.3 — Upload Product Photography:**
   * Upload front-facing photo and side lifestyle photo.
   * Verify uploaded image previews immediately.
4. **Step 2.4 — Link Variant & SKUs:**
   * Add Variant `Dark Amber Tortoise` (`#7B3F00`), Stock: `15`, SKU: `VIC-AMB-01`.
   * Click **Save Product**.
5. **Step 2.5 — Storefront Verification:**
   * Open `http://localhost:3000/shop`.
   * **Verification:** `Victoria Island Classic` appears in the shop grid with image, price, and color swatch.
6. **Step 2.6 — Dynamic Slug & Refresh Test (Zero 404 Guarantee):**
   * Click on the card to open `http://localhost:3000/shop/victoria-island-classic`.
   * **Verification:** Page loads with HTTP 200 OK.
   * **Hard Refresh (`Ctrl + F5`):** Page reloads with HTTP 200 OK (no 404).

---

## Session 3: Storage Buckets & Image Pipeline

| Test ID | Area | Procedure | Expected Outcome |
|---|---|---|---|
| **IMG-001** | Storage | Check Supabase bucket `product-media` | Public read access enabled, Max file size 10MB |
| **IMG-002** | Upload | Upload PNG, JPEG, and WebP frame images via Admin | File uploaded to bucket, returns valid public CDN URL |
| **IMG-003** | CDN Cache | Load image URL across different browsers | Image returns HTTP 200 with appropriate caching headers |
| **IMG-004** | DB Association | Inspect `product_media` table | Row created with valid `product_id`, `variant_id`, `type`, `url` |

---

## Session 4: 3D Virtual Try-On (VTO) & Asset Resolution

### VTO Interrogation Protocol

```text
[VTO Launch] -> [Camera Permission] -> [MediaPipe Mesh Init] -> [3D Glasses Anchor] -> [Face Motion & Head Rotation] -> [Temple Arm Clipping]
```

1. **Step 4.1 — VTO Launch & Permission:**
   * Navigate to `http://localhost:3000/try-on` or click **Virtual Try-On** on any PDP.
   * Grant webcam access when prompted.
   * **Assertion:** Video feed starts within $< 800\text{ms}$; 3D glasses anchor to nasal bridge.
2. **Step 4.2 — 6-DOF Head Pose Tracking:**
   * **Yaw (Left/Right $\pm 45^\circ$):** Frame rotates with face; nasal bridge alignment maintained.
   * **Pitch (Up/Down $\pm 30^\circ$):** Frame tilts naturally with nose angle.
   * **Roll (Tilt Head $\pm 30^\circ$):** Frame matches eye horizon.
   * **Z-Distance (Move Closer/Farther):** Frame scales smoothly without snapping.
3. **Step 4.3 — Temple Arm Clipping Verification:**
   * Turn head $35^\circ$ to the side.
   * **Assertion:** The temple arm disappears cleanly behind the ear plane without protruding unnaturally into the 3D space behind the head.
4. **Step 4.4 — 2D Photo $\to$ 3D GLB Ingestion Test:**
   * In Admin, upload a 2D front photo to **Generate 3D Model**.
   * Verify server extrudes 2.5D mesh with $3.5\text{ mm}$ acetate thickness and ergonomic $R = 145\text{ mm}$ face-wrap.
   * Test the generated model in VTO: renders with realistic front texture and transparent optical lenses.

---

## Session 5: Commerce Engine, Cart & Checkout

### Test Matrix

| Test ID | Scenario | Input | Expected Output |
|---|---|---|---|
| **CART-001** | Add to Cart | Click **Add to Cart** on `/shop/island-classic` | Cart drawer opens; item added with quantity 1, correct color, and price |
| **CART-002** | Quantity Controls | Click `+` and `-` buttons in cart | Subtotal updates dynamically; removing last item empties cart gracefully |
| **CART-003** | LocalStorage Persistence | Add item, navigate to `/about`, refresh page | Cart retains items and quantities across refreshes and tab reloads |
| **CHK-001** | Standard Delivery Fee | Cart total $< ₦50,000$, select Lagos Delivery | Delivery fee adds **₦2,500** to subtotal |
| **CHK-002** | Free Delivery Threshold | Cart total $\ge ₦50,000$, select Lagos Delivery | Delivery fee automatically drops to **₦0 (Free Delivery)** |
| **CHK-003** | Lagos Island Pickup | Select **Pickup at Lagos Hub** | Delivery fee is **₦0**; pickup address (`4, Nnamdi Azikiwe St`) displayed |
| **CHK-004** | Paystack Integration | Click **Pay via Paystack** | Paystack popup opens with exact calculated total in NGN |
| **CHK-005** | WhatsApp Order Routing | Click **Order via WhatsApp** | Opens `https://wa.me/2348152346649` with pre-filled itemized order manifest |

---

## Session 6: Admin Operations, Security & Persistence

1. **Passcode Protection:**
   * Access `/` on Admin port (`3001`).
   * Entering invalid passkey blocks access with HTTP 401.
   * Entering valid passkey grants session token and opens dashboard.
2. **Order Intake & Lead Tracking:**
   * Placing a test order on the storefront registers immediately in the Admin **Order Intents** table.
3. **Inventory Auto-Depletion:**
   * Completing a checkout decrements `product_variants.units_in_stock` by the ordered quantity.
   * When stock reaches 0, variant status updates to `OUT_OF_STOCK`.

---

## Session 7: Mobile Responsiveness, Edge Cases & SEO

1. **Mobile Breakpoints:**
   * Test at $375\text{px}$ (iPhone SE), $390\text{px}$ (iPhone 14/15), and $768\text{px}$ (iPad).
   * Header collapses into clean slide-out mobile navigation drawer.
   * VTO controls and Express Checkout drawer adapt to touch viewports.
2. **SEO & Metadata Integrity:**
   * Every page contains canonical URL tag, unique title, and meta description.
   * JSON-LD `OpticalShop` and `Product` schemas present and valid.

---

## 🤖 Automated Regression Runner

To run the complete automated 39-point regression test suite locally at any time:

```bash
cd mcdaves-starter
node scripts/master-qa-full-regression.mjs
```
