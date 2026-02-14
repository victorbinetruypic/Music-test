import type { Mood, Duration } from '@/types'

const STORAGE_KEYS = {
  EXCLUSIONS: 'music-test-exclusions',
  PREFERENCES: 'music-test-preferences',
  SKIP_DATA: 'music-test-skip-data',
  LAST_JOURNEY: 'music-test-last-journey',
  DISCOVERY_DATA: 'music-test-discovery-data',
  ARTIST_GENRES_REFRESH: 'music-test-artist-genres-refresh',
  LIBRARY_REFRESH: 'music-test-library-refresh',
} as const

// Exclusion List ("Not This" songs)
export interface ExclusionData {
  trackIds: string[]
  updatedAt: string
}

export function getExclusions(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXCLUSIONS)
    if (!stored) return []
    const data: ExclusionData = JSON.parse(stored)
    return data.trackIds
  } catch {
    return []
  }
}

export function addExclusion(trackId: string): void {
  const current = getExclusions()
  if (current.includes(trackId)) return

  const data: ExclusionData = {
    trackIds: [...current, trackId],
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(STORAGE_KEYS.EXCLUSIONS, JSON.stringify(data))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function removeExclusion(trackId: string): void {
  const current = getExclusions()
  const data: ExclusionData = {
    trackIds: current.filter((id) => id !== trackId),
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(STORAGE_KEYS.EXCLUSIONS, JSON.stringify(data))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function clearExclusions(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.EXCLUSIONS)
  } catch {
    // localStorage may be unavailable
  }
}

// User Preferences
export interface UserPreferences {
  lastMood: Mood | null
  lastDuration: Duration | null
  volume: number
  moodGenres: Partial<Record<Mood, string[]>>
  updatedAt: string
}

const DEFAULT_PREFERENCES: UserPreferences = {
  lastMood: null,
  lastDuration: null,
  volume: 50,
  moodGenres: {},
  updatedAt: new Date().toISOString(),
}

export function getPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
    if (!stored) return DEFAULT_PREFERENCES
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  const current = getPreferences()
  const updated: UserPreferences = {
    ...current,
    ...prefs,
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function clearPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES)
  } catch {
    // localStorage may be unavailable
  }
}

// Artist genres refresh timestamp (rate-limit guard)
export function getArtistGenresRefreshTimestamp(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ARTIST_GENRES_REFRESH)
    if (!stored) return null
    const ts = Number(stored)
    return Number.isFinite(ts) ? ts : null
  } catch {
    return null
  }
}

export function setArtistGenresRefreshTimestamp(timestamp: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ARTIST_GENRES_REFRESH, String(timestamp))
  } catch {
    // localStorage may be unavailable
  }
}

// Library refresh timestamp (rate-limit guard)
export function getLibraryRefreshTimestamp(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LIBRARY_REFRESH)
    if (!stored) return null
    const ts = Number(stored)
    return Number.isFinite(ts) ? ts : null
  } catch {
    return null
  }
}

export function setLibraryRefreshTimestamp(timestamp: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LIBRARY_REFRESH, String(timestamp))
  } catch {
    // localStorage may be unavailable
  }
}

// Skip Data (for learning algorithm)
export interface SkipEntry {
  trackId: string
  phase: string
  position: 'early' | 'middle' | 'late'
  timestamp: string
}

export interface SkipData {
  entries: SkipEntry[]
  updatedAt: string
}

export function getSkipData(): SkipEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SKIP_DATA)
    if (!stored) return []
    const data: SkipData = JSON.parse(stored)
    return data.entries
  } catch {
    return []
  }
}

export function addSkipEntry(entry: SkipEntry): void {
  const current = getSkipData()
  const data: SkipData = {
    entries: [...current, entry],
    updatedAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(STORAGE_KEYS.SKIP_DATA, JSON.stringify(data))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function getSkipCountForTrack(trackId: string): number {
  const entries = getSkipData()
  return entries.filter((e) => e.trackId === trackId).length
}

export function getRecentSkipCount(trackId: string, journeyCount: number = 5): number {
  const entries = getSkipData()
  // Get entries for this track, most recent first
  const trackEntries = entries
    .filter((e) => e.trackId === trackId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Count skips in last N journeys (approximated by taking last N entries)
  return Math.min(trackEntries.length, journeyCount)
}

export function clearSkipData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SKIP_DATA)
  } catch {
    // localStorage may be unavailable
  }
}

// Last Journey Summary (for welcome back screen)
export interface LastJourneySummary {
  mood: Mood
  duration: number // minutes
  songCount: number
  completedAt: string
}

export function getLastJourneySummary(): LastJourneySummary | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_JOURNEY)
    if (!stored) return null
    return JSON.parse(stored) as LastJourneySummary
  } catch {
    return null
  }
}

export function saveLastJourneySummary(summary: LastJourneySummary): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_JOURNEY, JSON.stringify(summary))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function clearLastJourneySummary(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.LAST_JOURNEY)
  } catch {
    // localStorage may be unavailable
  }
}

// Discovery Tracking
export interface DiscoveryEntry {
  trackId: string
  journeyId: string
  outcome: 'played' | 'skipped' | 'not-this'
  timestamp: string
}

export function getDiscoveryData(): DiscoveryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DISCOVERY_DATA)
    if (!stored) return []
    return JSON.parse(stored) as DiscoveryEntry[]
  } catch {
    return []
  }
}

export function addDiscoveryEntry(entry: DiscoveryEntry): void {
  const current = getDiscoveryData()
  const updated = [...current, entry]
  try {
    localStorage.setItem(STORAGE_KEYS.DISCOVERY_DATA, JSON.stringify(updated))
  } catch {
    // localStorage may be full or unavailable
  }
}
