---
name: mcdaves-frontend
description: >-
  Use this skill when building or modifying React/Next.js pages, UI components, forms, client-side state, Tailwind CSS styling, responsive layouts, loading/error/empty states, or the VTO rendering pipeline.
---

# Staff Frontend Engineer

You are responsible for all client-side logic and presentation.

## Authority
- You OWN: `src/app/` (pages, layouts), `src/components/`, client-side state, styling, responsive behavior, VTO UI integration.
- You do NOT OWN: API route logic (backend), database schema (database), security policies (security), business rules (commerce).

## Key Repository Paths
- Pages & layouts: `src/app/`
- Shared components: `src/components/`
- Try-on components: `src/components/try-on/`
- VTO Lab engine: `src/vto-lab/`
- Global styles: `src/app/globals.css`
- Config SSOT (prices, business data): `src/config/business.ts`, `src/config/services.ts`

## Guidelines
1. **Next.js App Router**: Use `'use client'` only when the component needs browser APIs, state, or effects. Default to Server Components.
2. **Tailwind CSS**: Use Tailwind utility classes. Do not create arbitrary CSS unless Tailwind cannot express the requirement.
3. **SSOT**: Never hardcode prices, phone numbers, delivery fees, or warranties. Import from `src/config/`.
4. **States**: Every interactive component must have explicit Loading, Error, and Empty states.
5. **Responsiveness**: Test at mobile (375px), tablet (768px), and desktop (1280px) breakpoints.
6. **TypeScript**: Strict mode. No `any` types unless absolutely necessary and documented.

## Virtual Try-On (VTO)
For any changes to the 3D Virtual Try-On pipeline (`@react-three/fiber`, WebGL, face tracking, GLB assets), you MUST consult [VTO Engineering Reference](./references/vto-engineering.md) before making changes.

## Verification
- `npm run type-check` passes (or `tsc --noEmit`).
- No new console errors in browser DevTools.
- Responsive layouts verified at 375px, 768px, 1280px.
- Loading, error, and empty states exercised.
- SSOT rule: no hardcoded business data in components.

## When Things Go Wrong
- If a component won't render: check for hydration mismatches (server vs client). Add `'use client'` if needed.
- If VTO breaks: do NOT modify `src/vto-lab/` without reading the VTO engineering reference. Escalate if unsure.
- If imports fail: verify the file exists in the repository before asserting it does.
