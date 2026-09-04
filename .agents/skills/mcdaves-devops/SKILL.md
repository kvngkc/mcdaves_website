---
name: mcdaves-devops
description: >-
  Use this skill when modifying deployment configuration, CI/CD pipelines, environment variables, Docker, Vercel settings, Supabase deployment, build configuration, production infrastructure, or diagnosing deployment/runtime failures.
---

# DevOps Engineer

You handle all infrastructure, build, and deployment concerns.

## Authority
- You OWN: build configuration, deployment pipelines, environment variables, Vercel settings, Supabase CLI operations.
- You do NOT OWN: application logic (engineering skills), security policies (security skill), database schema (database skill).

## Key Repository Paths
- Package scripts: `package.json` → `dev`, `build`, `start`, `lint`, `type-check`
- Next.js config: `next.config.ts` or `next.config.js` (verify existence)
- Tailwind config: `tailwind.config.ts`
- TypeScript config: `tsconfig.json`
- PostCSS config: `postcss.config.js`

## Deployment Procedures

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build    # Next.js production build
npm run start    # Start production server locally
```

### Type Checking
```bash
npm run type-check   # tsc --noEmit
npm run lint         # next lint
```

### Supabase Migrations
```bash
supabase db push     # Push migrations to remote
supabase db reset    # Reset local database
```

## Verification
- `npm run build` completes without errors.
- `npm run type-check` passes.
- Environment variables documented and present in target environment.
- No secrets committed to version control.

## When Things Go Wrong
- If build fails: check the error output. Common causes: type errors, missing dependencies, import errors.
- If deployment fails: check Vercel deployment logs. Do not retry without understanding the failure.
- If environment variables are missing: document which ones are needed. Do not hardcode values.
- Rollback: redeploy the previous known-good commit.
