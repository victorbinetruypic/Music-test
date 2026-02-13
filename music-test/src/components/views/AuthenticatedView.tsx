'use client'

import { useEffect, useState, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { JourneyConfig } from '@/components/features/JourneyConfig'
import { PlaybackView } from '@/components/features/PlaybackView'
import { useAuthStore } from '@/stores/authStore'
import { useJourneyStore } from '@/stores/journeyStore'
import { usePlayerStore } from '@/stores/playerStore'
import { usePrefsStore } from '@/stores/prefsStore'
import { useSpotifyClient } from '@/hooks/useSpotifyClient'
import type { Journey } from '@/types'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { saveJourneyToHistory } from '@/lib/storage'
import {
  SpotifyIcon, WaveformIcon, ErrorIcon, InfoIcon,
  ChevronLeftIcon, PlayIcon, MoodIcon, MusicNoteIcon, ClockIcon,
} from '@/components/icons'

type ViewState = 'config' | 'playback'

export function AuthenticatedView(): React.ReactElement {
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

  const lastJourney = usePrefsStore((s) => s.lastJourney)
  const lastMood = usePrefsStore((s) => s.lastMood)
  const lastDuration = usePrefsStore((s) => s.lastDuration)
  const saveCompletedJourney = usePrefsStore((s) => s.saveCompletedJourney)
  const loadPrefsFromStorage = usePrefsStore((s) => s.loadFromStorage)
  const prefsLoaded = usePrefsStore((s) => s.isLoaded)

  const spotifyClient = useSpotifyClient()
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [viewState, setViewState] = useState<ViewState>('config')

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

    // Check sessionStorage cache first to avoid API calls on refresh
    const cachedProfile = sessionStorage.getItem('spotify_profile')
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile)
        setUser({
          id: parsed.id,
          displayName: parsed.displayName,
          likedSongsCount: parsed.likedSongsCount,
        })
        if (parsed.likedSongsCount !== null) {
          setLikedSongsCount(parsed.likedSongsCount)
        }
        setIsLoadingProfile(false)
        return
      } catch {
        // Corrupted cache, fall through to API
      }
    }

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

    const countResult = await spotifyClient.getLikedSongsCount()
    if (countResult.error) {
      setError(countResult.error)
      setIsLoadingProfile(false)
      return
    }

    if (countResult.data !== null) {
      setLikedSongsCount(countResult.data)
    }

    // Cache for session to avoid repeat API calls on refresh
    if (profileResult.data && countResult.data !== null) {
      sessionStorage.setItem('spotify_profile', JSON.stringify({
        id: profileResult.data.id,
        displayName: profileResult.data.displayName,
        likedSongsCount: countResult.data,
      }))
    }

    setIsLoadingProfile(false)
  }, [spotifyClient, user, setUser, setLikedSongsCount, setError])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

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
            <Button onClick={fetchUserData} className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full px-6">Try again</Button>
            <Button variant="outline" onClick={logout} className="border-[#727272] text-white hover:bg-[#282828] hover:border-white rounded-full px-6">Disconnect</Button>
          </div>
        </div>
      </div>
    )
  }

  const MIN_SONGS_FOR_JOURNEYS = 50
  const hasEnoughSongs = user?.likedSongsCount !== null && user?.likedSongsCount !== undefined && user.likedSongsCount >= MIN_SONGS_FOR_JOURNEYS

  const handleJourneyReady = (_journey: Journey): void => {
    setViewState('playback')
  }

  const handleExitPlayback = (): void => {
    saveInterruptedJourney()
    clearJourney()
    // Reset player state so next journey shows "Ready to Play" screen
    usePlayerStore.getState().setPlaybackState('idle')
    setViewState('config')
  }

  const handleJourneyComplete = async (): Promise<void> => {
    if (currentJourney) {
      const totalDuration = currentJourney.tracks.reduce((sum, t) => sum + t.durationMs, 0)
      const completedAt = new Date().toISOString()
      const summary = {
        mood: currentJourney.mood,
        duration: Math.round(totalDuration / 60000),
        songCount: currentJourney.tracks.length,
        completedAt,
      }
      saveCompletedJourney(summary)
      try {
        await saveJourneyToHistory({
          id: currentJourney.id,
          mood: currentJourney.mood,
          duration: summary.duration,
          songCount: summary.songCount,
          completedAt,
          trackIds: currentJourney.tracks.map((t) => t.id),
        })
      } catch {
        // Non-fatal: history is best-effort
      }
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

  const handleQuickStart = (): void => {
    if (lastMood && lastDuration) {
      setSelectedMood(lastMood)
      setSelectedDuration(lastDuration)
    }
  }

  const canQuickStart = lastMood && lastDuration

  if (viewState === 'playback') {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 bg-gradient-to-b from-black to-transparent px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={handleExitPlayback} className="flex items-center gap-2 text-[#a7a7a7] hover:text-white transition-colors">
              <ChevronLeftIcon className="w-6 h-6" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="text-sm text-[#a7a7a7]">Now Playing</div>
            <div className="w-16" />
          </div>
        </header>
        <div className="px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <ErrorBoundary fallbackTitle="Playback Error" fallbackMessage="Something went wrong with playback. Please go back and try again." onReset={handleExitPlayback}>
              <PlaybackView onExit={handleExitPlayback} onComplete={handleJourneyComplete} />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    )
  }

  if (hasEnoughSongs && user?.likedSongsCount) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-[#282828]">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center">
                <WaveformIcon className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="font-bold">Music Journey</h1>
                <p className="text-xs text-[#a7a7a7]">{user.displayName} · {user.likedSongsCount.toLocaleString()} songs</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full">Log out</Button>
          </div>
        </header>

        <main className="px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
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
                    <Button onClick={handleResumeJourney} className="bg-white hover:bg-[#f0f0f0] text-black font-semibold rounded-full px-5">Resume</Button>
                    <Button variant="ghost" onClick={handleDiscardInterrupted} className="text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full">Dismiss</Button>
                  </div>
                </div>
              </div>
            )}

            {!interruptedJourney && lastJourney && (
              <div className="bg-[#181818] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-[#a7a7a7]">Welcome back!</p>
                    <h3 className="font-bold text-lg">Your last journey</h3>
                  </div>
                  {canQuickStart && (
                    <Button onClick={handleQuickStart} className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full px-5">Quick Start</Button>
                  )}
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center"><MoodIcon className="w-4 h-4 text-[#1DB954]" /></div>
                    <div><p className="text-sm font-medium capitalize">{lastJourney.mood}</p><p className="text-xs text-[#a7a7a7]">Mood</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center"><MusicNoteIcon className="w-4 h-4 text-[#1DB954]" /></div>
                    <div><p className="text-sm font-medium">{lastJourney.songCount}</p><p className="text-xs text-[#a7a7a7]">Songs</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#282828] flex items-center justify-center"><ClockIcon className="w-4 h-4 text-[#1DB954]" /></div>
                    <div><p className="text-sm font-medium">{lastJourney.duration}m</p><p className="text-xs text-[#a7a7a7]">Duration</p></div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <h2 className="text-2xl font-bold">Create a new journey</h2>
              <p className="text-[#a7a7a7]">Select your mood and duration</p>
            </div>

            <ErrorBoundary fallbackTitle="Journey Error" fallbackMessage="Something went wrong creating your journey. Please try again.">
              <JourneyConfig likedSongsCount={user.likedSongsCount} onJourneyReady={handleJourneyReady} />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    )
  }

  // Not enough songs
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
                <p className="text-4xl font-bold text-[#1DB954]">{user.likedSongsCount.toLocaleString()}</p>
                <p className="text-[#a7a7a7]">liked songs</p>
              </div>
            )}
          </>
        )}
        <div className="mb-6 p-4 rounded-lg bg-[#282828] border border-[#3e3e3e]">
          <div className="flex items-center justify-center gap-2 text-[#f0b429] mb-2">
            <InfoIcon className="w-5 h-5" />
            <span className="font-semibold">Need more songs</span>
          </div>
          <p className="text-sm text-[#a7a7a7]">
            Like at least {MIN_SONGS_FOR_JOURNEYS} songs on Spotify for the best journey experience. You have {user?.likedSongsCount ?? 0} so far.
          </p>
        </div>
        <p className="text-[#a7a7a7] mb-6">Head to Spotify to like more of your favorite songs!</p>
        <Button variant="outline" onClick={logout} className="border-[#727272] text-white hover:bg-[#282828] hover:border-white rounded-full px-6">Disconnect</Button>
      </div>
    </div>
  )
}
