'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { MoodPicker } from './MoodPicker'
import { DurationPicker } from './DurationPicker'
import { ArcPreview } from './ArcVisualization'
import { cn } from '@/lib/utils'
import { useJourneyStore } from '@/stores/journeyStore'
import { usePrefsStore, calculatePenaltyScore } from '@/stores/prefsStore'
import { useSpotifyClient } from '@/hooks/useSpotifyClient'
import { useAudioFeatures } from '@/hooks/useAudioFeatures'
import {
  generateJourney,
  combineTracksWithFeatures,
  createFeaturesMap,
  InsufficientSongsError,
  filterTracksByMood,
} from '@/lib/journey'
import { fetchDiscoveryTracks } from '@/lib/discovery/discovery-service'
import { findForgottenGems } from '@/lib/discovery/forgotten-gems'
import { buildTasteProfile, filterGenresForMood } from '@/lib/discovery/taste-profile'
import { getMoodThresholds } from '@/lib/journey/matcher'
import type { Track, Journey, Mood, Duration } from '@/types'

const TRACK_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000
const AUTO_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000
const AUTO_REFRESH_MAX_SAMPLE_TRACKS = 100
const FALLBACK_GENRES = [
  'electronic',
  'house',
  'techno',
  'ambient',
  'classical',
  'hip hop',
  'trap',
  'rock',
  'metal',
  'jazz',
  'pop',
  'indie',
]

interface JourneyConfigProps {
  likedSongsCount: number
  onJourneyReady?: (journey: Journey) => void
}

