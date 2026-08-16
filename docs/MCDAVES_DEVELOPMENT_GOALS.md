# McDaves — Development Goals & Technical Direction

> [!IMPORTANT]
> **Dual-Track Architecture Focus:** This document translates the strategy from `docs/MCDAVES_CONTEXT.md` into technical development priorities. New development strictly prioritizes the B2B supply platform (`/pro`) while preserving the live B2C retail track (`/shop`).

---

## 1. North Star

The McDaves platform serves two distinct user audiences through a dual-track digital architecture:

1. **B2C Consumers:** Provided with a sleek, credible retail experience for purchasing fashion frames and prescription lenses via instant Paystack checkout.
2. **B2B Optical Professionals:** Provided with a dedicated, information-dense supply platform (`/pro`) for discovering and sourcing optical materials, lens blanks, repair hardware, and workshop supplies via a structured quotation engine.

> **Engineering Rule:** New platform feature development prioritizes the B2B `/pro` track without degrading, breaking, or obscuring the live B2C retail experience.

---

## 2. Dual-Track Architecture

| Architecture Attribute | B2C Retail Track | B2B Professional Track (`/pro`) |
|---|---|---|
| **Route Scope** | `/`, `/shop`, `/checkout`, `/try-on`, `/shop/[slug]` | `/pro`, `/pro/catalog`, `/pro/quote`, `/pro/how-it-works`, `/services/*` |
| **Primary Audience** | Individual consumers | Optical labs, opticians, eyewear businesses |
| **Primary CTA** | `"Shop Now"` / `"Add to Cart"` | `"Request a Quote"` / `"Browse Supplies"` |
| **Fulfillment Model** | Paystack instant card payment | B2B quotation submission & trade consultation |
| **Catalog Content** | `Sightly` consumer frame collection | Optical materials, lens blanks, repair parts, lab supplies |
| **Header Link to Other Track**| **`"For Optical Professionals"`** (`/pro`) | **`"Consumer Shop"`** (`/shop`) |

### Navigation & Header Behavior
- **B2C Navigation Context:** Displays links for consumer shopping (`Shop`, `Try-On`, `Our Story`, `Contact`) and includes a prominent header link or button labeled **"For Optical Professionals"** leading to `/pro`.
- **B2B Navigation Context (on `/pro/*`):** Switches to B2B supply links (`Catalog`, `Services`, `How It Works`, `Request Quote`, `Contact`) and includes a subtle link labeled **"Consumer Shop"** leading back to `/shop`.

### Visual Distinction Guidelines
- **B2B Visual Accent:** B2B pages feature a subtle `"Trade & Supply"` header badge or dark accent treatment to distinguish the professional environment.
- **Imagery Rules:** B2B pages avoid consumer lifestyle model photography; they use technical product shots, material close-ups, and workshop hardware imagery.
- **Layout Density:** B2B catalog views are more utilitarian, structured, and information-dense than B2C retail cards.

---

## 3. Primary Development Goals

### Goal 1 — Establish Dual-Track Credibility Immediately
- **B2C Pages:** Instantly communicate retail quality and include a clear, visible entry point to `/pro` for trade buyers.
- **B2B Hub (`/pro`):** Immediately establish trade supply credibility, optical heritage, and scope of materials supplied.

### Goal 2 — B2B Product Discovery Experience (`/pro/catalog`)
Build a dedicated B2B supply catalog structure supporting:
- Trade supply categories (Lens Blanks, Frame Repair Hardware, Workshop Tools, Lab Consumables).
- Parametric search and filtering by technical material properties (e.g., index, coating, material type).
- Quote request CTAs on every item detail view (no prices, no instant checkout buttons).

### Goal 3 — B2B Quotation Funnel (`/pro/quote`)
Primary B2B CTA is **"Request a Quote"** — *never* instant consumer checkout.
- Localized strictly within `/pro/quote`, `/pro/catalog`, and `/services/*`.
- Must **never leak** quote-only CTAs into the B2C consumer shop flow.
- Captures structured trade details (business name, account type, estimated volume, technical specifications, contact preferences).

### Goal 4 — Easy Business Communication
Keep conversion channels accessible using authoritative site config (`src/data/site-config.ts`):
- Single source of truth for contact details (`phone/WhatsApp: 2348152346649`, `mcdavesopticals@gmail.com`, `4, Nnamdi Azikwe Street, Lagos`).
- Contextual WhatsApp routing (e.g., pre-filled B2B quote message vs retail product inquiry message).

### Goal 5 — Explain the B2B Purchasing Process (`/pro/how-it-works`)
Eliminate trade buyer uncertainty by illustrating the commercial quote-to-fulfillment flow:
```
Browse Supply Catalog ──> Submit Quote Request ──> Trade Consultation & Pricing ──> Order Confirmation ──> Fulfillment & Delivery
```

### Goal 6 — Scalable Dual-Track Architecture
Maintain clean separation of concerns:
- Shared design primitives (`src/components/ui/`) and design tokens (`tailwind.config.ts`).
- Separated navigation shells (`Header.tsx` vs B2B trade header).
- Strongly typed interfaces in `src/lib/types.ts`.

---

## 4. Current Priority Ranking

Developers and AI agents must prioritize work according to this ranking:

