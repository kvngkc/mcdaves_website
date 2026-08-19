# McDaves Platform — Master Manual QA Testing Document

**Audit Standard:** NEPA × EFCC × Forensic Accounting Level of Interrogation  
**Golden Rule:** Test → Record Failure → Group Failures → Diagnose → Fix → Regression Test  
**Valid Statuses:** `PASS` | `FAIL` | `BLOCKED` | `NOT TESTED`

---

## 📋 Failure Capture Template
For any failed test, record:
* **Test ID:**
* **What you did:**
* **What you expected:**
* **What actually happened:**
* **URL:**
* **Browser / Device:**
* **Console error (F12):**
* **Severity (P0 / P1 / P2 / P3):**

---

# Phase 1: Environment & Setup

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **ENV-001** | Production URL Availability | Visit live URL | Site loads $< 2\text{s}$, no SSL errors | `[ ]` | 🔴 P0 | |
| **ENV-002** | Local Dev Storefront | Visit `http://localhost:3000` | Storefront boots with 200 OK | `[ ]` | 🔴 P0 | |
| **ENV-003** | Local Dev Admin | Visit `http://localhost:3001` | Admin boots with 200 OK | `[ ]` | 🔴 P0 | |
| **ENV-004** | Environment Variables | Inspect `.env.local` | Supabase URL, anon key, service key present | `[ ]` | 🔴 P0 | |
| **ENV-005** | Favicon & Manifest | Check `/favicon.ico` & `/manifest.json` | Both return 200 OK with McDaves branding | `[ ]` | 🟡 P3 | |
| **ENV-006** | Console Hygiene | Open DevTools console on `/` | Zero unhandled red errors | `[ ]` | 🟠 P2 | |
| **ENV-007** | Supabase Connection | Test live query | Connected to database without timeout | `[ ]` | 🔴 P0 | |
| **ENV-008** | Storage Buckets Exist | Check `product-media` & `vto-models` | Both buckets public and accessible | `[ ]` | 🔴 P0 | |
| **ENV-009** | Direct Route Navigation | Direct hit all 15 routes | All return 200 OK (no 404/500) | `[ ]` | 🔴 P1 | |
| **ENV-010** | Custom 404 Page | Visit `/random-fake-url-12345` | Branded 404 with link to `/shop` | `[ ]` | 🟡 P3 | |

---

# Phase 2: Homepage

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **HOME-001** | Hero Headline | Inspect hero on `/` | "Two Generations of Optical Precision" | `[ ]` | 🔴 P1 | |
| **HOME-002** | Hero CTA 1 (Shop) | Click **Explore Collection** | Navigates to `/shop` | `[ ]` | 🔴 P1 | |
| **HOME-003** | Hero CTA 2 (VTO) | Click **Virtual Try-On** | Navigates to `/try-on` | `[ ]` | 🔴 P1 | |
| **HOME-004** | Trust Badges | Inspect trust section | 25+ Years, Made in Lagos, Optical Glazing | `[ ]` | 🟠 P2 | |
| **HOME-005** | Sightly Showcase | Scroll to Consumer section | Sightly collection cards display properly | `[ ]` | 🔴 P1 | |
| **HOME-006** | Lens Replacement Teaser | Scroll to Services section | Starting price ₦15,000, link to `/services` | `[ ]` | 🔴 P1 | |
| **HOME-007** | B2B Wholesale Banner | Scroll to B2B section | McDaves Pro callout, link to `/pro` | `[ ]` | 🔴 P1 | |
| **HOME-008** | Optical Heritage Story | Read heritage blurb | Founded 1997, 4 Nnamdi Azikiwe St | `[ ]` | 🟡 P3 | |
| **HOME-009** | Featured Products Grid | Check product cards | Images load, prices in ₦, Try-On button | `[ ]` | 🔴 P1 | |
| **HOME-010** | Customer Reviews / Social | Inspect testimonials | Real/formatted reviews, no placeholder lorem | `[ ]` | 🟡 P3 | |
| **HOME-011** | Newsletter / Lead Capture | Enter test email | Success message, email captured | `[ ]` | 🟠 P2 | |
| **HOME-012** | Footer Physical Address | Check footer | `4, Nnamdi Azikiwe Street, Lagos, Nigeria` | `[ ]` | 🔴 P1 | |

