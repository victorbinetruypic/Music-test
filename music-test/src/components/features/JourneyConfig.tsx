'use client'

import { useState, useCallback, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
} from '@/lib/journey'
import type { Track, Journey, Mood, Duration } from '@/types'
import { Progress } from '@/components/ui/progress'

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

  // Local state
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoadingTracks, setIsLoadingTracks] = useState(false)
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  const [savedPlaylistUrl, setSavedPlaylistUrl] = useState<string | null>(null)

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
      // Fetch all liked songs (paginated)
      const allTracks: Track[] = []
      let offset = 0
      const limit = 50

      while (offset < likedSongsCount) {
        const { data, error: fetchError } = await spotifyClient.getLikedSongs(limit, offset)
        if (fetchError) {
          setError(fetchError)
          setIsLoadingTracks(false)
          return
        }
        if (data) {
          allTracks.push(...data)
        }
        offset += limit

        // Safety check to avoid infinite loop
        if (allTracks.length >= likedSongsCount || !data || data.length < limit) {
          break
        }
      }

      setTracks(allTracks)

      // Fetch audio features
      const features = await fetchFeatures(allTracks, spotifyClient)

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
    if (!selectedMood || !selectedDuration || !featuresProgress || featuresProgress.phase !== 'done') {
      return
    }

    setIsGenerating(true)
    setError(null)

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

      // Generate journey
      const result = generateJourney({
        tracks: tracksWithFeatures,
        mood: selectedMood,
        duration: selectedDuration,
        excludedTrackIds: exclusions,
        skipPenalties,
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
      setIsGenerating(false)
    }
  }, [selectedMood, selectedDuration, featuresProgress, tracks, exclusions, skipData, setIsGenerating, setError, setJourney, onJourneyReady])

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
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Preparing your library...</h2>
        <Progress value={progressPercent} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {featuresProgress
            ? `Analyzing ${featuresProgress.current} of ${featuresProgress.total} songs`
            : 'Loading your liked songs...'}
        </p>
      </Card>
    )
  }

  // Show journey preview if generated
  if (currentJourney) {
    return (
      <div className="space-y-4">
        <ArcPreview journey={currentJourney} />

        {/* Save confirmation */}
        {savedPlaylistUrl && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4" />
              <span>Saved to Spotify!</span>
              <a
                href={savedPlaylistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline ml-auto"
              >
                Open playlist
              </a>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => onJourneyReady?.(currentJourney)} className="flex-1">
            Start Journey
          </Button>
          {!savedPlaylistUrl && (
            <Button
              variant="outline"
              onClick={handleSavePlaylist}
              disabled={isSavingPlaylist}
            >
              {isSavingPlaylist ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                'Save to Spotify'
              )}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          className="w-full"
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
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            Generating...
          </>
        ) : (
          'Create Journey'
        )}
      </Button>

      {!canGenerate && !isGenerating && (
        <p className="text-sm text-center text-muted-foreground">
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
