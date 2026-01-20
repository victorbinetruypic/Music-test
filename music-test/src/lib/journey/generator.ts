import type { GenerationInput, GenerationResult, PhaseInfo, TrackWithFeatures } from './types'
import type { Track, Journey, Duration } from '@/types'
import { selectTemplate, calculatePhaseSongCounts } from './templates'
import { filterTracksByMood } from './matcher'
import { sequenceTracksForPhase, removeFromPool } from './sequencer'
import { validateGenerationInput } from './validator'

/**
 * Generate a journey playlist using template-based arc patterns
 *
 * @param input - Generation parameters including tracks, mood, duration
 * @returns Generated journey with tracks sequenced by phase
 */
export function generateJourney(input: GenerationInput): GenerationResult {
  // Validate input (throws on invalid)
  const validation = validateGenerationInput(input)
  let availableTracks = validation.matchingTracks

  // Select template based on duration
  const template = selectTemplate(input.duration)

  // Calculate how many songs we need
  const durationMinutes = getDurationMinutes(input.duration)
  const avgSongDuration = 3.5 // minutes
  const targetSongCount = Math.max(10, Math.round(durationMinutes / avgSongDuration))

  // Limit to available tracks
  const actualSongCount = Math.min(targetSongCount, availableTracks.length)

  // Calculate songs per phase
  const phaseCounts = calculatePhaseSongCounts(template, actualSongCount)

  // Build journey by sequencing tracks for each phase
  const allTracks: Track[] = []
  const phases: PhaseInfo[] = []
  let trackPool = [...availableTracks]

  template.phases.forEach((phaseDef, index) => {
    const count = phaseCounts.get(index) || 1
    const startIndex = allTracks.length

    // Sequence tracks for this phase (with skip penalties for frequency reduction)
    const phaseTracks = sequenceTracksForPhase(trackPool, phaseDef, count, input.skipPenalties)
    allTracks.push(...phaseTracks)

    // Remove used tracks from pool
    trackPool = removeFromPool(trackPool, phaseTracks)

    // Record phase info
    phases.push({
      phase: phaseDef.phase,
      tracks: phaseTracks,
      startIndex,
      endIndex: allTracks.length - 1,
    })
  })

  // Calculate actual duration
  const actualDuration = allTracks.reduce((sum, t) => sum + t.durationMs, 0) / 60000

  // Create journey object
  const journey: Journey = {
    id: generateId(),
    mood: input.mood,
    duration: Math.round(actualDuration),
    tracks: allTracks,
    phases: phases.map((p) => ({
      phase: p.phase,
      tracks: p.tracks,
      startIndex: p.startIndex,
      endIndex: p.endIndex,
    })),
    createdAt: new Date().toISOString(),
  }

  return { journey }
}

/**
 * Get duration in minutes
 */
function getDurationMinutes(duration: Duration): number {
  if (duration === 'open-ended') {
    return 180 // 3 hours for open-ended
  }
  return duration
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `journey-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Combine tracks with their audio features
 */
export function combineTracksWithFeatures(
  tracks: Track[],
  featuresMap: Map<string, { energy: number; valence: number; tempo: number; danceability: number }>
): TrackWithFeatures[] {
  return tracks
    .filter((t) => featuresMap.has(t.id))
    .map((track) => ({
      track,
      features: {
        id: track.id,
        ...featuresMap.get(track.id)!,
      },
    }))
}

/**
 * Create a features map from an array of audio features
 */
export function createFeaturesMap(
  features: Array<{ id: string; energy: number; valence: number; tempo: number; danceability: number }>
): Map<string, { energy: number; valence: number; tempo: number; danceability: number }> {
  const map = new Map<string, { energy: number; valence: number; tempo: number; danceability: number }>()
  for (const f of features) {
    map.set(f.id, {
      energy: f.energy,
      valence: f.valence,
      tempo: f.tempo,
      danceability: f.danceability,
    })
  }
  return map
}
