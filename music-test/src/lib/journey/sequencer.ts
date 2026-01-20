import type { TrackWithFeatures, PhaseDefinition } from './types'
import type { Track } from '@/types'
import { getTargetEnergy } from './templates'

/**
 * Sequence tracks within a phase based on energy progression
 * Optionally deprioritizes tracks with high skip penalties
 */
export function sequenceTracksForPhase(
  tracks: TrackWithFeatures[],
  phase: PhaseDefinition,
  count: number,
  skipPenalties?: Map<string, number>
): Track[] {
  if (tracks.length === 0) return []
  if (count === 0) return []

  // Get the target number of tracks (or all if not enough)
  const targetCount = Math.min(count, tracks.length)

  // Sort tracks by how well they fit the phase's energy range
  const [minEnergy, maxEnergy] = phase.energyRange
  const midEnergy = (minEnergy + maxEnergy) / 2

  const scoredTracks = tracks.map((t) => {
    const energyFit = 1 - Math.abs(t.features.energy - midEnergy)

    // Apply penalty from skip data (Story 4.4)
    // penaltyScore >= 3: deprioritized (selected last)
    // penaltyScore >= 5: soft-excluded (only if no alternatives)
    const penalty = skipPenalties?.get(t.track.id) ?? 0
    let adjustedScore = energyFit

    if (penalty >= 5) {
      // Soft-excluded: very low priority
      adjustedScore -= 2
    } else if (penalty >= 3) {
      // Deprioritized: lower priority
      adjustedScore -= 1
    } else if (penalty > 0) {
      // Slight penalty for any skips
      adjustedScore -= penalty * 0.1
    }

    return {
      track: t,
      energyFit: adjustedScore,
      energy: t.features.energy,
      penalty,
    }
  })

  // Select tracks that fit the phase (higher score = better fit)
  scoredTracks.sort((a, b) => b.energyFit - a.energyFit)
  const selectedTracks = scoredTracks.slice(0, targetCount)

  // Now order them based on energy progression
  switch (phase.energyProgression) {
    case 'ascending':
      selectedTracks.sort((a, b) => a.energy - b.energy)
      break
    case 'descending':
      selectedTracks.sort((a, b) => b.energy - a.energy)
      break
    case 'peak':
      // Sort by distance from peak energy, then order to create arc
      const peakEnergy = maxEnergy
      selectedTracks.sort((a, b) => {
        const distA = Math.abs(a.energy - peakEnergy)
        const distB = Math.abs(b.energy - peakEnergy)
        return distA - distB
      })
      // Reorder: lowest at edges, highest in middle
      const reordered = reorderForPeak(selectedTracks)
      return reordered.map((t) => t.track.track)
    case 'stable':
    default:
      // Shuffle slightly to add variety while keeping energy stable
      shuffleArray(selectedTracks)
      break
  }

  return selectedTracks.map((t) => t.track.track)
}

/**
 * Reorder tracks for peak progression: low → high → low (bell curve)
 */
function reorderForPeak<T extends { energy: number }>(tracks: T[]): T[] {
  if (tracks.length <= 2) return tracks

  // Sort by energy ascending first
  const sorted = [...tracks].sort((a, b) => a.energy - b.energy)

  const result: T[] = []
  const midIndex = Math.floor(sorted.length / 2)

  // Build up: take from low end
  for (let i = 0; i < midIndex; i++) {
    result.push(sorted[i])
  }

  // Peak: highest energy tracks in middle
  for (let i = sorted.length - 1; i >= midIndex; i--) {
    if (result.length < sorted.length) {
      result.push(sorted[i])
    }
  }

  return result
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Select best tracks for a target energy level
 */
export function selectTracksForEnergy(
  tracks: TrackWithFeatures[],
  targetEnergy: number,
  count: number,
  tolerance: number = 0.2
): TrackWithFeatures[] {
  // Score tracks by how close their energy is to target
  const scored = tracks.map((t) => ({
    track: t,
    distance: Math.abs(t.features.energy - targetEnergy),
  }))

  // Sort by distance (closest first)
  scored.sort((a, b) => a.distance - b.distance)

  // Filter by tolerance and take top count
  return scored
    .filter((s) => s.distance <= tolerance)
    .slice(0, count)
    .map((s) => s.track)
}

/**
 * Remove selected tracks from pool (to avoid duplicates)
 */
export function removeFromPool(
  pool: TrackWithFeatures[],
  selected: Track[]
): TrackWithFeatures[] {
  const selectedIds = new Set(selected.map((t) => t.id))
  return pool.filter((t) => !selectedIds.has(t.track.id))
}
