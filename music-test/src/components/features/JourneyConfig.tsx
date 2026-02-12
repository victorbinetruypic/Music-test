'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { MoodPicker } from './MoodPicker'
import { DurationPicker } from './DurationPicker'
import { ArcPreview } from './ArcVisualization'
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
import type { Track, Journey, Mood, Duration } from '@/types'

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
  const loadPrefsFromStorage = usePrefsStore((s) => s.loadFromStorage)
  const prefsLoaded = usePrefsStore((s) => s.isLoaded)

  // Audio features
  const { progress: featuresProgress, fetchFeatures } = useAudioFeatures()

  // Discovery tracking
  const discoveryHistory = usePrefsStore((s) => s.discoveryHistory)

  // Local state
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(false)
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  const [savedPlaylistUrl, setSavedPlaylistUrl] = useState<string | null>(null)
  const [generationPhase, setGenerationPhase] = useState<string | null>(null)
  const generatingRef = useRef(false)

  // Load preferences on mount
  useEffect(() => {
    if (!prefsLoaded) {
      loadPrefsFromStorage()
    }
  }, [prefsLoaded, loadPrefsFromStorage])

  // Set defaults from last session
  useEffect(() => {
    if (prefsLoaded && !selectedMood && lastMood) {
      setSelectedMood(lastMood)
    }
    if (prefsLoaded && !selectedDuration && lastDuration) {
      setSelectedDuration(lastDuration)
    }
  }, [prefsLoaded, lastMood, lastDuration, selectedMood, selectedDuration, setSelectedMood, setSelectedDuration])

  // Load tracks and features
  const loadTracksAndFeatures = useCallback(async (): Promise<void> => {
    if (!spotifyClient) return

    setIsLoadingTracks(true)
    setError(null)

    try {
      // Sample random pages from the library instead of loading everything.
      // A journey only needs a diverse pool — 500 tracks is more than enough.
      const limit = 50
      const totalPages = Math.ceil(likedSongsCount / limit)
      const MAX_SAMPLE_TRACKS = 500
      const pagesToFetch = Math.min(totalPages, Math.ceil(MAX_SAMPLE_TRACKS / limit))

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

      setTracks(allTracks)

      // Fetch audio features
      await fetchFeatures(allTracks, spotifyClient)

      setIsLoadingTracks(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks')
      setIsLoadingTracks(false)
    }
  }, [spotifyClient, likedSongsCount, fetchFeatures, setError])

  // Load tracks when component mounts
  useEffect(() => {
    if (spotifyClient && tracks.length === 0 && !isLoadingTracks) {
      loadTracksAndFeatures()
    }
  }, [spotifyClient, tracks.length, isLoadingTracks, loadTracksAndFeatures])

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

  // Generate journey
  const handleGenerate = useCallback(async (): Promise<void> => {
    if (!selectedMood || !selectedDuration || !featuresProgress || featuresProgress.phase !== 'done' || !spotifyClient) {
      return
    }

    // Prevent concurrent generation (double-click / rapid re-trigger)
    if (generatingRef.current) return
    generatingRef.current = true

    setIsGenerating(true)
    setError(null)
    setGenerationPhase('Loading your library...')

    try {
      // Get cached features
      const { getAllCachedFeatures } = await import('@/lib/storage')
      const cachedFeatures = await getAllCachedFeatures()

      // Combine tracks with features
      const featuresMap = createFeaturesMap(cachedFeatures)
      const tracksWithFeatures = combineTracksWithFeatures(tracks, featuresMap)

      // Compute skip penalties for frequency reduction (Story 4.4)
      const skipPenalties = new Map<string, number>()
      const trackIds = new Set(tracks.map((t) => t.id))
      for (const trackId of trackIds) {
        const penalty = calculatePenaltyScore(trackId, skipData)
        if (penalty > 0) {
          skipPenalties.set(trackId, penalty)
        }
      }

      // Calculate how many discoveries to fetch
      const avgSongDuration = 3.5
      const durationMinutes = selectedDuration === 'open-ended' ? 180 : selectedDuration
      const estimatedTracks = Math.round(durationMinutes / avgSongDuration)
      const discoveryCount = Math.max(2, Math.floor(estimatedTracks * 0.2))

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
        allLikedTracks: tracks,
        recentlyPlayedIds,
        mood: selectedMood,
        featuresMap,
        count: 2,
      })

      // Use mood-filtered tracks as seeds for better recommendations
      const moodMatchedTracks = filterTracksByMood(tracksWithFeatures, selectedMood)

      // Fetch discovery tracks (failure is non-fatal — journey works without them)
      const { tracks: discoveryTracks, error: discoveryError } = await fetchDiscoveryTracks(
        spotifyClient,
        {
          seedTracks: moodMatchedTracks.slice(0, 20),
          mood: selectedMood,
          count: discoveryCount,
          excludeTrackIds: excludeIds,
        }
      )
      if (discoveryError) {
        console.warn('Discovery fetch degraded:', discoveryError)
      }

      setGenerationPhase('Creating journey...')

      // Generate journey with discoveries and gems
      const result = generateJourney({
        tracks: tracksWithFeatures,
        mood: selectedMood,
        duration: selectedDuration,
        excludedTrackIds: exclusions,
        skipPenalties,
        discoveryTracks: discoveryTracks.length > 0 ? discoveryTracks : undefined,
        forgottenGems: gems.length > 0 ? gems : undefined,
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
  }, [selectedMood, selectedDuration, featuresProgress, tracks, exclusions, skipData, discoveryHistory, spotifyClient, setIsGenerating, setError, setJourney, onJourneyReady])

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

  // Loading state
  if (isLoadingTracks || (featuresProgress && featuresProgress.phase === 'fetching')) {
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
              {featuresProgress
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
  const canGenerate = selectedMood && selectedDuration && featuresProgress?.phase === 'done'

  return (
    <div className="space-y-6">
      <MoodPicker
        value={selectedMood}
        onChange={handleMoodChange}
        disabled={isGenerating}
      />

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
    </div>
  )
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
