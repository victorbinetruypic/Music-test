import type { GenerationInput, GenerationResult, PhaseInfo, TrackWithFeatures } from './types'
import type { Track, AudioFeatures, Journey, Duration } from '@/types'
import { selectTemplate, calculatePhaseSongCounts } from './templates'
import { filterTracksByMood } from './matcher'
import { sequenceTracksForPhase, removeFromPool } from './sequencer'
import { validateGenerationInput } from './validator'
import { scoreTransition } from './transition-scorer'

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

  // Inject forgotten gems into the opening phase
  const allInputTracks = [
    ...input.tracks,
    ...(input.discoveryTracks ?? []),
    ...(input.forgottenGems ?? []),
  ]
  const featuresMap = buildFeaturesLookup(allInputTracks)

  if (input.forgottenGems && input.forgottenGems.length > 0 && phases.length > 0) {
    injectForgottenGems(allTracks, phases, input.forgottenGems, featuresMap)
  }

  // Inject discovery tracks using sandwich pattern
  if (input.discoveryTracks && input.discoveryTracks.length > 0) {
    injectDiscoveryTracks(allTracks, phases, input.discoveryTracks, featuresMap)
  }

  // Optimize phase boundaries for smoother transitions
  optimizePhaseBoundaries(allTracks, phases, featuresMap)

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
 * Build a lookup from track ID → AudioFeatures from the input TrackWithFeatures array.
 */
function buildFeaturesLookup(tracks: TrackWithFeatures[]): Map<string, AudioFeatures> {
  const map = new Map<string, AudioFeatures>()
  for (const twf of tracks) {
    map.set(twf.track.id, twf.features)
  }
  return map
}

/**
 * Optimize phase boundaries by trying swaps at each boundary.
 * For each boundary (last track of phase N, first track of phase N+1),
 * try swapping boundary-adjacent tracks to improve the transition score.
 * Mutates allTracks and phases in place.
 */
function optimizePhaseBoundaries(
  allTracks: Track[],
  phases: PhaseInfo[],
  featuresMap: Map<string, AudioFeatures>
): void {
  for (let p = 0; p < phases.length - 1; p++) {
    const endIdx = phases[p].endIndex
    const startIdx = phases[p + 1].startIndex

    // Need at least 2 tracks in each phase to swap
    if (phases[p].endIndex <= phases[p].startIndex) continue
    if (phases[p + 1].endIndex <= phases[p + 1].startIndex) continue

    const featA = featuresMap.get(allTracks[endIdx].id)
    const featB = featuresMap.get(allTracks[startIdx].id)
    if (!featA || !featB) continue

    const currentScore = scoreTransition(featA, featB)

    // Try swapping the last track of phase N with the second-to-last
    let bestScore = currentScore
    let bestSwap: [number, number] | null = null

    // Candidate 1: swap endIdx with endIdx-1, check boundary score
    const prevIdx = endIdx - 1
    if (prevIdx >= phases[p].startIndex) {
      const featPrev = featuresMap.get(allTracks[prevIdx].id)
      if (featPrev) {
        const newScore = scoreTransition(featPrev, featB)
        if (newScore > bestScore) {
          bestScore = newScore
          bestSwap = [prevIdx, endIdx]
        }
      }
    }

    // Candidate 2: swap startIdx with startIdx+1, check boundary score
    const nextIdx = startIdx + 1
    if (nextIdx <= phases[p + 1].endIndex) {
      const featNext = featuresMap.get(allTracks[nextIdx].id)
      if (featNext) {
        const newScore = scoreTransition(featA, featNext)
        if (newScore > bestScore) {
          bestScore = newScore
          bestSwap = [startIdx, nextIdx]
        }
      }
    }

    if (bestSwap) {
      const [i, j] = bestSwap
      ;[allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]]
      // Update phase track arrays
      for (const phase of phases) {
        phase.tracks = allTracks.slice(phase.startIndex, phase.endIndex + 1)
      }
    }
  }
}

/**
 * Combine tracks with their audio features
 */
export function combineTracksWithFeatures(
  tracks: Track[],
  featuresMap: Map<string, AudioFeatures>
): TrackWithFeatures[] {
  return tracks
    .filter((t) => featuresMap.has(t.id))
    .map((track) => ({
      track,
      features: featuresMap.get(track.id)!,
    }))
}

/**
 * Create a features map from an array of audio features
 */
export function createFeaturesMap(
  features: AudioFeatures[]
): Map<string, AudioFeatures> {
  const map = new Map<string, AudioFeatures>()
  for (const f of features) {
    map.set(f.id, f)
  }
  return map
}

/**
 * Inject forgotten gems into the opening phase by replacing tracks.
 * Picks the gem with the best transition score to its neighbors.
 */
