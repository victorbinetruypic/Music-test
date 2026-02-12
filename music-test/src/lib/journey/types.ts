import type { Track, AudioFeatures, Mood, Phase, Duration } from '@/types'

// Track with audio features combined
export interface TrackWithFeatures {
  track: Track
  features: AudioFeatures
}

// Arc template definition
export interface ArcTemplate {
  name: string
  description: string
  phases: PhaseDefinition[]
}

export interface PhaseDefinition {
  phase: Phase
  percentage: number // Percentage of total duration
  energyRange: [number, number] // Min, max energy (0-1)
  energyProgression: 'ascending' | 'descending' | 'stable' | 'peak'
}

// Generation input
export interface GenerationInput {
  tracks: TrackWithFeatures[]
  mood: Mood
  duration: Duration
  excludedTrackIds?: Set<string>
  skipPenalties?: Map<string, number> // trackId -> penalty score
  discoveryTracks?: TrackWithFeatures[]
  forgottenGems?: TrackWithFeatures[]
}

// Generation result
export interface GenerationResult {
  journey: {
    id: string
    mood: Mood
    duration: number
    tracks: Track[]
    phases: PhaseInfo[]
    createdAt: string
  }
}

export interface PhaseInfo {
  phase: Phase
  tracks: Track[]
  startIndex: number
  endIndex: number
}

// Mood matching thresholds
export interface MoodThresholds {
  energy: [number, number]
  valence: [number, number]
  tempo?: [number, number]
  danceability?: [number, number]
}

// Typed errors
export class InsufficientSongsError extends Error {
  constructor(mood: string, count: number, minimum: number = 10) {
    super(`Only ${count} songs match "${mood}" mood. Need at least ${minimum}.`)
    this.name = 'InsufficientSongsError'
  }
}

export class InvalidDurationError extends Error {
  constructor(duration: number) {
    super(`Duration must be 15-240 minutes, got ${duration}`)
    this.name = 'InvalidDurationError'
  }
}

export class NoTracksError extends Error {
  constructor() {
    super('No tracks provided for journey generation')
    this.name = 'NoTracksError'
  }
}
