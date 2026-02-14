import type { SpotifyClient } from '@/lib/spotify/client'
import type { TrackWithFeatures } from '@/lib/journey/types'
import type { Track, Mood } from '@/types'
import { getMoodThresholds, calculateMoodMatchScore } from '@/lib/journey/matcher'
import { buildTasteProfile, filterGenresForMood, selectSearchGenres } from './taste-profile'
import {
  getAllCachedArtistGenres,
  getCachedDiscoveryCandidates,
  cacheDiscoveryCandidates,
} from '@/lib/storage/indexed-db'
import { estimateAudioFeatures } from '@/lib/genre/feature-estimator'

export interface DiscoveryOptions {
  seedTracks: TrackWithFeatures[]
  mood: Mood
  count: number
  excludeTrackIds: Set<string>
  maxPopularity?: number
  preferredGenres?: string[]
}

export interface DiscoveryResult {
  tracks: TrackWithFeatures[]
  seeds: string[]
  error?: string
}

/**
 * Fetch discovery tracks using Spotify's Search API and genre-based taste profiling.
 *
 * 1. Build taste profile from cached artist genres
 * 2. Filter genres by mood compatibility
 * 3. Search Spotify for tracks in those genres
 * 4. Estimate audio features and score by mood fit
 * 5. Return top candidates as discovery tracks
 *
 * Uses a 24-hour cache for search results — repeated journeys with the same
 * mood+genre hit 0 API calls.
 */
export async function fetchDiscoveryTracks(
  client: SpotifyClient,
  options: DiscoveryOptions
): Promise<DiscoveryResult> {
  const { mood, count, excludeTrackIds, maxPopularity = 70, preferredGenres } = options

  try {
    const normalizedPreferred = (preferredGenres ?? [])
      .map((genre) => genre.toLowerCase().trim())
      .filter(Boolean)

    let searchGenres: string[] = []

    if (normalizedPreferred.length > 0) {
      searchGenres = Array.from(new Set(normalizedPreferred)).slice(0, 4)
    } else {
      // Step 1: Get artist genres from IndexedDB
      const artistGenreMap = await getAllCachedArtistGenres()
      if (artistGenreMap.size === 0) {
        return { tracks: [], seeds: [], error: 'No artist genre data cached yet' }
      }

      // Step 2: Build taste profile
      const tasteProfile = buildTasteProfile(artistGenreMap)
      if (tasteProfile.rankedGenres.length === 0) {
        return { tracks: [], seeds: [] }
      }

      // Step 3: Filter genres by mood
      const thresholds = getMoodThresholds(mood)
      const moodGenres = filterGenresForMood(tasteProfile.rankedGenres, thresholds)
      if (moodGenres.length === 0) {
        return { tracks: [], seeds: [], error: 'No genres match this mood in your taste profile' }
      }

      // Step 4: Select top genres to search
      searchGenres = selectSearchGenres(moodGenres, 4)
    }

    // Step 5: Search for tracks in each genre (with caching)
    const allCandidates: Array<{ track: Track; sourceGenre: string }> = []

    for (const genre of searchGenres) {
      const cacheKey = genre

      // Check cache first
      const cached = await getCachedDiscoveryCandidates(cacheKey)
      if (cached) {
        for (const track of cached) {
          allCandidates.push({ track, sourceGenre: genre })
        }
        continue
      }

      // Cache miss — search Spotify
      const query = `genre:"${genre}"`
      const { data: tracks, error } = await client.searchTracks(query, 50)

      if (error) {
        console.warn(`[Discovery] Search failed for genre "${genre}":`, error)
        continue
      }

      if (tracks && tracks.length > 0) {
        // Cache the results
        await cacheDiscoveryCandidates(cacheKey, tracks)
        for (const track of tracks) {
          allCandidates.push({ track, sourceGenre: genre })
        }
      }
    }

    if (allCandidates.length === 0) {
      return { tracks: [], seeds: searchGenres }
    }

    // Step 6: Deduplicate, filter excluded, apply popularity filter
    const seen = new Set<string>()
    const filtered = allCandidates.filter(({ track }) => {
      if (seen.has(track.id)) return false
      if (excludeTrackIds.has(track.id)) return false
      if (track.popularity !== undefined && track.popularity > maxPopularity) return false
      seen.add(track.id)
      return true
    })

    // Step 7: Estimate features and score by mood fit
    const scored = filtered.map(({ track, sourceGenre }) => {
      const features = estimateAudioFeatures(track, [sourceGenre])
      const trackWithFeatures: TrackWithFeatures = {
        track: { ...track, isDiscovery: true },
        features,
      }
      const score = calculateMoodMatchScore(trackWithFeatures, mood)
      return { trackWithFeatures, score }
    })

    // Step 8: Sort by mood match, take top count
    scored.sort((a, b) => b.score - a.score)
    const result = scored.slice(0, count).map((s) => s.trackWithFeatures)

    return { tracks: result, seeds: searchGenres }
  } catch (err) {
    console.warn('[Discovery] Genre search failed:', err)
    return { tracks: [], seeds: [], error: 'Discovery search failed' }
  }
}