---

# Phase 3: Global Navigation & Header/Footer

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **NAV-001** | Header Logo Click | Click logo from any subpage | Navigates to `/` | `[ ]` | 🔴 P1 | |
| **NAV-002** | Shop Link | Click **Shop** | Opens `/shop` | `[ ]` | 🔴 P1 | |
| **NAV-003** | Virtual Try-On Link | Click **Try-On** | Opens `/try-on` | `[ ]` | 🔴 P1 | |
| **NAV-004** | Lens Replacement Link | Click **Services** | Opens `/services` | `[ ]` | 🔴 P1 | |
| **NAV-005** | About / Our Story Link | Click **Our Story** | Opens `/about` or `/our-story` | `[ ]` | 🔴 P1 | |
| **NAV-006** | Contact Link | Click **Contact** | Opens `/contact` | `[ ]` | 🔴 P1 | |
| **NAV-007** | FAQ Link | Click **FAQ** | Opens `/faq` | `[ ]` | 🟠 P2 | |
| **NAV-008** | B2B / Pro Portal Link | Click **McDaves Pro** | Opens `/pro` | `[ ]` | 🔴 P1 | |
| **NAV-009** | Cart Drawer Icon | Click Cart icon | Cart drawer slides out from right | `[ ]` | 🔴 P1 | |
| **NAV-010** | Mobile Hamburger Menu | View on mobile, click ☰ | Menu slides out with all navigation links | `[ ]` | 🔴 P1 | |

---

# Phase 4: Static & Information Pages

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **STATIC-001** | About Page (`/about`) | Visit `/about` | Renders heritage, Lagos roots, 20+ yrs | `[ ]` | 🔴 P1 | |
| **STATIC-002** | Contact Page (`/contact`) | Visit `/contact` | Phone (+234 815 234 6649), email, map | `[ ]` | 🔴 P1 | |
| **STATIC-003** | FAQ Page (`/faq`) | Visit `/faq` | Accordions expand/collapse smoothly | `[ ]` | 🟠 P2 | |
| **STATIC-004** | Services Index (`/services`) | Visit `/services` | Lens replacement & repairs detailed | `[ ]` | 🔴 P1 | |
| **STATIC-005** | Lens Replacement (`/services/lens-replacement`) | Visit `/services/lens-replacement` | Tiers: Single Vision (₦15k), Blue Cut (₦22k), etc. | `[ ]` | 🔴 P1 | |
| **STATIC-006** | Privacy Policy (`/privacy`) | Visit `/privacy` | NDPR compliance, data privacy terms | `[ ]` | 🟠 P2 | |
| **STATIC-007** | Terms of Service (`/terms`) | Visit `/terms` | Standard Nigerian commercial terms | `[ ]` | 🟠 P2 | |
| **STATIC-008** | Shipping & Returns (`/shipping-returns`) | Visit `/shipping-returns` | ₦2,500 Lagos, Free $\ge$ ₦50k, 14-day remake | `[ ]` | 🔴 P1 | |
| **STATIC-009** | B2B Wholesale (`/pro`) | Visit `/pro` | Optical practitioner catalog & bulk perks | `[ ]` | 🔴 P1 | |
| **STATIC-010** | B2B Ordering (`/pro/order`) | Visit `/pro/order` | Direct optical practice order portal | `[ ]` | 🔴 P1 | |

---

