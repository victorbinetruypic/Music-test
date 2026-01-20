---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
workflowComplete: true
completedDate: '2026-01-19'
inputDocuments:
  - '_bmad-output/analysis/brainstorming-session-2026-01-18.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: 'Web App (Consumer SPA)'
  domain: 'Entertainment / Music Tech'
  complexity: 'Medium'
  projectContext: 'Greenfield'
  businessModel: 'Free utility (near-zero operating costs)'
---

# Product Requirements Document - Music-test

**Author:** Vic
**Date:** 2026-01-18

## Executive Summary

**Product Vision:** Transform your Spotify liked songs into intentional DJ-set experiences with designed energy arcs — not random shuffle, but curated journeys that build, peak, and resolve.

**Core Differentiator:** Journey Architecture — the only music app that treats playlists as deliberate experiences with energy management, inspired by live DJ sets and tasting menus.

**MVP Hypothesis:** Can template-based journey arcs make your existing Spotify likes feel like a live DJ set? Validate with friend group before adding complexity.

**Business Model:** Free utility with near-zero operating costs (static hosting, client-side processing). Future: acquisition target for Spotify based on proven journey architecture AI and community.

---

## Success Criteria

### User Success

**Primary Metric: Return Usage**
- Users come back to the app within 24-48 hours of their first journey
- Regular usage pattern develops (daily/weekly listening sessions)
- The "book you love" signal — even if interrupted mid-journey, they return

**Secondary Metric: Organic Sharing**
- Users share the app with friends unprompted
- Word-of-mouth growth within friend networks

**Tertiary Metric: Journey Completion**
- Nice-to-have, not primary — life interrupts, and that's okay
- Completion indicates flow state achieved, but absence doesn't indicate failure

### Business Success

**MVP Validation (Only metric that matters now):**
- Core friend group returns to the app regularly
- Daily/weekly usage becomes habit for music-listening friends
- If friends who listen to music all day choose this over Spotify shuffle, MVP is validated

**Future metrics deferred** — will revisit after MVP proves the magic

### Technical Success

- **Cost:** Near-zero operating costs (static hosting, client-side processing)
- **Spotify Integration:** Successfully reads liked songs and audio features
- **WhatsApp Parsing:** Extracts Spotify/YouTube/SoundCloud links from chat exports
- **Journey Delivery:** Generated sets feel intentional, not random — the "live DJ set" standard

### Measurable Outcomes

| Timeframe | Success Indicator |
|-----------|-------------------|
| Week 1 | Friends try it and complete at least one journey |
| Month 1 | Friends return regularly without prompting |
| Month 3 | Friends prefer it over Spotify shuffle for daily listening |

---

## Product Scope

### MVP - Minimum Viable Product

**Core Features (Required for magic):**
1. **Spotify Connection** — OAuth login, read liked songs, access audio features (energy, valence, tempo)
2. **Simple Mood Picker** — 4-6 mood options (energetic, chill, melancholic, focused, uplifting, dark)
3. **Duration Picker** — User controls session length (30 min, 1 hr, 2 hr, open-ended)
4. **Journey Architecture** — Template-based sets with intentional arc (build → peak → resolve)
5. **Arc Visualization** — Show journey structure before playback to set expectations
6. **In-Browser Playback** — Via Spotify Web Playback SDK (Premium required)
7. **Contextual Feedback** — Skip tracking + "Not This" permanent exclusion

**Technical Constraints:**
- Static hosting (Vercel free tier)
- Client-side processing
- Single serverless function for Spotify OAuth
- No database (LocalStorage + IndexedDB)

*See "Project Scoping & Phased Development" section for detailed feature breakdown.*

### Growth Features (Post-MVP)

**Phase 2 — Friend Imports (v1.1):**
- WhatsApp chat export parsing
- Copy-paste song links
- Friend attribution ("Marco shared this")

**Phase 3+ — Intelligence & Social:**
- Contextual sensing (auto-detect time, day, weather)
- Personalized DJ personas ("Your rainy day DJ")
- Multi-platform link normalization
- Social features (vibe overlap stats)
- Taste affinity weighting per sharer

### Vision (Future)

*If validation leads to acquisition path:*
- Deep Spotify integration (native playback, richer features)
- Multiple chat source support (Discord, forums, subreddits)
- Pro DJ tools for professional curators
- Community platform for tastemakers
- "Spotify Wrapped"-style retrospectives

---

## User Journeys

> **Note:** Journey 1 depicts the full v1.1 vision including WhatsApp import. MVP (v1.0) is simpler: Spotify likes only, no friend imports. The core experience — mood selection, arc visualization, journey playback — remains identical.

