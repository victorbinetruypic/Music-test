'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { validateState, exchangeCodeForTokens } from '@/lib/spotify'
import { useAuthStore } from '@/stores/authStore'

function CallbackContent(): React.ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  const setTokens = useAuthStore((s) => s.setTokens)
  const setIsLoggingIn = useAuthStore((s) => s.setIsLoggingIn)

  useEffect(() => {
    async function handleCallback(): Promise<void> {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const errorParam = searchParams.get('error')

      // Handle Spotify errors
      if (errorParam) {
        setError(
          errorParam === 'access_denied'
            ? 'You declined the Spotify connection. Please try again.'
            : `Spotify error: ${errorParam}`
        )
        setIsProcessing(false)
        setIsLoggingIn(false)
        return
      }

      // Validate required parameters
      if (!code || !state) {
        setError('Missing authorization parameters. Please try again.')
        setIsProcessing(false)
        setIsLoggingIn(false)
        return
      }

      // Validate state for CSRF protection
      if (!validateState(state)) {
        setError('Security validation failed. Please try connecting again.')
        setIsProcessing(false)
        setIsLoggingIn(false)
        return
      }

      // Exchange code for tokens
      const { data, error: tokenError } = await exchangeCodeForTokens(code)

      if (tokenError || !data) {
        setError(tokenError || 'Failed to complete authentication. Please try again.')
        setIsProcessing(false)
        setIsLoggingIn(false)
        return
      }

      // Calculate token expiry time
      const expiresAt = Date.now() + data.expiresIn * 1000

      // Store tokens
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt,
      })

      setIsLoggingIn(false)

      // Redirect to main app
      router.replace('/')
    }

    handleCallback()
  }, [searchParams, router, setTokens, setIsLoggingIn])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-xl font-semibold text-red-600">Connection Failed</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <button
            onClick={() => router.replace('/')}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">
          {isProcessing ? 'Connecting to Spotify...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  )
}

function LoadingFallback(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function CallbackPage(): React.ReactElement {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackContent />
    </Suspense>
  )
}
