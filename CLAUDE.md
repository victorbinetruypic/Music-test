# CLAUDE.md — Music Journey Project

## Build & Run Commands
- Dev server: `cd music-test && npm run dev` (access via http://127.0.0.1:3000, NOT localhost)
- Build: `cd music-test && npm run build`
- Lint: `cd music-test && npm run lint`
- All source code lives under `music-test/src/`

## Workflow Preferences
- After completing code changes, ALWAYS run the code-review agent to review the code
- After review passes and fixes are applied, commit and push to main on GitHub
- Do not ask for confirmation on commit+push — just do it after review passes
- Run `npm run build` before committing to catch type errors
- If the Turbopack cache corrupts (`.next/` errors), `rm -rf .next` and restart dev server
- When a mistake is made and corrected, automatically add the lesson learned to CLAUDE.md (in the relevant section) or to a file in `.claude/rules/` if it's a new topic — do not ask, just update

## Spotify API — Critical Gotchas
- **Redirect URI must use `127.0.0.1`, NOT `localhost`** — Spotify rejects localhost
- Working redirect URI: `http://127.0.0.1:3000/callback` (http is fine for 127.0.0.1)
- Dashboard redirect URI and `.env.local` must match exactly
- **We are in Development Mode** with very low rate limits (rolling 30s window)
- Extended Quota Mode requires 250K MAU — we don't qualify
- Getting rate-limited (429) with Retry-After > 60s means a multi-hour ban — don't retry, show error
- All API calls go through the request queue (`request-queue.ts`) — serial, 1s spacing, global 429 pause
- Tracks and audio features are cached in IndexedDB to minimize API calls
- User profile is cached in sessionStorage to avoid /me calls on page refresh
- Auto-refresh must stay conservative: ≤100 liked songs/day and ≤50 artists/day, gated to 24h, to avoid dev-mode bans

## Tech Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- State: Zustand (stores in `src/stores/`)
- Styling: Tailwind CSS 4, Radix UI primitives
- Storage: IndexedDB (via `idb` library) for tracks/features cache, localStorage for auth, sessionStorage for profile
- Spotify Web API + Web Playback SDK
- Demo mode via `?demo` query param (no Spotify auth needed)

## Architecture Notes
- DJ engine depends on 8 Spotify audio features: energy, valence, tempo, danceability, key, mode, loudness, id
- Apple Music and Tidal do NOT provide energy/valence/danceability — Spotify is the only viable source
- Mood filtering uses energy + valence as primary criteria
- Transition scoring uses tempo (30%), key/mode via Camelot wheel (25%), energy (20%), valence (15%), loudness (10%)
- Journey generation is lazy-loaded — zero API calls on page mount, fetches only when user clicks "Create Journey"

## Credentials
- Stored in `music-test/.env.local` (gitignored via `.env*`)
- Never commit `.env.local` or files containing tokens/secrets
