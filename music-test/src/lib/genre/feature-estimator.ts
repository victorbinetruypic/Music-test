import type { Track, AudioFeatures } from '@/types'
import { getGenreEstimate, DEFAULT_GENRE_ESTIMATE, type GenreFeatureEstimate } from './genre-feature-map'

/**
 * Estimate audio features for a track based on its artist's genres,
 * popularity, and duration. Deterministic: same inputs → same outputs.
 */
export function estimateAudioFeatures(
  track: Track,
  artistGenres: string[],
  allArtistTracks?: Track[]
): AudioFeatures {
  // Step 1: Genre baseline — average feature ranges across all artist genres
  const genreEstimates = artistGenres.length > 0
    ? artistGenres.map((g) => getGenreEstimate(g))
    : [DEFAULT_GENRE_ESTIMATE]

  const baseline = averageEstimates(genreEstimates)

  // Step 2: Popularity modifier
  // Compare track popularity to artist catalog average
  let popularityDelta = 0
  if (track.popularity !== undefined && allArtistTracks && allArtistTracks.length > 1) {
    const artistPops = allArtistTracks
      .filter((t) => t.popularity !== undefined)
      .map((t) => t.popularity!)
    if (artistPops.length > 0) {
      const avgPop = artistPops.reduce((a, b) => a + b, 0) / artistPops.length
      // Normalize to ±0.05 range
      popularityDelta = ((track.popularity - avgPop) / 100) * 0.1
    }
  }

  // Step 3: Duration modifier
  // Shorter tracks tend to be more energetic
  const avgDurationMs = 3.5 * 60 * 1000 // 3.5 minutes
  const durationRatio = track.durationMs / avgDurationMs
  // Clamp to ±0.05 range: shorter = positive delta, longer = negative
  const durationDelta = clamp((1 - durationRatio) * 0.05, -0.05, 0.05)

  // Combine baseline with modifiers
  const energy = clamp(baseline.energy + popularityDelta + durationDelta, 0, 1)
  const danceability = clamp(baseline.danceability + popularityDelta, 0, 1)
  const valence = clamp(baseline.valence + popularityDelta * 0.5, 0, 1)
  const tempo = baseline.tempo
  const loudness = baseline.loudness

  return {
    id: track.id,
    energy,
    valence,
    tempo,
    danceability,
    key: undefined,
    mode: undefined,
    loudness,
  }
}

function averageEstimates(estimates: GenreFeatureEstimate[]): {
  energy: number
  tempo: number
  valence: number
  danceability: number
  loudness: number
} {
  const n = estimates.length
  const mid = (range: [number, number]) => (range[0] + range[1]) / 2

  return {
    energy: estimates.reduce((sum, e) => sum + mid(e.energy), 0) / n,
    tempo: estimates.reduce((sum, e) => sum + mid(e.tempo), 0) / n,
    valence: estimates.reduce((sum, e) => sum + mid(e.valence), 0) / n,
    danceability: estimates.reduce((sum, e) => sum + mid(e.danceability), 0) / n,
    loudness: estimates.reduce((sum, e) => sum + mid(e.loudness), 0) / n,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