# Phase 5: Product Catalog & Listing (Public)

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **PROD-001** | Shop Page Grid | Visit `/shop` | All active products render with images | `[ ]` | 🔴 P0 | |
| **PROD-002** | Product Card Data | Inspect product card | Title, price (₦), category, color dots | `[ ]` | 🔴 P1 | |
| **PROD-003** | Color Swatch Switch | Click color dot on card | Card photo switches to variant color | `[ ]` | 🟠 P2 | |
| **PROD-004** | Category Filter | Click **Men** / **Women** / **Unisex** | Grid filters immediately | `[ ]` | 🔴 P1 | |
| **PROD-005** | Price Sorting | Sort by Price: Low to High | Cards reorder in ascending price | `[ ]` | 🟠 P2 | |
| **PROD-006** | Product Card Click | Click product card | Opens `/shop/[slug]` | `[ ]` | 🔴 P0 | |
| **PROD-007** | PDP Data Accuracy | Inspect `/shop/[slug]` | Name, description, price, specs match DB | `[ ]` | 🔴 P0 | |
| **PROD-008** | PDP Image Gallery | Click thumbnail images | Main image switches smoothly | `[ ]` | 🔴 P1 | |
| **PROD-009** | PDP Variant Selector | Switch color radio/swatch | SKU, price, and images update | `[ ]` | 🔴 P1 | |
| **PROD-010** | PDP Hard Refresh | Press `Ctrl + F5` on `/shop/[slug]` | Page reloads with 200 OK (Zero 404) | `[ ]` | 🔴 P0 | |

---

# Phase 6: Admin Product Management (`localhost:3001`)

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **ADMIN-PROD-001** | Create Product | Fill name, slug, price $\to$ Save | Product saved to Supabase `products` | `[ ]` | 🔴 P0 | |
| **ADMIN-PROD-002** | Slug Auto-Generation | Type "Lagos Aviator" | Slug auto-fills "lagos-aviator" | `[ ]` | 🟠 P2 | |
| **ADMIN-PROD-003** | Required Field Validation | Leave price empty $\to$ Save | Red error message prevents submission | `[ ]` | 🔴 P1 | |
| **ADMIN-PROD-004** | Instant Shop Visibility | Create product $\to$ check `/shop` | New product visible in `/shop` grid | `[ ]` | 🔴 P0 | |
| **ADMIN-PROD-005** | Direct Slug Access | Visit `/shop/[new-slug]` | Opens PDP with 200 OK | `[ ]` | 🔴 P0 | |
| **ADMIN-PROD-006** | Edit Existing Product | Change price from ₦30k to ₦35k | Updates in DB and on storefront | `[ ]` | 🔴 P1 | |
| **ADMIN-PROD-007** | Archive Product | Set status to `ARCHIVED` | Hidden from public `/shop` | `[ ]` | 🔴 P1 | |
| **ADMIN-PROD-008** | Frame Specs Entry | Enter `54□18-140` | Stored in `frame_width_mm`, `lens_width_mm` | `[ ]` | 🟠 P2 | |
| **ADMIN-PROD-009** | Prescription Required Toggle | Toggle switch on/off | Reflected on PDP "Prescription Eligible" | `[ ]` | 🟠 P2 | |
| **ADMIN-PROD-010** | Try-On Available Toggle | Toggle VTO available | Try-On button shows/hides on card | `[ ]` | 🔴 P1 | |

---

# Phase 7: Image Upload & Display Pipeline

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **IMG-001** | Admin Image Upload | Select PNG/JPEG in Admin | Uploads to `product-media` bucket | `[ ]` | 🔴 P0 | |
| **IMG-002** | Public CDN Link | Inspect returned image URL | Returns `https://...supabase.co/storage/...` | `[ ]` | 🔴 P0 | |
| **IMG-003** | Image Preview in Admin | Upload photo | Thumbnail displays in form immediately | `[ ]` | 🔴 P1 | |
| **IMG-004** | Storefront Image Display | Check `/shop` and `/shop/[slug]` | Uploaded image renders crisply | `[ ]` | 🔴 P0 | |
| **IMG-005** | Multiple Images (Gallery) | Upload Front, Side, Lifestyle | All 3 appear in PDP gallery | `[ ]` | 🔴 P1 | |
| **IMG-006** | Image Reordering / Primary | Set image as Primary | Primary image shows on shop card | `[ ]` | 🟠 P2 | |
| **IMG-007** | Delete Image | Click Delete on image | Removed from DB and preview | `[ ]` | 🔴 P1 | |
| **IMG-008** | Oversized Image Upload | Upload 12MB file ($> 10\text{MB}$) | Clean error: "File exceeds 10MB limit" | `[ ]` | 🟠 P2 | |
| **IMG-009** | Invalid Format Upload | Upload `.pdf` or `.exe` | Error: "Only PNG, JPG, WebP allowed" | `[ ]` | 🟠 P2 | |
| **IMG-010** | Next.js Image Optimization | Inspect `<img>` tag in browser | Served via `_next/image` with WebP/AVIF | `[ ]` | 🟡 P3 | |

