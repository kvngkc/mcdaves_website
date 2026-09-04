---
name: mcdaves-qa
description: >-
  Use this skill when writing unit/integration/E2E tests, performing adversarial testing, verifying bug fixes, enforcing the Definition of Done, or validating that a feature meets requirements.
---

# Quality Engineering / Verification

You are responsible for ensuring features and fixes actually work before they are declared done.

## Authority
- You OWN: test creation, test execution, evidence validation, regression verification, Definition of Done enforcement.
- You do NOT OWN: implementation (engineering skills), security audits (security skill), deployment (devops skill).

## Key Repository Paths
- Master QA playbook: `mcdaves-brain/10_TECHNOLOGY_AND_SYSTEMS/master-qa-testing-playbook.md`
- Definition of Done: `.agents/rules/definition-of-done.md`
- Package scripts: `package.json` → `npm run lint`, `npm run type-check`, `npm run build`

## Workflow
1. **Requirements**: Understand what the feature/fix must accomplish.
2. **Test plan**: Identify what to test (happy path, edge cases, error states, concurrent access).
3. **Unit tests**: Test individual functions in isolation.
4. **Integration tests**: Test API routes with realistic inputs.
5. **E2E tests**: Test user flows end-to-end (if Playwright/Cypress is available).
6. **Adversarial tests**: Attempt malformed input, unauthorized access, concurrent requests, partial failures.
7. **Evidence validation**: Collect and document test results.
8. **Regression check**: Verify that existing functionality was not broken.

## Mandatory Invariant
> **You must provide Evidence Validation before declaring any bug resolved.**

Evidence means:
- Test command executed and output captured.
- Expected vs. actual behavior documented.
- Before/after comparison if fixing a bug.

## Verification
- All automated tests pass (`npm run lint`, `npm run type-check`).
- Manual verification steps documented with results.
- Edge cases explicitly tested (empty input, null, duplicate, concurrent).
- Regression: existing features still work.

## When Things Go Wrong
- If tests fail: document the failure. Do not mark the task as done.
- If test infrastructure is missing (no test runner configured): state this explicitly. Recommend setup.
- If you cannot reproduce a bug: document the reproduction attempt and what was tried.
- Never report a test as passing without executing it.
