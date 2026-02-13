'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ArcVisualizationCompact } from './ArcVisualization'
import { usePlayer } from '@/hooks/usePlayer'
import { useJourneyStore, getCurrentTrack } from '@/stores/journeyStore'
import { formatTime } from '@/stores/playerStore'

interface PlaybackViewProps {
  onExit?: () => void
  onComplete?: () => void
}

export function PlaybackView({ onExit, onComplete }: PlaybackViewProps): React.ReactElement {
  const currentJourney = useJourneyStore((s) => s.currentJourney)
  const currentTrackIndex = useJourneyStore((s) => s.currentTrackIndex)

  const {
    playbackState,
    isSDKReady,
    isPremium,
    error,
    currentPosition,
    duration,
    volume,
    isJourneyComplete,
    initializePlayer,
    playJourney,
    togglePlayback,
    skip,
    markNotThis,
    seekTo,
    changeVolume,
  } = usePlayer()

  // "Not This" confirmation state
  const [showNotThisConfirm, setShowNotThisConfirm] = useState(false)
  const notThisTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Pause playback when exiting
  const handleExit = useCallback(async () => {
    if (playbackState === 'playing') {
      await togglePlayback()
    }
    onExit?.()
  }, [playbackState, togglePlayback, onExit])

  // Handle "Not This" action
  const handleNotThis = useCallback(async () => {
    await markNotThis()
    setShowNotThisConfirm(true)

    // Clear any existing timeout
    if (notThisTimeoutRef.current) {
      clearTimeout(notThisTimeoutRef.current)
    }

    // Auto-hide confirmation after 2 seconds
    notThisTimeoutRef.current = setTimeout(() => {
      setShowNotThisConfirm(false)
      notThisTimeoutRef.current = null
    }, 2000)
  }, [markNotThis])

  // Cleanup "Not This" timeout on unmount
  useEffect(() => {
    return () => {
      if (notThisTimeoutRef.current) {
        clearTimeout(notThisTimeoutRef.current)
      }
    }
  }, [])

  const currentTrack = getCurrentTrack(currentJourney, currentTrackIndex)

  // Debounced seek state
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [seekingPosition, setSeekingPosition] = useState<number | null>(null)

  // Debounced seek handler - waits 150ms after user stops dragging
  const handleSeek = useCallback(
    (position: number) => {
      setSeekingPosition(position)

      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
      }

      seekTimeoutRef.current = setTimeout(() => {
        seekTo(position)
        setSeekingPosition(null)
        seekTimeoutRef.current = null
      }, 150)
    },
    [seekTo]
  )

  // Cleanup seek timeout on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
      }
    }
  }, [])

  // Initialize player on mount
  useEffect(() => {
    initializePlayer()
  }, [initializePlayer])

  // Handle journey completion
  useEffect(() => {
    if (isJourneyComplete) {
      onComplete?.()
    }
  }, [isJourneyComplete, onComplete])

  // Start playback when ready
  const handleStartPlayback = useCallback(() => {
    playJourney(currentTrackIndex)
  }, [playJourney, currentTrackIndex])

  // Premium required view
  if (isPremium === false) {
    return (
      <div className="bg-[#181818] rounded-xl p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#f0b429]/20 flex items-center justify-center">
          <PremiumIcon className="w-8 h-8 text-[#f0b429]" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Spotify Premium Required</h2>
          <p className="text-[#a7a7a7]">
            In-browser playback requires a Spotify Premium subscription.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {currentJourney && (
            <Button
              onClick={() => {
                window.open(`https://open.spotify.com/track/${currentJourney.tracks[0].id}`, '_blank')
              }}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full"
            >
              Open in Spotify App
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleExit}
            className="text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Loading/initializing view
  if (!isSDKReady || playbackState === 'loading') {
    return (
      <div className="bg-[#181818] rounded-xl p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center animate-pulse">
          <SpotifyIcon className="w-6 h-6 text-black" />
        </div>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1DB954] border-t-transparent mx-auto" />
        <p className="text-[#a7a7a7]">
          {!isSDKReady ? 'Connecting to Spotify...' : 'Starting playback...'}
        </p>
      </div>
    )
  }

  // Error view
  if (playbackState === 'error' && error) {
    return (
      <div className="bg-[#181818] rounded-xl p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#e91429]/20 flex items-center justify-center">
          <ErrorIcon className="w-8 h-8 text-[#e91429]" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Playback Error</h2>
          <p className="text-[#a7a7a7]">{error}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleStartPlayback}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full px-6"
          >
            Retry
          </Button>
          <Button
            variant="ghost"
            onClick={handleExit}
            className="text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Idle - ready to play
  if (playbackState === 'idle' && !isJourneyComplete) {
    return (
      <div className="space-y-6">
        {currentJourney && (
          <ArcVisualizationCompact journey={currentJourney} currentTrackIndex={-1} />
        )}
        <div className="bg-[#181818] rounded-xl p-8 text-center space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Ready to Play</h2>
            <p className="text-[#a7a7a7]">
              Your journey is ready. Press play to begin.
            </p>
          </div>
          <Button
            onClick={handleStartPlayback}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full px-8 py-6 text-lg hover:scale-105 transition-transform"
          >
            <PlayIcon className="w-6 h-6 mr-2" />
            Start Journey
          </Button>
        </div>
      </div>
    )
  }

  // Journey complete view
  if (isJourneyComplete && currentJourney) {
    const totalDuration = currentJourney.tracks.reduce((sum, t) => sum + t.durationMs, 0)
    const durationMinutes = Math.round(totalDuration / 60000)

    return (
      <div className="bg-[#181818] rounded-xl p-8 text-center space-y-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center">
          <CheckIcon className="w-10 h-10 text-black" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Journey Complete!</h2>
          <p className="text-[#a7a7a7]">
            You listened to {currentJourney.tracks.length} songs over {durationMinutes} minutes.
          </p>
        </div>

        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#1DB954]">{currentJourney.tracks.length}</div>
            <div className="text-xs text-[#a7a7a7] uppercase tracking-wide">Songs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#1DB954]">{durationMinutes}</div>
            <div className="text-xs text-[#a7a7a7] uppercase tracking-wide">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#1DB954] capitalize">{currentJourney.mood}</div>
            <div className="text-xs text-[#a7a7a7] uppercase tracking-wide">Mood</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleExit}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full py-6"
          >
            Start New Journey
          </Button>
          <Button
            variant="ghost"
            onClick={handleExit}
            className="text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full"
          >
            Done
          </Button>
        </div>
      </div>
    )
  }

  // Active playback view
  return (
    <div className="space-y-6">
      {/* "Not This" confirmation toast */}
      {showNotThisConfirm && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-full bg-[#1DB954] text-black px-6 py-3 text-sm font-semibold shadow-lg">
            Got it, removed from future journeys
          </div>
        </div>
      )}

      {/* Arc progress */}
      {currentJourney && (
        <ArcVisualizationCompact journey={currentJourney} currentTrackIndex={currentTrackIndex} />
      )}

      {/* Now playing card */}
      <div className="bg-[#181818] rounded-xl p-6 space-y-6">
        {/* Track info */}
        <div className="text-center">
          {currentTrack ? (
            <>
              <h3 className="font-bold text-xl text-white truncate">{currentTrack.name}</h3>
              <p className="text-[#a7a7a7] truncate">{currentTrack.artist}</p>
              <p className="text-sm text-[#6a6a6a] truncate">{currentTrack.album}</p>
            </>
          ) : (
            <p className="text-[#a7a7a7]">No track playing</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[seekingPosition ?? currentPosition]}
            max={duration || 100}
            step={1000}
            onValueChange={([value]) => handleSeek(value)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-[#a7a7a7]">
            <span>{formatTime(seekingPosition ?? currentPosition)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayback}
            className="h-16 w-16 rounded-full bg-white hover:bg-[#f0f0f0] hover:scale-105 transition-transform"
          >
            {playbackState === 'playing' ? (
              <PauseIcon className="h-8 w-8 text-black" />
            ) : (
              <PlayIcon className="h-8 w-8 text-black" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={skip}
            className="h-12 w-12 text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full"
          >
            <SkipIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Secondary actions: Not This */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNotThis}
            className="text-[#a7a7a7] hover:text-[#e91429] hover:bg-[#e91429]/10 rounded-full px-4"
          >
            <BanIcon className="h-4 w-4 mr-2" />
            Not This
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-3 px-4">
          <VolumeIcon className="h-5 w-5 text-[#a7a7a7]" />
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={([value]) => changeVolume(value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Exit button */}
      <Button
        variant="ghost"
        className="w-full text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full"
        onClick={handleExit}
      >
        Exit Journey
      </Button>
    </div>
  )
}

// Icons
function PlayIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function SkipIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <polygon points="5 4 15 12 5 20 5 4" />
      <rect x="15" y="4" width="4" height="16" />
    </svg>
  )
}

function VolumeIcon({ className }: { className?: string }): React.ReactElement {
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
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function PremiumIcon({ className }: { className?: string }): React.ReactElement {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }): React.ReactElement {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
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

function BanIcon({ className }: { className?: string }): React.ReactElement {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  )
}

function SpotifyIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}
