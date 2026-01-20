'use client'

import { useEffect, useState, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { initiateOAuthFlow } from '@/lib/spotify'
import { useAuthStore } from '@/stores/authStore'
import { useSpotifyClient } from '@/hooks/useSpotifyClient'
import { JourneyConfig } from '@/components/features/JourneyConfig'
import { PlaybackView } from '@/components/features/PlaybackView'
import { useJourneyStore } from '@/stores/journeyStore'
import { usePrefsStore } from '@/stores/prefsStore'
import type { Journey } from '@/types'

type ViewState = 'config' | 'playback'

function LandingView(): React.ReactElement {
  const isLoggingIn = useAuthStore((s) => s.isLoggingIn)
  const setIsLoggingIn = useAuthStore((s) => s.setIsLoggingIn)

  const handleConnect = (): void => {
    setIsLoggingIn(true)
    initiateOAuthFlow()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">Music-test</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Transform your liked songs into intentional journeys.
        </p>
        <Button
          size="lg"
          onClick={handleConnect}
          disabled={isLoggingIn}
          className="gap-2"
        >
          {isLoggingIn ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Connecting...
            </>
          ) : (
            <>
              <SpotifyIcon />
              Connect Spotify
            </>
          )}
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          We&apos;ll use your liked songs to create curated listening experiences.
        </p>
      </div>
    </div>
  )
}

