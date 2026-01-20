import { create } from 'zustand'

import type { Track, Mood, Duration, Phase, Journey, JourneyPhase } from '@/types'

const INTERRUPTED_JOURNEY_KEY = 'music-test-interrupted-journey'

interface InterruptedJourney {
  journey: Journey
  trackIndex: number
  savedAt: string
}

interface JourneyStore {
  // State
  currentJourney: Journey | null
  selectedMood: Mood | null
  selectedDuration: Duration | null
  currentPhase: Phase | null
  currentTrackIndex: number
  isGenerating: boolean
  isSavingPlaylist: boolean
  error: string | null
  interruptedJourney: InterruptedJourney | null

  // Actions
  setSelectedMood: (mood: Mood | null) => void
  setSelectedDuration: (duration: Duration | null) => void
  setJourney: (journey: Journey) => void
  clearJourney: () => void
  setCurrentTrackIndex: (index: number) => void
  advanceToNextTrack: () => void
  setCurrentPhase: (phase: Phase | null) => void
  setIsGenerating: (value: boolean) => void
  setIsSavingPlaylist: (value: boolean) => void
  setError: (message: string | null) => void
  saveInterruptedJourney: () => void
  loadInterruptedJourney: () => void
  resumeJourney: () => void
  clearInterruptedJourney: () => void
  reset: () => void
}

const initialState = {
  currentJourney: null,
  selectedMood: null,
  selectedDuration: null,
  currentPhase: null,
  currentTrackIndex: 0,
  isGenerating: false,
  isSavingPlaylist: false,
  error: null,
  interruptedJourney: null,
}

export const useJourneyStore = create<JourneyStore>((set, get) => ({
  ...initialState,

  setSelectedMood: (mood) => {
    set({ selectedMood: mood, error: null })
  },

  setSelectedDuration: (duration) => {
    set({ selectedDuration: duration, error: null })
  },

  setJourney: (journey) => {
    set({
      currentJourney: journey,
      currentTrackIndex: 0,
      currentPhase: journey.phases[0]?.phase ?? null,
      error: null,
    })
  },

  clearJourney: () => {
    set({
      currentJourney: null,
      currentTrackIndex: 0,
      currentPhase: null,
    })
  },

  setCurrentTrackIndex: (index) => {
    const journey = get().currentJourney
    if (!journey) return

    // Update current phase based on track index
    let newPhase: Phase | null = null
    for (const phase of journey.phases) {
      if (index >= phase.startIndex && index <= phase.endIndex) {
        newPhase = phase.phase
        break
      }
    }

    set({ currentTrackIndex: index, currentPhase: newPhase })
  },

  advanceToNextTrack: () => {
    const { currentTrackIndex, currentJourney } = get()
    if (!currentJourney) return

    const nextIndex = currentTrackIndex + 1
    if (nextIndex < currentJourney.tracks.length) {
      get().setCurrentTrackIndex(nextIndex)
    }
  },

  setCurrentPhase: (phase) => {
    set({ currentPhase: phase })
  },

  setIsGenerating: (value) => {
    set({ isGenerating: value })
  },

  setIsSavingPlaylist: (value) => {
    set({ isSavingPlaylist: value })
  },

  setError: (message) => {
    set({ error: message })
  },

  saveInterruptedJourney: () => {
    const { currentJourney, currentTrackIndex } = get()
    if (!currentJourney || currentTrackIndex >= currentJourney.tracks.length - 1) {
      // Don't save if no journey or journey is complete
      return
    }

    const interruptedData: InterruptedJourney = {
      journey: currentJourney,
      trackIndex: currentTrackIndex,
      savedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(INTERRUPTED_JOURNEY_KEY, JSON.stringify(interruptedData))
      set({ interruptedJourney: interruptedData })
    } catch {
      // localStorage might be full or unavailable
      console.warn('Failed to save interrupted journey')
    }
  },

  loadInterruptedJourney: () => {
    try {
      const stored = localStorage.getItem(INTERRUPTED_JOURNEY_KEY)
      if (stored) {
        const data = JSON.parse(stored) as InterruptedJourney
        // Only load if saved within the last 24 hours
        const savedAt = new Date(data.savedAt)
        const now = new Date()
        const hoursSinceSave = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)

        if (hoursSinceSave < 24) {
          set({ interruptedJourney: data })
        } else {
          // Clear old interrupted journey
          localStorage.removeItem(INTERRUPTED_JOURNEY_KEY)
        }
      }
    } catch {
      // Invalid JSON or other error
      localStorage.removeItem(INTERRUPTED_JOURNEY_KEY)
    }
  },

  resumeJourney: () => {
    const { interruptedJourney } = get()
    if (!interruptedJourney) return

    // Restore the journey state
    set({
      currentJourney: interruptedJourney.journey,
      currentTrackIndex: interruptedJourney.trackIndex,
      selectedMood: interruptedJourney.journey.mood,
      currentPhase: null, // Will be set by setCurrentTrackIndex
      interruptedJourney: null,
    })

    // Update the phase
    get().setCurrentTrackIndex(interruptedJourney.trackIndex)

    // Clear from storage
    try {
      localStorage.removeItem(INTERRUPTED_JOURNEY_KEY)
    } catch {
      // localStorage may be unavailable
    }
  },

  clearInterruptedJourney: () => {
    try {
      localStorage.removeItem(INTERRUPTED_JOURNEY_KEY)
    } catch {
      // localStorage may be unavailable
    }
    set({ interruptedJourney: null })
  },

  reset: () => {
    set(initialState)
  },
}))

// Utility functions for journey state
export function getCurrentTrack(journey: Journey | null, index: number): Track | null {
  if (!journey || index < 0 || index >= journey.tracks.length) {
    return null
  }
  return journey.tracks[index]
}

export function getPhaseForTrackIndex(journey: Journey, index: number): JourneyPhase | null {
  for (const phase of journey.phases) {
    if (index >= phase.startIndex && index <= phase.endIndex) {
      return phase
    }
  }
  return null
}

export function getJourneyProgress(journey: Journey | null, index: number): number {
  if (!journey || journey.tracks.length === 0) return 0
  return (index / journey.tracks.length) * 100
}
