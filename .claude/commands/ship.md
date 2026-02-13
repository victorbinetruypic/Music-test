# /ship — Build, Review, and Push to Main

Run the full shipping pipeline for all uncommitted changes. Do NOT ask for confirmation at any step — execute the entire pipeline automatically.

## Steps

### 1. Build
Run `cd music-test && npm run build` to catch type errors and compilation issues.
- If the build fails, fix the errors and rebuild. Do not proceed until the build passes.

### 2. Code Review
Run the code-review agent (`feature-dev:code-reviewer`) on all uncommitted changes.
- Review the findings. Fix any issues with confidence >= 85%.
- If fixes were applied, rebuild to verify they didn't break anything.

### 3. Commit
- Stage only the relevant source files (no `.env*`, no credentials, no `.next/`)
- Write a concise commit message summarizing all changes (imperative mood, focus on "why")
- Include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

### 4. Push
- Push to `origin main`
- Report the commit hash and a one-line summary when done

## Error Handling
- If build fails after 2 fix attempts, stop and report the errors
- If code review finds critical security issues, stop and report before committing
- If push fails (e.g. diverged branch), stop and report — do NOT force push