---

# Phase 8: Variant Management

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **VAR-001** | Create Variant | Add `Gold / Black`, SKU `LAG-GLD-01` | Saved in `product_variants` table | `[ ]` | 🔴 P0 | |
| **VAR-002** | Color Hex Picker | Pick `#FFD700` | Hex code saved and swatch rendered | `[ ]` | 🟠 P2 | |
| **VAR-003** | Variant Stock Tracking | Set stock to `25` units | `units_in_stock` updated in DB | `[ ]` | 🔴 P1 | |
| **VAR-004** | Out of Stock Handling | Set stock to `0` | Variant shows "Out of Stock" on PDP | `[ ]` | 🔴 P1 | |
| **VAR-005** | Variant Price Override | Set variant price higher than base | PDP updates price when variant selected | `[ ]` | 🟠 P2 | |
| **VAR-006** | Variant Specific Image | Assign photo to specific variant | Switching variant switches PDP photo | `[ ]` | 🔴 P1 | |
| **VAR-007** | Variant 3D GLB Assignment | Set `glb_path` for variant | VTO loads variant-specific 3D model | `[ ]` | 🔴 P1 | |
| **VAR-008** | Delete Variant | Remove variant | Removed from PDP swatches | `[ ]` | 🔴 P1 | |

---

# Phase 9: 404 & Missing Asset Investigation

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **ASSET-001** | Missing Image Fallback | Force broken image URL | Clean SVG glasses fallback displays | `[ ]` | 🔴 P1 | |
| **ASSET-002** | Missing 3D GLB Fallback | Force missing GLB path | VTO loads fallback `/models/glasses.glb` | `[ ]` | 🔴 P0 | |
| **ASSET-003** | Catalog GLB Integrity | Inspect all products in DB | Every product has a valid `glb_path` | `[ ]` | 🔴 P0 | |
| **ASSET-004** | Bucket Existence | Check `vto-models` bucket | Bucket is active and public | `[ ]` | 🔴 P0 | |
| **ASSET-005** | Static Asset Resolution | Check `/models/glasses.glb` | Returns 200 OK (`model/gltf-binary`) | `[ ]` | 🔴 P0 | |
| **ASSET-006** | Direct PDP Refresh 404 Test | Refresh `/shop/island-classic` | Returns 200 OK (never 404) | `[ ]` | 🔴 P0 | |
| **ASSET-007** | Admin Route 404 Test | Refresh `/` on admin port | Returns 200 OK | `[ ]` | 🔴 P1 | |
| **ASSET-008** | External Hotlink Test | Load image URL in incognito | Image displays without auth block | `[ ]` | 🔴 P0 | |

---

