import { getGenreEstimate } from '@/lib/genre/genre-feature-map'
import type { MoodThresholds } from '@/lib/journey/types'

export interface TasteProfile {
  rankedGenres: Array<{ genre: string; count: number }>
  artistCount: number
}

export interface MoodGenre {
  genre: string
  count: number
  moodFitScore: number
  combinedScore: number
}

/**
 * Build a taste profile from a map of artist → genres.
 * Aggregates all genres, ranks by frequency (how many artists share each genre).
 */
export function buildTasteProfile(
  artistGenreMap: Map<string, string[]>
): TasteProfile {
  const genreCounts = new Map<string, number>()

  for (const genres of artistGenreMap.values()) {
    for (const genre of genres) {
      const normalized = genre.toLowerCase().trim()
      genreCounts.set(normalized, (genreCounts.get(normalized) || 0) + 1)
    }
  }

  const rankedGenres = Array.from(genreCounts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)

  return {
    rankedGenres,
    artistCount: artistGenreMap.size,
  }
}

/**
 * Filter genres by mood compatibility.
 * For each genre, look up feature estimate and check if energy AND valence
 * ranges overlap with the mood's thresholds.
 * Score = energyOverlap × valenceOverlap.
 * Sort by weighted combination of mood fit (60%) + user taste frequency (40%).
 */
export function filterGenresForMood(
  genres: Array<{ genre: string; count: number }>,
  thresholds: MoodThresholds
): MoodGenre[] {
  if (genres.length === 0) return []

  const maxCount = genres[0].count // Already sorted by count desc

  const scored: MoodGenre[] = []

  for (const { genre, count } of genres) {
    const estimate = getGenreEstimate(genre)

    const energyOverlap = rangeOverlap(estimate.energy, thresholds.energy)
    const valenceOverlap = rangeOverlap(estimate.valence, thresholds.valence)

    // Both must overlap
    if (energyOverlap <= 0 || valenceOverlap <= 0) continue

    const moodFitScore = energyOverlap * valenceOverlap
    const tasteScore = count / maxCount
    const combinedScore = moodFitScore * 0.6 + tasteScore * 0.4

    scored.push({ genre, count, moodFitScore, combinedScore })
  }

  return scored.sort((a, b) => b.combinedScore - a.combinedScore)
}

/**
 * Select top N mood-compatible genres, deduplicating genre families.
 * Avoids selecting genres that share the same base word (e.g. "house" and
 * "deep house" both have base "house"). Genres with distinct base words
 * like "rock" and "folk rock" are allowed through.
 */
export function selectSearchGenres(
  moodGenres: MoodGenre[],
  maxGenres: number = 3
): string[] {
  const selected: string[] = []
  const selectedBases = new Set<string>()

  for (const { genre } of moodGenres) {
    if (selected.length >= maxGenres) break

    const words = genre.split(/\s+/)
    // The "base" is the last word (e.g. "deep house" → "house", "indie rock" → "rock")
    const base = words[words.length - 1]

    // Skip if an exact match or if a single-word genre matches a selected base
    // (e.g. skip "rock" if "indie rock" is already selected)
    if (selected.includes(genre)) continue
    if (words.length === 1 && selectedBases.has(base)) continue
    // Skip multi-word genres if the exact same base is already selected as a standalone
    if (words.length > 1 && selected.includes(base)) continue

    selected.push(genre)
    selectedBases.add(base)
  }

  return selected
}

/**
 * Calculate overlap between two ranges as a 0-1 score.
 * Returns 0 if no overlap, 1 if one range fully contains the other.
 */
function rangeOverlap(
  a: [number, number],
  b: [number, number]
): number {
  const overlapStart = Math.max(a[0], b[0])
  const overlapEnd = Math.min(a[1], b[1])

  if (overlapStart >= overlapEnd) return 0

  const overlapSize = overlapEnd - overlapStart
  const smallerRange = Math.min(a[1] - a[0], b[1] - b[0])

  if (smallerRange <= 0) return 0

  return overlapSize / smallerRange
}
