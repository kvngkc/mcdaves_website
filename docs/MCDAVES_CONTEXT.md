# McDaves — Authoritative Business & Strategic Context

> [!IMPORTANT]
> **Dual-Track Architecture:** McDaves operates two distinct digital tracks: a live **B2C Retail** track for consumer eyewear and a primary strategic **B2B Supply** track for optical professionals anchored under `/pro`.
>
> **Priority Rule:** B2B supply (`/pro`) is the long-term strategic focus and the primary driver for new platform development. B2C retail (`/shop`) is a live revenue stream that must be preserved but must not obstruct B2B credibility, trade messaging, or professional navigation.

---

## 1. Business Model

McDaves operates two distinct digital commercial tracks:

### B2C Retail (Live)
- **Offering:** Consumer eyewear, frames, lenses, accessories.
- **Model:** Instant online checkout via Paystack.
- **Experience:** Virtual try-on (`face-api.js`), lifestyle branding, direct consumer purchasing.
- **Primary Audience:** Individual eyewear consumers in Nigeria.
- **Routes:** `/`, `/shop`, `/checkout`, `/try-on`

### B2B Supply (Primary Strategic Focus / In Active Development)
- **Offering:** Optical materials, semi-finished & finished lens blanks, frame repair components, lab equipment, and workshop supplies.
- **Model:** Quote-driven trade fulfillment. No instant checkout.
- **Experience:** Information-dense supply catalog, parametric search, structured B2B quote engine, direct consultation.
- **Primary Audience:** Optical laboratories, independent opticians, eyewear brands & retailers.
- **Route Hub:** `/pro` — *"For Optical Professionals"*

---

## 2. Business Overview

McDaves serves both the individual consumer market and the commercial optical supply chain:

- **Industry:** Optical & Eyewear Supply Chain (B2B) & Consumer Eyewear Retail (B2C).
- **Role:** Wholesale distributor & supply partner for optical businesses; retail provider for consumer eyewear.
- **Core Value Proposition:** Providing dependable access to optical supplies for trade buyers while delivering convenient retail eyewear solutions to individual consumers.

---

## 3. Market Problem

Optical professionals (labs, opticians, workshops) face systemic supply chain frictions:

1. **Fragmented Sourcing:** Finding lens blanks, replacement components, alignment tools, and consumables requires dealing with multiple unverified vendors.
2. **Inconsistent Availability:** Stockouts and unpredictable lead times stall lab production and delay patient/customer fulfillment.
3. **Inefficient Quoting:** Lack of transparent B2B inquiry and quote channels makes volume ordering slow and cumbersome.
4. **Poor Communication:** Generic suppliers fail to understand technical optical specifications.

McDaves exists to make optical supply simple, reliable, and highly practical for optical professionals through its dedicated `/pro` platform.

---

## 4. Current Business Position

McDaves currently operates a dual-track digital presence:

1. **B2C Retail Track is Live:** Operating at root routes (`/`, `/shop`, `/checkout`), generating active consumer sales with Paystack payment processing.
2. **B2B Supply Track is Core Identity & Strategic Direction:** Active development is expanding the B2B supply experience under `/pro` to strengthen trade credibility, product discoverability, B2B inquiries, and structured quotation requests.

---

## 5. Long-Term Strategic Direction

McDaves is evolving its B2B supply operation into a fully digitally enabled platform.

### Capability Roadmap Matrix

| Feature / System | B2C Retail Track (Live) | B2B Supply Track (`/pro`) — Future Vision |
|---|---|---|
| **Product Access** | Frame catalog & details | Comprehensive optical supply catalog with deep search & filtering |
| **Purchasing Flow** | Instant Paystack cart checkout | Digital B2B quotation engine & customer portal |
| **Pricing Model** | Fixed retail price (NGN) | Customer-specific tier pricing & volume discounts |
| **Reordering** | Repeat cart checkout | Recurring supply contracts & 1-click trade reordering |
| **Operations** | Direct delivery fulfillment | Real-time inventory visibility & trade order tracking |

> [!NOTE]
> Future platform capabilities (e.g., trade portal login, automated inventory feeds, volume tier pricing engines) live under `/pro`. Never present future B2B portal capabilities as live features until fully implemented.

---

## 6. Core Strategic Positioning

> McDaves is a dependable B2B optical materials and supplies partner helping optical businesses access the products they need — while also serving individual consumers through its retail eyewear platform.

### Track Separation Principle

B2C and B2B experiences must **never compete for attention on the same screen**.

- **B2C pages (`/`, `/shop`, `/checkout`)** speak to individuals: focus on lifestyle, fashion, convenience, and instant purchase.
- **B2B pages (`/pro/*`, `/services/*`)** speak to businesses: focus on reliability, supply chain efficiency, technical specifications, quotation, volume, and trade partnership.
- **Never** use B2C lifestyle imagery or "Buy Now" checkout buttons on B2B supply pages.
- **Never** use technical B2B supply jargon or "Request Quote" as the sole CTA on B2C retail pages.

### Positioning Guardrails
- Do **NOT** position McDaves as an eye clinic, optometry practice, or eye hospital.
- Do **NOT** position McDaves as a consumer frame repair shop.
- Do **NOT** dilute B2B trade credibility on `/pro` pages with retail fashion messaging.

---

## 7. Terminology Rules