export function JourneyConfig({
  likedSongsCount,
  onJourneyReady,
}: JourneyConfigProps): React.ReactElement {
  const spotifyClient = useSpotifyClient()

  // Journey store
  const selectedMood = useJourneyStore((s) => s.selectedMood)
  const selectedDuration = useJourneyStore((s) => s.selectedDuration)
  const currentJourney = useJourneyStore((s) => s.currentJourney)
  const isGenerating = useJourneyStore((s) => s.isGenerating)
  const error = useJourneyStore((s) => s.error)
  const setSelectedMood = useJourneyStore((s) => s.setSelectedMood)
  const setSelectedDuration = useJourneyStore((s) => s.setSelectedDuration)
  const setJourney = useJourneyStore((s) => s.setJourney)
  const clearJourney = useJourneyStore((s) => s.clearJourney)
  const setIsGenerating = useJourneyStore((s) => s.setIsGenerating)
  const setError = useJourneyStore((s) => s.setError)

  // Prefs store
  const exclusions = usePrefsStore((s) => s.exclusions)
  const skipData = usePrefsStore((s) => s.skipData)
  const lastMood = usePrefsStore((s) => s.lastMood)
  const lastDuration = usePrefsStore((s) => s.lastDuration)
  const setLastMood = usePrefsStore((s) => s.setLastMood)
  const setLastDuration = usePrefsStore((s) => s.setLastDuration)
  const moodGenres = usePrefsStore((s) => s.moodGenres)
  const setMoodGenres = usePrefsStore((s) => s.setMoodGenres)
  const loadPrefsFromStorage = usePrefsStore((s) => s.loadFromStorage)
  const prefsLoaded = usePrefsStore((s) => s.isLoaded)

  // Audio features
  const { progress: featuresProgress, fetchFeatures, retryFailed } = useAudioFeatures()

  // Discovery tracking
  const discoveryHistory = usePrefsStore((s) => s.discoveryHistory)

  // Local state
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(false)
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  const [savedPlaylistUrl, setSavedPlaylistUrl] = useState<string | null>(null)
  const [generationPhase, setGenerationPhase] = useState<string | null>(null)
  const [lastLibraryRefresh, setLastLibraryRefresh] = useState<number | null>(null)
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [usingFallbackGenres, setUsingFallbackGenres] = useState(false)
  const generatingRef = useRef(false)

  // Refresh library handler — clears caches so next generation re-fetches
  const handleRefreshLibrary = useCallback(async () => {
    const { clearTracksCache, clearAudioFeaturesCache } = await import('@/lib/storage')
    await clearTracksCache()
    await clearAudioFeaturesCache()
    setTracks([])
  }, [])

  // Load preferences on mount
  useEffect(() => {
    if (!prefsLoaded) {
      loadPrefsFromStorage()
    }
  }, [prefsLoaded, loadPrefsFromStorage])

  // Load last refresh timestamp on mount
  useEffect(() => {
    let isMounted = true
    const loadRefreshTimestamp = async (): Promise<void> => {
      const { getLibraryRefreshTimestamp } = await import('@/lib/storage')
      if (isMounted) {
        setLastLibraryRefresh(getLibraryRefreshTimestamp())
      }
    }
    loadRefreshTimestamp()
    return () => {
      isMounted = false
    }
  }, [])

  const genreRefreshKey = `${selectedMood ?? 'none'}|${lastLibraryRefresh ?? 0}|${featuresProgress?.phase ?? 'idle'}`

  // Load available genres for the selected mood
  useEffect(() => {
    let isMounted = true

    const loadGenres = async (): Promise<void> => {
      if (!selectedMood) {
        setAvailableGenres([])
        setUsingFallbackGenres(false)
        return
      }

      const { getAllCachedArtistGenres } = await import('@/lib/storage')
      const artistGenreMap = await getAllCachedArtistGenres()
      if (!isMounted) return

      if (artistGenreMap.size === 0) {
        setAvailableGenres(FALLBACK_GENRES)
        setUsingFallbackGenres(true)
        return
      }

      const tasteProfile = buildTasteProfile(artistGenreMap)
      const moodGenres = filterGenresForMood(
        tasteProfile.rankedGenres,
        getMoodThresholds(selectedMood)
      )

      const topGenres = moodGenres.slice(0, 12).map((g) => g.genre)
      if (topGenres.length > 0) {
        setAvailableGenres(topGenres)
        setUsingFallbackGenres(false)
      } else {
        setAvailableGenres(FALLBACK_GENRES)
        setUsingFallbackGenres(true)
      }
    }

    loadGenres()

    return () => {
      isMounted = false
    }
  }, [genreRefreshKey])

  // Set defaults from last session
  useEffect(() => {
    if (prefsLoaded && !selectedMood && lastMood) {
      setSelectedMood(lastMood)
    }
    if (prefsLoaded && !selectedDuration && lastDuration) {
      setSelectedDuration(lastDuration)
    }
  }, [prefsLoaded, lastMood, lastDuration, selectedMood, selectedDuration, setSelectedMood, setSelectedDuration])

  // Load tracks and features (checks IndexedDB cache first)
  const loadTracksAndFeatures = useCallback(async (
    options?: { maxSampleTracks?: number; markRefresh?: boolean }
  ): Promise<void> => {
    if (!spotifyClient) return

    setIsLoadingTracks(true)
    setError(null)

    try {
      const {
        getCachedTracks,
        getTracksCacheTimestamp,
        cacheTracks,
        setLibraryRefreshTimestamp,
      } = await import('@/lib/storage')

      // Check cache first
      const cachedTracks = await getCachedTracks()
      const cacheTs = await getTracksCacheTimestamp()
      const cacheAge = cacheTs ? Date.now() - cacheTs : Infinity
      const cacheValid = cachedTracks.length >= 50 && cacheAge < TRACK_CACHE_MAX_AGE_MS

      if (cacheValid) {
        setTracks(cachedTracks)
        await fetchFeatures(cachedTracks, spotifyClient)
        setIsLoadingTracks(false)
        return
      }

      // Cache miss or stale — fetch from Spotify
      const limit = 50
      const totalPages = Math.ceil(likedSongsCount / limit)
      const maxSampleTracks = Math.max(
        limit,
        Math.min(options?.maxSampleTracks ?? 250, likedSongsCount)
      )
      const pagesToFetch = Math.min(totalPages, Math.ceil(maxSampleTracks / limit))

      if (options?.markRefresh) {
        const refreshTimestamp = Date.now()
        setLibraryRefreshTimestamp(refreshTimestamp)
        setLastLibraryRefresh(refreshTimestamp)
      }

      // Pick random page offsets spread across the library
      const allOffsets = Array.from({ length: totalPages }, (_, i) => i * limit)
      for (let i = allOffsets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOffsets[i], allOffsets[j]] = [allOffsets[j], allOffsets[i]]
      }
      const selectedOffsets = allOffsets.slice(0, pagesToFetch).sort((a, b) => a - b)

      const allTracks: Track[] = []

      for (const offset of selectedOffsets) {
        const { data, error: fetchError } = await spotifyClient.getLikedSongs(limit, offset)
        if (fetchError) {
          setError(fetchError)
          setIsLoadingTracks(false)
          return
        }
        if (data) {
          allTracks.push(...data)
        }

        // Delay between pages to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Persist to IndexedDB for next time
      await cacheTracks(allTracks)

      setTracks(allTracks)

      // Fetch audio features
      await fetchFeatures(allTracks, spotifyClient)

      setIsLoadingTracks(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks')
      setIsLoadingTracks(false)
    }
  }, [spotifyClient, likedSongsCount, fetchFeatures, setError])


  // Handle mood change
  const handleMoodChange = (mood: Mood): void => {
    setSelectedMood(mood)
    setLastMood(mood)
  }

  // Handle duration change
  const handleDurationChange = (duration: Duration): void => {
    setSelectedDuration(duration)
    setLastDuration(duration)
  }

  const selectedGenres = selectedMood ? moodGenres[selectedMood] ?? [] : []
  const selectedGenreSet = useMemo(
    () => new Set(selectedGenres.map((g) => g.toLowerCase())),
    [selectedGenres]
  )
  const matchesSelectedGenre = useCallback(
    (genre: string) => {
      const normalized = genre.toLowerCase()
      for (const selected of selectedGenreSet) {
        if (normalized === selected) return true
        if (normalized.includes(selected)) return true
        if (selected.includes(normalized)) return true
      }
      return false
    },
    [selectedGenreSet]
  )

  const toggleGenre = useCallback(
    (genre: string) => {
      if (!selectedMood) return
      const current = new Set(selectedGenres)
      if (current.has(genre)) {
        current.delete(genre)
      } else {
        current.add(genre)
      }
      setMoodGenres(selectedMood, Array.from(current))
    },
    [selectedMood, selectedGenres, setMoodGenres]
  )

  const clearGenres = useCallback(() => {
    if (!selectedMood) return
    setMoodGenres(selectedMood, [])
  }, [selectedMood, setMoodGenres])

  // Generate journey
  const handleGenerate = useCallback(async (): Promise<void> => {
    if (!selectedMood || !selectedDuration || !spotifyClient) {
      return
    }

    // Prevent concurrent generation (double-click / rapid re-trigger)
    if (generatingRef.current) return
    generatingRef.current = true

    setIsGenerating(true)
    setError(null)
    setGenerationPhase('Loading your library...')

    try {
      // Always read from cache to get the latest data (React state may be stale)
      const {
        getAllCachedFeatures,
        getCachedTracks,
        getTracksCacheTimestamp,
        getAllCachedArtistGenres,
        getLibraryRefreshTimestamp,
        getJourneyHistory,
      } = await import('@/lib/storage')

      const cacheTs = await getTracksCacheTimestamp()
      const cacheAge = cacheTs ? Date.now() - cacheTs : Infinity
      const cacheStale = cacheAge > TRACK_CACHE_MAX_AGE_MS
      const cachedGenres = await getAllCachedArtistGenres()
      const genresMissing = cachedGenres.size === 0
      const lastLibraryRefresh = getLibraryRefreshTimestamp()
      const canAutoRefresh =
        !lastLibraryRefresh || Date.now() - lastLibraryRefresh > AUTO_REFRESH_INTERVAL_MS

      const needsInitialLoad =
        tracks.length === 0 || !featuresProgress || featuresProgress.phase !== 'done'

      // Lazy-load or auto-refresh if cache is stale, but rate-limit background refreshes
      if (needsInitialLoad) {
        await loadTracksAndFeatures({
          maxSampleTracks: AUTO_REFRESH_MAX_SAMPLE_TRACKS,
          markRefresh: true,
        })
      } else if ((cacheStale || genresMissing) && canAutoRefresh) {
        await loadTracksAndFeatures({
          maxSampleTracks: AUTO_REFRESH_MAX_SAMPLE_TRACKS,
          markRefresh: true,
        })
      }

      const currentTracks = await getCachedTracks()
      const cachedFeatures = await getAllCachedFeatures()

      // Combine tracks with features
      const featuresMap = createFeaturesMap(cachedFeatures)
      const tracksWithFeatures = combineTracksWithFeatures(currentTracks, featuresMap)

      // Estimate track count for pacing and filtering
      const avgSongDuration = 3.5
      const durationMinutes = selectedDuration === 'open-ended' ? 180 : selectedDuration
      const estimatedTracks = Math.max(10, Math.round(durationMinutes / avgSongDuration))

      // Apply optional genre filter (only if it leaves enough tracks)
      let candidateTracks = tracksWithFeatures
      if (selectedGenreSet.size > 0) {
        const filteredByGenre = tracksWithFeatures.filter((twf) => {
          const genres = cachedGenres.get(twf.track.artistId) || []
          return genres.some(matchesSelectedGenre)
        })

        // Enforce genre selection; fail fast if we don't have enough matches
        if (filteredByGenre.length < 10) {
          setError(
            `Only ${filteredByGenre.length} songs match your selected genres. Add more genres or clear the filter.`
          )
          setIsGenerating(false)
          setGenerationPhase(null)
          generatingRef.current = false
          return
        }

        candidateTracks = filteredByGenre
      }

      // Compute skip penalties for frequency reduction (Story 4.4)
      const skipPenalties = new Map<string, number>()
      const trackIds = new Set(currentTracks.map((t) => t.id))
      for (const trackId of trackIds) {
        const penalty = calculatePenaltyScore(trackId, skipData)
        if (penalty > 0) {
          skipPenalties.set(trackId, penalty)
        }
      }

      // Calculate how many discoveries to fetch
      const discoveryCount = Math.max(2, Math.floor(estimatedTracks * 0.2))

      // Reduce repeats: exclude tracks from the most recent journey if pool allows
      const recentHistory = await getJourneyHistory(1)
      const recentTrackIds = new Set<string>(
        recentHistory.flatMap((entry) => entry.trackIds ?? [])
      )
      const recentExclusions = new Set<string>()
      if (recentTrackIds.size > 0) {
        const minPoolAfterExclusions = Math.max(30, estimatedTracks + 10)
        if (currentTracks.length - recentTrackIds.size >= minPoolAfterExclusions) {
          for (const id of recentTrackIds) recentExclusions.add(id)
        } else {
          // If the pool is tight, softly penalize recent tracks instead of excluding
          for (const id of recentTrackIds) {
            const currentPenalty = skipPenalties.get(id) ?? 0
            skipPenalties.set(id, Math.max(currentPenalty, 1))
          }
        }
      }

      // Build exclude set: liked songs + exclusions + rejected discoveries
      const excludeIds = new Set([...trackIds, ...exclusions])
      if (discoveryHistory) {
        for (const entry of discoveryHistory) {
          if (entry.outcome === 'not-this') {
            excludeIds.add(entry.trackId)
          }
        }
        // Also exclude tracks skipped 3+ times
        const skipCounts = new Map<string, number>()
        for (const entry of discoveryHistory) {
          if (entry.outcome === 'skipped') {
            skipCounts.set(entry.trackId, (skipCounts.get(entry.trackId) ?? 0) + 1)
          }
        }
        for (const [id, count] of skipCounts) {
          if (count >= 3) excludeIds.add(id)
        }
      }

      // Fetch recently played for forgotten gems (failure is non-fatal)
      setGenerationPhase('Finding discoveries...')
      const recentlyPlayedIds = new Set<string>()
      const { data: recentlyPlayed, error: recentError } = await spotifyClient.getRecentlyPlayed(50)
      if (recentError) {
        console.warn('Could not fetch recently played:', recentError)
      }
      if (recentlyPlayed) {
        for (const item of recentlyPlayed) {
          recentlyPlayedIds.add(item.track.id)
        }
      }

      // Find forgotten gems (pure client-side, no API calls)
      const gems = findForgottenGems({
        allLikedTracks: currentTracks,
        recentlyPlayedIds,
        mood: selectedMood,
        featuresMap,
        count: 2,
      })
      const filteredGems = gems.filter((g) => {
        if (recentExclusions.has(g.track.id)) return false
        if (selectedGenreSet.size === 0) return true
        const genres = cachedGenres.get(g.track.artistId) || []
        return genres.some(matchesSelectedGenre)
      })

      // Use mood-filtered tracks as seeds for better recommendations
      const moodMatchedTracks = filterTracksByMood(candidateTracks, selectedMood)

      // Fetch discovery tracks (failure is non-fatal — journey works without them)
      const { tracks: discoveryTracks, error: discoveryError } = await fetchDiscoveryTracks(
        spotifyClient,
        {
          seedTracks: moodMatchedTracks.slice(0, 20),
          mood: selectedMood,
          count: discoveryCount,
          excludeTrackIds: excludeIds,
          preferredGenres: selectedGenres,
        }
      )
      if (discoveryError) {
        console.warn('Discovery fetch degraded:', discoveryError)
      }

      setGenerationPhase('Creating journey...')

      // Generate journey with discoveries and gems
      const generatorExclusions = new Set<string>([...exclusions, ...recentExclusions])
      const result = generateJourney({
        tracks: candidateTracks,
        mood: selectedMood,
        duration: selectedDuration,
        excludedTrackIds: generatorExclusions,
        skipPenalties,
        discoveryTracks: discoveryTracks.length > 0 ? discoveryTracks : undefined,
        forgottenGems: filteredGems.length > 0 ? filteredGems : undefined,
      })

      setJourney(result.journey)
      onJourneyReady?.(result.journey)
    } catch (err) {
      if (err instanceof InsufficientSongsError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate journey')
      }
    } finally {
      generatingRef.current = false
      setIsGenerating(false)
      setGenerationPhase(null)
    }
  }, [selectedMood, selectedDuration, selectedGenres, featuresProgress, tracks, exclusions, skipData, discoveryHistory, spotifyClient, setIsGenerating, setError, setJourney, onJourneyReady, loadTracksAndFeatures])

  // Save playlist to Spotify
  const handleSavePlaylist = useCallback(async (): Promise<void> => {
    if (!spotifyClient || !currentJourney) return

    setIsSavingPlaylist(true)
    setError(null)

    try {
      const moodLabel = currentJourney.mood.charAt(0).toUpperCase() + currentJourney.mood.slice(1)
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const playlistName = `${moodLabel} Journey - ${date}`
      const trackUris = currentJourney.tracks.map((t) => t.uri)

      const { data, error: saveError } = await spotifyClient.createPlaylist(playlistName, trackUris)

      if (saveError) {
        setError(saveError)
      } else if (data) {
        setSavedPlaylistUrl(data.external_urls.spotify)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save playlist')
    } finally {
      setIsSavingPlaylist(false)
    }
  }, [spotifyClient, currentJourney, setError])

  // Loading state — only shown during generation (lazy loading)
  if (isGenerating && (isLoadingTracks || (featuresProgress && (featuresProgress.phase === 'fetching-genres' || featuresProgress.phase === 'estimating')))) {
    const progressPercent = featuresProgress
      ? (featuresProgress.current / featuresProgress.total) * 100
      : 0

    return (
      <div className="bg-[#181818] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#282828] flex items-center justify-center">
            <div className="w-6 h-6 animate-spin rounded-full border-2 border-[#1DB954] border-t-transparent" />
          </div>
          <div>
            <h2 className="font-bold text-white">Preparing your library</h2>
            <p className="text-sm text-[#a7a7a7]">
              {featuresProgress?.phase === 'fetching-genres'
                ? 'Fetching artist genres...'
                : featuresProgress?.phase === 'estimating'
                  ? `Analyzing ${featuresProgress.current} of ${featuresProgress.total} songs`
                  : 'Loading your liked songs...'}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-[#282828] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1DB954] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    )
  }

  // Audio features failed — show error with retry
  if (featuresProgress?.phase === 'error') {
    return (
      <div className="bg-[#181818] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#e91429]/20 flex items-center justify-center">
            <span className="text-[#e91429] text-xl">!</span>
          </div>
          <div>
            <h2 className="font-bold text-white">Couldn&apos;t analyze your library</h2>
            <p className="text-sm text-[#a7a7a7]">
              {featuresProgress.error || 'Failed to analyze your music library.'}
            </p>
          </div>
        </div>
        <Button
          onClick={retryFailed}
          className="w-full bg-[#282828] hover:bg-[#383838] text-white rounded-full py-4"
        >
          Retry
        </Button>
      </div>
    )
  }

  // Show journey preview if generated
  if (currentJourney) {
    return (
      <div className="space-y-4">
        <ArcPreview journey={currentJourney} />

        {/* Save confirmation */}
        {savedPlaylistUrl && (
          <div className="rounded-lg bg-[#1DB954]/20 p-4 border border-[#1DB954]/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-black" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Saved to Spotify!</p>
              </div>
              <a
                href={savedPlaylistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1DB954] hover:underline text-sm font-medium"
              >
                Open playlist
              </a>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg bg-[#e91429]/20 p-4 border border-[#e91429]/30">
            <p className="text-sm text-[#e91429]">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => onJourneyReady?.(currentJourney)}
            className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full py-6"
          >
            Start Journey
          </Button>
          {!savedPlaylistUrl && (
            <Button
              variant="outline"
              onClick={handleSavePlaylist}
              disabled={isSavingPlaylist}
              className="border-[#727272] text-white hover:bg-[#282828] hover:border-white rounded-full"
            >
              {isSavingPlaylist ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save to Spotify'
              )}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          className="w-full text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full"
          onClick={() => {
            clearJourney()
            setSavedPlaylistUrl(null)
          }}
        >
          Change Settings
        </Button>
      </div>
    )
  }

  // Configuration UI
  const canGenerate = selectedMood && selectedDuration
  const lastRefreshLabel = formatLastRefresh(lastLibraryRefresh)
  const lastRefreshTooltip = formatLastRefreshTooltip(lastLibraryRefresh)

  return (
    <div className="space-y-6">
      <MoodPicker
        value={selectedMood}
        onChange={handleMoodChange}
        disabled={isGenerating}
      />

      {selectedMood && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#a7a7a7]">Optional: narrow by genre</p>
            {selectedGenres.length > 0 && (
              <button
                type="button"
                onClick={clearGenres}
                className="text-[11px] text-[#6a6a6a] hover:text-[#a7a7a7] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {availableGenres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => {
                const isSelected = selectedGenres.includes(genre)
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs transition-colors',
                      isSelected
                        ? 'bg-[#1DB954] text-black'
                        : 'bg-[#202020] text-[#cfcfcf] hover:bg-[#2a2a2a]'
                    )}
                  >
                    {formatGenreLabel(genre)}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-[11px] text-[#5f5f5f]">
              Genres will appear after your library is analyzed.
            </p>
          )}
          {usingFallbackGenres && (
            <p className="text-[11px] text-[#5f5f5f]">
              Using common genres until your library finishes analysis.
            </p>
          )}
        </div>
      )}

      <DurationPicker
        value={selectedDuration}
        onChange={handleDurationChange}
        disabled={isGenerating}
      />

      {error && (
        <div className="rounded-lg bg-[#e91429]/20 p-4 border border-[#e91429]/30">
          <p className="text-sm text-[#e91429]">{error}</p>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full py-6 text-lg disabled:bg-[#282828] disabled:text-[#6a6a6a]"
      >
        {isGenerating ? (
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            <span>{generationPhase || 'Creating your journey...'}</span>
          </div>
        ) : (
          'Create Journey'
        )}
      </Button>

      {!canGenerate && !isGenerating && (
        <p className="text-sm text-center text-[#6a6a6a]">
          Select a mood and duration to create your journey
        </p>
      )}

      <button
        type="button"
        onClick={handleRefreshLibrary}
        disabled={isGenerating}
        className="w-full text-xs text-[#6a6a6a] hover:text-[#a7a7a7] transition-colors disabled:opacity-50"
      >
        Refresh library
      </button>
      <p className="text-[11px] text-center text-[#5f5f5f]">
        <span title={lastRefreshTooltip}>Last refresh: {lastRefreshLabel}</span>
      </p>
    </div>
  )
}

function formatLastRefresh(timestamp: number | null): string {
  if (!timestamp) return 'Never'
  const diffMs = Date.now() - timestamp
  if (diffMs < 60 * 1000) return 'Just now'
  const minutes = Math.floor(diffMs / (60 * 1000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatLastRefreshTooltip(timestamp: number | null): string {
  if (!timestamp) return 'No refresh recorded yet'
  return new Date(timestamp).toLocaleString()
}

function formatGenreLabel(genre: string): string {
  return genre
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function CheckIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
