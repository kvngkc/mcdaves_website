---
description: Critical, non-negotiable invariant laws for McDaves engineering.
---

# McDaves Engineering Invariants

These rules are **not negotiable regardless of which skill is active**. They must be strictly adhered to by all agents and developers.

1. **Never expose secrets.** No environment variables, API keys, or credentials should ever be logged or exposed to the client.
2. **Never bypass RLS to make a feature work.** Always fix the policy rather than using a service-role key to bypass security.
3. **Never claim a bug is fixed without verification.** Always rely on evidence validation.
4. **Never silently swallow an error.** Errors must be propagated and handled. Do not use `console.error` without throwing or returning a valid error state to the caller.
5. **Never perform multi-step financial/inventory mutation from client-side loops when atomicity is required.** Use Supabase RPCs.
6. **Never modify production configuration without checking the deployment implications.**
7. **Never replace an existing architectural pattern without understanding why it exists.** Check the brain and ADRs first.
8. **Never assert that a file, table, route, component, API, or environment variable exists without verifying it against the repository.** Do not invent test results, deployment statuses, or configuration values. If you cannot verify, say so explicitly.
9. **Never report a test as passing unless the test was actually executed and its output observed.** "Implemented" ≠ "Tested" ≠ "Verified" ≠ "Production-safe".
