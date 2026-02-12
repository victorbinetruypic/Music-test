// Spotify OAuth Utilities

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'

// Required scopes for Music-test functionality
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-read-playback-state',
  'user-modify-playback-state',
  'streaming',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-recently-played',
].join(' ')

const STATE_STORAGE_KEY = 'music-test-oauth-state'

/**
 * Generate a random state string for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get the Spotify authorization URL
 * Stores state in sessionStorage for CSRF validation
 */
export function getAuthorizationUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI

  if (!clientId || !redirectUri) {
    throw new Error('Missing Spotify OAuth configuration')
  }

  const state = generateState()
  sessionStorage.setItem(STATE_STORAGE_KEY, state)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    state: state,
    show_dialog: 'false', // Don't show dialog if already authorized
  })

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`
}

/**
 * Validate the OAuth state parameter
 */
export function validateState(returnedState: string): boolean {
  const storedState = sessionStorage.getItem(STATE_STORAGE_KEY)
  sessionStorage.removeItem(STATE_STORAGE_KEY) // Clear after use
  return storedState === returnedState
}

/**
 * Initiate the Spotify OAuth flow
 * Redirects the user to Spotify's authorization page
 */
export function initiateOAuthFlow(): void {
  const url = getAuthorizationUrl()
  window.location.href = url
}

/**
 * Exchange authorization code for tokens (client-side call to API route)
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<{ data: TokenData | null; error: string | null }> {
  try {
    const response = await fetch('/api/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        data: null,
        error: errorData.error || 'Failed to exchange authorization code',
      }
    }

    const data = await response.json()
    return { data, error: null }
  } catch {
    return {
      data: null,
      error: 'Network error during token exchange',
    }
  }
}

export interface TokenData {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ data: { accessToken: string; expiresIn: number } | null; error: string | null }> {
  try {
    const response = await fetch('/api/callback', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        data: null,
        error: errorData.error || 'Failed to refresh token',
      }
    }

    const data = await response.json()
    return {
      data: {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      },
      error: null,
    }
  } catch {
    return {
      data: null,
      error: 'Network error during token refresh',
    }
  }
}