function AuthenticatedView(): React.ReactElement {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const setLikedSongsCount = useAuthStore((s) => s.setLikedSongsCount)
  const setError = useAuthStore((s) => s.setError)
  const logout = useAuthStore((s) => s.logout)
  const error = useAuthStore((s) => s.error)

  const clearJourney = useJourneyStore((s) => s.clearJourney)
  const interruptedJourney = useJourneyStore((s) => s.interruptedJourney)
  const loadInterruptedJourney = useJourneyStore((s) => s.loadInterruptedJourney)
  const resumeJourney = useJourneyStore((s) => s.resumeJourney)
  const clearInterruptedJourney = useJourneyStore((s) => s.clearInterruptedJourney)
  const saveInterruptedJourney = useJourneyStore((s) => s.saveInterruptedJourney)
  const currentJourney = useJourneyStore((s) => s.currentJourney)
  const setSelectedMood = useJourneyStore((s) => s.setSelectedMood)
  const setSelectedDuration = useJourneyStore((s) => s.setSelectedDuration)

  // Prefs store for last journey and quick start
  const lastJourney = usePrefsStore((s) => s.lastJourney)
  const lastMood = usePrefsStore((s) => s.lastMood)
  const lastDuration = usePrefsStore((s) => s.lastDuration)
  const saveCompletedJourney = usePrefsStore((s) => s.saveCompletedJourney)
  const loadPrefsFromStorage = usePrefsStore((s) => s.loadFromStorage)
  const prefsLoaded = usePrefsStore((s) => s.isLoaded)

  const spotifyClient = useSpotifyClient()
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [viewState, setViewState] = useState<ViewState>('config')

  // Load interrupted journey and prefs on mount
  useEffect(() => {
    loadInterruptedJourney()
    if (!prefsLoaded) {
      loadPrefsFromStorage()
    }
  }, [loadInterruptedJourney, loadPrefsFromStorage, prefsLoaded])

  const fetchUserData = useCallback(async (): Promise<void> => {
    if (!spotifyClient || user) return

    setIsLoadingProfile(true)
    setError(null)

    // Fetch profile
    const profileResult = await spotifyClient.getUserProfile()
    if (profileResult.error) {
      setError(profileResult.error)
      setIsLoadingProfile(false)
      return
    }

    if (profileResult.data) {
      setUser({
        id: profileResult.data.id,
        displayName: profileResult.data.displayName,
        likedSongsCount: null,
      })
    }

    // Fetch liked songs count
    const countResult = await spotifyClient.getLikedSongsCount()
    if (countResult.error) {
      setError(countResult.error)
      setIsLoadingProfile(false)
      return
    }

    if (countResult.data !== null) {
      setLikedSongsCount(countResult.data)
    }

    setIsLoadingProfile(false)
  }, [spotifyClient, user, setUser, setLikedSongsCount, setError])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading your library...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="max-w-md p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-600">Something went wrong</h2>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchUserData}>Retry</Button>
            <Button variant="outline" onClick={logout}>Disconnect</Button>
          </div>
        </Card>
      </div>
    )
  }

  const MIN_SONGS_FOR_JOURNEYS = 50
  const hasEnoughSongs = user?.likedSongsCount !== null && user?.likedSongsCount !== undefined && user.likedSongsCount >= MIN_SONGS_FOR_JOURNEYS

  const handleJourneyReady = (journey: Journey): void => {
    setViewState('playback')
  }

  const handleExitPlayback = (): void => {
    // Save current progress before exiting
    saveInterruptedJourney()
    clearJourney()
    setViewState('config')
  }

  const handleJourneyComplete = (): void => {
    // Journey completed - save summary and clear interrupted state
    if (currentJourney) {
      const totalDuration = currentJourney.tracks.reduce((sum, t) => sum + t.durationMs, 0)
      saveCompletedJourney({
        mood: currentJourney.mood,
        duration: Math.round(totalDuration / 60000),
        songCount: currentJourney.tracks.length,
        completedAt: new Date().toISOString(),
      })
    }
    clearInterruptedJourney()
  }

  const handleResumeJourney = (): void => {
    resumeJourney()
    setViewState('playback')
  }

  const handleDiscardInterrupted = (): void => {
    clearInterruptedJourney()
  }

  // Quick Start: use previous settings
  const handleQuickStart = (): void => {
    if (lastMood && lastDuration) {
      setSelectedMood(lastMood)
      setSelectedDuration(lastDuration)
    }
  }

  const canQuickStart = lastMood && lastDuration

  // Show playback view
  if (viewState === 'playback') {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-2xl">
          <PlaybackView
            onExit={handleExitPlayback}
            onComplete={handleJourneyComplete}
          />
        </div>
      </div>
    )
  }

  // Show journey configuration when library is ready
  if (hasEnoughSongs && user?.likedSongsCount) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Create a Journey</h1>
              <p className="text-sm text-muted-foreground">
                {user.displayName} · {user.likedSongsCount.toLocaleString()} songs
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Disconnect
            </Button>
          </div>

          {/* Resume Journey Banner */}
          {interruptedJourney && (
            <Card className="mb-6 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Resume Your Journey</h3>
                  <p className="text-sm text-muted-foreground">
                    {interruptedJourney.journey.mood.charAt(0).toUpperCase() + interruptedJourney.journey.mood.slice(1)} ·
                    Song {interruptedJourney.trackIndex + 1} of {interruptedJourney.journey.tracks.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleResumeJourney}>
                    Resume
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDiscardInterrupted}>
                    Discard
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Welcome Back with Last Journey Summary */}
          {!interruptedJourney && lastJourney && (
            <Card className="mb-6 p-4 bg-muted/50">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back!</p>
                  <h3 className="font-semibold">Your last journey</h3>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-medium capitalize">{lastJourney.mood}</span>
                    <span className="text-muted-foreground"> mood</span>
                  </div>
                  <div>
                    <span className="font-medium">{lastJourney.songCount}</span>
                    <span className="text-muted-foreground"> songs</span>
                  </div>
                  <div>
                    <span className="font-medium">{lastJourney.duration}</span>
                    <span className="text-muted-foreground"> min</span>
                  </div>
                </div>
                {canQuickStart && (
                  <Button onClick={handleQuickStart} className="w-full" size="sm">
                    Quick Start (Same Settings)
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Journey Configuration */}
          <JourneyConfig
            likedSongsCount={user.likedSongsCount}
            onJourneyReady={handleJourneyReady}
          />
        </div>
      </div>
    )
  }

  // Show library status for users without enough songs
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="max-w-md p-6 text-center">
        <div className="mb-4 flex items-center justify-center gap-2 text-green-600">
          <CheckIcon />
          <span className="text-sm font-medium">Connected to Spotify</span>
        </div>
        {user && (
          <>
            <h1 className="mb-2 text-2xl font-bold">Welcome, {user.displayName}!</h1>
            {user.likedSongsCount !== null && (
              <p className="mb-4 text-3xl font-bold text-primary">
                {user.likedSongsCount.toLocaleString()}
                <span className="block text-sm font-normal text-muted-foreground">
                  liked songs in your library
                </span>
              </p>
            )}
          </>
        )}

        {/* Library Requirements Status */}
        <div className="mb-6">
          <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
            <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
              <InfoIcon />
              <span className="font-medium">Add more liked songs</span>
            </div>
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-500">
              For the best experience, like at least {MIN_SONGS_FOR_JOURNEYS} songs on Spotify.
              You have {user?.likedSongsCount ?? 0} so far.
            </p>
          </div>
        </div>

        <p className="mb-6 text-muted-foreground">
          You can still explore, but journeys work best with more variety.
        </p>
        <Button variant="outline" onClick={logout} size="sm">
          Disconnect
        </Button>
      </Card>
    </div>
  )
}

function SpotifyIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function CheckIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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

function InfoIcon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export default function Home(): React.ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    loadFromStorage()
    setIsHydrated(true)
  }, [loadFromStorage])

  // Prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return isAuthenticated ? <AuthenticatedView /> : <LandingView />
}