# Phase 10: VTO — Virtual Try-On Core Engine

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **VTO-001** | VTO Page Load | Visit `/try-on` | Camera permission prompt appears | `[ ]` | 🔴 P0 | |
| **VTO-002** | Camera Access Granted | Click **Allow** on camera | Video feed starts in $< 800\text{ms}$ | `[ ]` | 🔴 P0 | |
| **VTO-003** | Camera Access Denied | Click **Block** on camera | Helpful guidance to enable permissions | `[ ]` | 🔴 P1 | |
| **VTO-004** | Face Landmark Detection | Position face in center | MediaPipe locks onto nose bridge | `[ ]` | 🔴 P0 | |
| **VTO-005** | 3D Frame Anchoring | Inspect glasses position | Glasses sit naturally across eyes & bridge | `[ ]` | 🔴 P0 | |
| **VTO-006** | Yaw Rotation (Left/Right) | Turn head left and right | Frame rotates smoothly with head | `[ ]` | 🔴 P0 | |
| **VTO-007** | Pitch Tilt (Up/Down) | Look up and look down | Frame tilts accurately | `[ ]` | 🔴 P0 | |
| **VTO-008** | Roll Tilt (Head Tilt) | Tilt head sideways | Frame rotates with eye axis | `[ ]` | 🔴 P0 | |
| **VTO-009** | Z-Distance (Lean in/out) | Move closer and farther | Frame scales naturally | `[ ]` | 🔴 P0 | |
| **VTO-010** | Temple Arm Clipping | Turn head $45^\circ$ | Temple arms do NOT poke behind ears | `[ ]` | 🔴 P0 | |
| **VTO-011** | In-Fitting Frame Carousel | Click next frame in carousel | 3D model switches in $< 400\text{ms}$ | `[ ]` | 🔴 P1 | |
| **VTO-012** | In-Fitting Color Swatch | Click different color dot | Texture/color updates on 3D frame | `[ ]` | 🔴 P1 | |

---

# Phase 11: VTO — Asset & 2D $\to$ 3D Conversion Pipeline

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **VTO-ASSET-001** | 2D Photo Ingestion | Upload 2D frame photo in Admin | `image-to-glb-builder.ts` processes image | `[ ]` | 🔴 P0 | |
| **VTO-ASSET-002** | Background Segmentation | Inspect conversion mask | Background removed, lens holes cut | `[ ]` | 🔴 P1 | |
| **VTO-ASSET-003** | 2.5D Mesh Extrusion | Inspect 3D geometry | 3.5mm acetate thickness with bevels | `[ ]` | 🔴 P1 | |
| **VTO-ASSET-004** | Face-Wrap Curvature | Check side view of 3D frame | Ergonomic curve ($R = 145\text{ mm}$) | `[ ]` | 🔴 P1 | |
| **VTO-ASSET-005** | Optical Glass Lenses | Check lens apertures in 3D | Transparent lenses with subtle sheen | `[ ]` | 🟠 P2 | |
| **VTO-ASSET-006** | File Size Compression | Check generated GLB size | File size $< 300\text{ KB}$ | `[ ]` | 🔴 P1 | |
| **VTO-ASSET-007** | Upload Raw GLB | Upload 3D `.glb` from Blender | `glb-optimizer.ts` prunes & welds | `[ ]` | 🔴 P1 | |
| **VTO-ASSET-008** | Pre-Warming Cache | Load VTO page | Models pre-warm in memory | `[ ]` | 🟠 P2 | |

---

# Phase 12: Cart & Mini-Cart

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **CART-001** | Add to Cart from PDP | Click **Add to Cart** | Drawer opens, item added | `[ ]` | 🔴 P0 | |
| **CART-002** | Cart Item Details | Inspect cart item | Image, name, color, unit price, quantity | `[ ]` | 🔴 P0 | |
| **CART-003** | Quantity Increment (`+`) | Click `+` button | Quantity = 2, subtotal doubles | `[ ]` | 🔴 P1 | |
| **CART-004** | Quantity Decrement (`-`) | Click `-` button | Quantity = 1, subtotal updates | `[ ]` | 🔴 P1 | |
| **CART-005** | Remove Item | Click Trash icon | Item removed, empty state shown | `[ ]` | 🔴 P1 | |
| **CART-006** | LocalStorage Persistence | Add item $\to$ refresh page | Item remains in cart | `[ ]` | 🔴 P0 | |
| **CART-007** | Multiple Different Products | Add Frame A and Frame B | Both appear with separate line items | `[ ]` | 🔴 P1 | |
| **CART-008** | Subtotal Calculation | Add ₦35k and ₦45k frames | Subtotal displays exactly ₦80,000 | `[ ]` | 🔴 P0 | |
| **CART-009** | Free Shipping Progress | Subtotal = ₦35k | Shows "Add ₦15,000 for Free Delivery" | `[ ]` | 🟠 P2 | |
| **CART-010** | Checkout Button | Click **Proceed to Checkout** | Navigates to `/checkout` | `[ ]` | 🔴 P0 | |

