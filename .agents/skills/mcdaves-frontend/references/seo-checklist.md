# SEO Checklist

Use this checklist for any page that should be indexed by search engines.

## Metadata (Next.js App Router)
- [ ] `metadata` export object defined in page/layout with `title` and `description`.
- [ ] OpenGraph `og:title`, `og:description`, `og:image` set for social sharing.
- [ ] Canonical URL set if content is duplicable.

## Semantic HTML
- [ ] Single `<h1>` per page.
- [ ] Heading hierarchy (`h1` → `h2` → `h3`) is logical, not decorative.
- [ ] Semantic elements used: `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`.

## Structured Data
- [ ] Product pages have JSON-LD `Product` schema with `name`, `price`, `image`, `availability`.
- [ ] FAQ pages have JSON-LD `FAQPage` schema if applicable.

## Technical
- [ ] `robots.ts` does not block critical pages.
- [ ] `sitemap.ts` includes all public-facing pages.
- [ ] Images use `next/image` with `alt` text.
- [ ] No JavaScript-only content that search engines cannot crawl.

## Repository Paths
- Sitemap: `src/app/sitemap.ts`
- Robots: `src/app/robots.ts`
- Root layout (metadata): `src/app/layout.tsx`