function injectForgottenGems(
  allTracks: Track[],
  phases: PhaseInfo[],
  gems: TrackWithFeatures[],
  featuresMap: Map<string, AudioFeatures>
): void {
  const openingPhase = phases[0]
  if (!openingPhase || openingPhase.endIndex - openingPhase.startIndex < 2) return

  // Replace up to 2 tracks in the opening phase (not index 0)
  const maxGems = Math.min(gems.length, 2)

  for (let g = 0; g < maxGems; g++) {
    const gem = gems[g]
    const gemFeatures = gem.features

    // Find best replacement position (skip index 0)
    let bestIdx = -1
    let bestScore = -1

    for (let i = openingPhase.startIndex + 1; i <= openingPhase.endIndex; i++) {
      // Don't replace other gems we already placed
      if (allTracks[i].isForgottenGem) continue

      const prevFeatures = featuresMap.get(allTracks[i - 1].id)
      const nextFeatures = i < allTracks.length - 1 ? featuresMap.get(allTracks[i + 1].id) : null

      let score = 0
      if (prevFeatures) score += scoreTransition(prevFeatures, gemFeatures)
      if (nextFeatures) score += scoreTransition(gemFeatures, nextFeatures)

      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }

    if (bestIdx >= 0) {
      allTracks[bestIdx] = gem.track
      // Update phase tracks
      openingPhase.tracks = allTracks.slice(openingPhase.startIndex, openingPhase.endIndex + 1)
    }
  }
}

/**
 * Inject discovery tracks using the sandwich pattern:
 * - Never at index 0 or 1
 * - Never in last 3 tracks
 * - Always between two liked songs (no adjacent discoveries)
 * - Max ~20% of the journey
 */
function injectDiscoveryTracks(
  allTracks: Track[],
  phases: PhaseInfo[],
  discoveries: TrackWithFeatures[],
  featuresMap: Map<string, AudioFeatures>
): void {
  if (allTracks.length < 6) return // too short for safe injection

  // Max discoveries: ~20% of journey
  const maxDiscoveries = Math.max(1, Math.floor(allTracks.length * 0.2))
  const toInject = discoveries.slice(0, maxDiscoveries)

  // Valid injection points: after index 1, before last 3, not adjacent to another injection
  const injectedIndices = new Set<number>()

  for (const disc of toInject) {
    const discFeatures = disc.features
    let bestIdx = -1
    let bestScore = -1

    // Safe range: index 2 to length-3
    const maxIdx = allTracks.length - 3

    for (let i = 2; i <= maxIdx; i++) {
      // Skip if adjacent to another injection
      if (injectedIndices.has(i - 1) || injectedIndices.has(i) || injectedIndices.has(i + 1)) continue

      const prevFeatures = featuresMap.get(allTracks[i - 1].id)
      const nextFeatures = featuresMap.get(allTracks[i].id)

      if (!prevFeatures || !nextFeatures) continue

      // Score how well the discovery fits between these two tracks
      const score = scoreTransition(prevFeatures, discFeatures) + scoreTransition(discFeatures, nextFeatures)

      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }

    if (bestIdx >= 0) {
      // Insert discovery at bestIdx (push everything after it forward)
      allTracks.splice(bestIdx, 0, disc.track)
      injectedIndices.add(bestIdx)

      // Shift all previously recorded indices that are >= bestIdx
      const shifted = new Set<number>()
      for (const idx of injectedIndices) {
        shifted.add(idx >= bestIdx && idx !== bestIdx ? idx + 1 : idx)
      }
      injectedIndices.clear()
      for (const idx of shifted) injectedIndices.add(idx)
    }
  }

  // Rebuild phase info after insertions
  rebuildPhases(allTracks, phases)
}

/**
 * Rebuild phase boundaries after track insertions.
 * Distributes tracks proportionally based on original phase ratios.
 */
function rebuildPhases(allTracks: Track[], phases: PhaseInfo[]): void {
  const totalOriginal = phases.reduce((sum, p) => sum + (p.endIndex - p.startIndex + 1), 0)
  const totalNow = allTracks.length

  let cursor = 0
  for (let i = 0; i < phases.length; i++) {
    const originalCount = phases[i].endIndex - phases[i].startIndex + 1
    const ratio = originalCount / totalOriginal
    const newCount = i === phases.length - 1
      ? totalNow - cursor // last phase gets remainder
      : Math.max(1, Math.round(ratio * totalNow))

    phases[i].startIndex = cursor
    phases[i].endIndex = cursor + newCount - 1
    phases[i].tracks = allTracks.slice(cursor, cursor + newCount)
    cursor += newCount
  }
}