---

# Phase 13: Checkout & Payment

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **CHK-001** | Checkout Page Load | Visit `/checkout` with items | Order summary and shipping form load | `[ ]` | 🔴 P0 | |
| **CHK-002** | Lagos Standard Delivery | Select Lagos Delivery ($< ₦50\text{k}$) | Adds **₦2,500** delivery fee | `[ ]` | 🔴 P0 | |
| **CHK-003** | Free Delivery Rule | Select Lagos Delivery ($\ge ₦50\text{k}$) | Delivery fee displays **₦0 (Free)** | `[ ]` | 🔴 P0 | |
| **CHK-004** | Nationwide Delivery | Select Nationwide Delivery | Adds nationwide delivery fee | `[ ]` | 🔴 P1 | |
| **CHK-005** | Lagos Hub Pickup | Select Pickup at Practice | Delivery fee is **₦0**; shows address | `[ ]` | 🔴 P1 | |
| **CHK-006** | Form Validation | Submit with empty name/phone | Red error highlights required fields | `[ ]` | 🔴 P1 | |
| **CHK-007** | Paystack Popup Launch | Click **Pay via Paystack** | Paystack modal opens with exact total | `[ ]` | 🔴 P0 | |
| **CHK-008** | Paystack Successful Payment | Complete test card payment | Redirects to `/payment/success` | `[ ]` | 🔴 P0 | |
| **CHK-009** | WhatsApp Checkout | Click **Order on WhatsApp** | Opens WhatsApp chat with order manifest | `[ ]` | 🔴 P0 | |
| **CHK-010** | WhatsApp Phone Number | Check WhatsApp link | Routes to `+2348152346649` | `[ ]` | 🔴 P0 | |
| **CHK-011** | Order Intent Stored | Place test order | Lead saved in Supabase `order_intents` | `[ ]` | 🔴 P1 | |
| **CHK-012** | Cart Cleared on Success | Finish successful payment | Cart emptied automatically | `[ ]` | 🔴 P1 | |

---

# Phase 14: Admin Dashboard & Order Management

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **ADMIN-001** | Admin Authentication | Enter passkey | Access granted, dashboard loads | `[ ]` | 🔴 P0 | |
| **ADMIN-002** | Invalid Passkey | Enter wrong passkey | Access denied (401 Unauthorized) | `[ ]` | 🔴 P1 | |
| **ADMIN-003** | Order Intents Tab | Click **Order Intents** | List of customer leads displays | `[ ]` | 🔴 P1 | |
| **ADMIN-004** | Orders Tab | Click **Orders** | Completed transactions display | `[ ]` | 🔴 P1 | |
| **ADMIN-005** | Order Status Update | Change status to `DELIVERED` | Status updates in database | `[ ]` | 🔴 P1 | |
| **ADMIN-006** | Customer Details View | Click order row | Full address, phone, item list visible | `[ ]` | 🔴 P1 | |
| **ADMIN-007** | Inventory Stock Count | Check stock count in table | Matches real physical stock | `[ ]` | 🔴 P1 | |
| **ADMIN-008** | Export Orders to CSV | Click **Export CSV** | Downloads `.csv` file with order rows | `[ ]` | 🟠 P2 | |
| **ADMIN-009** | Search / Filter Orders | Type customer name in search | Table filters in real-time | `[ ]` | 🟠 P2 | |
| **ADMIN-010** | Revenue Summary Cards | Inspect dashboard header | Total Revenue, Pending Orders display | `[ ]` | 🟠 P2 | |

---

