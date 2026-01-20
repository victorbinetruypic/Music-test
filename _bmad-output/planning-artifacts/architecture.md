---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
workflowComplete: true
completedDate: '2026-01-19'
status: 'complete'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/analysis/brainstorming-session-2026-01-18.md'
workflowType: 'architecture'
project_name: 'Music-test'
user_name: 'Vic'
date: '2026-01-19'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
33 FRs across 6 capability areas drive the architecture:
- **Music Library Connection (FR1-6):** Spotify OAuth integration, liked songs retrieval, audio feature caching
- **Journey Configuration (FR7-10):** Mood/duration selection, arc preview display
- **Journey Generation (FR11-16):** Template-based algorithm, playlist creation via Spotify API
- **Playback Experience (FR17-24):** Web Playback SDK integration, pause/resume/skip, journey progress
- **Feedback & Learning (FR25-29):** Skip tracking with context, permanent exclusions, behavioral learning
- **Session Management (FR30-33):** Persistent auth, preferences, journey history

**Non-Functional Requirements:**
- **Performance:** <3s initial load, <5s journey generation, <2s playback start, <1s skip response
- **Security:** Secure token storage (not localStorage for refresh tokens), HTTPS only, no third-party data transmission
- **Integration:** Spotify API rate limit compliance, automatic token refresh, Web Playback SDK v1.x
- **Accessibility:** WCAG 2.1 AA compliance, keyboard navigation, visible focus states

**Scale & Complexity:**
- Primary domain: Web SPA (Consumer)
- Complexity level: Medium
- Estimated architectural components: 8-10 (auth, api-client, journey-engine, playback, storage, state, ui-components, error-handling)

### Technical Constraints & Dependencies

| Constraint | Impact |
|------------|--------|
| Static hosting (Vercel free tier) | No backend server, serverless functions only |
| Single serverless function | OAuth token exchange only, all else client-side |
| No database | LocalStorage for preferences, IndexedDB for cached data |
| Spotify Premium required | Web Playback SDK dependency, must communicate to users |
| Client-side processing | Journey algorithm runs in browser |

**External Dependencies:**
- Spotify Web API (liked songs, audio features, playlist creation)
- Spotify Web Playback SDK (in-browser playback)
- Vercel (hosting + serverless function)

### Cross-Cutting Concerns Identified

| Concern | Scope | Architectural Impact |
|---------|-------|---------------------|
| **Authentication** | All features | Auth state affects every API call, UI rendering |
| **Caching Strategy** | Performance, offline | IndexedDB for audio features, LocalStorage for preferences |
| **Error Handling** | Reliability | Spotify API failures, network issues, playback errors |
| **State Persistence** | UX continuity | Sessions, journey progress, exclusion lists |
| **Token Management** | Security | Refresh flow, secure storage, expiration handling |

---

## Starter Template Evaluation

### Primary Technology Domain

Web SPA with Static Export — based on project requirements for Vercel free tier hosting, client-side processing, and shadcn/ui component library.

### Starter Options Considered

| Option | Assessment |
|--------|------------|
| **shadcn/ui CLI (creates Next.js)** | Viable but newer, less documentation |
| **create-next-app + shadcn init** | Recommended — battle-tested, full control |
| **T3 Stack** | Rejected — overkill for client-only app |
| **Vite + React** | Rejected — loses SSG benefits |
| **SvelteKit** | Rejected — incompatible with shadcn/ui (React-based) |

### Selected Starter: Next.js + shadcn/ui

**Rationale:**
- shadcn/ui requires React — eliminates SvelteKit option from PRD
- Static export (`output: 'export'`) perfect for Vercel free tier
- App Router provides modern patterns for SPA-like behavior
- TypeScript provides type safety for Spotify API integration
- Tailwind v4 support in current shadcn CLI

**Initialization Commands:**

```bash
# Create Next.js project
npx create-next-app@latest music-test --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Initialize shadcn/ui
cd music-test
npx shadcn@latest init

# Add required components
npx shadcn@latest add button card slider progress toast tooltip
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript 5.x with strict mode
- React 19 / Next.js 15
- Node.js runtime for build, browser runtime for app

**Styling Solution:**
- Tailwind CSS v4
- CSS variables for theming (shadcn/ui default)
- `cn()` utility for conditional classes

**Build Tooling:**
- Next.js compiler (SWC-based)
- Static export via `output: 'export'` in next.config.js
- Automatic code splitting per route

**Project Structure:**
```
src/
├── app/                 # App Router pages
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles + Tailwind
├── components/
│   └── ui/              # shadcn/ui components
├── lib/
│   └── utils.ts         # cn() utility
└── ...
```

**Development Experience:**
- Hot Module Replacement (HMR)
- TypeScript error overlay
- ESLint with Next.js rules
- Path aliases (`@/components`, `@/lib`)

**Static Export Configuration:**

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
```

