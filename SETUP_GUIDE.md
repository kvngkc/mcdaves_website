# McDaves Platform — Setup Guide
## From Zero to Development in 30 Minutes

---

## STEP 1: Get Paystack Test Keys (5 minutes)

1. Go to https://dashboard.paystack.com
2. Sign up with your business email: mcdavesopticals@gmail.com
3. Complete basic profile (use "McDaves Optical" as business name)
4. In the left sidebar, click **Developers** → **API Keys**
5. You will see two keys:
   - **Public Key** (starts with `pk_test_`) → This goes in `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - **Secret Key** (starts with `sk_test_`) → This goes in `PAYSTACK_SECRET_KEY`
6. Copy both keys and save them in a note on your phone

**IMPORTANT:** These are TEST keys. They work with Paystack's test card numbers. You can build and test everything without real money. Switch to LIVE keys only when ready to launch.

**Paystack Test Card:**
- Card Number: `4084084084084081`
- Expiry: Any future date (e.g., `12/26`)
- CVV: `000`
- PIN: `12345`

---

## STEP 2: Set Up Formspree (5 minutes)

1. Go to https://formspree.io
2. Sign up with mcdavesopticals@gmail.com
3. Create 3 forms:
   - **Contact Form** → Copy the form ID (looks like `xrbggjvp`)
   - **B2B Quote Form** → Copy the form ID
   - **Newsletter Form** → Copy the form ID
4. Paste these IDs into your `.env.local` file

---

## STEP 3: Set Up Google Analytics (5 minutes)

1. Go to https://analytics.google.com
2. Sign in with your Google account
3. Click **Start measuring** → Create account "McDaves"
4. Property name: "McDaves Website"
5. Industry: "Shopping / Retail"
6. Time zone: Lagos (GMT+01:00)
7. Currency: Nigerian Naira
8. After creation, you will get a **Measurement ID** (looks like `G-XXXXXXXXXX`)
9. Copy this ID into `NEXT_PUBLIC_GA4_ID`

---

## STEP 4: Set Up Google Search Console (5 minutes)

1. Go to https://search.google.com/search-console
2. Add property → Domain → Type: `mcdaves.com.ng`
3. Verify via DNS record (Vercel can help with this, or your domain registrar)
4. Submit your sitemap after launch: `https://mcdaves.com.ng/sitemap.xml`

---

## STEP 5: Initialize the Project (10 minutes)

### Option A: Using this starter template

1. Unzip the `mcdaves-starter` folder
2. Open your terminal / command prompt
3. Navigate to the folder:
   ```bash
   cd mcdaves-starter
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
6. Open `.env.local` in any text editor and paste your actual keys
7. Start development:
   ```bash
   npm run dev
   ```
8. Open http://localhost:3000 in your browser

### Option B: Fresh Next.js install

```bash
npx create-next-app@latest mcdaves-platform \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd mcdaves-platform
npm install lucide-react fuse.js face-api.js zod
```

Then copy the files from this starter into your project.

---

## STEP 6: Connect to Vercel (5 minutes)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/mcdaves-platform.git
   git push -u origin main
   ```
2. Go to https://vercel.com
3. Sign up with GitHub
4. Click **Add New Project** → Import your GitHub repo
5. Framework preset: Next.js
6. Add Environment Variables in Vercel dashboard (copy from `.env.local`)
7. Click **Deploy**
8. Your site will be live on a `.vercel.app` URL
9. Add your custom domain (`mcdaves.com.ng`) in Vercel project settings

---

## STEP 7: Add Product Photos

Create this folder structure inside `public/images/products/sightly/`:

```
public/images/products/sightly/
├── classic-havana/
│   ├── front.webp
│   ├── side.webp
│   └── lifestyle.webp
├── lagos-aviator/
│   ├── front.webp
│   ├── side.webp
│   └── lifestyle.webp
└── ikoyi-cat-eye/
    ├── front.webp
    ├── side.webp
    └── lifestyle.webp
```