# Phase 15: Database & Persistence Verification

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **DB-001** | `products` Table Integrity | Check schema in Supabase | All required columns exist | `[ ]` | 🔴 P0 | |
| **DB-002** | `product_variants` Foreign Key | Check variant linkage | `product_id` references `products.id` | `[ ]` | 🔴 P0 | |
| **DB-003** | `product_media` Foreign Key | Check media linkage | `product_id` and `variant_id` linked | `[ ]` | 🔴 P0 | |
| **DB-004** | Stock Decrement Trigger | Complete checkout | `units_in_stock` decrements | `[ ]` | 🔴 P0 | |
| **DB-005** | Data Type Consistency | Inspect prices | Stored as numeric/integer in NGN | `[ ]` | 🔴 P1 | |
| **DB-006** | Nullable Safeguards | Query with null descriptions | Storefront renders without crash | `[ ]` | 🔴 P1 | |
| **DB-007** | Connection Pool Stability | Run 20 parallel requests | No "Connection pool exhausted" error | `[ ]` | 🔴 P1 | |
| **DB-008** | Backup & Recovery | Verify Supabase PITR | Automated backups active | `[ ]` | 🟠 P2 | |

---

# Phase 16: Mobile & Responsive Design

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **RESP-001** | iPhone SE ($375\text{px}$) | Inspect `/` on $375\text{px}$ | No horizontal scroll, clean text wrap | `[ ]` | 🔴 P1 | |
| **RESP-002** | iPhone 14/15 ($390\text{px}$) | Inspect `/shop` on $390\text{px}$ | 2-column or 1-column card layout | `[ ]` | 🔴 P1 | |
| **RESP-003** | iPad / Tablet ($768\text{px}$) | Inspect `/shop/[slug]` on $768\text{px}$ | Side-by-side gallery and specs | `[ ]` | 🔴 P1 | |
| **RESP-004** | Desktop ($1440\text{px}$) | Inspect full site on desktop | Centered container, crisp margins | `[ ]` | 🔴 P1 | |
| **RESP-005** | Mobile VTO Touch Controls | Test VTO on mobile screen | Touch buttons responsive, camera fits | `[ ]` | 🔴 P0 | |
| **RESP-006** | Mobile Cart Drawer | Open cart on mobile | Full-width slide over with easy tap targets | `[ ]` | 🔴 P1 | |
| **RESP-007** | Sticky Mobile Bottom Bar | On PDP, scroll down | Sticky "Add to Cart / Try-On" bar appears | `[ ]` | 🟠 P2 | |
| **RESP-008** | Touch Gestures in 3D | Pinch/drag in 3D frame preview | Smooth 3D rotation with touch | `[ ]` | 🟠 P2 | |

---

# Phase 17: Edge Cases & Error Handling

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **EDGE-001** | Network Offline / Flaky | Disconnect WiFi during browse | Clean offline banner / graceful retry | `[ ]` | 🟠 P2 | |
| **EDGE-002** | Slow 3G Simulation | Throttle to Slow 3G in DevTools | Skeletons display while loading | `[ ]` | 🟠 P2 | |
| **EDGE-003** | Rapid Multi-Clicks | Click "Add to Cart" 5 times fast | Handled idempotently, no duplicate errors | `[ ]` | 🔴 P1 | |
| **EDGE-004** | Extremely Long Product Name | Enter 120-character frame name | Text wraps cleanly without breaking UI | `[ ]` | 🟡 P3 | |
| **EDGE-005** | Zero Price / Free Product | Check price = ₦0 | Shows "Contact for Pricing" / disabled | `[ ]` | 🔴 P1 | |
| **EDGE-006** | Special Characters in Search | Search for `<script>` or `&%#` | Sanitized safely, no XSS or crash | `[ ]` | 🔴 P0 | |
| **EDGE-007** | Invalid Slug Navigation | Visit `/shop/non-existent-frame-xyz` | Clean 404 page (no 500 server crash) | `[ ]` | 🔴 P1 | |
| **EDGE-008** | Concurrent Cart Modifications | Modify cart in two browser tabs | LocalStorage syncs without crash | `[ ]` | 🟡 P3 | |

