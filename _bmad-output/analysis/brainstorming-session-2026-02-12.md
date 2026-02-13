---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Building a DJ engine without Spotify audio features — alternative data sources, heuristics, and creative workarounds'
session_goals: 'Identify every possible data source for music analysis, generate creative heuristics for mood/energy/tempo matching, design a buildable architecture that works with available APIs'
selected_approach: 'AI-Recommended Techniques'
techniques_used: ['Morphological Analysis', 'Cross-Pollination', 'First Principles Thinking']
ideas_generated: [DS1-Genre Mapping, DS2-Popularity Gradient, DS3-Duration Deviation, DS4-Replay Intensity, DS5-Personalized Weighting, DS6-Text/Visual (parked), CP1-Diagnostic Model, CP2-Sommelier Engine, CP3-Onboarding Ramp, CP4-Skip Detection, CP5-Safe-to-Adventurous Ramp, FP-Fresh Palate Principle, ARCH-Sommelier Engine Architecture]
context_file: ''
session_continued: true
continuation_date: '2026-02-13'
pivot_reason: 'Spotify deprecated /audio-features and /recommendations endpoints Nov 2024 — 403 for all new apps'
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitator:** Vic
**Date:** 2026-02-12 (continued 2026-02-13)

## Session Overview

**Topic:** Building a DJ engine without Spotify audio features — alternative data sources, heuristics, and creative workarounds
**Goals:** Identify every possible data source for music analysis, generate creative heuristics for mood/energy/tempo matching, and design a buildable architecture that works with available APIs and tools.

### Session Setup

**Original topic:** Reverse-engineering legendary DJ sets to improve the automated DJ engine.

**Pivot (Feb 13):** Discovered Spotify deprecated `/v1/audio-features` and `/v1/recommendations` for new apps (Nov 27, 2024). Our app gets 403 Forbidden. Extended quota requires 250K MAU — not viable. The brainstorm pivots to: how do we build a great DJ engine *without* the 8 Spotify audio features we depended on?

**What we lost:** energy, valence, tempo, danceability, key, mode, loudness, acousticness — all via one API call.
**What still works:** liked songs, profile, recently played, playlists, track metadata (name, artist, album, duration, popularity).
**Alternatives explored:** Apple Music (0/8 features), Tidal (4/8 features), Essentia.js (needs raw audio — blocked by DRM), Soundcharts (paid), AcousticBrainz (dead).

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Building music intelligence from scratch, given API restrictions

**Recommended Techniques:**

- **Morphological Analysis:** Map every possible dimension of music data we *could* access — build the complete parameter grid of what's available
- **Cross-Pollination:** Steal ideas from other domains that solve "understanding without direct measurement" — how do other apps infer music properties?
- **First Principles Thinking:** Ground the best ideas into what's actually buildable with our tech stack (Next.js, browser APIs, free/cheap services)

**AI Rationale:** We're solving a constraint problem. Phase 1 maps the full landscape of what's possible. Phase 2 imports wild ideas from other fields. Phase 3 filters for what's actually buildable and ships.

## Technique Execution Results

### Phase 1: Morphological Analysis — Mapping the Data Landscape

**Focus:** Identify every possible data source for music intelligence without audio analysis.

**Data Sources Identified:**

**[DS1] Genre-to-Feature Mapping Table** (Buildability: 9/10)
_Concept:_ Build a curated lookup table mapping Spotify's 5,000+ micro-genres to estimated audio features (energy, tempo range, valence, danceability). LLM-seeded, shipped as static JSON. A genre name like "tropical house" inherently encodes ~110 BPM, medium-high energy, uplifting mood.
_Novelty:_ Instead of analyzing audio, we analyze language — genre labels are human-created summaries of what music sounds like.
_Implementation:_ Batch fetch artist genres via `/artists?ids=` (50 per request = ~10 API calls for full library). Cache in IndexedDB.

