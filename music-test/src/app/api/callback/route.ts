import { NextRequest, NextResponse } from 'next/server'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'

/**
 * POST /api/callback
 * Exchange authorization code for access and refresh tokens
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Spotify OAuth configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Spotify token exchange failed:', errorData)
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      )
    }

    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    })
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/callback
 * Refresh the access token using a refresh token
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Missing Spotify OAuth configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Spotify token refresh failed:', errorData)
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 400 }
      )
    }

    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
