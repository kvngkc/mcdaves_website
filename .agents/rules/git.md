---
description: Git workflow and version control rules for McDaves.
---

# McDaves Git Rules

1. **Commit messages**: Use conventional commit format (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
2. **Never commit secrets**: `.env`, API keys, and credentials must never appear in version control. Verify `.gitignore` before committing.
3. **Branch hygiene**: Work on feature branches. Do not push directly to `main` without review.
4. **Atomic commits**: Each commit should represent a single logical change. Do not bundle unrelated changes.
5. **No generated files**: Do not commit `node_modules/`, `.next/`, or build artifacts.
