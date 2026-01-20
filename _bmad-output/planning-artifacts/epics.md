---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
workflowComplete: true
completedDate: '2026-01-19'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# Music-test - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Music-test, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Music Library Connection (FR1-FR6)**
- FR1: User can connect their Spotify account via single-click OAuth
- FR2: User can view confirmation of their connected library size (liked songs count)
- FR3: System can retrieve user's liked songs from Spotify
- FR4: System can retrieve audio features (energy, valence, tempo) for liked songs
- FR5: System can cache audio features locally for repeat sessions
- FR6: User can understand minimum library requirements for journey generation

**Journey Configuration (FR7-FR10)**
- FR7: User can select a mood for their journey from predefined options (energetic, chill, melancholic, focused, uplifting, dark)
- FR8: User can select a duration for their journey (30 min, 1 hr, 2 hr, open-ended)
- FR9: User can preview the journey arc structure before playback begins
- FR10: User can understand which phase of the journey they're currently in (opening, build, peak, resolve)

**Journey Generation (FR11-FR16)**
- FR11: System can generate a journey playlist using template-based arc patterns
- FR12: System can sequence songs following predefined arc templates (slow build, wave pattern, etc.)
- FR13: System can match songs to mood and phase requirements using audio features
- FR14: System can create a Spotify playlist from the generated journey
- FR15: User can save a journey playlist to their Spotify library
- FR16: System can exclude previously rejected songs from journey generation

**Playback Experience (FR17-FR24)**
- FR17: User can understand Spotify Premium requirement before attempting playback
- FR18: User can play their journey directly in the browser (Spotify Premium required)
- FR19: User can pause and resume playback
- FR20: User can skip to the next song in the journey
- FR21: User can see the current song and its position in the journey arc
- FR22: User can resume an interrupted journey from where they left off
- FR23: User can understand and recover from playback errors
- FR24: User can experience a satisfying journey completion moment

**Feedback & Learning (FR25-FR29)**
- FR25: User can skip a song (contextual signal — "love it, wrong moment")
- FR26: User can mark a song as "Not This" (permanent exclusion — "never play again")
- FR27: System can track skip behavior with journey phase context
- FR28: System can reduce frequency of skipped songs in subsequent journeys
- FR29: System can remember "Not This" exclusions across all sessions

**Session Management (FR30-FR33)**
- FR30: User can return to the app without re-authenticating
- FR31: User can view their last journey summary (duration, songs discovered)
- FR32: User can start a journey with previous settings in 3 or fewer interactions
- FR33: System can persist user preferences across sessions

### Non-Functional Requirements

**Performance (NFR-P1 to NFR-P5)**
- NFR-P1: Initial page load completes in < 3 seconds on broadband connection
- NFR-P2: Journey generation completes in < 5 seconds after mood/duration selection
- NFR-P3: Playback starts within 2 seconds of pressing play
- NFR-P4: Skip to next track responds within 1 second
- NFR-P5: Audio feature retrieval uses cached data after first fetch

**Security (NFR-S1 to NFR-S4)**
- NFR-S1: Spotify access tokens stored in secure browser storage
- NFR-S2: No user data transmitted to third parties beyond Spotify
- NFR-S3: All API communications over HTTPS
- NFR-S4: OAuth state parameter validated to prevent CSRF attacks

**Integration (NFR-I1 to NFR-I4)**
- NFR-I1: Graceful handling when Spotify API is unavailable (clear error message, retry option)
- NFR-I2: Spotify rate limits respected (batch requests where possible)
- NFR-I3: Support Spotify Web Playback SDK v1.x or later
- NFR-I4: Handle Spotify token refresh automatically without user re-authentication

**Accessibility (NFR-A1 to NFR-A3)**
- NFR-A1: All interactive elements accessible via keyboard
- NFR-A2: Sufficient color contrast for text (WCAG AA minimum)
- NFR-A3: Playback controls have visible focus states

### Additional Requirements