| Priority Rank | Focus Area | Scope & Objectives |
|---|---|---|
| **Priority 1** | **Core Positioning & Dual-Track Clarity** | Homepage dual-track messaging, `"For Optical Professionals"` link, `/pro` hub page launch, preserving live B2C shop intact. |
| **Priority 2** | **B2B Product Discovery (`/pro/catalog`)** | B2B catalog structure, supply category browse, parametric filtering, item spec views. |
| **Priority 3** | **B2B Quotation Engine (`/pro/quote`)** | Structured B2B quote request form, quote CTAs on `/pro` catalog, contextual WhatsApp quote links. |
| **Priority 4** | **Solutions Pages (`/services/*`)** | B2B service pages (`/services/lens-replacement`, `/services/repairs`, `/services/how-it-works`). |
| **Priority 5** | **Trust & Information** | Technical documentation, trade FAQ, business policies, lab resources. |
| **Priority 6** | **Future Platform Capabilities** | B2B customer accounts, tier pricing engines, inventory visibility feeds, recurring supply contracts. |

---

## 5. Route Architecture & Service Pages Positioning

| Route | Track | B2B / B2C Positioning | Key Requirements |
|---|---|---|---|
| `/` | B2C / Core | Live home page with clear `/pro` entry point | Retains B2C hero while prominently directing trade buyers to `/pro`. |
| `/shop` | B2C | Live consumer frame catalog | B2C eyewear catalog with Paystack checkout and try-on links. |
| `/pro` | B2B | Hub: *"For Optical Professionals"* | Entry point establishing B2B trade credibility, supply scope, and catalog links. |
| `/pro/catalog` | B2B | Professional supply catalog | Information-dense catalog for lens blanks, repair parts, and lab tools (quote-only, no prices). |
| `/pro/quote` | B2B | B2B quotation engine | Structured form for requesting volume supply quotes. |
| `/pro/how-it-works` | B2B | B2B purchasing process | Visual explanation of the quote-to-fulfillment commercial process. |
| `/services/lens-replacement` | B2B | Lens replacement supply | Focus on lens blanks, single vision/bifocal/progressive stock for opticians/labs. No consumer repair language. |
| `/services/repairs` | B2B | Repair components & workshop supply | Focus on hardware (screws, hinges, nose pads, tools) for optical practices. No consumer frame fixing claims. |
| `/services/how-it-works` | B2B | B2B process explanation | Redirects or aligns with `/pro/how-it-works`. |

---

## 6. Core Technical Principles

1. **Inspect Before Modifying:** Thoroughly inspect existing code before making edits.
2. **Reuse Existing Architecture:** Use established tokens (`tailwind.config.ts`), UI primitives (`src/components/ui/`), and site config (`src/data/site-config.ts`).
3. **Respect Track Separation:** Do not bleed B2C checkout logic into B2B `/pro` pages or B2B technical jargon into B2C `/shop` pages.
4. **Preserve B2C Revenue Stream:** Ensure edits never break live `/shop`, `/checkout`, or Paystack integrations.
5. **Avoid Unnecessary Dependencies:** Rely on established npm packages (`lucide-react`, `fuse.js`, `zod`).
6. **Use TypeScript Correctly:** Enforce strict typing in `src/lib/types.ts`. Avoid `any`.
7. **Maintain Responsive Behavior:** Ensure seamless responsive design across mobile, tablet, and desktop.
8. **Maintain Accessibility:** Use proper ARIA attributes, semantic HTML tags, keyboard focus rings, and color contrast.
9. **Validate Changes After Implementation:** Test rendered UI, interactive states, and navigation routes.
10. **Run Type and Build Checks:** Run `npx tsc --noEmit` and verify clean build execution before completing tasks.

---

## 7. Definition of Done (DoD) Checklist

A task is complete only when all applicable criteria are met:

- [ ] **Dual-Track CTA Separation:** B2B pages contain zero B2C checkout CTAs; B2C pages contain zero quote-only trade CTAs.
- [ ] **Navigation Integration:** B2C header has a visible link to `/pro`; `/pro` header has a visible link to `/shop`.
- [ ] **Navigation Shell Switching:** `/pro/*` pages render the B2B trade navigation shell, not the B2C consumer shop navigation.
- [ ] **Correct Route Placement:** Page file placed in exact `src/app/` route directory.
- [ ] **Responsive Layout:** Visually verified on mobile (375px), tablet (768px), and desktop (1280px).
- [ ] **Accessible Interactions:** Proper focus rings, ARIA labels, semantic tags, and keyboard accessibility.
- [ ] **Content Integrity:** 100% compliant with business context (zero fabricated B2B SKUs, prices, or claims).
- [ ] **Distinct Metadata:** Page title, description, and OpenGraph tags are tailored to the specific track (B2C vs B2B).
- [ ] **Zero TypeScript Errors:** `npx tsc --noEmit` passes cleanly with 0 errors.
- [ ] **Zero Build Errors:** `npm run build` succeeds without warnings.
- [ ] **No Broken Existing Routes:** B2C `/shop`, `/checkout`, and `/payment` remain 100% functional.

---

## 8. Agent Operating Rule

Before undertaking any development task on this repository, every AI agent must execute this reading sequence:

1. Read `docs/MCDAVES_CONTEXT.md` (the **WHY** — business model, positioning, constraints).
2. Read `docs/MCDAVES_DEVELOPMENT_GOALS.md` (the **WHAT** — dual-track architecture, priorities, principles).
3. Inspect relevant codebase files in `src/` (the **HOW** — current implementation).

### Conflict Resolution Protocol
If a conflict or ambiguity arises between documentation and codebase implementation:
1. **Do not guess.**
2. Preserve confirmed business facts and authoritative site config.
3. Preserve live B2C functionality while building B2B `/pro` features.
4. Identify the conflict and ask the user for clarification if it impacts implementation.