**[DS2] Popularity Gradient — Per-Artist Relative** (Buildability: 10/10)
_Concept:_ Within a single artist's catalog, rank tracks by popularity score. Higher relative popularity likely correlates with higher energy/danceability. Use popularity percentile within an artist as an energy modifier on top of the genre baseline.
_Novelty:_ Not absolute popularity — *relative* popularity within an artist's own catalog as a proxy for "this is the one that hits hardest."
_Limitation:_ Commercially biased. Slow ballads can be popular (Radiohead's "Creep"), viral tracks popular for non-energy reasons. Useful but noisy signal.

**[DS3] Duration x Genre Deviation** (Buildability: 10/10)
_Concept:_ Track duration combined with genre reveals song structure. A 2:30 track = pop single or intro. A 7:30 electronic track = progressive build. A 3:45 punk track = banger. Duration as deviation from genre average is the key metric.
_Novelty:_ Duration alone means nothing. Duration as a deviation from genre norms means everything.

**[DS4] Replay Intensity — The "Obsession Signal"** (Buildability: 7/10)
_Concept:_ When a user discovers a banger, they binge it — multiple plays within hours of adding, repeated plays over following days. This creates a distinctive spike pattern detectable via `/me/player/recently-played`. A track played 15 times in 3 days = high energy/impact. A track played once a week = chill background.
_Novelty:_ Reading the user's emotional reaction through behavior. The replay curve IS the energy signature.
_Patterns:_ "Obsession spike" (5+ plays in 48h), "Slow burn" (steady weekly), "One and done" (didn't connect), "Comeback kid" (rediscovery after months).
_Limitation:_ Only 50 recent plays available per API call. Needs accumulation over time in IndexedDB.

**[DS5] Personalized Feature Weighting** (Buildability: 8/10)
_Concept:_ Instead of universal audio features, build a per-user model. YOUR bangers are the tracks YOU binged. YOUR chill tracks are the ones YOU play once at midnight. The DJ engine doesn't need absolute energy — it needs to know where a track sits in YOUR personal energy spectrum.
_Novelty:_ Flips the entire approach from "analyze music objectively" to "analyze how the user relates to the music." Arguably more powerful for a personal DJ engine than Spotify's static features ever were.

**[DS6] Text/Visual Metadata** (Parked)
_Concept:_ Song titles and album art carry emotional cues. NLP on titles, color analysis on artwork.
_Decision:_ Weak signal, high noise ("Bang Bang" is actually slow). Parked for future exploration.

**Phase 1 Key Breakthrough:** The pivot from objective audio analysis to personal behavioral analysis. We don't need to know a track's absolute BPM — we need to know where it lives in the user's energy universe.

---

### Phase 2: Cross-Pollination — Ideas From Other Domains

**Focus:** How do other fields solve "understanding without direct measurement"?

**[CP1] The Diagnostic Model** (from Medicine)
_Concept:_ Before MRI, doctors diagnosed through symptoms, history, and behavioral patterns. Treat each track like a patient — build a "symptom profile" from multiple weak signals (genre, duration, popularity, replay behavior). No single signal is diagnostic, but the combination converges on a confident assessment.
_Novelty:_ Formalizes the multi-signal approach as a confidence-weighted system. Each signal adds probability, not certainty.

**[CP2] The Sommelier Engine** (from Wine Tasting)
_Concept:_ A sommelier doesn't chemically analyze wine. They pattern-match indirect sensory signals against a mental catalog built from thousands of wines. The DJ engine starts rough and builds a trained palate for the user's taste through journey feedback.
_Novelty:_ The engine gets better the more you use it — a learning DJ. Turns our weakness (no audio data) into a strength (deeply personalized over time).
_Critical constraint (Vic):_ The feedback loop must be fast enough that users don't get demoralized and leave before the engine learns. Solved by the Onboarding Ramp.

**[CP3] The Onboarding Ramp** (from Video Game Difficulty Curves)
_Concept:_ Games like Celeste are rewarding from minute one but deepen over hundreds of hours. The first level teaches mechanics through play, not explanation. Our first journey IS the tutorial — it feels magical while secretly calibrating the engine.
_Novelty:_ Journey 1 uses the user's existing library data (genres, most-played, popularity) to deliver a solid experience before any behavioral learning kicks in.

**[CP4] Skip/Play-Through Detection** (from Pandora)
_Concept:_ Pandora didn't wait for end-of-station surveys — thumbs up/down on every track. We go further: skip within 15 seconds = implicit thumbs down. Full play-through = implicit thumbs up. Replay mid-journey = massive positive signal. Web Playback SDK provides all events for free.
_Novelty:_ No explicit feedback needed. User behavior during playback is continuous, honest feedback.

**[CP5] Safe-to-Adventurous Ramp** (from Netflix)
_Concept:_ Netflix over-indexes on "safe bets" for new users, then gradually introduces riskier picks as confidence grows. Journey 1 leans on most-played favorites. Journey 3 introduces deeper cuts. Journey 10 pulls forgotten gems.
_Novelty:_ The engine earns the right to take risks. User never hits the "this sucks" wall.

| Journey | Strategy | Risk Level |
|---------|----------|-----------|
| 1 | Top played + genre anchors | Very safe |
| 2-3 | Adjust via skip/play-through data | Low risk |
| 4-7 | Mix in deeper cuts, test boundaries | Medium |
| 8+ | Full sommelier, forgotten gems, surprises | High confidence |

---

### Phase 3: First Principles — Buildability Assessment

**Hard Constraints:** Client-side only (no backend), IndexedDB + sessionStorage, Spotify free tier API, no raw audio access (DRM), ~1 req/sec rate limit.

**Buildability Scores:**

| Idea | Score | Notes |
|------|-------|-------|
| DS1: Genre Mapping | 9/10 | ~10 API calls via batched `/artists?ids=`, static JSON table |
| DS2: Popularity Gradient | 10/10 | Pure math, zero API calls, data already cached |
| DS3: Duration Deviation | 10/10 | Pure math, zero API calls |
| DS4: Replay Intensity | 7/10 | Works but slow to accumulate (50 plays per poll) |
| DS5: Personalized Weighting | 8/10 | Orchestration layer, needs weight tuning |
| CP2: Sommelier Engine | 8/10 | IndexedDB feedback storage, iterative improvement |
| CP3: Onboarding Ramp | 9/10 | Strategy choice in generator, not a new system |
| CP4: Skip Detection | 9/10 | Web Playback SDK events, already available |
| CP5: Safe-to-Adventurous | 9/10 | Confidence counter in IndexedDB |

### The "Fresh Palate" Principle (Vic's Breakthrough)

Monthly cache expiry isn't a limitation — it's a feature. The sommelier forgets and rediscovers you. Your taste evolves, the engine evolves with you. Things move fast — people change, want new things. Periodic reset keeps the flow of music fresh. This is **better than static audio features** which would lock you into the same profile forever.

---

### Synthesized Architecture: The Sommelier Engine

```
┌─────────────────────────────────────────────┐
│           TRACK INTELLIGENCE SCORE          │
│                                             │
│  Genre Baseline (static JSON, LLM-seeded)   │
│      ↓ modified by                          │
│  Popularity Gradient (per-artist relative)  │
│      ↓ modified by                          │
│  Duration Deviation (vs genre average)      │
│      ↓ modified by                          │
│  Replay Intensity (obsession spikes)        │
│      ↓ modified by                          │
│  Sommelier Feedback (skip/play/ratings)     │
│                                             │
│  = Estimated { energy, tempo, valence,      │
│               danceability } per track      │
├─────────────────────────────────────────────┤
│           JOURNEY GENERATOR                 │
│                                             │
│  Onboarding ramp (safe → adventurous)       │
│  Phase curve (opening → build → peak →      │
│               resolve) using estimated      │
│               features                      │
│  Mid-journey adaptation (skip detection)    │
├─────────────────────────────────────────────┤
│           STORAGE (IndexedDB)               │
│                                             │
│  Track cache + genre mappings (24h TTL)     │
│  Artist genres (monthly refresh)            │
│  Play history accumulator (monthly reset)   │
│  Sommelier weights (monthly reset = fresh)  │
│  Journey history + ratings                  │
└─────────────────────────────────────────────┘
```

**API Call Budget:**

| Scenario | Before (audio features) | After (Sommelier Engine) |
|----------|------------------------|--------------------------|
| Page load | 9 calls | **0 calls** |
| First use (cold cache) | 12 calls | **~15 calls** (liked songs + artist genres) |
| Create Journey (warm cache) | 3 calls | **0 calls** |
| Returning user page load | 9 calls | **0 calls** |

---

## Idea Organization and Prioritization

### Top 3 High-Impact Ideas

1. **Genre-to-Feature Mapping Table** — the foundation everything else builds on
2. **The Sommelier Engine** — the overarching learning architecture
3. **Onboarding Ramp (Safe-to-Adventurous)** — solves cold start and retention

### Quick Wins (ship this week)

1. Genre baseline table (LLM-generated, static JSON)
2. Popularity gradient (pure math, zero API calls)
3. Duration deviation (pure math, zero API calls)

### Longer-Term Build

1. Play history accumulator (needs time to collect data)
2. Sommelier feedback weights (needs journey feedback loop)
3. Skip detection via Web Playback SDK events

---

## Action Plan

### Phase 1 — Foundation (immediate)

1. Generate genre-to-feature lookup table (~300 genres) using an LLM
2. Ship as static JSON in the app
3. Fetch artist genres via batched `/artists?ids=` calls (~10 API calls for full library)
4. Cache artist-genre mappings in IndexedDB
5. Compute popularity gradient + duration deviation client-side
6. Wire into existing journey generator as replacement for audio features

### Phase 2 — Behavioral Layer (next)

1. Start accumulating play history from `/me/player/recently-played` on each app open
2. Implement obsession spike detection algorithm
3. Add skip detection via Web Playback SDK events
4. Use behavioral signals as modifiers on top of genre baseline

### Phase 3 — Sommelier (iterative)

1. Add post-journey feedback UI (single tap: fire / good / meh / bad)
2. Store feedback per track in IndexedDB
3. Implement confidence-based journey strategy (safe early, adventurous later)
4. Monthly cache reset for the "Fresh Palate" effect

---

## Session Summary and Insights

**Key Achievements:**

- Turned a crisis (Spotify killing audio features) into an opportunity to build something arguably **better** — a personalized, learning engine vs. static universal features
- Identified 6 data sources, all free, requiring minimal API calls
- Designed a complete architecture (The Sommelier Engine) that improves with use
- Solved the cold start problem through the Netflix-inspired onboarding ramp
- Discovered the "Fresh Palate" principle — monthly resets keep the engine evolving with the user

**Session Breakthrough:** The fundamental reframe from "How do we replace audio analysis?" to "How do we understand what music means to THIS user?" This personalized approach is more valuable than what we lost.

### Creative Facilitation Narrative

This session began as a pivot under pressure — Spotify had just cut off the endpoints our entire engine depended on. What could have been a demoralized "well, we're stuck" moment became a generative exploration that yielded a stronger architecture than the original. The key turning point was Vic's insight about replay behavior ("when I find a banger, I listen to it multiple times right after adding it") which unlocked the entire personalized behavioral approach. His later insight about monthly cache resets being a feature, not a bug, cemented the "Fresh Palate" philosophy that makes this engine unique.

### Session Highlights

**Vic's Creative Strengths:** Pattern recognition from personal experience, instinct for user retention challenges, turning constraints into features
**Facilitation Approach:** Domain-hopping (medicine, wine, gaming, streaming) to break out of the "we need audio analysis" mental model
**Breakthrough Moment:** The shift from objective measurement to personal behavioral analysis
**Energy Flow:** Started cautious (can we really do this without audio features?), built momentum through data source stacking, peaked at the Sommelier concept, and landed with a concrete architecture
