'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { useAuthStore } from '@/stores/authStore'
import { WaveformIcon } from '@/components/icons'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LandingView } from '@/components/views/LandingView'
import { AuthenticatedView } from '@/components/views/AuthenticatedView'
import { DemoConfigView } from '@/components/views/DemoConfigView'
import { DemoPlaybackView } from '@/components/views/DemoPlaybackView'

function HomeContent(): React.ReactElement {
  const searchParams = useSearchParams()
  const demoMode = searchParams.get('demo')

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage)
  const refreshTokenIfNeeded = useAuthStore((s) => s.refreshTokenIfNeeded)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    loadFromStorage()
    setIsHydrated(true)
  }, [loadFromStorage])

  // Proactive token refresh — check every 60s, refresh 5 min before expiry
  useEffect(() => {
    if (!isAuthenticated) return
    const interval = setInterval(() => refreshTokenIfNeeded(), 60_000)
    return () => clearInterval(interval)
  }, [isAuthenticated, refreshTokenIfNeeded])

  if (!isHydrated) {
    return <LoadingFallback />
  }

  // Demo mode views
  if (demoMode === 'config') return <DemoConfigView />
  if (demoMode === 'playback') return <DemoPlaybackView />

  return isAuthenticated ? <AuthenticatedView /> : <LandingView />
}

function LoadingFallback(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center animate-pulse">
        <WaveformIcon className="w-6 h-6 text-black" />
      </div>
    </div>
  )
}

export default function Home(): React.ReactElement {
  return (
    <ErrorBoundary fallbackTitle="App Error" fallbackMessage="Something went wrong. Please refresh the page.">
      <Suspense fallback={<LoadingFallback />}>
        <HomeContent />
      </Suspense>
    </ErrorBoundary>
  )
}
