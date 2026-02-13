import { useState, useCallback } from 'react'

import type { Track, AudioFeatures } from '@/types'
import type { SpotifyClient } from '@/lib/spotify'
import {
  getCachedAudioFeatures,
  cacheAudioFeatures,
  getAllCachedFeatures,
  getCacheTimestamp,
  getCachedArtistGenres,
  cacheArtistGenres,
} from '@/lib/storage'
import { estimateAudioFeatures } from '@/lib/genre/feature-estimator'

export interface FetchProgress {
  current: number
  total: number
  phase: 'loading' | 'fetching-genres' | 'estimating' | 'caching' | 'done' | 'error'
  error?: string
}

export interface UseAudioFeaturesResult {
  features: AudioFeatures[]
  isCached: boolean
  cacheTimestamp: number | null
  progress: FetchProgress | null
  fetchFeatures: (tracks: Track[], client: SpotifyClient) => Promise<AudioFeatures[]>
  retryFailed: () => Promise<void>
}

export function useAudioFeatures(): UseAudioFeaturesResult {
  const [features, setFeatures] = useState<AudioFeatures[]>([])
  const [isCached, setIsCached] = useState(false)
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null)
  const [progress, setProgress] = useState<FetchProgress | null>(null)
  const [pendingTracks, setPendingTracks] = useState<Track[]>([])
  const [pendingClient, setPendingClient] = useState<SpotifyClient | null>(null)

  const fetchFeatures = useCallback(
    async (tracks: Track[], client: SpotifyClient): Promise<AudioFeatures[]> => {
      if (tracks.length === 0) {
        setFeatures([])
        return []
      }

      setProgress({ current: 0, total: tracks.length, phase: 'loading' })

      // Check cache first
      const trackIds = tracks.map((t) => t.id)
      const { cached, uncached } = await getCachedAudioFeatures(trackIds)

      if (uncached.length === 0) {
        // All features are cached (either from API or previous estimation)
        const timestamp = await getCacheTimestamp()
        setFeatures(cached)
        setIsCached(true)
        setCacheTimestamp(timestamp)
        setProgress({ current: tracks.length, total: tracks.length, phase: 'done' })
        return cached
      }

      // Need to estimate features for uncached tracks
      const uncachedTracks = tracks.filter((t) => uncached.includes(t.id))

      // Store for potential retry
      setPendingTracks(uncachedTracks)
      setPendingClient(client)

      setProgress({
        current: cached.length,
        total: tracks.length,
        phase: 'fetching-genres',
      })

      try {
        // Extract unique artist IDs from uncached tracks
        const artistIds = [...new Set(uncachedTracks.map((t) => t.artistId).filter(Boolean))]

        // Check artist-genres cache
        const { cached: cachedGenres, uncached: uncachedArtistIds } =
          await getCachedArtistGenres(artistIds)

        // Fetch missing artist genres from Spotify
        if (uncachedArtistIds.length > 0) {
          const { data: artists, error } = await client.getArtists(uncachedArtistIds)

          if (error) {
            console.warn('Failed to fetch some artist genres:', error)
          }

          if (artists && artists.length > 0) {
            // Cache fetched genres
            await cacheArtistGenres(
              artists.map((a) => ({ artistId: a.id, genres: a.genres }))
            )
            // Add to local map
            for (const artist of artists) {
              cachedGenres.set(artist.id, artist.genres)
            }
          }
        }

        // Estimate features
        setProgress({
          current: cached.length,
          total: tracks.length,
          phase: 'estimating',
        })

        // Group tracks by artist for popularity comparison
        const tracksByArtist = new Map<string, Track[]>()
        for (const track of tracks) {
          const existing = tracksByArtist.get(track.artistId) || []
          existing.push(track)
          tracksByArtist.set(track.artistId, existing)
        }

        const estimatedFeatures: AudioFeatures[] = uncachedTracks.map((track) => {
          const genres = cachedGenres.get(track.artistId) || []
          const artistTracks = tracksByArtist.get(track.artistId)
          return estimateAudioFeatures(track, genres, artistTracks)
        })

        // Cache estimated features
        setProgress({
          current: cached.length + estimatedFeatures.length,
          total: tracks.length,
          phase: 'caching',
        })

        await cacheAudioFeatures(estimatedFeatures)

        const allFeatures = [...cached, ...estimatedFeatures]
        const timestamp = await getCacheTimestamp()

        setFeatures(allFeatures)
        setIsCached(true)
        setCacheTimestamp(timestamp)
        setProgress({ current: tracks.length, total: tracks.length, phase: 'done' })
        setPendingTracks([])
        setPendingClient(null)

        return allFeatures
      } catch (err) {
        console.warn('Feature estimation error:', err)

        // Return whatever we have cached
        setFeatures(cached)
        setIsCached(cached.length > 0)
        setProgress({
          current: cached.length,
          total: tracks.length,
          phase: 'error',
          error: err instanceof Error ? err.message : 'Failed to analyze your music library',
        })
        return cached
      }
    },
    []
  )

  const retryFailed = useCallback(async (): Promise<void> => {
    if (pendingTracks.length === 0 || !pendingClient) {
      return
    }

    await fetchFeatures(pendingTracks, pendingClient)
  }, [pendingTracks, pendingClient, fetchFeatures])

  return {
    features,
    isCached,
    cacheTimestamp,
    progress,
    fetchFeatures,
    retryFailed,
  }
}

// Utility function to load all cached features (for app initialization)
export async function loadCachedFeatures(): Promise<{
  features: AudioFeatures[]
  timestamp: number | null
}> {
  const features = await getAllCachedFeatures()
  const timestamp = await getCacheTimestamp()
  return { features, timestamp }
}