### Journey 1: First-Time Setup — "Alex Discovers the Magic"

**Persona:** Alex, 28, designer. Listens to music 6+ hours/day while working. Has 2,400 liked songs on Spotify but hates shuffle. His friend group has shared music in WhatsApp for 3 years.

**Opening Scene:**
Alex lands on the app after his friend Vic recommended it. Clean landing page: *"Turn your friends' music into magical journeys."* One button: Connect Spotify. He clicks, authorizes in one step, done.

**Rising Action:**
App confirms connection, shows his 2,400 liked songs. Next: import curated music source. Alex uploads his WhatsApp chat export. App scans it: *"Found 847 song links from your chat."*

**Climax:**
Mood picker appears. Alex selects "Focused" (Monday morning, needs to work). The arc visualization appears — a timeline showing gentle opening → building energy → peak focus zone → wind-down. He sees the structure, feels engaged, hits play.

**Resolution:**
First song is good, not perfect. Alex glances at the arc — he's in "gentle opening." Instead of quitting, he thinks: *"Let's see where this goes."* By song 12, he's in flow state. Journey ends gracefully. He bookmarks the app. Tomorrow, he'll be back.

---

### Journey 2: Daily Use — "Alex Returns"

**Persona:** Same Alex, day 2. Just finished a tough meeting, needs to decompress and get back to deep work.

**Opening Scene:**
Alex opens the app (still logged in). Sees: *"Welcome back. Last journey: Monday Focus — 1h 47m. You discovered 12 new songs."* Small dopamine hit.

**Rising Action:**
Quick repeat option for "Monday Focus" appears. Below it, mood picker and duration selector. Alex taps Focused + 2 hours — three taps total.

**Climax:**
Arc appears. Similar to yesterday, but smarter — songs he skipped are gone, new discoveries added. Songs show "via Marco" attribution. Alex smiles, hits play.

**Resolution:**
Fewer skips than yesterday. Flow state faster. He doesn't finish (meeting interrupts), but the experience was better than day 1. He'll be back tomorrow. And the next day.

---

### Journey Requirements Summary

**First-Time Setup reveals:**
- Single-click Spotify OAuth
- Flexible song import (file upload or paste)
- Link parsing from messy text
- Mood picker (4-6 options)
- Arc visualization before playback
- Playlist generation with intentional structure

**Daily Use reveals:**
- Session persistence
- Journey history with stats
- Quick repeat previous mood
- Duration picker (30m / 1hr / 2hr / open)
- Conservative learning from skip behavior
- Friend attribution on songs
- Minimal friction (3 taps to music)

---

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Journey Architecture (Core Innovation)**

The central innovation: treating playlists as intentional DJ-set experiences with designed energy arcs — build, peak, resolve. Not "songs that match your mood" but "an experience designed to take you somewhere."

- **Differentiator:** Spotify shuffle is random. Mood playlists are static. No existing solution crafts *journeys* with deliberate energy management.
- **Inspiration:** Live DJ sets, restaurant tasting menus, meditation app session design.
- **Key insight:** "We lack magic because we shuffle thousands of songs."

**2. Arc Visualization (UX Innovation)**

Showing journey structure before playback to create user investment and set expectations. Shifts mental model from "this song doesn't match" to "I'm in the gentle opening, let's see where it goes."

- **Problem solved:** First-song abandonment — if song 1 doesn't match mood, users quit.
- **Mechanism:** Visual timeline showing journey phases creates understanding and patience.
- **Key insight:** The arc visualization is a retention mechanism, not just a feature.

**3. Three-Tier Feedback (Feedback Innovation)**

Redefining skip behavior: Skip ≠ Dislike. Three distinct signals:
- **Skip:** "Love this song, wrong moment"
- **Not This:** "Never play this again"
- **Engage:** Positive reinforcement

- **Differentiator:** Every recommendation system treats skip as negative. This captures context, not just preference.
- **Key insight:** A skip is information about *context*, not about the *song*.

### Validation Approach

| Innovation | Validation Method |
|------------|-------------------|
| Journey Architecture | Hand-craft 5-10 journeys manually, test with friend group. Does it feel like a DJ set or just a playlist? |
| Arc Visualization | Early prototype with/without arc. Measure first-song abandonment rate. |
| Three-Tier Feedback | Track if skip rate decreases over time. Interview users: do they understand skip vs. "not this"? |

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Journey architecture doesn't "feel" different | Study actual DJ sets, extract patterns, validate against professional DJs in friend network |
| Arc visualization adds friction | Make it subtle, skippable. A/B test engagement vs. immediate playback |
| Users don't understand feedback tiers | Default to simple (skip = contextual). Add "not this" as power-user feature |
| AI can't craft good journeys | Start with template-based arcs (slow build, waves, etc.) before full AI generation |

