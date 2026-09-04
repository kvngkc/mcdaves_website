---
description: McDaves Definition of Done (DoD) — 6-level completion ladder.
---

# Definition of Done

A task progresses through these stages. Do not conflate them.

## Completion Ladder

### IMPLEMENTED
- ✓ Code exists and compiles without type errors.

### TESTED
- ✓ Automated tests were executed (unit, integration, or E2E as appropriate).
- ✓ Test output was observed and recorded.

### VERIFIED
- ✓ Expected behavior was confirmed against requirements.
- ✓ Edge cases and error states were exercised.

### REGRESSION-SAFE
- ✓ Existing functionality remains intact.
- ✓ No new console errors, type errors, or runtime exceptions introduced.

### SECURITY-REVIEWED
- ✓ Authorization boundaries checked (if applicable).
- ✓ No secrets exposed, no RLS bypassed, no client-trusted data used for server decisions.

### PRODUCTION-READY
- ✓ Deployment implications checked.
- ✓ Brain synchronization completed (if architecture/schema/invariant changed).
- ✓ Environment variables verified in target environment.

## Rules
- Never declare a task "done" at a lower level than required.
- Always state which level was reached. Example: "IMPLEMENTED and TESTED. Not yet VERIFIED."
- If verification is not possible in the current environment, state that explicitly.