**Note:** Project initialization should be the first implementation task.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- State management approach → Zustand
- Token storage strategy → localStorage (both tokens)
- Journey engine architecture → Pure functions

**Important Decisions (Shape Architecture):**
- Data storage organization → localStorage + IndexedDB split
- Validation strategy → Zod for API boundaries, TypeScript for internal
- Serverless scope → Single function (OAuth callback only)
- Abstraction layers → Interfaces for Spotify API + Playback SDK

**Deferred Decisions (Post-MVP):**
- Error monitoring service (Sentry)
- Analytics integration
- Advanced caching strategies

### Data Architecture

**Storage Strategy:**

| Data Type | Storage | Rationale |
|-----------|---------|-----------|
| Auth tokens (access + refresh) | `localStorage` | Simplicity for MVP, acceptable risk |
| User preferences | `localStorage` | Small, persist across sessions |
| Audio features cache | `IndexedDB` via `idb` | Large dataset, use `idb` wrapper (2KB) |
| Exclusion list ("Not This") | `localStorage` | Small, must persist forever |
| Journey history | `IndexedDB` via `idb` | Grows over time, queryable |

**IndexedDB Wrapper:** Use [`idb`](https://github.com/jakearchibald/idb) library — cleaner Promise-based API, avoids callback complexity.

**Validation Strategy:**
- **Zod at API boundaries** — Validate all Spotify API responses before they enter the system
- **TypeScript** for internal state — compile-time only, zero overhead
- **`validateGenerationInput()`** — Early validation in journey engine for edge cases

### Authentication & Security

**OAuth Flow:**
```
User → "Connect Spotify" → Spotify OAuth → /api/callback → tokens to localStorage → done
```

**Token Handling:**

| Token | Storage | Refresh |
|-------|---------|---------|
| Access Token | `localStorage` | Client calls Spotify refresh endpoint |
| Refresh Token | `localStorage` | Used to get new access token |

**Serverless Functions:**
- `/api/callback` — OAuth code-to-token exchange (single function)

**Security Trade-offs:**
- Tokens in localStorage exposed to XSS
- Acceptable for MVP: static site, no user-generated content, trusted user base
- Post-MVP: Consider HttpOnly cookie approach if scaling beyond friends

### API Abstraction Layer

**Spotify Client Interface:**

```typescript
// Abstract Spotify API behind interface for testability
interface SpotifyClient {
  getLikedSongs(): Promise<Track[]>
  getAudioFeatures(trackIds: string[]): Promise<AudioFeatures[]>
  createPlaylist(name: string, trackUris: string[]): Promise<Playlist>
  refreshToken(): Promise<string>
}

// Implementations
class RealSpotifyClient implements SpotifyClient { ... }
class MockSpotifyClient implements SpotifyClient { ... }  // For tests
```

**Player Service Interface:**

```typescript
// Abstract Web Playback SDK for testability
interface PlayerService {
  initialize(token: string): Promise<void>
  play(trackUri: string): Promise<void>
  pause(): Promise<void>
  skip(): Promise<void>
  getState(): PlayerState
}
```

### Frontend Architecture

**State Management: Zustand**

Minimal, TypeScript-friendly state management with ~1KB bundle impact.

**Store Structure:**

| Store | Responsibility |
|-------|---------------|
| `authStore` | tokens, user profile, isAuthenticated, login/logout |
| `journeyStore` | currentJourney, phase, progress, queue, feedback |
| `playerStore` | isPlaying, currentTrack, deviceId, SDK state |
| `prefsStore` | mood history, exclusions, UI preferences |

**Component Architecture:**
- Follows shadcn/ui patterns (components/ui/ for primitives)
- Feature components in components/features/
- Hooks for store access and side effects

### Journey Engine Architecture

**Approach:** Pure functions — testable, no hidden state, functional patterns.

**Module Structure:**

```
src/lib/journey/
├── types.ts          # Journey, Phase, ArcTemplate, AudioFeatures
├── templates.ts      # Arc templates (slow-build, waves, intensity)
├── matcher.ts        # matchSongsToMood(songs, mood) → filtered songs
├── sequencer.ts      # sequencePhase(songs, phase) → ordered songs
├── generator.ts      # generateJourney(songs, mood, duration) → Journey
├── validator.ts      # validateGenerationInput() — edge case handling
└── index.ts          # Public API exports
```

**Input Validation:**

```typescript
// validator.ts — fail early with clear messages
function validateGenerationInput(songs: Track[], mood: Mood, duration: number): void {
  const matchingSongs = filterByMood(songs, mood)

  if (matchingSongs.length < 10) {
    throw new InsufficientSongsError(
      `Only ${matchingSongs.length} songs match "${mood}" mood. Need at least 10.`
    )
  }

  if (duration < 15 || duration > 240) {
    throw new InvalidDurationError(`Duration must be 15-240 minutes, got ${duration}`)
  }
}
```

**Generation Algorithm:**

```typescript
generateJourney(songs, mood, duration, template?) → Journey
  1. Validate inputs (validateGenerationInput) — fail early
  2. Filter songs by mood (energy, valence, tempo thresholds)
  3. Select arc template (or use default for duration)
  4. Allocate to phases: Opening 15%, Build 30%, Peak 35%, Resolve 20%
  5. Sequence within phases (energy progression)
  6. Return Journey { tracks, phases, totalDuration, mood }
```

### Testing Strategy

**Testing Pyramid:**

| Level | Scope | Tools | Count |
|-------|-------|-------|-------|
| **Unit** | Journey engine, validators, matchers | Vitest | Many (50+) |
| **Integration** | Zustand stores, IndexedDB operations | Vitest + jsdom | Medium (15-20) |
| **E2E** | Happy path flows only | Playwright | Few (2-3) |

**Mocking Strategy:**
- `MockSpotifyClient` for unit/integration tests
- `MockPlayerService` for playback tests
- No real Spotify calls in automated tests

### Infrastructure & Deployment

**Hosting:** Vercel (free tier)
- Static export + single serverless function
- Auto-deploy from GitHub `main` branch

**Environment Variables:**

| Variable | Scope | Purpose |
|----------|-------|---------|
| `SPOTIFY_CLIENT_ID` | Public | OAuth app identifier |
| `SPOTIFY_CLIENT_SECRET` | Server only | OAuth token exchange |
| `NEXT_PUBLIC_REDIRECT_URI` | Public | OAuth callback URL |

**Error Monitoring:** Console logging only (MVP)
- Friends can report issues directly
- Add Sentry post-MVP if scaling

**CI/CD:** Vercel default
- Push to `main` → auto-deploy
- Preview deployments for PRs

### Decision Impact Analysis

**Implementation Sequence:**
1. Project initialization (Next.js + shadcn/ui)
2. Zustand stores setup
3. Spotify OAuth integration (/api/callback)
4. SpotifyClient + PlayerService interfaces
5. IndexedDB + localStorage utilities (using `idb`)
6. Journey engine (pure functions + validator)
7. UI components + playback integration

**Cross-Component Dependencies:**

```
authStore ←── playerStore (needs tokens for SDK)
    ↑
journeyStore ←── prefsStore (exclusions affect generation)
    ↑
journey/generator ←── journey/validator ←── journey/matcher ←── journey/templates
    ↑
SpotifyClient (interface) ←── RealSpotifyClient | MockSpotifyClient
```

---

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 6 areas where AI agents could make different choices — all addressed below.

### Naming Patterns

**File Naming Conventions:**

| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase.tsx | `MoodPicker.tsx` |
| Hooks | camelCase with `use` prefix | `useJourneyStore.ts` |
| Utilities/libs | camelCase.ts | `generateJourney.ts` |
| Type definitions | types.ts (grouped) | `types.ts` → exports `Journey`, `Phase` |
| Test files | [name].test.ts (co-located) | `generator.test.ts` |
| Stores | camelCase + Store | `authStore.ts` |

**Code Naming Conventions:**

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `currentTrack`, `isPlaying` |
| Functions | camelCase, verb + noun | `generateJourney()`, `fetchLikedSongs()` |
| Types/Interfaces | PascalCase | `Journey`, `AudioFeatures` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_JOURNEY_DURATION` |
| React components | PascalCase | `ArcVisualization` |
| Hooks | use + PascalCase | `usePlayerStore` |
| Zustand actions | verb + noun | `setCurrentTrack`, `clearExclusions` |

### Structure Patterns

**Project Organization (Hybrid Approach):**

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home/main page
│   ├── api/
│   │   └── callback/
│   │       └── route.ts      # OAuth callback (serverless)
│   └── globals.css           # Tailwind + CSS variables
├── components/
│   ├── ui/                   # shadcn/ui primitives (DO NOT MODIFY)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── features/             # Custom feature components
│       ├── ArcVisualization.tsx
│       ├── MoodPicker.tsx
│       ├── PhaseIndicator.tsx
│       ├── JourneySummary.tsx
│       └── PlaybackControls.tsx
├── hooks/                    # Custom React hooks
│   └── useSpotifyPlayer.ts
├── lib/                      # Core logic (framework-agnostic)
│   ├── journey/              # Journey engine
│   │   ├── types.ts
│   │   ├── templates.ts
│   │   ├── matcher.ts
│   │   ├── sequencer.ts
│   │   ├── validator.ts
│   │   ├── generator.ts
│   │   └── index.ts
│   ├── spotify/              # Spotify integration
│   │   ├── types.ts
│   │   ├── client.ts         # SpotifyClient interface + impl
│   │   ├── player.ts         # PlayerService interface + impl
│   │   └── index.ts
│   ├── storage/              # Persistence utilities
│   │   ├── indexed-db.ts     # idb wrapper
│   │   ├── local-storage.ts
│   │   └── index.ts
│   └── utils.ts              # cn() and shared utilities
├── stores/                   # Zustand stores
│   ├── authStore.ts
│   ├── journeyStore.ts
│   ├── playerStore.ts
│   └── prefsStore.ts
└── types/                    # Shared type definitions
    └── index.ts
```

**Test File Location:** Co-located with source files

```
src/lib/journey/
├── generator.ts
├── generator.test.ts         # Tests next to source
├── matcher.ts
└── matcher.test.ts
```

### Format Patterns

**TypeScript Conventions:**

| Rule | Standard |
|------|----------|
| Strict mode | Enabled (`"strict": true`) |
| Explicit return types | Required for exported functions |
| Interface vs Type | Interface for objects, Type for unions/primitives |
| Null handling | Use `null` for intentional absence, `undefined` for optional |

**Data Format Standards:**

| Data | Format |
|------|--------|
| Dates | ISO 8601 strings (`2026-01-19T14:30:00Z`) |
| Durations | Minutes as number (`120` not `"2h"`) |
| IDs | String (Spotify uses string IDs) |
| Booleans | `true`/`false` (never `1`/`0`) |

### Communication Patterns

**Zustand State Management Rules:**

```typescript
// ✅ CORRECT: Immutable update
set((state) => ({
  ...state,
  currentTrack: track
}))

// ❌ WRONG: Direct mutation
set((state) => {
  state.currentTrack = track  // Never do this
  return state
})
```

**Action Patterns:**

```typescript
// Store definition pattern
interface JourneyStore {
  // State
  currentJourney: Journey | null
  phase: Phase | null
  isGenerating: boolean
  error: string | null

  // Actions (verb + noun)
  setJourney: (journey: Journey) => void
  clearJourney: () => void
  advancePhase: () => void
  setError: (message: string) => void
  clearError: () => void
}
```

**Selector Patterns:**

```typescript
// ✅ CORRECT: Select specific state
const isPlaying = usePlayerStore((s) => s.isPlaying)
const currentTrack = usePlayerStore((s) => s.currentTrack)

// ❌ WRONG: Select entire store (causes unnecessary re-renders)
const store = usePlayerStore()
```

### Process Patterns

**Error Handling Strategy:**

```typescript
// Service layer: Return tuple, don't throw
async function fetchLikedSongs(): Promise<{ data: Track[] | null, error: string | null }> {
  try {
    const response = await spotifyClient.getLikedSongs()
    return { data: response, error: null }
  } catch (e) {
    return { data: null, error: 'Failed to load your music library' }
  }
}

// Component layer: Handle gracefully
const { data, error } = await fetchLikedSongs()
if (error) {
  toast.error(error)  // User-friendly message
  return
}
```

**Error Types (Journey Engine):**

```typescript
// Typed errors for specific failure modes
class InsufficientSongsError extends Error {
  constructor(mood: string, count: number) {
    super(`Only ${count} songs match "${mood}". Need at least 10.`)
    this.name = 'InsufficientSongsError'
  }
}

class InvalidDurationError extends Error { ... }
class SpotifyAuthError extends Error { ... }
```

**Loading State Patterns:**

```typescript
// One boolean per async operation
interface AuthStore {
  isLoggingIn: boolean      // During OAuth flow
  isRefreshingToken: boolean // During token refresh
}

interface JourneyStore {
  isGenerating: boolean     // During journey generation
  isSavingPlaylist: boolean // During Spotify save
}
```

**Async Function Pattern:**

```typescript
// ✅ CORRECT: async/await with clear error handling
async function generateAndPlay(mood: Mood, duration: number) {
  setIsGenerating(true)
  setError(null)

  try {
    const journey = await generateJourney(songs, mood, duration)
    setJourney(journey)
    await playerService.play(journey.tracks[0].uri)
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Something went wrong')
  } finally {
    setIsGenerating(false)
  }
}

// ❌ WRONG: .then() chains
generateJourney(songs, mood, duration)
  .then(journey => { ... })
  .catch(e => { ... })
```

### Import Patterns

**Import Order (enforced by ESLint):**

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { create } from 'zustand'

// 3. Internal modules (using @/ alias)
import { Button } from '@/components/ui/button'
import { generateJourney } from '@/lib/journey'
import { useAuthStore } from '@/stores/authStore'

// 4. Types (if separate import)
import type { Journey, Phase } from '@/types'
```

**Path Alias Rules:**

```typescript
// ✅ CORRECT: Always use @/ alias
import { cn } from '@/lib/utils'
import { ArcVisualization } from '@/components/features/ArcVisualization'

// ❌ WRONG: Relative paths beyond parent
import { cn } from '../../../lib/utils'
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. Follow file naming conventions exactly (PascalCase for components, camelCase for utils)
2. Place new components in correct directory (`ui/` for primitives, `features/` for custom)
3. Use immutable state updates in Zustand stores
4. Return `{ data, error }` tuples from service functions
5. Use `@/` path aliases for all imports
6. Co-locate test files with source files
7. Use typed errors for known failure modes

**Pattern Verification:**
- ESLint enforces import order and naming
- TypeScript strict mode catches type violations
- PR review checklist includes pattern compliance

### Anti-Patterns to Avoid

| Anti-Pattern | Correct Pattern |
|--------------|-----------------|
| `store.currentTrack = track` | `set({ currentTrack: track })` |
| `import from '../../../'` | `import from '@/lib/...'` |
| `throw new Error('Failed')` | `return { data: null, error: '...' }` |
| `const store = useStore()` | `const value = useStore(s => s.value)` |
| `isLoading` (generic) | `isGenerating`, `isSaving` (specific) |
| `.then().catch()` chains | `async/await` with try/catch |

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices integrate cleanly:
- Next.js 15 + App Router → shadcn/ui (React-based) → Zustand (React state) — full React ecosystem alignment
- Tailwind CSS v4 + shadcn/ui CSS variables — consistent styling approach
- TypeScript strict mode throughout — type safety at all layers
- Static export (`output: 'export'`) compatible with all dependencies
- Single serverless function scope respects Vercel free tier constraints

**Pattern Consistency:**
- Naming conventions follow React/Next.js community standards
- File structure mirrors shadcn/ui recommendations
- Zustand patterns use immutable updates consistently
- Error handling uses tuple return pattern (`{ data, error }`) throughout service layer

**Structure Alignment:**
- Project structure directly supports all 4 Zustand stores
- `lib/journey/` structure matches pure function architecture decision
- `lib/spotify/` supports both interface abstractions (SpotifyClient, PlayerService)
- Test co-location pattern supported by Vitest defaults

### Requirements Coverage Validation ✅

**FR Category → Architectural Support:**

| Category | FRs | Support |
|----------|-----|---------|
| Music Library Connection | FR1-6 | SpotifyClient interface, `lib/spotify/`, authStore, IndexedDB cache |
| Journey Configuration | FR7-10 | prefsStore, `components/features/MoodPicker`, `ArcVisualization` |
| Journey Generation | FR11-16 | `lib/journey/` pure functions, SpotifyClient.createPlaylist() |
| Playback Experience | FR17-24 | PlayerService interface, playerStore, journeyStore phase tracking |
| Feedback & Learning | FR25-29 | prefsStore.exclusions, journeyStore.feedback, localStorage persistence |
| Session Management | FR30-33 | localStorage auth tokens, prefsStore, IndexedDB journey history |

**NFR → Architectural Support:**

| NFR Category | Key Requirements | Support |
|--------------|------------------|---------|
| Performance | <3s load, <5s generation | Static export, IndexedDB caching, client-side processing |
| Security | Token storage, HTTPS | localStorage (MVP trade-off documented), Vercel HTTPS |
| Integration | Rate limits, token refresh | SpotifyClient interface handles refresh, batched API calls |
| Accessibility | Keyboard nav, focus states | shadcn/ui built-in accessibility, Tailwind focus utilities |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical decisions documented with specific versions (Next.js 15, React 19, Tailwind v4)
- Implementation patterns comprehensive (naming, structure, format, communication, process, import)
- TypeScript examples provided for all major patterns (stores, services, error handling)
- Anti-patterns explicitly documented to prevent conflicts

**Structure Completeness:**
- Complete directory structure with all files specified
- Clear ownership boundaries (ui/ vs features/, lib/ vs stores/)
- Integration points mapped (authStore → playerStore dependency)

**Pattern Completeness:**
- All 6 conflict points addressed (file naming, component placement, state updates, error returns, imports, tests)
- Enforcement guidelines clear for AI agents
- ESLint rules mentioned for automated enforcement

### Gap Analysis Results

**Critical Gaps:** None

**Important Gaps:**
1. **NFR-S1 Deviation** — PRD specifies "not localStorage for refresh tokens" but architecture chose localStorage for both. Documented as MVP trade-off with post-MVP mitigation path (HttpOnly cookies). **Status:** Acceptable, documented.

**Nice-to-Have Gaps:**
1. E2E test scenarios could be more specific
2. Accessibility testing approach not specified
3. Rate limit batch sizes not detailed

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (33 FRs, 16 NFRs)
- [x] Scale and complexity assessed (Medium, 8-10 components)
- [x] Technical constraints identified (static hosting, no database, client-side)
- [x] Cross-cutting concerns mapped (auth, caching, errors, state, tokens)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (interfaces + mocks)
- [x] Performance considerations addressed (caching, static export)

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified (Zustand)
- [x] Process patterns documented (error handling, async)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all critical paths covered, patterns comprehensive, trade-offs documented

**Key Strengths:**
1. **Journey engine isolation** — Pure functions enable thorough testing without Spotify dependency
2. **Interface abstractions** — MockSpotifyClient/MockPlayerService enable full test coverage
3. **Explicit anti-patterns** — Reduces AI agent conflicts during implementation
4. **Progressive complexity** — Clear MVP → post-MVP boundary

**Areas for Future Enhancement:**
1. Sentry integration post-MVP for error monitoring
2. HttpOnly cookie approach if scaling beyond trusted friend group
3. Detailed E2E test scenarios
4. Accessibility testing automation

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
```bash
npx create-next-app@latest music-test --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd music-test
npx shadcn@latest init
npx shadcn@latest add button card slider progress toast tooltip
```

---

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-19
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**

- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**

- 12 architectural decisions made (state management, storage, auth, journey engine, testing, infrastructure, etc.)
- 6 implementation pattern categories defined (naming, structure, format, communication, process, import)
- 8-10 architectural components specified
- 33 functional requirements + 16 non-functional requirements fully supported

**📚 AI Agent Implementation Guide**

- Technology stack with verified versions (Next.js 15, React 19, Tailwind v4, Zustand, TypeScript)
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Quality Assurance Checklist

**✅ Architecture Coherence**

- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**

- [x] All 33 functional requirements are supported
- [x] All 16 non-functional requirements are addressed
- [x] Cross-cutting concerns are handled (auth, caching, errors, state, tokens)
- [x] Integration points are defined (Spotify API, Web Playback SDK)

**✅ Implementation Readiness**

- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale.

**🔧 Consistency Guarantee**
Implementation patterns ensure multiple AI agents produce compatible, consistent code.

**📋 Complete Coverage**
All project requirements are architecturally supported with clear mapping.

**🏗️ Solid Foundation**
Starter template and architectural patterns provide a production-ready foundation.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

