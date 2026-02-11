import { useState, useCallback } from 'react'

import type { Track, AudioFeatures } from '@/types'
import type { SpotifyClient } from '@/lib/spotify'
import {
  getCachedAudioFeatures,
  cacheAudioFeatures,
  getAllCachedFeatures,
  getCacheTimestamp,
} from '@/lib/storage'

const BATCH_SIZE = 100
const BATCH_DELAY_MS = 500 // Delay between batches to avoid rate limiting

export interface FetchProgress {
  current: number
  total: number
  phase: 'loading' | 'fetching' | 'caching' | 'done' | 'error'
  error?: string
  partialSuccess?: {
    completedBatches: number
    totalBatches: number
    failedBatch: number
  }
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
        // All features are cached
        const timestamp = await getCacheTimestamp()
        setFeatures(cached)
        setIsCached(true)
        setCacheTimestamp(timestamp)
        setProgress({ current: tracks.length, total: tracks.length, phase: 'done' })
        return cached
      }

      // Need to fetch some features
      setProgress({
        current: cached.length,
        total: tracks.length,
        phase: 'fetching',
      })

      // Store for potential retry
      setPendingTracks(tracks.filter((t) => uncached.includes(t.id)))
      setPendingClient(client)

      // Fetch in batches
      const batches: string[][] = []
      for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
        batches.push(uncached.slice(i, i + BATCH_SIZE))
      }

      const fetchedFeatures: AudioFeatures[] = []
      let failedBatchIndex = -1

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]

        const { data, error } = await client.getAudioFeatures(batch)

        if (error || !data) {
          failedBatchIndex = i
          setProgress({
            current: cached.length + fetchedFeatures.length,
            total: tracks.length,
            phase: 'error',
            error: error || 'Failed to fetch audio features',
            partialSuccess: {
              completedBatches: i,
              totalBatches: batches.length,
              failedBatch: i + 1,
            },
          })

          // Cache what we got so far
          if (fetchedFeatures.length > 0) {
            await cacheAudioFeatures(fetchedFeatures)
          }

          // Return partial data
          const allFeatures = [...cached, ...fetchedFeatures]
          setFeatures(allFeatures)
          setIsCached(false)
          return allFeatures
        }

        fetchedFeatures.push(...data)

        // Update progress
        setProgress({
          current: cached.length + fetchedFeatures.length,
          total: tracks.length,
          phase: 'fetching',
        })

        // Add small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
        }
      }

      // Cache all fetched features
      setProgress({
        current: cached.length + fetchedFeatures.length,
        total: tracks.length,
        phase: 'caching',
      })

      await cacheAudioFeatures(fetchedFeatures)

      const allFeatures = [...cached, ...fetchedFeatures]
      const timestamp = await getCacheTimestamp()

      setFeatures(allFeatures)
      setIsCached(true)
      setCacheTimestamp(timestamp)
      setProgress({ current: tracks.length, total: tracks.length, phase: 'done' })
      setPendingTracks([])
      setPendingClient(null)

      return allFeatures
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
