import type { TrackWithFeatures, PhaseDefinition } from './types'
import type { Track } from '@/types'
import { scoreTransition } from './transition-scorer'

/**
 * Sequence tracks within a phase using greedy nearest-neighbor chain.
 *
 * 1. Score candidates by energy fit + skip penalties (same as before)
 * 2. Pick starter based on phase direction
 * 3. Greedy chain: pick next track with best transition score (70%) + energy direction fit (30%)
 */
export function sequenceTracksForPhase(
  tracks: TrackWithFeatures[],
  phase: PhaseDefinition,
  count: number,
  skipPenalties?: Map<string, number>
): Track[] {
  if (tracks.length === 0 || count === 0) return []

  const targetCount = Math.min(count, tracks.length)
  const [minEnergy, maxEnergy] = phase.energyRange
  const midEnergy = (minEnergy + maxEnergy) / 2

  // Step 1: Score and select candidate tracks by energy fit + skip penalties
  const scoredCandidates = tracks.map((t) => {
    const energyFit = 1 - Math.abs(t.features.energy - midEnergy)
    const penalty = skipPenalties?.get(t.track.id) ?? 0

    let adjustedScore = energyFit
    if (penalty >= 5) {
      adjustedScore -= 2
    } else if (penalty >= 3) {
      adjustedScore -= 1
    } else if (penalty > 0) {
      adjustedScore -= penalty * 0.1
    }

    return { twf: t, score: adjustedScore }
  })

  scoredCandidates.sort((a, b) => b.score - a.score)
  const candidates = scoredCandidates.slice(0, targetCount).map((s) => s.twf)

  if (candidates.length <= 1) {
    return candidates.map((c) => c.track)
  }

  // Step 2: Pick starter based on phase direction
  const starter = pickStarter(candidates, phase.energyProgression)
  const remaining = candidates.filter((c) => c.track.id !== starter.track.id)

  // Step 3: Greedy chain
  const chain: TrackWithFeatures[] = [starter]
  const pool = [...remaining]

  while (pool.length > 0) {
    const current = chain[chain.length - 1]
    const progress = chain.length / targetCount // 0→1

    let bestIdx = 0
    let bestScore = -Infinity

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i]

      // Transition quality (70% weight)
      const transitionScore = scoreTransition(current.features, candidate.features)

      // Energy direction fit (30% weight)
      const directionScore = scoreEnergyDirection(
        current.features.energy,
        candidate.features.energy,
        phase.energyProgression,
        progress
      )

      const combined = 0.7 * transitionScore + 0.3 * directionScore

      if (combined > bestScore) {
        bestScore = combined
        bestIdx = i
      }
    }

    chain.push(pool[bestIdx])
    pool.splice(bestIdx, 1)
  }

  return chain.map((c) => c.track)
}

/**
 * Pick the starting track based on phase energy progression.
 */
function pickStarter(
  candidates: TrackWithFeatures[],
  progression: PhaseDefinition['energyProgression']
): TrackWithFeatures {
  const sorted = [...candidates].sort((a, b) => a.features.energy - b.features.energy)

  switch (progression) {
    case 'ascending':
      return sorted[0] // lowest energy
    case 'descending':
      return sorted[sorted.length - 1] // highest energy
    case 'peak':
      return sorted[0] // start low, build to peak
    case 'stable':
    default:
      // Start from the middle energy
      return sorted[Math.floor(sorted.length / 2)]
  }
}

/**
 * Score how well the energy transition fits the phase's energy progression.
 * Returns 0.0 to 1.0.
 */
function scoreEnergyDirection(
  currentEnergy: number,
  nextEnergy: number,
  progression: PhaseDefinition['energyProgression'],
  progress: number
): number {
  const diff = nextEnergy - currentEnergy

  switch (progression) {
    case 'ascending':
      // Reward increases, penalize decreases
      return diff >= 0 ? 1.0 : Math.max(0, 1.0 + diff * 3)
    case 'descending':
      // Reward decreases, penalize increases
      return diff <= 0 ? 1.0 : Math.max(0, 1.0 - diff * 3)
    case 'peak':
      // First half: ascending, second half: descending
      if (progress < 0.5) {
        return diff >= 0 ? 1.0 : Math.max(0, 1.0 + diff * 3)
      } else {
        return diff <= 0 ? 1.0 : Math.max(0, 1.0 - diff * 3)
      }
    case 'stable':
    default:
      // Small changes are good
      const absDiff = Math.abs(diff)
      return absDiff <= 0.05 ? 1.0 : Math.max(0, 1.0 - absDiff * 3)
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
  const scored = tracks.map((t) => ({
    track: t,
    distance: Math.abs(t.features.energy - targetEnergy),
  }))

  scored.sort((a, b) => a.distance - b.distance)

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