---

## Web App Specific Requirements

### Project-Type Overview

**Architecture:** Single Page Application (SPA)
- One-page app with dynamic content updates
- No full page reloads during user flow
- State maintained client-side

**Hosting:** Static hosting (Vercel free tier)
- Near-zero cost
- Serverless edge function for Spotify OAuth only

### Technical Architecture Considerations

**Frontend Stack:**
- Modern JavaScript framework (SvelteKit or Next.js with static export)
- Client-side routing
- LocalStorage for preferences + IndexedDB for cached data

**Backend Requirements:**
- Single serverless function for Spotify OAuth token exchange
- No database for MVP
- All processing client-side

**API Integrations:**
- Spotify Web API (read liked songs, audio features, create playlists)
- Spotify Web Playback SDK (play directly in browser — requires Premium)

### MVP Simplification (Ship Fast)

**MVP Scope (v1.0):**
- Spotify likes ONLY as song source
- No friend imports required
- Connect → Mood → Play (2 taps after auth)

**Post-MVP (v1.1):**
- Friend-curated song import (WhatsApp export, copy-paste, file upload)
- Step-by-step import guide with screenshots
- "Unlock full experience" prompt after users love the basic journey

### Browser Support

| Browser | Support Level |
|---------|---------------|
| Chrome, Firefox, Safari, Edge (latest) | Full support |
| Older browsers | Not supported |

### Responsive Design

- **Primary:** Desktop/laptop (work listening use case)
- **Secondary:** Tablet/mobile (basic support)

*Performance targets defined in Non-Functional Requirements section.*

### Technical Constraints

- **Spotify Premium required** for Web Playback SDK
- **Cache audio features** in IndexedDB after first API call
- **WhatsApp has no API** — import requires manual export (deferred to v1.1)

### Data Flow (MVP)

1. User authenticates with Spotify
2. App fetches liked songs + audio features (cached locally)
3. User picks mood + duration
4. Journey generated client-side using template arcs
5. Playlist created via Spotify API
6. Playback via Web Playback SDK in browser

### Security Considerations

- Spotify tokens stored securely
- No server-side data storage
- All user data stays in browser

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP
- Prove the core magic (journey architecture) before adding complexity
- Minimum features, maximum "I feel great" experience
- Fast to ship, fast to validate with friend group

**Core Hypothesis:** Can journey architecture make your Spotify likes feel like a DJ set?

**Resource Requirements:** Solo developer, 2-4 weeks to MVP

### MVP Feature Set (Phase 1)

**Core User Journey Supported:** Daily Use (returning user)
- Connect Spotify → Pick mood → Pick duration → Experience journey

**Must-Have Capabilities:**

| Feature | Rationale |
|---------|-----------|
| Spotify OAuth | Access to liked songs and audio features |
| Audio feature caching | Performance — don't re-fetch on every session |
| Mood picker (4-6 options) | Core input for journey generation |
| Duration picker | User controls session length |
| Template-based journey arcs | The core innovation — build, peak, resolve |
| Arc visualization | Retention mechanism — sets expectations |
| Web Playback SDK | Plays directly in browser (Premium required) |
| Skip tracking | Contextual learning — "love it, wrong moment" |
| "Not This" button | Permanent exclusion — "never play again" |
| Session persistence | Frictionless return visits |
| Last journey summary | Dopamine hit on return |

### Post-MVP Features

**Phase 2 — Friend Imports (v1.1):**
- WhatsApp chat export parsing
- Copy-paste song links
- File upload support
- Friend attribution on songs ("via Marco")
- Quick repeat previous mood
- Step-by-step import guide

**Phase 3 — Intelligence (v2.0):**
- Contextual sensing (time, day, weather)
- Personalized DJ personas
- Advanced AI journey generation (beyond templates)
- Learning from cross-session patterns

**Phase 4 — Social (v3.0):**
- Vibe overlap stats
- Taste affinity weighting
- Shared journey experiences
- Community features

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Mitigation |
|------|------------|
| Journey doesn't feel different from shuffle | Hand-craft template arcs from real DJ sets. Test with friends before coding |
| Spotify Premium requirement | Acceptable for MVP validation. Consider app handoff for v1.1 |
| Audio feature caching complexity | Use IndexedDB, proven browser storage |

**Market Risks:**

| Risk | Mitigation |
|------|------------|
| Users don't return after first use | Arc visualization creates investment. Track Day 2 return obsessively |
| Journey magic doesn't land | Iterate on templates before adding features |

**Resource Risks:**