Precision in terminology is required across both tracks. McDaves **supplies** optical businesses and **sells** eyewear to consumers; it does **not** perform clinical optical services.

| Context | Preferred Terminology | Avoid (Misalignments) |
|---|---|---|
| **B2B Supply (`/pro`)** | "Optical materials, lens blanks, and workshop supplies for optical professionals." | "We repair your glasses." / "Bring your frames to us." |
| **B2C Retail (`/shop`)** | "Quality fashion eyewear and expertly fitted prescription frames." | "Bulk trade wholesale portal." |
| **Trade Quotes** | "Request a B2B quotation for volume optical supply." | "Buy now at instant checkout." (on B2B pages) |
| **Clinical Services** | "Supplying prescription lens blanks to opticians and labs." | "Book an eye test with our optometrists." |

---

## 8. Target Customers

### B2B Professional Segments (Strategic Focus)
1. **Optical Laboratories:**
   - *Needs:* Semi-finished & finished lens blanks, single vision/bifocal/progressive stock, hard coatings, surface treatments, bulk purchasing options, predictable supply chains.
2. **Independent Opticians:**
   - *Needs:* Replacement lens supplies, frame repair parts (screws, hinges, nose pads), workshop tools, lab consumables, responsive quote processing.
3. **Eyewear Businesses & Brands:**
   - *Needs:* Component sourcing, hardware supplies, wholesale frame/lens ordering, flexible order quantities.

### B2C Consumer Segment (Live Revenue Track)
- **Individual Consumers:**
  - *Needs:* Stylish fashion frames, prescription lenses, simple virtual try-on, convenient online checkout via Paystack.
  - *Channel:* B2C retail track (`/`, `/shop`, `/checkout`, `/try-on`).

---

## 9. Website Role

### B2C Role (`/`, `/shop`)
Live retail storefront for consumer eyewear browsing, virtual try-on, and direct online purchase.

### B2B Role (`/pro`)
Digital front door and emerging supply platform for optical professionals, providing:
1. Clear explanation of trade supply scope.
2. Trade credibility and optical history.
3. Interactive B2B supply catalog.
4. Structured quotation request engine.
5. Direct sales consultation via WhatsApp, phone, and form.

---

## 10. Conversion Strategy & User Journeys

| Customer Type | Track | Journey Path | Primary UX Goal |
|---|---|---|---|
| **New Consumer** | B2C | Discover Home → Browse Frames → Try On → Paystack Checkout | Drive retail conversion |
| **Returning Consumer** | B2C | Find Product → Add to Cart → Paystack Payment → Fulfillment | Frictionless repeat purchase |
| **Optical Professional (New)** | B2B | Discover McDaves → Click `/pro` Entry Point → Browse Supplies → Request Quote | Build trade trust; capture quote |
| **Optical Professional (Product-Led)** | B2B | Direct / Search `/pro/catalog` → Item Specs → Request Quote | Immediate specification & volume quote request |
| **General Inquiry** | Either | Learn About / Service Page → Contact Form / WhatsApp → Routed Appropriately | Fast trade or retail consultation response |

---

## 11. Brand Voice & Tone

- **Voice Attributes:** Professional, practical, dependable, knowledgeable, commercially focused.
- **Tone Guardrails:** Concise, clear, direct. Avoid fluff.
- **Avoid:** Empty corporate jargon, fake urgency ("Sale ends in 5 minutes!"), excessive hype, or unsupported superlatives (*"world-class"*, *"industry-leading"*).

---

## 12. Content Integrity Rules (Non-Negotiable)

AI agents and content creators must **NEVER** fabricate business data.

### Absolute Prohibitions — Never Invent:
- Prices, SKUs, part numbers, stock levels, or inventory numbers for B2B supply catalog items.
- Product specifications, ISO certifications, or optical compliance claims unless explicitly verified.
- Brand partnerships, manufacturer names, or official distributorship claims.
- Delivery guarantees, response-time SLAs, or shipping promises.
- Customer counts, sales figures, or revenue metrics.
- Geographic operational coverage outside confirmed locations (`4, Nnamdi Azikwe Street, Lagos, Nigeria`).

> [!CAUTION]
> **Unknown Information Rule:** If a business fact is unverified, write:
> `TODO: Business confirmation required`
> Never convert an assumption or aspiration into a factual claim.

---

## 13. Architecture Principles

### Dual-Track URL Architecture
- **B2C Retail Routes:** `/`, `/shop`, `/checkout`, `/try-on`, `/shop/[slug]`
- **B2B Professional Routes:** `/pro`, `/pro/catalog`, `/pro/quote`, `/pro/how-it-works`, `/services/*`

### Header Navigation Switching Rule
- **B2C Header:** Shop \| Try-On \| Our Story \| Contact \| **[ For Optical Professionals ]** (`/pro`)
- **B2B Header (`/pro/*`):** Catalog \| Services \| How It Works \| Request Quote \| Contact \| **[ Consumer Shop ]** (`/shop`)

### System Integration
- **Shared Infrastructure:** Brand identity system, Tailwind tokens (`tailwind.config.ts`), site contact config (`src/data/site-config.ts`), core UI primitives (`src/components/ui/`), `/contact` form routing.
- **Separated Experiences:** Hero sections, CTAs, catalog data structures, purchasing models (instant checkout vs quote request), messaging tone, and visual imagery.