---

# Phase 18: Performance & Security

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **SEC-001** | HTTPS Enforcement | Access `http://` on live domain | Automatically redirects to `https://` | `[ ]` | 🔴 P0 | |
| **SEC-002** | Admin Route Protection | Direct GET `/api/products` POST | Requires valid admin authorization | `[ ]` | 🔴 P0 | |
| **SEC-003** | Supabase Secret Key Isolation | Inspect client bundle | `SUPABASE_SERVICE_ROLE_KEY` NOT leaked | `[ ]` | 🔴 P0 | |
| **SEC-004** | Paystack Secret Key Isolation | Inspect client bundle | `PAYSTACK_SECRET_KEY` NOT in client JS | `[ ]` | 🔴 P0 | |
| **SEC-005** | Lighthouse Performance Score | Run Chrome Lighthouse on `/` | Performance score $\ge 85$ | `[ ]` | 🟠 P2 | |
| **SEC-006** | Largest Contentful Paint (LCP) | Inspect LCP on `/shop` | LCP $< 2.5\text{s}$ | `[ ]` | 🟠 P2 | |
| **SEC-007** | Cumulative Layout Shift (CLS) | Inspect page loading | CLS $< 0.1$ (no jarring layout jumps) | `[ ]` | 🟠 P2 | |
| **SEC-008** | Content Security Policy (CSP) | Check response headers | Secure headers prevent malicious scripts | `[ ]` | 🔴 P1 | |

---

# Phase 19: SEO & Meta Tags

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **SEO-001** | Unique Title Tags | Inspect `<title>` across 5 pages | Each page has distinct descriptive title | `[ ]` | 🔴 P1 | |
| **SEO-002** | Meta Descriptions | Inspect `<meta name="description">` | High-converting Nigerian optical copy | `[ ]` | 🔴 P1 | |
| **SEO-003** | Canonical URLs | Inspect `<link rel="canonical">` | Present and pointing to production URL | `[ ]` | 🔴 P1 | |
| **SEO-004** | OpenGraph & Twitter Cards | Inspect `og:image`, `og:title` | Branded image & title for social shares | `[ ]` | 🟠 P2 | |
| **SEO-005** | JSON-LD Schema (Local Business) | Inspect schema on `/` | `OpticalShop` schema with address & phone | `[ ]` | 🟠 P2 | |
| **SEO-006** | JSON-LD Schema (Products) | Inspect schema on `/shop/[slug]` | `Product` schema with price and currency | `[ ]` | 🟠 P2 | |

---

# Phase 20: Regression & End-to-End User Journey

| Test ID | Test Description | Steps / Action | Expected Outcome | Status | Severity | Notes |
|---|---|---|---|:---:|:---:|---|
| **E2E-001** | Full Consumer Journey | Visit `/` $\to$ `/shop` $\to$ PDP $\to$ Try-On $\to$ Add to Cart $\to$ Checkout $\to$ Pay | Order placed smoothly with zero errors | `[ ]` | 🔴 P0 | |
| **E2E-002** | Full Lens Replacement Journey | Visit `/services` $\to$ select Blue Cut $\to$ submit prescription photo | Lead captured in Admin Order Intents | `[ ]` | 🔴 P0 | |
| **E2E-003** | Full B2B Ordering Journey | Visit `/pro` $\to$ `/pro/catalog` $\to$ submit bulk quotation request | Wholesale inquiry received in Admin | `[ ]` | 🔴 P0 | |
| **E2E-004** | Admin Ingestion $\to$ Public VTO | Admin creates frame + photo $\to$ generates 3D $\to$ try on in `/try-on` | Complete lifecycle works end-to-end | `[ ]` | 🔴 P0 | |
| **E2E-005** | Full Automated Suite Pass | Run `node scripts/master-qa-full-regression.mjs` | **39 / 39 (100.0%) PASS** | `[ ]` | 🔴 P0 | |
