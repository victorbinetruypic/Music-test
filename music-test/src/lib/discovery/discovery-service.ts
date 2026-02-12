import type { SpotifyClient } from '@/lib/spotify/client'
import type { TrackWithFeatures } from '@/lib/journey/types'
import type { Mood } from '@/types'
import { getMoodThresholds } from '@/lib/journey/matcher'

export interface DiscoveryOptions {
  seedTracks: TrackWithFeatures[]
  mood: Mood
  count: number
  excludeTrackIds: Set<string>
  maxPopularity?: number
}

export interface DiscoveryResult {
  tracks: TrackWithFeatures[]
  seeds: string[]
  error?: string
}

/**
 * Pick 5 diverse seed tracks spread across the energy range of the pool.
 */
function pickDiverseSeeds(tracks: TrackWithFeatures[], count: number = 5): TrackWithFeatures[] {
  if (tracks.length <= count) return [...tracks]

  const sorted = [...tracks].sort((a, b) => a.features.energy - b.features.energy)
  const step = (sorted.length - 1) / (count - 1)
  const seeds: TrackWithFeatures[] = []

  for (let i = 0; i < count; i++) {
    seeds.push(sorted[Math.round(i * step)])
  }
  return seeds
}

/**
 * Fetch discovery tracks from Spotify's Recommendations API.
 * Picks diverse seeds, targets the mood's audio profile, and filters out known tracks.
 *
 * Makes exactly 2 API calls: 1x getRecommendations + 1x getAudioFeatures.
 * Both go through the request queue for rate limiting.
 */
export async function fetchDiscoveryTracks(
  client: SpotifyClient,
  options: DiscoveryOptions
): Promise<DiscoveryResult> {
  const { seedTracks, mood, count, excludeTrackIds, maxPopularity = 70 } = options

  if (seedTracks.length === 0) {
    return { tracks: [], seeds: [] }
  }

  // Pick diverse seeds
  const seeds = pickDiverseSeeds(seedTracks)
  const seedIds = seeds.map((s) => s.track.id)

  // Compute target features from mood thresholds
  const thresholds = getMoodThresholds(mood)
  const targetEnergy = (thresholds.energy[0] + thresholds.energy[1]) / 2
  const targetValence = (thresholds.valence[0] + thresholds.valence[1]) / 2
  const targetTempo = thresholds.tempo
    ? (thresholds.tempo[0] + thresholds.tempo[1]) / 2
    : undefined
  const targetDanceability = thresholds.danceability
    ? (thresholds.danceability[0] + thresholds.danceability[1]) / 2
    : undefined

  // Request more than needed so we can filter — capped at 100 (Spotify's max)
  const requestLimit = Math.min(100, count * 3)

  // API call 1: Get recommendations
  const { data: recommendedTracks, error } = await client.getRecommendations({
    seedTrackIds: seedIds,
    targetEnergy,
    targetValence,
    targetTempo,
    targetDanceability,
    maxPopularity,
    limit: requestLimit,
  })

  if (error || !recommendedTracks || recommendedTracks.length === 0) {
    return { tracks: [], seeds: seedIds, error: error ?? undefined }
  }

  // Filter out excluded tracks
  const filtered = recommendedTracks.filter((t) => !excludeTrackIds.has(t.id))

  // Limit to requested count (and never exceed 100 for the features batch)
  const selected = filtered.slice(0, Math.min(count, 100))

  if (selected.length === 0) {
    return { tracks: [], seeds: seedIds }
  }

  // API call 2: Get audio features for discovery tracks
  const discoveryIds = selected.map((t) => t.id)
  const { data: featuresMap, error: featuresError } = await client.getAudioFeaturesMap(discoveryIds)

  if (!featuresMap) {
    return { tracks: [], seeds: seedIds, error: featuresError ?? undefined }
  }

  // Combine into TrackWithFeatures, mark as discovery
  const tracksWithFeatures: TrackWithFeatures[] = selected
    .filter((t) => featuresMap.has(t.id))
    .map((track) => ({
      track: { ...track, isDiscovery: true },
      features: featuresMap.get(track.id)!,
    }))

  return { tracks: tracksWithFeatures, seeds: seedIds }
}
