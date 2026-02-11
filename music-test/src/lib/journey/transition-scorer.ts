/**
 * Transition Scorer — scores how well track B follows track A.
 *
 * Scores a track pair on 5 dimensions:
 *   Tempo (0.30), Key (0.25), Energy (0.20), Valence (0.15), Loudness (0.10)
 *
 * Missing data → neutral score (0.5), never penalized.
 */

import type { AudioFeatures } from '@/types'
import { toCamelot, camelotDistance } from './camelot'

const WEIGHTS = {
  tempo: 0.30,
  key: 0.25,
  energy: 0.20,
  valence: 0.15,
  loudness: 0.10,
} as const

/**
 * Score a transition from track A to track B.
 * Returns 0.0 (terrible) to 1.0 (perfect).
 */
export function scoreTransition(a: AudioFeatures, b: AudioFeatures): number {
  const tempo = scoreTempo(a.tempo, b.tempo)
  const key = scoreKey(a, b)
  const energy = scoreEnergy(a.energy, b.energy)
  const valence = scoreValence(a.valence, b.valence)
  const loudness = scoreLoudness(a.loudness, b.loudness)

  return (
    WEIGHTS.tempo * tempo +
    WEIGHTS.key * key +
    WEIGHTS.energy * energy +
    WEIGHTS.valence * valence +
    WEIGHTS.loudness * loudness
  )
}

/**
 * Tempo score: considers half-time and double-time matching.
 * Score 1.0 when diff ≤ 5 BPM, 0.0 when diff ≥ 30 BPM.
 */
function scoreTempo(tempoA: number, tempoB: number): number {
  // Check direct, half-time, and double-time matches
  const candidates = [
    Math.abs(tempoA - tempoB),
    Math.abs(tempoA - tempoB * 2),
    Math.abs(tempoA * 2 - tempoB),
  ]
  const diff = Math.min(...candidates)

  if (diff <= 5) return 1.0
  if (diff >= 30) return 0.0
  return 1.0 - (diff - 5) / 25
}

/**
 * Key compatibility score using Camelot wheel.
 * Score 1.0 for distance 0, 0.5 for distance 1, 0.0 for distance 3+.
 */
function scoreKey(a: AudioFeatures, b: AudioFeatures): number {
  const camelotA = toCamelot(a.key, a.mode)
  const camelotB = toCamelot(b.key, b.mode)

  // Missing key data → neutral
  if (!camelotA || !camelotB) return 0.5

  const dist = camelotDistance(camelotA, camelotB)
  if (dist === 0) return 1.0
  if (dist === 1) return 0.75
  if (dist === 2) return 0.35
  return 0.0
}

/**
 * Energy score: 1.0 when diff ≤ 0.05, 0.0 when diff ≥ 0.4.
 */
function scoreEnergy(energyA: number, energyB: number): number {
  const diff = Math.abs(energyA - energyB)
  if (diff <= 0.05) return 1.0
  if (diff >= 0.4) return 0.0
  return 1.0 - (diff - 0.05) / 0.35
}

/**
 * Valence score: 1.0 when diff ≤ 0.1, 0.0 when diff ≥ 0.5.
 */
function scoreValence(valenceA: number, valenceB: number): number {
  const diff = Math.abs(valenceA - valenceB)
  if (diff <= 0.1) return 1.0
  if (diff >= 0.5) return 0.0
  return 1.0 - (diff - 0.1) / 0.4
}

/**
 * Loudness score (normalized).
 * Spotify loudness is typically -60 to 0 dB. Normalize to 0-1.
 * Score 1.0 when normalized diff ≤ 0.1, 0.0 when diff ≥ 0.5.
 */
function scoreLoudness(loudnessA: number | undefined, loudnessB: number | undefined): number {
  if (loudnessA === undefined || loudnessB === undefined) return 0.5

  // Normalize: map [-60, 0] → [0, 1], clamped for edge cases
  const normA = Math.max(0, Math.min(1, (loudnessA + 60) / 60))
  const normB = Math.max(0, Math.min(1, (loudnessB + 60) / 60))
  const diff = Math.abs(normA - normB)

  if (diff <= 0.1) return 1.0
  if (diff >= 0.5) return 0.0
  return 1.0 - (diff - 0.1) / 0.4
}
