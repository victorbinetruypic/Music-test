'use client'

import { useCallback, useEffect, useRef } from 'react'

import { usePlayerStore } from '@/stores/playerStore'
import { useJourneyStore, getPhaseForTrackIndex } from '@/stores/journeyStore'
import { useAuthStore } from '@/stores/authStore'
import { usePrefsStore } from '@/stores/prefsStore'
import { RealPlayerService, type PlayerService, type SpotifyPlaybackState } from '@/lib/player'

// Singleton state with proper locking
let playerServiceInstance: PlayerService | null = null
let initializationPromise: Promise<boolean> | null = null
let isInitializing = false

// Get or create player instance with lock
async function getOrCreatePlayer(
  token: string,
  callbacks: Parameters<PlayerService['initialize']>[1]
): Promise<{ instance: PlayerService; isNew: boolean }> {
  // If already initialized, return existing instance
  if (playerServiceInstance) {
    return { instance: playerServiceInstance, isNew: false }
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    await initializationPromise
    if (playerServiceInstance) {
      return { instance: playerServiceInstance, isNew: false }
    }
  }

  // Start new initialization
  isInitializing = true
  const newInstance = new RealPlayerService()

  initializationPromise = newInstance.initialize(token, callbacks)

  try {
    const success = await initializationPromise
    if (success) {
      playerServiceInstance = newInstance
      return { instance: newInstance, isNew: true }
    }
    throw new Error('Failed to initialize player')
  } finally {
    isInitializing = false
    initializationPromise = null
  }
}

// Journey position thresholds for skip tracking
const POSITION_EARLY_THRESHOLD = 0.33 // First third of journey
const POSITION_LATE_THRESHOLD = 0.66 // Last third of journey

// Cleanup player instance
function cleanupPlayer(): void {
  if (playerServiceInstance) {
    playerServiceInstance.disconnect()
    playerServiceInstance = null
  }
  initializationPromise = null
  isInitializing = false
}