**Photo requirements:**
- Format: WebP (use https://squoosh.app to convert)
- Dimensions: 800×600px (front/side), 1200×800px (lifestyle)
- Max file size: 100KB per image
- Background: White or light gray for product shots
- For try-on: You will need transparent PNG overlays of just the frames (no lenses, no background)

---

## STEP 8: Download face-api.js Models

Download these 4 files and place them in `public/models/`:

1. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
2. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model.bin
3. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-weights_manifest.json
4. https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model.bin

Or use this command:
```bash
mkdir -p public/models
cd public/models
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model.bin
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model.bin
```

---

## FILE CHECKLIST

Before you start developing with Antigravity IDE, ensure you have:

- [ ] `package.json` — Dependencies listed
- [ ] `next.config.js` — Static export configured
- [ ] `tailwind.config.ts` — Design tokens configured
- [ ] `tsconfig.json` — TypeScript paths configured
- [ ] `.env.local` — All API keys filled in
- [ ] `src/data/products.ts` — At least 3 products added
- [ ] `src/data/site-config.ts` — Business details correct
- [ ] `src/lib/types.ts` — Type definitions
- [ ] `src/app/layout.tsx` — Root layout with metadata
- [ ] `src/app/page.tsx` — Home page starter
- [ ] `src/app/globals.css` — Global styles
- [ ] `public/models/` — face-api.js model files
- [ ] `public/images/products/` — Product photos (or placeholders)

---

## ANTIGRAVITY IDE PROMPT SEQUENCE

Use these prompts in order with Antigravity IDE:

### Prompt 1: Design System Primitives
```
Generate the following UI primitive components in src/components/ui/:
1. Button.tsx — variants: primary, secondary, tertiary, whatsapp, danger. Sizes: sm, md, lg. States: default, hover, active, disabled, loading.
2. Input.tsx — types: text, email, tel, textarea. States: default, focus, error, success. With label and helper text support.
3. Modal.tsx — Accessible modal with backdrop, close button, focus trap. Sizes: sm, md, lg, full (for try-on).
4. Badge.tsx — variants: default, success, warning, error, gold.
5. Price.tsx — Displays price with optional original price (strikethrough). Currency: NGN (₦).

Use Tailwind classes. Follow the design tokens in tailwind.config.ts. Export all components with named exports.
```

### Prompt 2: Layout Components
```
Generate the following layout components:
1. Header.tsx — Sticky header with logo, desktop nav (Shop, Fix, Supply, Our Story, Contact), search icon, cart icon. Mobile: hamburger menu.
2. Footer.tsx — 4-column footer with links, contact info, newsletter form, social links. Include address, phone, WhatsApp, hours.
3. MobileNav.tsx — Slide-out drawer for mobile navigation. Links to all main pages.
4. WhatsAppButton.tsx — Floating button (bottom-right) that opens WhatsApp with contextual message.
5. Breadcrumb.tsx — Breadcrumb navigation for deep pages.

Use Lucide icons. Follow mobile-first design. WhatsApp button must be visible on all pages.
```

### Prompt 3: Home Page Sections
```
Generate section components for the home page:
1. HeroSection.tsx — Full hero with headline, trust pills, 3 CTAs (Shop, Fix, Supply).
2. HowItWorks.tsx — 3-step visual: Order, Mail, Receive. With icons and descriptions.
3. ProductGrid.tsx — Grid of ProductCard components. Props: products[], columns, showTryOn.
4. ServicePreview.tsx — Two cards: Lens Replacement and Frame Repairs with pricing.
5. B2BTeaser.tsx — Dark section with wholesale CTA.
6. TrustSignals.tsx — 4 stats in a row.

Use the data from src/data/site-config.ts and src/data/products.ts. Make all sections responsive.
```

### Prompt 4: Product Pages
```
Generate product page components:
1. ProductCard.tsx — Card with image, collection badge, name, price, color dots, "Add to Cart" and "Try On" buttons.
2. ProductDetail page at src/app/shop/[slug]/page.tsx — Image gallery (swipeable), product info, size/material, color selector, Add to Cart, Try On, Buy on WhatsApp. Related products section.
3. CartDrawer.tsx — Slide-out cart with items, quantity controls, remove button, subtotal, checkout CTA.

Implement cart state using React Context in src/context/CartContext.tsx and useCart hook in src/hooks/useCart.ts. Persist cart to localStorage.
```

### Prompt 5: Checkout & Payment
```
Generate checkout flow:
1. Checkout page at src/app/checkout/page.tsx — 3-step: Customer Details, Delivery & Prescription, Payment Review.
2. PaymentService interface and PaystackService implementation in src/services/payment/.
3. API routes: /api/pay/initialize (POST), /api/pay/verify (GET).
4. Payment callback page at src/app/payment/callback/page.tsx — Verifies payment, shows success/error.

Use the PaymentService abstraction. Never expose secret keys to client. Guest checkout only.
```

### Prompt 6: Virtual Try-On
```
Generate virtual try-on feature:
1. TryOnModal.tsx — Modal with upload area, camera option, canvas overlay.
2. useTryOn.ts hook — Loads face-api.js models, detects face, returns position data.
3. Canvas overlay logic — Drag to move, pinch/scroll to scale, rotate buttons.
4. Photo generation — Render 3 angles (front, left 15°, right 15°) with "Sightly by McDaves" watermark.
5. Gallery view — Download all, share to WhatsApp, shop this frame.

Use face-api.js tiny models. Fallback to manual positioning if face detection fails.
```

### Prompt 7: Services & B2B Pages
```
Generate remaining pages:
1. Services pages: /services/lens-replacement, /services/repairs, /services/how-it-works
2. B2B pages: /wholesale (landing), /wholesale/catalog (category browse), /wholesale/quote (inquiry form)
3. Static pages: /about, /contact, /faq, /privacy, /terms
4. Search page: /search using Fuse.js

Use Formspree for form submissions. Use site-config for consistent contact info.
```

### Prompt 8: Analytics & SEO
```
Add analytics and SEO:
1. GAService in src/services/analytics/ — Page views, e-commerce events, custom events.
2. Event tracking on all CTAs: Add to Cart, Checkout, WhatsApp Click, Try On Start, B2B Inquiry.
3. Schema.org JSON-LD: Product, LocalBusiness, FAQPage, BreadcrumbList.
4. Sitemap generation at src/app/sitemap.ts.
5. Open Graph and Twitter card meta tags on all pages.

Ensure all events fire correctly and schema validates.
```

---

## TROUBLESHOOTING

**Problem:** `npm install` fails
**Solution:** Make sure you have Node.js 18+ installed. Check with `node -v`

**Problem:** Images don't load
**Solution:** Check that images are in `public/` folder and referenced with `/images/...` path

**Problem:** Paystack payment fails in test mode
**Solution:** Use the test card: 4084084084084081, expiry 12/26, CVV 000, PIN 12345

**Problem:** face-api.js models not loading
**Solution:** Check that model files are in `public/models/` and the browser console shows no 404 errors

**Problem:** Build fails with TypeScript errors
**Solution:** Run `npx tsc --noEmit` to see exact errors. Fix types before building.

---

## SUPPORT

If you get stuck:
1. Check the browser console for error messages
2. Check the terminal for build errors
3. Message me with the exact error text
4. Or WhatsApp your technical questions (if urgent)

---

**You are now ready to build. Good luck.**
