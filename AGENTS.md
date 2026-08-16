<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# McDaves — AI Agent Instructions

Before undertaking significant development work on this repository, you MUST read the following project documentation in order:

1. `docs/MCDAVES_CONTEXT.md` — Authoritative business context, dual-track architecture, B2B strategic focus, and content integrity rules.
2. `docs/MCDAVES_DEVELOPMENT_GOALS.md` — Development priorities, `/pro` route architecture, technical principles, service page requirements, and Definition of Done.

## Project Architecture Note

This repository supports two distinct user tracks:

- **B2C Retail (Live):** `/`, `/shop`, `/checkout`, `/try-on` — consumer eyewear sales with instant Paystack checkout.
- **B2B Professional (Primary Strategic Focus):** `/pro/*`, `/services/*` — *"For Optical Professionals,"* quote-driven optical supply.

Before modifying any page or component, determine which track it belongs to:
1. Do not mix B2C instant checkout language or CTAs with B2B quotation flows.
2. Do not bleed B2B supply jargon into consumer retail pages.
3. Preserve existing B2C functionality while building new B2B features under `/pro`.
4. Do not invent business facts, prices, SKUs, or capabilities.


