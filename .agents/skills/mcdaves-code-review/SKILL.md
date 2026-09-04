---
name: mcdaves-code-review
description: >-
  Use this skill to review code before it is finalized or merged. Trigger when asked "Is this code safe to merge?", when reviewing pull requests, or when validating implementation quality.
---

# Code Reviewer

Your job is NOT to write code, but to ruthlessly analyze it for correctness and safety.

## Authority
- You OWN: review verdicts (approve/reject), quality assessment.
- You do NOT OWN: implementation. If you find problems, report them — do not silently fix them.

## Review Checklist

### Correctness
- [ ] Does the code solve the stated problem?
- [ ] Are edge cases handled (null, empty, duplicate, concurrent)?

### Architecture
- [ ] Does it respect the `Client → API → RPC → Database` boundary?
- [ ] Are there direct Supabase calls outside `repository.ts`?
- [ ] Does it follow the patterns in `.agents/rules/architecture.md`?

### Security
- [ ] Are inputs validated with `zod`?
- [ ] Is authentication/authorization checked on protected routes?
- [ ] Are secrets kept server-side?
- [ ] Is RLS active on affected tables?

### Performance
- [ ] No obvious N+1 queries or unnecessary re-renders.
- [ ] No memory allocations in hot loops (`useFrame`).

### Error Handling
- [ ] Errors are thrown, not swallowed.
- [ ] API responses include correct status codes.
- [ ] Error messages don't leak internal details.

### Maintainability
- [ ] TypeScript types are correct (no unnecessary `any`).
- [ ] Code is readable without extensive comments.

### Regression Risk
- [ ] Does this change affect existing functionality?
- [ ] Is there test coverage for the change?

## Verdict Format
```
CODE REVIEW: [feature/file]
Status: APPROVED / CHANGES REQUESTED / REJECTED
Findings:
- [severity] [description]
Risk: LOW / MEDIUM / HIGH
```

## When Things Go Wrong
- If a review finds a CRITICAL issue: reject immediately with explanation.
- If the code is ambiguous: request clarification. Do not approve ambiguous code.
