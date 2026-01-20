import type { TrackWithFeatures, MoodThresholds } from './types'
import type { Mood } from '@/types'

/**
 * Mood thresholds based on audio features
 * Each mood has target ranges for energy and valence
 */
const MOOD_THRESHOLDS: Record<Mood, MoodThresholds> = {
  energetic: {
    energy: [0.7, 1.0],
    valence: [0.5, 1.0],
    tempo: [120, 200],
    danceability: [0.6, 1.0],
  },
  chill: {
    energy: [0.1, 0.5],
    valence: [0.3, 0.7],
    tempo: [60, 110],
  },
  melancholic: {
    energy: [0.1, 0.5],
    valence: [0.0, 0.4],
  },
  focused: {
    energy: [0.3, 0.7],
    valence: [0.3, 0.7],
    tempo: [80, 130],
  },
  uplifting: {
    energy: [0.5, 0.9],
    valence: [0.6, 1.0],
    danceability: [0.5, 1.0],
  },
  dark: {
    energy: [0.4, 0.9],
    valence: [0.0, 0.35],
  },
}

/**
 * Calculate how well a track matches a mood
 * Returns a score from 0 (no match) to 1 (perfect match)
 */
export function calculateMoodMatchScore(
  track: TrackWithFeatures,
  mood: Mood
): number {
  const thresholds = MOOD_THRESHOLDS[mood]
  const { features } = track

  let totalScore = 0
  let criteriaCount = 0

  // Energy match
  const energyScore = calculateRangeScore(
    features.energy,
    thresholds.energy[0],
    thresholds.energy[1]
  )
  totalScore += energyScore
  criteriaCount++

  // Valence match
  const valenceScore = calculateRangeScore(
    features.valence,
    thresholds.valence[0],
    thresholds.valence[1]
  )
  totalScore += valenceScore
  criteriaCount++

  // Optional: Tempo match
  if (thresholds.tempo) {
    const tempoScore = calculateRangeScore(
      features.tempo,
      thresholds.tempo[0],
      thresholds.tempo[1]
    )
    totalScore += tempoScore * 0.5 // Weight tempo less
    criteriaCount += 0.5
  }

  // Optional: Danceability match
  if (thresholds.danceability) {
    const danceScore = calculateRangeScore(
      features.danceability,
      thresholds.danceability[0],
      thresholds.danceability[1]
    )
    totalScore += danceScore * 0.5 // Weight danceability less
    criteriaCount += 0.5
  }

  return totalScore / criteriaCount
}

/**
 * Calculate how well a value fits within a range
 * Returns 1 if in range, decreasing score as distance increases
 */
function calculateRangeScore(value: number, min: number, max: number): number {
  if (value >= min && value <= max) {
    return 1
  }

  // Calculate distance from nearest boundary
  const distance = value < min ? min - value : value - max
  // Decay score based on distance (0.5 score at 0.3 distance)
  return Math.max(0, 1 - distance / 0.3)
}

/**
 * Filter tracks that match a mood
 * Returns tracks with match score >= threshold (default 0.5)
 */
export function filterTracksByMood(
  tracks: TrackWithFeatures[],
  mood: Mood,
  threshold: number = 0.5
): TrackWithFeatures[] {
  return tracks
    .map((track) => ({
      track,
      score: calculateMoodMatchScore(track, mood),
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ track }) => track)
}

/**
 * Get mood thresholds for external use
 */
export function getMoodThresholds(mood: Mood): MoodThresholds {
  return MOOD_THRESHOLDS[mood]
}

/**
 * Check if a track is a good match for a mood (quick check)
 */
export function isTrackMoodMatch(track: TrackWithFeatures, mood: Mood): boolean {
  return calculateMoodMatchScore(track, mood) >= 0.5
}
