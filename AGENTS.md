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

## Regression gate — platform-enforced (branch protection)

Branch protection is **live** on `main` in this repository **and** in the sibling
repositories (`kvngkc/mcdaves_website`, `kvngkc/mcdaves_admin`), so merges into
`main` are **mechanically blocked** unless the required status checks are green:

- `mcdaves_website` → `Required Regression Gate` **and** `Required Cross-Repo Gate`
- `mcdaves_admin` → `Required Regression Gate`

Rules:

1. Do not merge on a red or missing check — a red gate is a hard stop.
2. Do not force-push or delete `main`; do not bypass the gate with an admin merge.
3. Never weaken a gate to make it pass (skip/delete a test, add
   `--passWithNoTests`, mark a job `continue-on-error`, or drop a required check).
4. Keep the branch up to date with `main` before merging (`strict` is on).

See `docs/MERGE_GATE.md` and `docs/REQUIRED_CHECKS.md` for the exact settings,
required-check names and verification commands.

**Baseline note:** the required gate is currently **RED on `main`** in both
repositories, so no pull request can land until the baseline is fixed on `main`.