| Risk | Mitigation |
|------|------------|
| Limited dev time | Ruthlessly simple MVP. Spotify does heavy lifting |
| Scope creep | Friend imports are v1.1, not MVP. Hold the line |

---

## Functional Requirements

### Music Library Connection

- **FR1:** User can connect their Spotify account via single-click OAuth
- **FR2:** User can view confirmation of their connected library size (liked songs count)
- **FR3:** System can retrieve user's liked songs from Spotify
- **FR4:** System can retrieve audio features (energy, valence, tempo) for liked songs
- **FR5:** System can cache audio features locally for repeat sessions
- **FR6:** User can understand minimum library requirements for journey generation

### Journey Configuration

- **FR7:** User can select a mood for their journey from predefined options (energetic, chill, melancholic, focused, uplifting, dark)
- **FR8:** User can select a duration for their journey (30 min, 1 hr, 2 hr, open-ended)
- **FR9:** User can preview the journey arc structure before playback begins
- **FR10:** User can understand which phase of the journey they're currently in (opening, build, peak, resolve)

### Journey Generation

- **FR11:** System can generate a journey playlist using template-based arc patterns
- **FR12:** System can sequence songs following predefined arc templates (slow build, wave pattern, etc.)
- **FR13:** System can match songs to mood and phase requirements using audio features
- **FR14:** System can create a Spotify playlist from the generated journey
- **FR15:** User can save a journey playlist to their Spotify library
- **FR16:** System can exclude previously rejected songs from journey generation

### Playback Experience

- **FR17:** User can understand Spotify Premium requirement before attempting playback
- **FR18:** User can play their journey directly in the browser (Spotify Premium required)
- **FR19:** User can pause and resume playback
- **FR20:** User can skip to the next song in the journey
- **FR21:** User can see the current song and its position in the journey arc
- **FR22:** User can resume an interrupted journey from where they left off
- **FR23:** User can understand and recover from playback errors
- **FR24:** User can experience a satisfying journey completion moment

### Feedback & Learning

- **FR25:** User can skip a song (contextual signal — "love it, wrong moment")
- **FR26:** User can mark a song as "Not This" (permanent exclusion — "never play again")
- **FR27:** System can track skip behavior with journey phase context
- **FR28:** System can reduce frequency of skipped songs in subsequent journeys
- **FR29:** System can remember "Not This" exclusions across all sessions

### Session Management

- **FR30:** User can return to the app without re-authenticating
- **FR31:** User can view their last journey summary (duration, songs discovered)
- **FR32:** User can start a journey with previous settings in 3 or fewer interactions
- **FR33:** System can persist user preferences across sessions

---

## Non-Functional Requirements

### Performance

| NFR | Requirement | Rationale |
|-----|-------------|-----------|
| **NFR-P1** | Initial page load completes in < 3 seconds on broadband connection | Fast first impression, no bounce |
| **NFR-P2** | Journey generation completes in < 5 seconds after mood/duration selection | Maintain engagement, feel responsive |
| **NFR-P3** | Playback starts within 2 seconds of pressing play | Seamless transition to music |
| **NFR-P4** | Skip to next track responds within 1 second | Feels instantaneous |
| **NFR-P5** | Audio feature retrieval uses cached data after first fetch | No re-fetching on return visits |

### Security

| NFR | Requirement | Rationale |
|-----|-------------|-----------|
| **NFR-S1** | Spotify access tokens stored in secure browser storage (not localStorage for refresh tokens) | Prevent token theft |
| **NFR-S2** | No user data transmitted to third parties beyond Spotify | Privacy commitment |
| **NFR-S3** | All API communications over HTTPS | Data in transit protection |
| **NFR-S4** | OAuth state parameter validated to prevent CSRF attacks | Standard OAuth security |

### Integration

| NFR | Requirement | Rationale |
|-----|-------------|-----------|
| **NFR-I1** | Graceful handling when Spotify API is unavailable (clear error message, retry option) | Don't leave user confused |
| **NFR-I2** | Spotify rate limits respected (batch requests where possible) | Prevent API lockout |
| **NFR-I3** | Support Spotify Web Playback SDK v1.x or later | Dependency management |
| **NFR-I4** | Handle Spotify token refresh automatically without user re-authentication | Seamless sessions |

### Accessibility (Minimal for MVP)

| NFR | Requirement | Rationale |
|-----|-------------|-----------|
| **NFR-A1** | All interactive elements accessible via keyboard | Basic usability |
| **NFR-A2** | Sufficient color contrast for text (WCAG AA minimum) | Readability |
| **NFR-A3** | Playback controls have visible focus states | Know what's selected |

