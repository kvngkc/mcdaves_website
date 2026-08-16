# McDaves Platform

Next.js 14 + TypeScript + Tailwind CSS optical e-commerce platform.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual keys

# 3. Run development server
npm run dev

# 4. Open http://localhost:3000
```

## Build for Production

```bash
npm run build
# Output: /out folder (static HTML)
```

## Project Structure

- `src/app/` — Next.js App Router pages
- `src/components/` — React components
- `src/data/` — Product and site data (JSON/TS files)
- `src/lib/` — Utilities, types, validators
- `src/services/` — External integrations (Paystack, Formspree, GA4)
- `src/hooks/` — Custom React hooks
- `src/context/` — React Context providers
- `public/images/` — Static images and assets
- `public/models/` — face-api.js models for virtual try-on

## Adding Products

Edit `src/data/products.ts` and add new Product objects to the `products` array.

## Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack Dashboard | Payment processing |
| `PAYSTACK_SECRET_KEY` | Paystack Dashboard | Server-side verification |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics | Tracking |
| `NEXT_PUBLIC_FORMSPREE_*` | Formspree | Form submissions |

## Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy
