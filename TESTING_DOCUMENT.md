# 👓 McDaves Platform — Your Hands-On Testing Guide

Welcome! This document is designed specifically for **you** to test the entire McDaves platform from start to finish like a real customer and store owner.

---

## ⚡ Quick Start — Where to Open
Make sure both apps are running in your browser:
* 🛍️ **Customer Storefront:** [`http://localhost:3000`](http://localhost:3000) (or your live Vercel link)
* 🔐 **Admin Operations Panel:** [`http://localhost:3001`](http://localhost:3001) *(Passcode: `mcdaves2026`)*

---

## 🧭 TEST JOURNEY 1: You as the Admin (Create a Product & 3D VTO)

**Goal:** Create a brand new eyewear frame from scratch, upload a real photo, convert it into 3D, and assign inventory.

### Steps to Follow:
1. Open [`http://localhost:3001`](http://localhost:3001) and enter passkey `mcdaves2026`.
2. Click the **Products & Catalog** tab.
3. Click **+ New Product** and fill in this sample data:
   * **Product Name:** `Lekki Sovereign`
   * **Slug:** `lekki-sovereign` *(or let it auto-fill)*
   * **Category:** `Unisex`
   * **Collection:** `Sightly`
   * **Price:** `₦45,000`
   * **Material:** `Handcrafted Italian Acetate`
   * **Frame Dimensions:** `54□18-140`
4. **Upload a Photo:**
   * In **Product Media**, click **Upload Image** and choose any photo of glasses from your computer.
   * ✅ *Check:* Does the image thumbnail preview immediately?
5. **Generate 3D Model for Virtual Try-On:**
   * In the **3D Virtual Try-On Asset** section, click **Generate 3D from Photo** *(or Upload .glb if you have a 3D file)*.
   * ✅ *Check:* Does it generate a 3D model and show an interactive 3D box where you can spin the glasses with your mouse?
6. **Add a Color Variant:**
   * Click **+ Add Variant**.
   * Name: `Tortoise Gold`, Color: `Tortoise`, Color Hex: `#8B4513`, Stock: `15 units`, SKU: `LEK-TOR-01`.
7. Click **Save Product**.

#### 🎯 What You Should Verify:
- [ ] Product saves without any red error popup.
- [ ] `Lekki Sovereign` appears at the top of your Admin product list with its image and stock count.
- [ ] **Hard Refresh (`Ctrl + F5`):** The product and image are still there in Admin.

---

## 🧭 TEST JOURNEY 2: You as a Customer (Shop & Product Details)

**Goal:** Verify that your newly created product appears immediately on the public website with zero 404 errors.

### Steps to Follow:
1. Open [`http://localhost:3000/shop`](http://localhost:3000/shop).
2. Look at the product grid.
   * ✅ *Check:* Do you see your new `Lekki Sovereign` card with its uploaded photo and `₦45,000` price tag?
3. Click the filter buttons at the top (**Men**, **Women**, **Unisex**).
   * ✅ *Check:* Does clicking `Unisex` filter the grid correctly?
4. Click on `Lekki Sovereign` to open its Product Detail Page (`/shop/lekki-sovereign`).
5. **The 404 & Hard Refresh Test:**
   * ✅ *Check:* Does the product page load with the large photo gallery, description, and specs?
   * Press **`Ctrl + F5`** (or `Cmd + Shift + R` on Mac) to force refresh the page.
   * ✅ *Check:* Does the page reload cleanly with **200 OK** (and NOT a 404 page)?
6. Open a new **Incognito / Private tab**, paste `http://localhost:3000/shop/lekki-sovereign`, and hit Enter.
   * ✅ *Check:* Does it load perfectly without needing any login?

---

## 🧭 TEST JOURNEY 3: You in the 3D Virtual Try-On (VTO)

**Goal:** Test your webcam, face tracking, 3D glasses fit, head movement, and ear clipping.

### Steps to Follow:
1. On the product page (or at [`http://localhost:3000/try-on`](http://localhost:3000/try-on)), click the **Virtual Try-On** (Camera) button.
2. Click **Allow** when your browser asks for Camera permissions.
3. Look directly into your webcam.

#### 🎯 Test These Motions on Your Camera:
- [ ] **Snap & Fit:** Do the glasses automatically lock onto the bridge of your nose and align with your eyes?
- [ ] **Turn Left & Right (Yaw):** Slowly turn your head left and right. Do the glasses stay firmly on your face without shaking or flying off?
- [ ] **Tilt Up & Down (Pitch):** Look up at the ceiling, then down. Do the frames tilt naturally with your nose angle?
- [ ] **Ear Clipping Test (Crucial!):** Turn your head $45^\circ$ to the side. Do the temple arms end cleanly at your ears without poking through the back of your head?
- [ ] **Switch Colors:** Click different color circles at the bottom. Does the 3D frame change color live on your face?
- [ ] **Express Order Button:** Click the **Buy This Frame** / **Express Order** button inside the camera screen. Does the quick order drawer slide up?

---

## 🧭 TEST JOURNEY 4: You Buying Glasses (Cart, Pricing & Checkout)

**Goal:** Test cart persistence, delivery fee calculations (₦2,500 vs Free over ₦50k), and Paystack / WhatsApp checkout.

### Steps to Follow:
1. Go to any product page and click **Add to Cart**.
2. The Cart Drawer slides out from the right:
   * Click **`+`** to increase quantity to 2 $\to$ verify subtotal doubles.
   * Click **`-`** to decrease quantity back to 1.
3. **Cart Memory Test:**
   * Close the cart, navigate to [`/about`](http://localhost:3000/about), and refresh the page.
   * Click the Cart icon in the top header $\to$ your items should still be in the cart!
4. Open Cart and click **Proceed to Checkout** (`/checkout`).
5. **Test the Nigerian Delivery Fee Rules:**
   * If your cart is **under ₦50,000**:
     * Select **Lagos Standard Delivery** $\to$ Delivery Fee should be **₦2,500**.
     * Select **Pickup at Lagos Island Practice** $\to$ Delivery Fee should be **₦0 (Free)**.
   * If your cart is **₦50,000 or above**:
     * Select **Lagos Standard Delivery** $\to$ Delivery Fee automatically shows **₦0 (Free Delivery)**!
6. Fill in your test details:
   * Name: `Test Customer`, Phone: `08012345678`, Address: `15 Victoria Island, Lagos`.
7. **Test Payment Options:**
   * **Option A (WhatsApp):** Click **Order via WhatsApp** $\to$ opens WhatsApp with a pre-filled itemized message to `+234 815 234 6649`.
   * **Option B (Paystack):** Click **Pay via Paystack** $\to$ Paystack modal opens with the exact Naira total.

---

## 🧭 TEST JOURNEY 5: You Upgrading Your Lenses (Lens Replacement)

**Goal:** Test the prescription lens replacement service.

### Steps to Follow:
1. In the header or footer, click **Services** or visit [`http://localhost:3000/services/lens-replacement`](http://localhost:3000/services/lens-replacement).
2. Review the 4 lens tiers:
   * Single Vision Clear (from ₦15,000)
   * Blue Cut Screen Protection (from ₦22,000)
   * Photochromic / Light-Adaptive (from ₦25,000)
   * Polycarbonate / High-Index (from ₦30,000)
3. Select **Blue Cut (₦22,000)** and click **Order Lens Replacement**.
4. Upload a sample prescription photo (or enter values) and submit.
5. ✅ *Check:* Does it confirm your lens booking?

---

## 🧭 TEST JOURNEY 6: You as an Optometrist / Clinic (B2B McDaves Pro)

**Goal:** Test the wholesale optical portal.

### Steps to Follow:
1. Click **McDaves Pro** in the header or visit [`http://localhost:3000/pro`](http://localhost:3000/pro).
2. Click **Request Wholesale Quote** or **Practice Order Portal** (`/pro/order`).
3. Fill in clinic name (e.g. `Lagos Eye Clinic`), select frame quantities, and submit.
4. ✅ *Check:* Does the inquiry submit with a confirmation message?

---

## 🧭 TEST JOURNEY 7: You Checking the Admin for New Orders

**Goal:** Verify that your test orders and leads appeared in the Admin dashboard.

### Steps to Follow:
1. Switch back to [`http://localhost:3001`](http://localhost:3001).
2. Click the **Order Intents (Leads)** tab.
   * ✅ *Check:* Do you see the customer checkout / lens inquiry you just submitted?
3. Click the **Orders** tab to inspect completed transactions.

---

## 🧭 TEST JOURNEY 8: Mobile Phone & Tablet Check

**Goal:** Ensure the website looks stunning on smartphones.

### Steps to Follow:
1. On your desktop browser, press **`F12`** $\to$ click the **Toggle Device Toolbar** icon (or test on your physical phone).
2. Choose **iPhone 14 Pro** or **Samsung Galaxy**.
3. **Verify:**
   * [ ] Hamburger menu (☰) opens smoothly with all navigation links.
   * [ ] Product cards fit cleanly on mobile screens without horizontal scroll.
   * [ ] Bottom sticky bar on product pages allows easy 1-tap "Add to Cart" and "Try-On".
   * [ ] Virtual Try-On camera view fits properly on mobile.

---

## 📝 Your Quick Result Checklist

Tick these off as you complete your test:

- [ ] **Admin:** Created a product with image & 3D model
- [ ] **Storefront:** Found product on `/shop` with photo and price
- [ ] **Product Page:** Loaded `/shop/[slug]` and refreshed without 404
- [ ] **VTO Camera:** Glasses tracked face, rotated with head, clipped at ears
- [ ] **Cart:** Added items, changed quantities, items persisted on refresh
- [ ] **Checkout:** Delivery fee calculated correctly (₦2,500 vs Free $\ge$ ₦50k)
- [ ] **WhatsApp/Paystack:** Order routed cleanly
- [ ] **Lens Replacement:** Visited `/services/lens-replacement`
- [ ] **B2B Portal:** Visited `/pro` and `/pro/order`
- [ ] **Admin Sync:** Saw new leads/orders appear in Admin
- [ ] **Mobile:** Tested site in mobile view
