'use client'

import { useEffect, useState, useCallback } from 'react'

import { Button } from '@/components/ui/button'
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
    <div className="min-h-screen flex flex-col">
      {/* Hero Section with gradient */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1DB954]/30 via-[#121212] to-black pointer-events-none" />

        {/* Animated background circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1DB954]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1DB954]/5 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Logo/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg shadow-[#1DB954]/25">
              <WaveformIcon className="w-10 h-10 text-black" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
            Music Journey
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-[#a7a7a7] mb-8 max-w-lg mx-auto">
            Transform your liked songs into intentional listening experiences
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <span className="px-4 py-2 rounded-full bg-[#282828] text-sm text-[#a7a7a7]">
              Emotional Arcs
            </span>
            <span className="px-4 py-2 rounded-full bg-[#282828] text-sm text-[#a7a7a7]">
              Smart Sequencing
            </span>
            <span className="px-4 py-2 rounded-full bg-[#282828] text-sm text-[#a7a7a7]">
              Your Music, Elevated
            </span>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={handleConnect}
            disabled={isLoggingIn}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-8 py-6 text-lg rounded-full transition-all hover:scale-105 shadow-lg shadow-[#1DB954]/25"
          >
            {isLoggingIn ? (
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <SpotifyIcon className="w-6 h-6" />
                <span>Continue with Spotify</span>
              </div>
            )}
          </Button>

          {/* Terms text */}
          <p className="mt-6 text-sm text-[#6a6a6a]">
            Connect your Spotify account to get started
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-16 bg-[#121212]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<LibraryIcon className="w-8 h-8" />}
              title="Your Library"
              description="We analyze your liked songs to understand your taste"
            />
            <FeatureCard
              icon={<WaveIcon className="w-8 h-8" />}
              title="Choose a Mood"
              description="Pick how you want to feel during your listening session"
            />
            <FeatureCard
              icon={<PlayIcon className="w-8 h-8" />}
              title="Experience"
              description="Enjoy a curated journey with intentional energy flow"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#282828]">
        <div className="max-w-4xl mx-auto text-center text-sm text-[#6a6a6a]">
          <p>Built for music lovers. Powered by Spotify.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}): React.ReactElement {
  return (
    <div className="bg-[#181818] rounded-lg p-6 text-center hover:bg-[#282828] transition-colors">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#282828] flex items-center justify-center text-[#1DB954]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-[#a7a7a7] text-sm">{description}</p>
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

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-6 w-16 h-16 mx-auto rounded-full bg-[#1DB954] flex items-center justify-center animate-pulse">
            <SpotifyIcon className="w-8 h-8 text-black" />
          </div>
          <div className="mb-4 h-6 w-6 animate-spin rounded-full border-2 border-[#1DB954] border-t-transparent mx-auto" />
          <p className="text-[#a7a7a7]">Loading your library...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#181818] rounded-xl p-8 text-center">
          <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-[#e91429]/20 flex items-center justify-center">
            <ErrorIcon className="w-8 h-8 text-[#e91429]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-[#a7a7a7] mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={fetchUserData}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full px-6"
            >
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="border-[#727272] text-white hover:bg-[#282828] hover:border-white rounded-full px-6"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const MIN_SONGS_FOR_JOURNEYS = 50
  const hasEnoughSongs = user?.likedSongsCount !== null && user?.likedSongsCount !== undefined && user.likedSongsCount >= MIN_SONGS_FOR_JOURNEYS

  const handleJourneyReady = (journey: Journey): void => {
    setViewState('playback')
  }

  const handleExitPlayback = (): void => {
    saveInterruptedJourney()
    clearJourney()
    setViewState('config')
  }

  const handleJourneyComplete = (): void => {
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
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-to-b from-black to-transparent px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={handleExitPlayback}
              className="flex items-center gap-2 text-[#a7a7a7] hover:text-white transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="text-sm text-[#a7a7a7]">Now Playing</div>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </header>

        <div className="px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <PlaybackView
              onExit={handleExitPlayback}
              onComplete={handleJourneyComplete}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show journey configuration when library is ready
  if (hasEnoughSongs && user?.likedSongsCount) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-[#282828]">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center">
                <WaveformIcon className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="font-bold">Music Journey</h1>
                <p className="text-xs text-[#a7a7a7]">
                  {user.displayName} · {user.likedSongsCount.toLocaleString()} songs
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full"
            >
              Log out
            </Button>
          </div>
        </header>

        <main className="px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Resume Journey Banner */}
            {interruptedJourney && (
              <div className="bg-gradient-to-r from-[#1DB954]/20 to-transparent rounded-xl p-5 border border-[#1DB954]/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#1DB954] flex items-center justify-center">
                      <PlayIcon className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="font-bold">Continue listening</h3>
                      <p className="text-sm text-[#a7a7a7]">
                        {interruptedJourney.journey.mood.charAt(0).toUpperCase() + interruptedJourney.journey.mood.slice(1)} journey ·
                        Song {interruptedJourney.trackIndex + 1} of {interruptedJourney.journey.tracks.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleResumeJourney}
                      className="bg-white hover:bg-[#f0f0f0] text-black font-semibold rounded-full px-5"
                    >
                      Resume
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleDiscardInterrupted}
                      className="text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Back with Last Journey Summary */}
            {!interruptedJourney && lastJourney && (
              <div className="bg-[#181818] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-[#a7a7a7]">Welcome back!</p>
                    <h3 className="font-bold text-lg">Your last journey</h3>
                  </div>
                  {canQuickStart && (
                    <Button
                      onClick={handleQuickStart}
                      className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full px-5"
                    >
                      Quick Start
                    </Button>
                  )}
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center">
                      <MoodIcon className="w-4 h-4 text-[#1DB954]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{lastJourney.mood}</p>
                      <p className="text-xs text-[#a7a7a7]">Mood</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center">
                      <MusicNoteIcon className="w-4 h-4 text-[#1DB954]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{lastJourney.songCount}</p>
                      <p className="text-xs text-[#a7a7a7]">Songs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center">
                      <ClockIcon className="w-4 h-4 text-[#1DB954]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{lastJourney.duration}m</p>
                      <p className="text-xs text-[#a7a7a7]">Duration</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Title */}
            <div className="pt-2">
              <h2 className="text-2xl font-bold">Create a new journey</h2>
              <p className="text-[#a7a7a7]">Select your mood and duration</p>
            </div>

            {/* Journey Configuration */}
            <JourneyConfig
              likedSongsCount={user.likedSongsCount}
              onJourneyReady={handleJourneyReady}
            />
          </div>
        </main>
      </div>
    )
  }

  // Show library status for users without enough songs
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#181818] rounded-xl p-8 text-center">
        <div className="mb-6 w-16 h-16 mx-auto rounded-full bg-[#1DB954]/20 flex items-center justify-center">
          <SpotifyIcon className="w-8 h-8 text-[#1DB954]" />
        </div>

        {user && (
          <>
            <h1 className="text-2xl font-bold mb-2">Welcome, {user.displayName}!</h1>
            {user.likedSongsCount !== null && (
              <div className="mb-6">
                <p className="text-4xl font-bold text-[#1DB954]">
                  {user.likedSongsCount.toLocaleString()}
                </p>
                <p className="text-[#a7a7a7]">liked songs</p>
              </div>
            )}
          </>
        )}

        {/* Library Requirements Status */}
        <div className="mb-6 p-4 rounded-lg bg-[#282828] border border-[#3e3e3e]">
          <div className="flex items-center justify-center gap-2 text-[#f0b429] mb-2">
            <InfoIcon className="w-5 h-5" />
            <span className="font-semibold">Need more songs</span>
          </div>
          <p className="text-sm text-[#a7a7a7]">
            Like at least {MIN_SONGS_FOR_JOURNEYS} songs on Spotify for the best journey experience.
            You have {user?.likedSongsCount ?? 0} so far.
          </p>
        </div>

        <p className="text-[#a7a7a7] mb-6">
          Head to Spotify to like more of your favorite songs!
        </p>

        <Button
          variant="outline"
          onClick={logout}
          className="border-[#727272] text-white hover:bg-[#282828] hover:border-white rounded-full px-6"
        >
          Disconnect
        </Button>
      </div>
    </div>
  )
}

// Icons
function SpotifyIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function WaveformIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <rect x="4" y="8" width="2" height="8" rx="1" />
      <rect x="8" y="5" width="2" height="14" rx="1" />
      <rect x="12" y="2" width="2" height="20" rx="1" />
      <rect x="16" y="6" width="2" height="12" rx="1" />
      <rect x="20" y="9" width="2" height="6" rx="1" />
    </svg>
  )
}

function LibraryIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function WaveIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11c2 0 2.5 2 5 2s3-2 5-2c1.3 0 1.9.5 2.5 1" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function ChevronLeftIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function MoodIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  )
}

function MusicNoteIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center animate-pulse">
          <WaveformIcon className="w-6 h-6 text-black" />
        </div>
      </div>
    )
  }

  return isAuthenticated ? <AuthenticatedView /> : <LandingView />
}
