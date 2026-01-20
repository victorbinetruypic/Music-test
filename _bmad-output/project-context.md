---
project_name: 'Music-test'
user_name: 'Vic'
date: '2026-01-19'
sections_completed: ['technology_stack', 'typescript_rules', 'framework_rules', 'error_handling', 'testing_rules', 'file_structure', 'anti_patterns']
status: 'complete'
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 15 | App Router, static export (`output: 'export'`) |
| React | 19 | |
| TypeScript | 5.x | Strict mode enabled |
| Tailwind CSS | v4 | CSS variables for theming |
| Zustand | latest | State management (~1KB) |
| shadcn/ui | latest | Copy-paste component library |
| Vitest | latest | Unit/integration tests |
| Playwright | latest | E2E tests (few, happy path only) |
| idb | latest | IndexedDB Promise wrapper |
| Zod | latest | API boundary validation |

**Version Constraints:**
- shadcn/ui requires React — no SvelteKit
- Static export requires `images: { unoptimized: true }`
- Spotify Web Playback SDK requires Premium account

---

## Critical Implementation Rules

### TypeScript Rules

**Configuration:**
- Strict mode enabled (`"strict": true`)
- Explicit return types required for exported functions
- Use `interface` for objects, `type` for unions/primitives

**Null Handling:**
- Use `null` for intentional absence
- Use `undefined` for optional parameters

**Import Conventions:**
- ALWAYS use `@/` path alias (never `../../../`)
- Import order: React/Next → External libs → Internal modules → Types

```typescript
// ✅ CORRECT
import { useState } from 'react'
import { create } from 'zustand'
import { Button } from '@/components/ui/button'
import type { Journey } from '@/types'

// ❌ WRONG
import { cn } from '../../../lib/utils'
```

**Data Formats:**
- Dates: ISO 8601 strings (`2026-01-19T14:30:00Z`)
- Durations: Minutes as number (`120` not `"2h"`)
- IDs: String (Spotify uses string IDs)
- Booleans: `true`/`false` (never `1`/`0`)

### React & Next.js Rules

**Component Organization:**
- `components/ui/` — shadcn/ui primitives (DO NOT MODIFY)
- `components/features/` — Custom feature components
- File naming: PascalCase for components (`MoodPicker.tsx`)

**Hooks:**
- Custom hooks in `hooks/` directory
- Naming: `use` + PascalCase (`useSpotifyPlayer.ts`)

### Zustand State Management

**Store Structure:**
- 4 stores: `authStore`, `journeyStore`, `playerStore`, `prefsStore`
- Location: `stores/` directory

**Immutable Updates (CRITICAL):**
```typescript
// ✅ CORRECT
set((state) => ({ ...state, currentTrack: track }))

// ❌ WRONG - Never mutate directly
set((state) => { state.currentTrack = track; return state })
```

**Selector Pattern (CRITICAL):**
```typescript
// ✅ CORRECT - Select specific state
const isPlaying = usePlayerStore((s) => s.isPlaying)

// ❌ WRONG - Causes unnecessary re-renders
const store = usePlayerStore()
```

**Action Naming:** verb + noun (`setJourney`, `clearExclusions`, `advancePhase`)

**Loading States:** Use specific booleans (`isGenerating`, `isSavingPlaylist`) not generic `isLoading`

### Error Handling Rules

**Service Layer Pattern (CRITICAL):**
Return tuples, don't throw exceptions:

```typescript
// ✅ CORRECT - Return tuple
async function fetchLikedSongs(): Promise<{ data: Track[] | null; error: string | null }> {
  try {
    const response = await spotifyClient.getLikedSongs()
    return { data: response, error: null }
  } catch (e) {
    return { data: null, error: 'Failed to load your music library' }
  }
}

// ❌ WRONG - Throwing from service
async function fetchLikedSongs(): Promise<Track[]> {
  throw new Error('Failed')  // Don't do this
}
```

**Typed Errors (Journey Engine):**
Use specific error classes for known failure modes:
- `InsufficientSongsError` — Not enough songs match mood
- `InvalidDurationError` — Duration out of range
- `SpotifyAuthError` — Authentication issues

