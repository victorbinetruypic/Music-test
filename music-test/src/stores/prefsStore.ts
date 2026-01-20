import { create } from 'zustand'

import type { Mood, Duration } from '@/types'
import {
  getExclusions,
  addExclusion as addExclusionToStorage,
  removeExclusion as removeExclusionFromStorage,
  clearExclusions as clearExclusionsFromStorage,
  getPreferences,
  savePreferences,
  getSkipData,
  addSkipEntry,
  getLastJourneySummary,
  saveLastJourneySummary,
  type SkipEntry,
  type LastJourneySummary,
} from '@/lib/storage'

interface PrefsStore {
  // State
  exclusions: Set<string>
  lastMood: Mood | null
  lastDuration: Duration | null
  skipData: SkipEntry[]
  lastJourney: LastJourneySummary | null
  isLoaded: boolean

  // Actions
  loadFromStorage: () => void
  addExclusion: (trackId: string) => void
  removeExclusion: (trackId: string) => void
  clearExclusions: () => void
  setLastMood: (mood: Mood) => void
  setLastDuration: (duration: Duration) => void
  recordSkip: (entry: Omit<SkipEntry, 'timestamp'>) => void
  getSkipCountForTrack: (trackId: string) => number
  saveCompletedJourney: (summary: LastJourneySummary) => void
}

export const usePrefsStore = create<PrefsStore>((set, get) => ({
  exclusions: new Set(),
  lastMood: null,
  lastDuration: null,
  skipData: [],
  lastJourney: null,
  isLoaded: false,

  loadFromStorage: () => {
    const exclusions = new Set(getExclusions())
    const prefs = getPreferences()
    const skipData = getSkipData()
    const lastJourney = getLastJourneySummary()

    set({
      exclusions,
      lastMood: prefs.lastMood,
      lastDuration: prefs.lastDuration,
      skipData,
      lastJourney,
      isLoaded: true,
    })
  },

  addExclusion: (trackId) => {
    addExclusionToStorage(trackId)
    set((state) => ({
      exclusions: new Set([...state.exclusions, trackId]),
    }))
  },

  removeExclusion: (trackId) => {
    removeExclusionFromStorage(trackId)
    set((state) => {
      const newExclusions = new Set(state.exclusions)
      newExclusions.delete(trackId)
      return { exclusions: newExclusions }
    })
  },

  clearExclusions: () => {
    clearExclusionsFromStorage()
    set({ exclusions: new Set() })
  },

  setLastMood: (mood) => {
    savePreferences({ lastMood: mood })
    set({ lastMood: mood })
  },

  setLastDuration: (duration) => {
    savePreferences({ lastDuration: duration })
    set({ lastDuration: duration })
  },

  recordSkip: (entry) => {
    const fullEntry: SkipEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    }
    addSkipEntry(fullEntry)
    set((state) => ({
      skipData: [...state.skipData, fullEntry],
    }))
  },

  getSkipCountForTrack: (trackId) => {
    const { skipData } = get()
    return skipData.filter((e) => e.trackId === trackId).length
  },

  saveCompletedJourney: (summary) => {
    saveLastJourneySummary(summary)
    set({ lastJourney: summary })
  },
}))

// Utility: Calculate penalty score for a track (used in generation)
export function calculatePenaltyScore(
  trackId: string,
  skipData: SkipEntry[],
  recentJourneyCount: number = 5
): number {
  const trackSkips = skipData.filter((e) => e.trackId === trackId)
  const totalSkipCount = trackSkips.length

  // Get recent skips (approximated by taking the most recent entries)
  const sortedSkips = [...trackSkips].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  const recentSkipCount = Math.min(sortedSkips.length, recentJourneyCount)

  // Formula from Story 4.4:
  // penaltyScore = (skipCount * 0.5) + (recentSkips * 1.0)
  return totalSkipCount * 0.5 + recentSkipCount * 1.0
}