**From Architecture - Starter Template (CRITICAL for Epic 1, Story 1):**
- Initialize project using: `npx create-next-app@latest music-test --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- Initialize shadcn/ui: `npx shadcn@latest init`
- Add required components: `npx shadcn@latest add button card slider progress toast tooltip`
- Configure static export in next.config.js (`output: 'export'`)

**From Architecture - Technical Infrastructure:**
- Set up Zustand stores (authStore, journeyStore, playerStore, prefsStore)
- Implement SpotifyClient interface with mock for testing
- Implement PlayerService interface with mock for testing
- Set up IndexedDB via `idb` library for audio features cache
- Set up localStorage utilities for preferences and tokens
- Configure Vitest for unit/integration testing
- Configure Playwright for E2E testing

**From Architecture - Journey Engine:**
- Implement pure function architecture in `lib/journey/`
- Create arc templates (slow-build, waves, intensity)
- Implement mood matcher using audio features
- Implement phase sequencer for energy progression
- Implement input validation (`validateGenerationInput()`)

**From UX Design:**
- Arc visualization must work "at a glance" (< 1 second comprehension)
- "3 taps to music" target for return visits
- Communicate Spotify Premium requirement gracefully before frustration
- UI should be minimal/ambient during playback
- Loading states should feel intentional using journey metaphor
- Empty states should guide users forward, never dead-end
- Transitions should feel smooth and intentional

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Spotify OAuth connection |
| FR2 | Epic 1 | Library size confirmation |
| FR3 | Epic 1 | Retrieve liked songs |
| FR4 | Epic 1 | Retrieve audio features |
| FR5 | Epic 1 | Cache audio features |
| FR6 | Epic 1 | Library requirements display |
| FR7 | Epic 2 | Mood selection |
| FR8 | Epic 2 | Duration selection |
| FR9 | Epic 2 | Arc preview |
| FR10 | Epic 2 | Phase indicator |
| FR11 | Epic 2 | Journey generation |
| FR12 | Epic 2 | Song sequencing |
| FR13 | Epic 2 | Mood/phase matching |
| FR14 | Epic 2 | Spotify playlist creation |
| FR15 | Epic 2 | Save to Spotify library |
| FR16 | Epic 2 | Exclude rejected songs |
| FR17 | Epic 3 | Premium requirement display |
| FR18 | Epic 3 | Browser playback |
| FR19 | Epic 3 | Pause/resume |
| FR20 | Epic 3 | Skip to next |
| FR21 | Epic 3 | Current song + position |
| FR22 | Epic 3 | Resume interrupted journey |
| FR23 | Epic 3 | Error recovery |
| FR24 | Epic 3 | Completion moment |
| FR25 | Epic 4 | Skip signal |
| FR26 | Epic 4 | "Not This" exclusion |
| FR27 | Epic 4 | Skip tracking with context |
| FR28 | Epic 4 | Reduce skipped frequency |
| FR29 | Epic 4 | Remember exclusions |
| FR30 | Epic 5 | Persistent auth |
| FR31 | Epic 5 | Last journey summary |
| FR32 | Epic 5 | Quick start (3 taps) |
| FR33 | Epic 5 | Persist preferences |

---

## Epic List

### Epic 1: Project Foundation & Spotify Connection
Users can connect their Spotify account and confirm their music library is ready for journey creation.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 2: Journey Creation & Arc Preview
Users can configure their journey preferences and see a visual preview of the arc before committing.

**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16

### Epic 3: Playback Experience
Users can play their journey in the browser with full controls and see their progress through the arc.

**FRs covered:** FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24

### Epic 4: Feedback & Learning
Users can tell the system which songs don't fit, and future journeys get smarter.

**FRs covered:** FR25, FR26, FR27, FR28, FR29

### Epic 5: Return Experience & Quick Start
Users can return to the app and start a new journey in 3 taps or less.

**FRs covered:** FR30, FR31, FR32, FR33

---

## Epic 1: Project Foundation & Spotify Connection

Users can connect their Spotify account and confirm their music library is ready for journey creation.

### Story 1.1: Project Initialization

As a **developer**,
I want **the project initialized with Next.js, shadcn/ui, and core architecture**,
So that **I have a solid foundation to build the Music-test application**.

**Acceptance Criteria:**

**Given** a fresh development environment
**When** the project initialization commands are run
**Then** a Next.js 15 project is created with App Router, TypeScript, Tailwind CSS, and ESLint
**And** shadcn/ui is initialized with the required components (button, card, slider, progress, toast, tooltip)
**And** the project structure matches the architecture specification (`src/app`, `src/components`, `src/lib`, `src/stores`, `src/hooks`, `src/types`)
**And** static export is configured in next.config.js (`output: 'export'`)
**And** path aliases are configured (`@/*` pointing to `src/*`)
**And** the project builds successfully with `npm run build`

---

### Story 1.2: Spotify OAuth Connection

As a **user**,
I want **to connect my Spotify account with a single click**,
So that **the app can access my music library**.

**Acceptance Criteria:**

**Given** I am on the landing page and not authenticated
**When** I click the "Connect Spotify" button
**Then** I am redirected to Spotify's authorization page
**And** after I authorize, I am redirected back to the app
**And** my access token and refresh token are stored in localStorage
**And** I see a confirmation that my Spotify account is connected

**Given** the OAuth callback is received
**When** the authorization code is exchanged for tokens
**Then** the `/api/callback` serverless function handles the token exchange
**And** CSRF is prevented via OAuth state parameter validation
**And** errors during token exchange display a user-friendly message

---

### Story 1.3: Library Confirmation Display

As a **user**,
I want **to see my connected library size**,
So that **I know my Spotify account is properly linked and ready**.

**Acceptance Criteria:**

**Given** I am authenticated with Spotify
**When** I view the main page
**Then** I see my Spotify display name or profile indicator
**And** I see the count of my liked songs (e.g., "2,847 liked songs")
**And** the liked songs count is fetched from the Spotify API
**And** the data is stored in the authStore

**Given** the Spotify API returns an error
**When** fetching liked songs fails
**Then** I see a clear error message with a retry option
**And** the error is logged for debugging

---

### Story 1.4: Audio Feature Retrieval & Caching

As a **system**,
I want **to retrieve and cache audio features for the user's liked songs**,
So that **journey generation can use this data without repeated API calls**.

**Acceptance Criteria:**

**Given** the user is authenticated and liked songs are retrieved
**When** audio features have not been cached
**Then** the system fetches audio features from Spotify API in batches (max 100 per request)
**And** audio features (energy, valence, tempo, danceability) are stored in IndexedDB via `idb` library
**And** the cache includes a timestamp for freshness tracking
**And** a progress indicator shows during the initial fetch

**Given** audio features are already cached
**When** the user returns to the app
**Then** the system uses cached data from IndexedDB
**And** no additional Spotify API calls are made for audio features
**And** the app loads significantly faster (meeting NFR-P5)

**Given** the Spotify API rate limit is approached
**When** batching audio feature requests
**Then** requests are throttled appropriately to avoid API lockout (NFR-I2)

**Given** a batch request fails mid-way (e.g., request 15 of 20 fails)
**When** partial data has been retrieved
**Then** successfully fetched data (requests 1-14) is cached and preserved
**And** the user sees which portion completed vs failed
**And** a "Retry failed" option is available to complete the remaining batches
**And** the app remains functional with partial data (degraded but usable)

---

### Story 1.5: Library Requirements Communication

As a **user**,
I want **to understand if my library meets the minimum requirements**,
So that **I know if I can generate journeys successfully**.

**Acceptance Criteria:**

**Given** I am authenticated and my library is loaded
**When** I have fewer than 50 liked songs
**Then** I see a message explaining that more songs are needed for quality journeys
**And** the message is helpful, not blocking (e.g., "Add more liked songs on Spotify for better journeys")

**Given** I have sufficient liked songs (50+)
**When** viewing the main interface
**Then** I see a positive indicator that my library is ready
**And** I can proceed to journey configuration

**Given** I have liked songs but audio features show limited mood variety
**When** analyzing my library
**Then** I see guidance about potential mood limitations (optional enhancement)

---

## Epic 2: Journey Creation & Arc Preview

Users can configure their journey preferences and see a visual preview of the arc before committing.

### Story 2.1: Mood Selection Interface

As a **user**,
I want **to select a mood for my journey from predefined options**,
So that **the generated playlist matches my current emotional state**.

**Acceptance Criteria:**

**Given** I am authenticated and my library is ready
**When** I view the journey configuration screen
**Then** I see 6 mood options displayed: Energetic, Chill, Melancholic, Focused, Uplifting, Dark
**And** each mood has a distinct visual treatment (icon or color)
**And** I can select exactly one mood at a time
**And** my selection is visually highlighted
**And** the selected mood is stored in the journeyStore

**Given** I have selected a mood
**When** I want to change my selection
**Then** I can tap a different mood to switch
**And** the previous selection is deselected

---

### Story 2.2: Duration Selection Interface

As a **user**,
I want **to select how long my journey should be**,
So that **the playlist fits my available listening time**.

**Acceptance Criteria:**

**Given** I am on the journey configuration screen
**When** I view the duration options
**Then** I see 4 duration choices: 30 min, 1 hr, 2 hr, Open-ended
**And** each option clearly indicates the approximate length
**And** I can select exactly one duration at a time
**And** my selection is stored in the journeyStore

**Given** I select "Open-ended"
**When** the journey is generated
**Then** the system creates a longer playlist that continues until manually stopped
**And** the arc structure still applies but cycles or extends gracefully

---

### Story 2.3: Journey Generation Engine

As a **system**,
I want **to generate a journey playlist using template-based arc patterns**,
So that **users experience intentional energy progression, not random shuffle**.

**Acceptance Criteria:**

**Given** a mood and duration are selected and audio features are cached
**When** the user initiates journey generation
**Then** the system filters songs matching the selected mood using audio features (energy, valence, tempo)
**And** the system selects an arc template appropriate for the duration
**And** songs are allocated to phases: Opening (15%), Build (30%), Peak (35%), Resolve (20%)
**And** songs within each phase are sequenced by energy progression
**And** the journey is generated in < 5 seconds (NFR-P2)
**And** the generated journey is stored in journeyStore

**Given** the journey engine receives input
**When** validating the generation request
**Then** `validateGenerationInput()` checks for sufficient matching songs (minimum 10)
**And** invalid duration values are rejected with clear error messages
**And** edge cases throw typed errors (`InsufficientSongsError`, `InvalidDurationError`)

**Given** the user's library has limited songs for the selected mood
**When** fewer than 10 songs match
**Then** the user sees a helpful message suggesting a different mood or adding more liked songs
**And** generation does not proceed with insufficient songs

---

### Story 2.4: Arc Visualization & Preview

As a **user**,
I want **to preview the journey arc structure before playback**,
So that **I understand the journey shape and feel engaged before music starts**.

**Acceptance Criteria:**

**Given** a journey has been generated
**When** I view the arc preview
**Then** I see a visual representation of the energy arc (Opening → Build → Peak → Resolve)
**And** the visualization is comprehensible in < 1 second (UX requirement)
**And** the current phase is visually distinguished
**And** I can see approximately how many songs are in each phase

**Given** I am viewing the arc preview
**When** I look at the phase indicator
**Then** I understand which phase I'm currently in (FR10)
**And** the phases are labeled clearly: Opening, Build, Peak, Resolve
**And** the visualization feels like a "journey map" not a clinical graph (UX requirement)

**Given** the journey is displayed
**When** I want to proceed
**Then** I see a clear "Start Journey" or "Play" action
**And** I feel anticipation and investment before the music begins

---

### Story 2.5: Spotify Playlist Creation & Save

As a **user**,
I want **to save my journey as a Spotify playlist**,
So that **I can access it later or share it with others**.

**Acceptance Criteria:**

**Given** a journey has been generated
**When** I choose to save the journey
**Then** the system creates a new playlist in my Spotify account via the API
**And** the playlist is named meaningfully (e.g., "Focused Journey - Jan 19")
**And** all journey tracks are added to the playlist in the correct order
**And** I see confirmation that the playlist was saved successfully (FR15)

**Given** the Spotify API fails during playlist creation
**When** an error occurs
**Then** I see a user-friendly error message with retry option
**And** the journey is not lost - I can retry saving

**Given** I don't want to save the playlist
**When** I skip the save option
**Then** I can still play the journey without saving to Spotify
**And** the journey exists only in the app for this session

---

### Story 2.6: Exclusion Filtering in Generation

As a **system**,
I want **to exclude previously rejected songs from journey generation**,
So that **users never hear songs they've marked as "Not This"**.

**Acceptance Criteria:**

**Given** the user has previously marked songs as "Not This" (stored in prefsStore)
**When** generating a new journey
**Then** all excluded song IDs are filtered out before mood matching
**And** excluded songs never appear in any generated journey
**And** the exclusion list persists across sessions (localStorage)

**Given** the exclusion list grows large
**When** filtering songs
**Then** performance remains acceptable (filtering is O(n) with Set lookup)
**And** the generation still completes in < 5 seconds

**Given** no songs have been excluded yet
**When** generating a journey
**Then** all mood-matching songs are eligible for selection
**And** the system functions normally without an exclusion list

---

## Epic 3: Playback Experience

Users can play their journey in the browser with full controls and see their progress through the arc.

### Story 3.1: Premium Requirement Communication

As a **user**,
I want **to understand that Spotify Premium is required before I try to play**,
So that **I'm not frustrated by unexpected limitations**.

**Acceptance Criteria:**

**Given** I am authenticated with a Spotify Free account
**When** I attempt to start playback
**Then** I see a clear, friendly message explaining that Spotify Premium is required for in-browser playback
**And** the message appears before any playback attempt fails
**And** I am offered alternative options (e.g., "Open in Spotify app" or "Save playlist to listen later")

**Given** I am authenticated with Spotify Premium
**When** I view the journey screen
**Then** no Premium warning is shown
**And** playback controls are fully enabled

**Given** Premium status cannot be determined
**When** viewing the interface
**Then** playback is attempted gracefully
**And** clear error messaging appears if it fails due to account type

---

### Story 3.2: Web Playback SDK Integration

As a **user**,
I want **to play my journey directly in the browser**,
So that **I can listen without switching to another app**.

**Acceptance Criteria:**

**Given** I have Spotify Premium and a generated journey
**When** I click "Play" or "Start Journey"
**Then** the Web Playback SDK initializes with my access token
**And** the browser registers as a Spotify Connect device
**And** the first song of the journey begins playing
**And** playback starts within 2 seconds of pressing play (NFR-P3)

**Given** the SDK is initialized
**When** playback begins
**Then** audio plays through the browser
**And** the playerStore is updated with current playback state
**And** the device appears in my Spotify Connect device list

**Given** I have another Spotify device active
**When** I start playback in the browser
**Then** playback transfers to the browser seamlessly
**And** I am not required to manually switch devices

**Given** another device is actively playing and refuses to yield
**When** the browser cannot take over playback
**Then** I see a clear message: "Music is playing on another device"
**And** I am offered options: "Play here instead" or "Open Spotify to switch"
**And** the journey is not lost - I can retry when ready

**Given** this story requires Spotify Premium for testing
**When** writing automated tests
**Then** unit/integration tests use MockPlayerService exclusively
**And** E2E tests are manual or use a dedicated test Premium account
**And** the SDK initialization is abstracted behind PlayerService interface for testability

---

### Story 3.3: Playback Controls

As a **user**,
I want **to pause, resume, and skip songs**,
So that **I have control over my listening experience**.

**Acceptance Criteria:**

**Given** a journey is playing
**When** I click the pause button
**Then** playback pauses immediately
**And** the button changes to a play icon
**And** the arc visualization pauses at the current position

**Given** playback is paused
**When** I click the play button
**Then** playback resumes from where it stopped
**And** the button changes back to a pause icon

**Given** a journey is playing
**When** I click the skip/next button
**Then** the current song stops and the next song in the journey begins
**And** the skip responds within 1 second (NFR-P4)
**And** the arc visualization updates to show the new position
**And** if I skip the last song, the journey completion triggers

**Given** playback controls are displayed
**When** using keyboard navigation
**Then** all controls are accessible via keyboard (NFR-A1)
**And** focused controls have visible focus states (NFR-A3)

---

### Story 3.4: Now Playing Display

As a **user**,
I want **to see the current song and my position in the journey arc**,
So that **I know where I am in the experience**.

**Acceptance Criteria:**

**Given** a journey is playing
**When** I view the now playing display
**Then** I see the current song title and artist
**And** I see album artwork (if available from Spotify)
**And** I see a progress bar for the current song
**And** I see my position in the overall journey arc

**Given** the arc visualization is displayed during playback
**When** viewing my progress
**Then** I can see which phase I'm in (Opening, Build, Peak, Resolve)
**And** the current song's position is highlighted on the arc
**And** completed songs/phases are visually distinguished from upcoming ones

**Given** playback is active
**When** a new song starts
**Then** the now playing display updates automatically
**And** the arc position indicator moves to the new song
**And** transitions feel smooth and intentional (UX requirement)

---

### Story 3.5: Journey Resume

As a **user**,
I want **to resume an interrupted journey from where I left off**,
So that **I don't lose my progress if I need to step away**.

**Acceptance Criteria:**

**Given** I was playing a journey and closed the browser or navigated away
**When** I return to the app within the same session
**Then** I see an option to "Resume Journey" with the journey name and progress
**And** I can see how far I got (e.g., "Song 8 of 24 - Build phase")

**Given** I choose to resume
**When** I click "Resume Journey"
**Then** the journey loads with all remaining songs
**And** playback starts from where I left off
**And** the arc visualization reflects my current position

**Given** I don't want to resume
**When** I choose to start a new journey instead
**Then** the interrupted journey is discarded
**And** I can configure a fresh journey

**Given** journey state needs to persist
**When** storing resume data
**Then** current position, journey details, and timestamp are saved to journeyStore
**And** data persists in localStorage for the session

---

### Story 3.6: Playback Error Handling

As a **user**,
I want **to understand and recover from playback errors**,
So that **I'm not stuck when something goes wrong**.

**Acceptance Criteria:**

**Given** the Spotify API becomes unavailable during playback
**When** an error occurs
**Then** I see a clear, non-technical error message (e.g., "Connection to Spotify lost")
**And** I see a "Retry" button to attempt reconnection
**And** the journey state is preserved so I don't lose progress (NFR-I1)

**Given** my access token expires during playback
**When** a 401 error is received
**Then** the system automatically attempts to refresh the token (NFR-I4)
**And** if refresh succeeds, playback continues seamlessly
**And** if refresh fails, I'm prompted to reconnect Spotify

**Given** the Web Playback SDK encounters an error
**When** the device disconnects or fails
**Then** I see a helpful message explaining the issue
**And** I'm offered options: retry, refresh page, or open in Spotify app

**Given** any playback error occurs
**When** viewing error messages
**Then** the message is user-friendly, not technical jargon
**And** there's always a clear next action available

---

### Story 3.7: Journey Completion Celebration

As a **user**,
I want **to experience a satisfying moment when my journey ends**,
So that **the experience feels complete and intentional, not abrupt**.

**Acceptance Criteria:**

**Given** the last song in the journey finishes playing
**When** the journey completes
**Then** I see a completion screen celebrating the finished journey
**And** the screen shows journey stats (duration, songs played, mood)
**And** the moment feels intentional and satisfying, not like an error

**Given** I'm viewing the completion screen
**When** I see my options
**Then** I can start a new journey
**And** I can save the playlist to Spotify (if not already saved)
**And** I can see a summary of songs I discovered (new to this journey)

**Given** the journey ends
**When** the completion animation/transition plays
**Then** it reinforces the "journey" metaphor (arrival, accomplishment)
**And** the UI doesn't abruptly stop - there's a graceful wind-down
**And** the user feels "wanting more + feeling complete" (from brainstorming insights)

**Given** I've just completed a journey
**When** I want to immediately start another
**Then** "Start New Journey" is prominently available on the completion screen
**And** tapping it takes me directly to mood/duration selection (or Quick Start)
**And** the transition from "arrival" to "new departure" feels natural, not jarring

---

## Epic 4: Feedback & Learning

Users can tell the system which songs don't fit, and future journeys get smarter.

### Story 4.1: Skip Signal with Context

As a **user**,
I want **to skip a song when it doesn't fit the moment**,
So that **the system learns my preferences without me having to explain**.

**Acceptance Criteria:**

**Given** a journey is playing
**When** I skip a song (via skip button or keyboard)
**Then** the skip is recorded with contextual metadata:
- Song ID
- Journey phase (Opening, Build, Peak, Resolve)
- Position in journey (early, middle, late)
- Timestamp
**And** the next song begins immediately
**And** the skip action feels lightweight, not punitive

**Given** I skip a song
**When** the skip is recorded
**Then** the system understands this as "love it, wrong moment" not "hate it"
**And** the song remains eligible for future journeys
**And** no disruptive UI appears asking "why did you skip?"

**Given** skip data is being collected
**When** storing the skip event
**Then** data is saved to journeyStore for the current session
**And** aggregate skip patterns are persisted to localStorage/IndexedDB for learning

**Given** the feedback interaction
**When** I skip quickly through multiple songs
**Then** each skip is recorded without UI lag
**And** the experience remains smooth and uninterrupted

---

### Story 4.2: "Not This" Permanent Exclusion

As a **user**,
I want **to mark a song as "Not This" so it never plays again**,
So that **I can permanently remove songs I truly don't want**.

**Acceptance Criteria:**

**Given** a song is playing or was just played
**When** I activate the "Not This" action
**Then** the song is immediately added to my exclusion list
**And** I see subtle confirmation (e.g., brief toast: "Got it, removed")
**And** the song will never appear in any future journey

**Given** I want to mark a song as "Not This"
**When** looking for the action
**Then** the "Not This" button/action is easily accessible but not prominent
**And** it's clearly different from "Skip" (skip = wrong moment, Not This = never again)
**And** the action requires a deliberate tap (not accidental)

**Given** I mark a song as "Not This"
**When** the exclusion is processed
**Then** the song ID is added to prefsStore exclusion list
**And** if the song is currently playing, it skips to the next song
**And** the feedback is subtle and doesn't interrupt flow (UX requirement)

**Given** the "Not This" action
**When** considering the UI
**Then** it's accessible via a secondary action (long-press, menu, or small button)
**And** it's not as prominent as play/pause/skip to prevent accidents

---

### Story 4.3: Exclusion Persistence Across Sessions

As a **system**,
I want **to remember "Not This" exclusions permanently**,
So that **excluded songs never return, even after months**.

**Acceptance Criteria:**

**Given** a user has marked songs as "Not This"
**When** the user closes the browser and returns later
**Then** all exclusions are still in effect
**And** excluded songs are filtered out during journey generation

**Given** exclusions need to persist
**When** storing the exclusion list
**Then** data is saved to localStorage (small, fast access)
**And** the format is a simple array of Spotify track IDs
**And** the data survives browser restarts and clearing session storage

**Given** the exclusion list exists
**When** the app initializes
**Then** the exclusion list is loaded into prefsStore on startup
**And** it's immediately available for journey generation filtering

**Given** the user has many exclusions over time
**When** the list grows (e.g., 100+ songs)
**Then** storage and retrieval remain performant
**And** localStorage size limits are respected (typically 5-10MB, exclusion list is tiny)

---

### Story 4.4: Skip-Based Frequency Reduction

As a **system**,
I want **to reduce the frequency of songs that get skipped often**,
So that **journeys improve over time without explicit user configuration**.

**Acceptance Criteria:**

**Given** a song has been skipped multiple times across journeys
**When** generating a new journey
**Then** the song's selection probability is reduced based on skip frequency
**And** songs skipped 3+ times are significantly deprioritized
**And** the song is not completely excluded (unlike "Not This")

**Given** skip patterns include phase context
**When** analyzing skip behavior
**Then** the system considers WHERE in the journey the skip occurred
**And** a song skipped during "Peak" might still be suitable for "Opening"
**And** phase-aware learning improves journey quality

**Given** the learning algorithm
**When** calculating selection probability
**Then** the formula uses a simple penalty score:
- `penaltyScore = (skipCount * 0.5) + (recentSkips * 1.0)` where recentSkips = skips in last 5 journeys
- Songs with penaltyScore >= 3 are deprioritized (selected last within their mood/phase match)
- Songs with penaltyScore >= 5 are soft-excluded (only used if insufficient alternatives)
**And** the algorithm is deterministic and testable
**And** penalty scores are stored alongside skip data for debugging

**Given** a song was skipped but user later engages positively
**When** the user lets a song play fully or adds it to a playlist
**Then** the negative signal is partially offset
**And** the system doesn't permanently penalize songs from early skips

**Given** the learning system
**When** affecting journey generation
**Then** changes are gradual, not dramatic
**And** the user's library isn't artificially narrowed over time
**And** there's a natural decay so old skip data matters less

---

## Epic 5: Return Experience & Quick Start

Users can return to the app and start a new journey in 3 taps or less.

### Story 5.1: Persistent Authentication

As a **user**,
I want **to return to the app without re-authenticating**,
So that **I can start listening immediately without friction**.

**Acceptance Criteria:**

**Given** I previously connected my Spotify account
**When** I return to the app (same browser)
**Then** I am automatically logged in
**And** I see my authenticated state (profile indicator, library ready)
**And** I don't see the "Connect Spotify" landing page

**Given** my access token has expired
**When** I return to the app
**Then** the system automatically refreshes the token using the stored refresh token
**And** this happens silently without user interaction (NFR-I4)
**And** I remain logged in seamlessly

**Given** the refresh token has expired or been revoked
**When** automatic refresh fails
**Then** I see a friendly message: "Please reconnect your Spotify"
**And** I can reconnect with one click
**And** the experience is not jarring or error-like

**Given** auth tokens are stored
**When** persisting credentials
**Then** both access token and refresh token are stored in localStorage
**And** tokens are loaded on app initialization
**And** authStore is populated before rendering authenticated UI

---

### Story 5.2: Last Journey Summary

As a **user**,
I want **to see a summary of my last journey when I return**,
So that **I feel a sense of continuity and progress**.

**Acceptance Criteria:**

**Given** I completed a journey in my previous session
**When** I return to the app
**Then** I see a "Welcome back" message with my last journey summary
**And** the summary shows: journey mood, duration played, and date
**And** I see how many songs I listened to (e.g., "18 songs, 1h 23m")

**Given** the last journey summary is displayed
**When** viewing the details
**Then** I can see any new discoveries (songs I hadn't played before)
**And** the display creates a small "dopamine hit" of recognition
**And** returning feels rewarding, like opening a favorite book

**Given** I have journey history
**When** storing journey data
**Then** completed journeys are saved to IndexedDB
**And** at minimum, the last journey details are persisted
**And** data includes: mood, duration, song count, date, discovery count

**Given** I have no previous journey
**When** returning as a first-time user after connecting Spotify
**Then** no summary is shown
**And** I see the journey configuration screen directly

---

### Story 5.3: Quick Start with Previous Settings

As a **user**,
I want **to start a new journey with my previous settings in 3 taps or less**,
So that **daily listening requires minimal effort**.

**Acceptance Criteria:**

**Given** I return to the app with a previous journey history
**When** I view the main screen
**Then** I see a prominent "Quick Start" or "Same as last time" option
**And** this option uses my previous mood and duration settings
**And** I can start a journey with: Open app → Tap Quick Start → Music plays (2 taps)

**Given** I tap Quick Start
**When** the journey generates
**Then** it uses my last mood and duration settings
**And** generation happens immediately
**And** playback begins automatically after generation
**And** the entire flow from tap to music is < 10 seconds

**Given** I want different settings than last time
**When** I look for options
**Then** I can easily access the full configuration (mood picker, duration picker)
**And** Quick Start doesn't hide the full options
**And** both paths are clearly available

**Given** the "3 taps to music" goal
**When** measuring the return user flow
**Then** the minimum path is: Open → Quick Start → (Music plays)
**And** even the full customization path is: Open → Select mood → Select duration → Play (4 taps max)

**Given** I am a first-time user who hasn't completed a journey yet
**When** viewing the main screen
**Then** Quick Start is NOT shown (no previous settings to use)
**And** I see the full mood/duration configuration instead
**And** Quick Start appears only after my first completed journey

---

### Story 5.4: Preference Persistence

As a **system**,
I want **to persist user preferences across sessions**,
So that **the app remembers how users like to use it**.

**Acceptance Criteria:**

**Given** a user has set preferences (last mood, last duration)
**When** the user returns to the app
**Then** their preferences are loaded from localStorage
**And** prefsStore is populated on app initialization
**And** Quick Start uses these persisted preferences

**Given** preferences need to be stored
**When** the user completes a journey or changes settings
**Then** the following are persisted:
- Last selected mood
- Last selected duration
- Exclusion list (from Epic 4)
- Any UI preferences (if applicable)
**And** data is saved to localStorage immediately

**Given** localStorage contains user preferences
**When** the app initializes
**Then** preferences load before the UI renders
**And** the app state reflects saved preferences immediately
**And** there's no flash of default state before preferences load

**Given** preferences might be corrupted or invalid
**When** loading preferences fails
**Then** the app falls back to sensible defaults
**And** no error is shown to the user
**And** the experience degrades gracefully