**Async Pattern (CRITICAL):**
```typescript
// ✅ CORRECT - async/await with try/catch
async function generateAndPlay() {
  try {
    const journey = await generateJourney(songs, mood, duration)
    await playerService.play(journey.tracks[0].uri)
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Something went wrong')
  }
}

// ❌ WRONG - .then() chains
generateJourney().then(j => { ... }).catch(e => { ... })
```

### Testing Rules

**Testing Pyramid:**
- Unit tests (Vitest): Many (50+) — Journey engine, validators, matchers
- Integration tests (Vitest + jsdom): Medium (15-20) — Stores, IndexedDB
- E2E tests (Playwright): Few (2-3) — Happy path flows only

**Test File Location:**
Co-locate tests with source files:
```
src/lib/journey/
├── generator.ts
├── generator.test.ts    # Tests next to source
├── matcher.ts
└── matcher.test.ts
```

**Test File Naming:** `[name].test.ts`

**Mocking Strategy:**
- Use `MockSpotifyClient` for unit/integration tests
- Use `MockPlayerService` for playback tests
- NO real Spotify API calls in automated tests

**Interface Abstractions:**
```typescript
// Abstract for testability
interface SpotifyClient {
  getLikedSongs(): Promise<Track[]>
  getAudioFeatures(trackIds: string[]): Promise<AudioFeatures[]>
}

class RealSpotifyClient implements SpotifyClient { ... }
class MockSpotifyClient implements SpotifyClient { ... }  // For tests
```

### File Structure & Naming

**Project Structure:**
```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/callback/route.ts # OAuth (only serverless function)
├── components/
│   ├── ui/                   # shadcn/ui (DO NOT MODIFY)
│   └── features/             # Custom components
├── hooks/                    # Custom React hooks
├── lib/
│   ├── journey/              # Pure function engine
│   ├── spotify/              # API + SDK wrappers
│   └── storage/              # idb + localStorage
├── stores/                   # Zustand stores
└── types/                    # Shared type definitions
```

**File Naming Conventions:**

| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase.tsx | `MoodPicker.tsx` |
| Hooks | camelCase with `use` | `useSpotifyPlayer.ts` |
| Utilities/libs | camelCase.ts | `generateJourney.ts` |
| Type definitions | types.ts (grouped) | `types.ts` |
| Stores | camelCase + Store | `authStore.ts` |
| Tests | [name].test.ts | `generator.test.ts` |

**Code Naming:**

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `currentTrack` |
| Functions | camelCase, verb+noun | `generateJourney()` |
| Types/Interfaces | PascalCase | `Journey`, `AudioFeatures` |
| Constants | SCREAMING_SNAKE | `MAX_JOURNEY_DURATION` |

### Critical Anti-Patterns

**NEVER DO THESE:**

| Anti-Pattern | Correct Pattern |
|--------------|-----------------|
| `store.currentTrack = track` | `set({ currentTrack: track })` |
| `import from '../../../'` | `import from '@/lib/...'` |
| `throw new Error('Failed')` | `return { data: null, error: '...' }` |
| `const store = useStore()` | `const value = useStore(s => s.value)` |
| `isLoading` (generic) | `isGenerating`, `isSaving` (specific) |
| `.then().catch()` chains | `async/await` with try/catch |
| Modify `components/ui/*` | Create in `components/features/` |

### Storage Rules

**localStorage:**
- Auth tokens (access + refresh)
- User preferences
- Exclusion list ("Not This")

**IndexedDB (via `idb`):**
- Audio features cache (large dataset)
- Journey history (grows over time)

### API Validation

**Zod at API Boundaries:**
- Validate ALL Spotify API responses before use
- Use `validateGenerationInput()` in journey engine for edge cases

### Security Notes (MVP)

- Tokens in localStorage (acceptable for MVP with trusted users)
- Post-MVP: Consider HttpOnly cookies if scaling
- Single serverless function: `/api/callback` only

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

---

**Last Updated:** 2026-01-19

