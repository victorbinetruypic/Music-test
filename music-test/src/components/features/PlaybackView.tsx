'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
      <Card className="p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
          <PremiumIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold">Spotify Premium Required</h2>
        <p className="text-muted-foreground">
          In-browser playback requires a Spotify Premium subscription.
        </p>
        <div className="flex flex-col gap-2">
          {currentJourney && (
            <Button
              variant="outline"
              onClick={() => {
                // Open Spotify with the first track
                window.open(`https://open.spotify.com/track/${currentJourney.tracks[0].id}`, '_blank')
              }}
            >
              Open in Spotify App
            </Button>
          )}
          <Button variant="ghost" onClick={onExit}>
            Go Back
          </Button>
        </div>
      </Card>
    )
  }

  // Loading/initializing view
  if (!isSDKReady || playbackState === 'loading') {
    return (
      <Card className="p-6 text-center space-y-4">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">
          {!isSDKReady ? 'Connecting to Spotify...' : 'Starting playback...'}
        </p>
      </Card>
    )
  }

  // Error view
  if (playbackState === 'error' && error) {
    return (
      <Card className="p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
          <ErrorIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold">Playback Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleStartPlayback}>Retry</Button>
          <Button variant="outline" onClick={onExit}>
            Go Back
          </Button>
        </div>
      </Card>
    )
  }

  // Idle - ready to play
  if (playbackState === 'idle' && !isJourneyComplete) {
    return (
      <div className="space-y-6">
        {currentJourney && (
          <ArcVisualizationCompact journey={currentJourney} currentTrackIndex={-1} />
        )}
        <Card className="p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold">Ready to Play</h2>
          <p className="text-muted-foreground">
            Your journey is ready. Press play to begin.
          </p>
          <Button size="lg" onClick={handleStartPlayback} className="gap-2">
            <PlayIcon className="w-5 h-5" />
            Start Journey
          </Button>
        </Card>
      </div>
    )
  }

  // Journey complete view
  if (isJourneyComplete && currentJourney) {
    const totalDuration = currentJourney.tracks.reduce((sum, t) => sum + t.durationMs, 0)
    const durationMinutes = Math.round(totalDuration / 60000)

    return (
      <Card className="p-6 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
          <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Journey Complete!</h2>
          <p className="text-muted-foreground">
            You listened to {currentJourney.tracks.length} songs over {durationMinutes} minutes.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{currentJourney.tracks.length}</div>
            <div className="text-xs text-muted-foreground">Songs</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{durationMinutes}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </div>
          <div>
            <div className="text-2xl font-bold capitalize">{currentJourney.mood}</div>
            <div className="text-xs text-muted-foreground">Mood</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={onExit}>Start New Journey</Button>
          <Button variant="ghost" onClick={onExit}>
            Done
          </Button>
        </div>
      </Card>
    )
  }

  // Active playback view
  return (
    <div className="space-y-4">
      {/* "Not This" confirmation toast */}
      {showNotThisConfirm && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium shadow-lg">
            Got it, removed from future journeys
          </div>
        </div>
      )}

      {/* Arc progress */}
      {currentJourney && (
        <ArcVisualizationCompact journey={currentJourney} currentTrackIndex={currentTrackIndex} />
      )}

      {/* Now playing card */}
      <Card className="p-4 space-y-4">
        {/* Track info */}
        <div className="text-center">
          {currentTrack ? (
            <>
              <h3 className="font-semibold text-lg truncate">{currentTrack.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.album}</p>
            </>
          ) : (
            <p className="text-muted-foreground">No track playing</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <Slider
            value={[seekingPosition ?? currentPosition]}
            max={duration || 100}
            step={1000}
            onValueChange={([value]) => handleSeek(value)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(seekingPosition ?? currentPosition)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayback}
            className="h-14 w-14 rounded-full"
          >
            {playbackState === 'playing' ? (
              <PauseIcon className="h-8 w-8" />
            ) : (
              <PlayIcon className="h-8 w-8" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={skip} className="h-10 w-10">
            <SkipIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Secondary actions: Not This */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNotThis}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <BanIcon className="h-3 w-3 mr-1" />
            Not This
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <VolumeIcon className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={([value]) => changeVolume(value)}
            className="flex-1"
          />
        </div>
      </Card>

      {/* Exit button */}
      <Button variant="ghost" className="w-full" onClick={onExit}>
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
      strokeWidth="2"
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
