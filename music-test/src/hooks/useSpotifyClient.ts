import { useMemo, useCallback } from 'react'

import { RealSpotifyClient } from '@/lib/spotify'
import { refreshAccessToken } from '@/lib/spotify/auth'
import { useAuthStore } from '@/stores/authStore'

export function useSpotifyClient(): RealSpotifyClient | null {
  const tokens = useAuthStore((s) => s.tokens)
  const setTokens = useAuthStore((s) => s.setTokens)

  const handleTokenRefresh = useCallback(async (): Promise<string | null> => {
    if (!tokens?.refreshToken) return null

    const { data, error } = await refreshAccessToken(tokens.refreshToken)

    if (error || !data) {
      return null
    }

    const newExpiresAt = Date.now() + data.expiresIn * 1000
    setTokens({
      accessToken: data.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: newExpiresAt,
    })

    return data.accessToken
  }, [tokens, setTokens])

  const client = useMemo(() => {
    if (!tokens?.accessToken) return null
    return new RealSpotifyClient(tokens.accessToken, handleTokenRefresh)
  }, [tokens?.accessToken, handleTokenRefresh])

  return client
}
