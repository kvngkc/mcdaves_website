# Secret Rotation Runbook - Supabase Service Role Key

## Required GitHub Actions secrets (this repo)

| Secret name | Consumed by | Rules |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | live/main DB leg (production project) | server-only, never `NEXT_PUBLIC_` |
| `TEST_SUPABASE_SERVICE_ROLE_KEY` | isolated test-DB leg | must belong to the isolated test project below, never production |

Non-secret Actions **variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Non-secret workflow `env:` values: `TEST_PROJECT_REF`, `TEST_SUPABASE_URL`, `TEST_SUPABASE_PUBLISHABLE_KEY`.
Only the service-role key is a secret; the publishable/anon keys are public by design.

## Rotation procedure

1. Supabase Dashboard -> Project Settings -> API -> **Roll** the `service_role` key.
2. Update the GitHub Actions secret in BOTH `kvngkc/mcdaves_website` and `kvngkc/mcdaves_admin`:
   Settings -> Secrets and variables -> Actions, or:
   ```bash
   gh secret set SUPABASE_SERVICE_ROLE_KEY --repo kvngkc/mcdaves_website
   gh secret set SUPABASE_SERVICE_ROLE_KEY --repo kvngkc/mcdaves_admin
   gh secret set TEST_SUPABASE_SERVICE_ROLE_KEY --repo kvngkc/mcdaves_website
   gh secret set TEST_SUPABASE_SERVICE_ROLE_KEY --repo kvngkc/mcdaves_admin
   ```
3. Update the runtime env on the hosting platform (e.g. Vercel) for the live service key.
4. If the isolated test project is ever replaced, update ALL of:
   - workflow `env:` -> `TEST_PROJECT_REF`, `TEST_SUPABASE_URL`, `TEST_SUPABASE_PUBLISHABLE_KEY`
   - `tests/supabase-test-client.ts` -> the `TEST_PROJECT_REF` constant (the guard refuses to run
     against any project other than the isolated test one)
   - the `TEST_SUPABASE_SERVICE_ROLE_KEY` secret for the new project
5. Re-run the regression gate and confirm the `Required Regression Gate` / `Required Cross-Repo Gate` checks are green.

## Prohibited (never do)

- NEVER hardcode a `service_role` key or a real project URL in source, scripts, workflows or fixtures.
- NEVER commit a real `.env` file - only `.env.example` templates with empty values.
- NEVER expose the service-role key to the browser (no `NEXT_PUBLIC_` prefix).

## Leak history (remediation record)

A `service_role` JWT for project `uijncyzhguftcdonkcdg` was hardcoded in two scripts:
`scripts/test-supabase.mjs` and `scripts/gate3_backfill_inventory.js`. Both literals were removed;
those scripts now read `process.env.NEXT_PUBLIC_SUPABASE_URL` / `process.env.SUPABASE_SERVICE_ROLE_KEY`
and fail closed if the env is absent. The key has been rotated.

The old key still exists in git history. If history hygiene is required, rewrite history on a mirror
(`git filter-repo --replace-text`) and force-push with `git push --force-with-lease`, then treat the
leaked key as permanently compromised.
