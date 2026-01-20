import type { GenerationInput, TrackWithFeatures } from './types'
import {
  InsufficientSongsError,
  InvalidDurationError,
  NoTracksError,
} from './types'
import { filterTracksByMood } from './matcher'

const MIN_SONGS_FOR_JOURNEY = 10
const MIN_DURATION_MINUTES = 15
const MAX_DURATION_MINUTES = 240

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  matchingTracks: TrackWithFeatures[]
  warnings: string[]
}

/**
 * Validate generation input before proceeding
 * Throws typed errors for specific failure modes
 */
export function validateGenerationInput(input: GenerationInput): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for tracks
  if (!input.tracks || input.tracks.length === 0) {
    throw new NoTracksError()
  }

  // Validate duration
  const durationMinutes = input.duration === 'open-ended' ? 180 : input.duration
  if (durationMinutes < MIN_DURATION_MINUTES || durationMinutes > MAX_DURATION_MINUTES) {
    throw new InvalidDurationError(durationMinutes)
  }

  // Filter out excluded tracks
  let availableTracks = input.tracks
  if (input.excludedTrackIds && input.excludedTrackIds.size > 0) {
    availableTracks = input.tracks.filter(
      (t) => !input.excludedTrackIds!.has(t.track.id)
    )

    const excludedCount = input.tracks.length - availableTracks.length
    if (excludedCount > 0) {
      warnings.push(`${excludedCount} songs excluded from "Not This" list`)
    }
  }

  // Apply skip penalties (deprioritize but don't exclude)
  if (input.skipPenalties && input.skipPenalties.size > 0) {
    // Sort tracks by penalty score (lowest first = most preferred)
    availableTracks = [...availableTracks].sort((a, b) => {
      const penaltyA = input.skipPenalties!.get(a.track.id) || 0
      const penaltyB = input.skipPenalties!.get(b.track.id) || 0
      return penaltyA - penaltyB
    })
  }

  // Check mood matching
  const matchingTracks = filterTracksByMood(availableTracks, input.mood)

  if (matchingTracks.length < MIN_SONGS_FOR_JOURNEY) {
    throw new InsufficientSongsError(
      input.mood,
      matchingTracks.length,
      MIN_SONGS_FOR_JOURNEY
    )
  }

  // Warn if we have limited songs
  if (matchingTracks.length < 20) {
    warnings.push(
      `Limited selection: only ${matchingTracks.length} songs match this mood. Consider adding more liked songs.`
    )
  }

  return {
    isValid: true,
    errors,
    matchingTracks,
    warnings,
  }
}

/**
 * Quick validation check without throwing
 */
export function canGenerateJourney(input: GenerationInput): {
  canGenerate: boolean
  reason?: string
} {
  try {
    validateGenerationInput(input)
    return { canGenerate: true }
  } catch (error) {
    if (error instanceof Error) {
      return { canGenerate: false, reason: error.message }
    }
    return { canGenerate: false, reason: 'Unknown error' }
  }
}

/**
 * Get the minimum requirements for journey generation
 */
export function getRequirements(): {
  minSongs: number
  minDuration: number
  maxDuration: number
} {
  return {
    minSongs: MIN_SONGS_FOR_JOURNEY,
    minDuration: MIN_DURATION_MINUTES,
    maxDuration: MAX_DURATION_MINUTES,
  }
}