export function usePlayer() {
  const tokens = useAuthStore((s) => s.tokens)
  const currentJourney = useJourneyStore((s) => s.currentJourney)
  const currentTrackIndex = useJourneyStore((s) => s.currentTrackIndex)
  const setCurrentTrackIndex = useJourneyStore((s) => s.setCurrentTrackIndex)
  const advanceToNextTrack = useJourneyStore((s) => s.advanceToNextTrack)

  // Prefs store for feedback tracking and persistence
  const recordSkip = usePrefsStore((s) => s.recordSkip)
  const addExclusion = usePrefsStore((s) => s.addExclusion)
  const persistVolume = usePrefsStore((s) => s.setVolume)
  const savedVolume = usePrefsStore((s) => s.volume)

  const playbackState = usePlayerStore((s) => s.playbackState)
  const deviceId = usePlayerStore((s) => s.deviceId)
  const isSDKReady = usePlayerStore((s) => s.isSDKReady)
  const isPremium = usePlayerStore((s) => s.isPremium)
  const error = usePlayerStore((s) => s.error)
  const currentPosition = usePlayerStore((s) => s.currentPosition)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)

  const setPlaybackState = usePlayerStore((s) => s.setPlaybackState)
  const setDeviceId = usePlayerStore((s) => s.setDeviceId)
  const setSDKReady = usePlayerStore((s) => s.setSDKReady)
  const setIsPremium = usePlayerStore((s) => s.setIsPremium)
  const setError = usePlayerStore((s) => s.setError)
  const setPosition = usePlayerStore((s) => s.setPosition)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const resetPlayer = usePlayerStore((s) => s.reset)

  const journeyTracksRef = useRef<string[]>([])
  const mountedRef = useRef(true)

  // Handle state changes from SDK
  const handleStateChange = useCallback(
    (state: SpotifyPlaybackState | null) => {
      // Guard against updates after unmount
      if (!mountedRef.current) return

      if (!state) {
        setPlaybackState('idle')
        return
      }

      setPlaybackState(state.paused ? 'paused' : 'playing')
      setPosition(state.position)
      setDuration(state.duration)

      // Check if track changed by comparing URIs
      if (currentJourney && state.track_window?.current_track) {
        const currentUri = state.track_window.current_track.uri
        const expectedTrackIndex = journeyTracksRef.current.indexOf(currentUri)

        if (expectedTrackIndex !== -1 && expectedTrackIndex !== currentTrackIndex) {
          setCurrentTrackIndex(expectedTrackIndex)
        }
      }
    },
    [currentJourney, currentTrackIndex, setCurrentTrackIndex, setPlaybackState, setPosition, setDuration]
  )

  // Initialize player
  const initializePlayer = useCallback(async () => {
    if (!tokens?.accessToken || isSDKReady || isInitializing) return

    setPlaybackState('loading')

    try {
      const { isNew } = await getOrCreatePlayer(tokens.accessToken, {
        onReady: (id) => {
          if (!mountedRef.current) return
          setDeviceId(id)
          setSDKReady(true)
          setPlaybackState('idle')
          setIsPremium(true)
        },
        onNotReady: () => {
          if (!mountedRef.current) return
          setSDKReady(false)
        },
        onPlayerStateChanged: handleStateChange,
        onError: (err) => {
          if (!mountedRef.current) return
          if (err.message.includes('Premium')) {
            setIsPremium(false)
            setError('Spotify Premium is required for in-browser playback')
          } else {
            setError(err.message)
          }
          setPlaybackState('error')
        },
        onAutoPlayFailed: () => {
          if (!mountedRef.current) return
          setError('Autoplay was blocked. Click play to start.')
        },
      })

      // If we're reusing an existing instance, update SDK ready state
      if (!isNew && playerServiceInstance) {
        setSDKReady(true)
        setPlaybackState('idle')
      }
    } catch (err) {
      if (!mountedRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to initialize player')
      setPlaybackState('error')
    }
  }, [tokens?.accessToken, isSDKReady, handleStateChange, setDeviceId, setSDKReady, setPlaybackState, setIsPremium, setError])

  // Play journey
  const playJourney = useCallback(
    async (startIndex: number = 0) => {
      if (!currentJourney || !playerServiceInstance) {
        setError('Player not ready')
        return
      }

      setPlaybackState('loading')
      const uris = currentJourney.tracks.map((t) => t.uri)
      journeyTracksRef.current = uris

      const { error: playError } = await playerServiceInstance.play(uris, startIndex)

      if (!mountedRef.current) return

      if (playError) {
        setError(playError)
        setPlaybackState('error')
      } else {
        setCurrentTrackIndex(startIndex)
      }
    },
    [currentJourney, setCurrentTrackIndex, setPlaybackState, setError]
  )

  // Playback controls
  const pause = useCallback(async () => {
    if (!playerServiceInstance) return
    const { error: pauseError } = await playerServiceInstance.pause()
    if (pauseError && mountedRef.current) setError(pauseError)
  }, [setError])

  const resume = useCallback(async () => {
    if (!playerServiceInstance) return
    const { error: resumeError } = await playerServiceInstance.resume()
    if (resumeError && mountedRef.current) setError(resumeError)
  }, [setError])

  const togglePlayback = useCallback(async () => {
    if (playbackState === 'playing') {
      await pause()
    } else {
      await resume()
    }
  }, [playbackState, pause, resume])

  const skip = useCallback(async () => {
    if (!playerServiceInstance || !currentJourney) return

    // Bounds check before accessing track
    if (currentTrackIndex < 0 || currentTrackIndex >= currentJourney.tracks.length) {
      return
    }

    // Record skip with context before skipping
    const currentTrack = currentJourney.tracks[currentTrackIndex]
    if (currentTrack) {
      const phaseInfo = getPhaseForTrackIndex(currentJourney, currentTrackIndex)
      const journeyLength = currentJourney.tracks.length
      const positionRatio = currentTrackIndex / journeyLength

      // Determine position: early (0-33%), middle (33-66%), late (66-100%)
      let position: 'early' | 'middle' | 'late' = 'middle'
      if (positionRatio < POSITION_EARLY_THRESHOLD) position = 'early'
      else if (positionRatio > POSITION_LATE_THRESHOLD) position = 'late'

      recordSkip({
        trackId: currentTrack.id,
        phase: phaseInfo?.phase ?? 'build',
        position,
      })
    }

    // Check if we're at the last track
    if (currentTrackIndex >= currentJourney.tracks.length - 1) {
      // Journey complete
      setPlaybackState('idle')
      return
    }

    const { error: skipError } = await playerServiceInstance.skip()
    if (!mountedRef.current) return

    if (skipError) {
      setError(skipError)
    } else {
      advanceToNextTrack()
    }
  }, [currentJourney, currentTrackIndex, advanceToNextTrack, setPlaybackState, setError, recordSkip])

  // Mark a track as "Not This" - permanently exclude from future journeys
  const markNotThis = useCallback(async () => {
    if (!currentJourney) return

    const currentTrack = currentJourney.tracks[currentTrackIndex]
    if (currentTrack) {
      // Add to exclusion list
      addExclusion(currentTrack.id)

      // Skip to next track
      await skip()
    }
  }, [currentJourney, currentTrackIndex, addExclusion, skip])

  const seekTo = useCallback(
    async (positionMs: number) => {
      if (!playerServiceInstance) return
      const { error: seekError } = await playerServiceInstance.seek(positionMs)
      if (seekError && mountedRef.current) setError(seekError)
    },
    [setError]
  )

  const changeVolume = useCallback(
    async (newVolume: number) => {
      if (!playerServiceInstance) return
      const { error: volumeError } = await playerServiceInstance.setVolume(newVolume)
      if (!volumeError && mountedRef.current) {
        setVolume(newVolume)
        persistVolume(newVolume) // Persist to localStorage
      }
    },
    [setVolume, persistVolume]
  )

  // Track mounted state and cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Note: We don't cleanup the player here because it's a singleton
      // that should persist across component remounts. Only cleanup
      // when the user explicitly logs out or the app is closing.
    }
  }, [])

  // Apply saved volume when SDK becomes ready
  useEffect(() => {
    if (isSDKReady && playerServiceInstance && savedVolume !== volume) {
      playerServiceInstance.setVolume(savedVolume)
      setVolume(savedVolume)
    }
    // Only run when SDK becomes ready, not on every volume change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSDKReady])

  // Check if journey is complete
  const isJourneyComplete = currentJourney
    ? currentTrackIndex >= currentJourney.tracks.length - 1 && playbackState === 'idle'
    : false

  return {
    // State
    playbackState,
    deviceId,
    isSDKReady,
    isPremium,
    error,
    currentPosition,
    duration,
    volume,
    isJourneyComplete,

    // Actions
    initializePlayer,
    playJourney,
    pause,
    resume,
    togglePlayback,
    skip,
    markNotThis,
    seekTo,
    changeVolume,
    resetPlayer,
    cleanupPlayer, // Export for logout scenarios
  }
}
