import type {
  SpotifyUserProfile,
  SpotifyPaginated,
  SpotifySavedTrack,
  SpotifyAudioFeatures,
  SpotifyPlaylist,
  SpotifyTrack,
} from './types'
import type { Track, AudioFeatures } from '@/types'

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export interface SpotifyClient {
  getUserProfile(): Promise<{ data: { id: string; displayName: string } | null; error: string | null }>
  getLikedSongsCount(): Promise<{ data: number | null; error: string | null }>
  getLikedSongs(limit?: number, offset?: number): Promise<{ data: Track[] | null; error: string | null }>
  getAudioFeatures(trackIds: string[]): Promise<{ data: AudioFeatures[] | null; error: string | null }>
  createPlaylist(name: string, trackUris: string[]): Promise<{ data: SpotifyPlaylist | null; error: string | null }>
}

export class RealSpotifyClient implements SpotifyClient {
  private accessToken: string
  private onTokenExpired?: () => Promise<string | null>

  constructor(accessToken: string, onTokenExpired?: () => Promise<string | null>) {
    this.accessToken = accessToken
    this.onTokenExpired = onTokenExpired
  }

  updateToken(accessToken: string): void {
    this.accessToken = accessToken
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (response.status === 401) {
        // Token expired, try to refresh
        if (this.onTokenExpired) {
          const newToken = await this.onTokenExpired()
          if (newToken) {
            this.accessToken = newToken
            // Retry the request
            return this.fetch(endpoint, options)
          }
        }
        return { data: null, error: 'Your session has expired. Please reconnect.' }
      }

      if (response.status === 429) {
        return { data: null, error: 'Too many requests. Please wait a moment and try again.' }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          data: null,
          error: errorData.error?.message || `Spotify API error: ${response.status}`,
        }
      }

      const data = await response.json()
      return { data, error: null }
    } catch {
      return { data: null, error: 'Network error. Please check your connection.' }
    }
  }

  async getUserProfile(): Promise<{ data: { id: string; displayName: string } | null; error: string | null }> {
    const { data, error } = await this.fetch<SpotifyUserProfile>('/me')

    if (error || !data) {
      return { data: null, error: error || 'Failed to load profile' }
    }

    return {
      data: {
        id: data.id,
        displayName: data.display_name || 'Spotify User',
      },
      error: null,
    }
  }

  async getLikedSongsCount(): Promise<{ data: number | null; error: string | null }> {
    // Request just 1 item to get the total count
    const { data, error } = await this.fetch<SpotifyPaginated<SpotifySavedTrack>>(
      '/me/tracks?limit=1'
    )

    if (error || !data) {
      return { data: null, error: error || 'Failed to load library' }
    }

    return { data: data.total, error: null }
  }

  async getLikedSongs(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data: Track[] | null; error: string | null }> {
    const { data, error } = await this.fetch<SpotifyPaginated<SpotifySavedTrack>>(
      `/me/tracks?limit=${limit}&offset=${offset}`
    )

    if (error || !data) {
      return { data: null, error: error || 'Failed to load songs' }
    }

    const tracks: Track[] = data.items.map((item) => mapSpotifyTrack(item.track))
    return { data: tracks, error: null }
  }

  async getAudioFeatures(
    trackIds: string[]
  ): Promise<{ data: AudioFeatures[] | null; error: string | null }> {
    if (trackIds.length === 0) {
      return { data: [], error: null }
    }

    // Spotify limits to 100 IDs per request
    if (trackIds.length > 100) {
      return { data: null, error: 'Too many tracks requested. Maximum is 100.' }
    }

    const { data, error } = await this.fetch<{ audio_features: (SpotifyAudioFeatures | null)[] }>(
      `/audio-features?ids=${trackIds.join(',')}`
    )

    if (error || !data) {
      return { data: null, error: error || 'Failed to load audio features' }
    }

    // Filter out null values (tracks that don't have audio features)
    const features: AudioFeatures[] = data.audio_features
      .filter((f): f is SpotifyAudioFeatures => f !== null)
      .map((f) => ({
        id: f.id,
        energy: f.energy,
        valence: f.valence,
        tempo: f.tempo,
        danceability: f.danceability,
      }))

    return { data: features, error: null }
  }

  async createPlaylist(
    name: string,
    trackUris: string[]
  ): Promise<{ data: SpotifyPlaylist | null; error: string | null }> {
    // First get user ID
    const profileResult = await this.getUserProfile()
    if (profileResult.error || !profileResult.data) {
      return { data: null, error: profileResult.error || 'Failed to get user profile' }
    }

    // Create the playlist
    const { data: playlist, error: createError } = await this.fetch<SpotifyPlaylist>(
      `/users/${profileResult.data.id}/playlists`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: 'Created by Music-test',
          public: false,
        }),
      }
    )

    if (createError || !playlist) {
      return { data: null, error: createError || 'Failed to create playlist' }
    }

    // Add tracks to the playlist (Spotify limits to 100 tracks per request)
    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100)
      const { error: addError } = await this.fetch(
        `/playlists/${playlist.id}/tracks`,
        {
          method: 'POST',
          body: JSON.stringify({ uris: batch }),
        }
      )

      if (addError) {
        return { data: null, error: `Failed to add tracks: ${addError}` }
      }
    }

    return { data: playlist, error: null }
  }
}

function mapSpotifyTrack(track: SpotifyTrack): Track {
  return {
    id: track.id,
    name: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    uri: track.uri,
    durationMs: track.duration_ms,
  }
}

// Mock client for testing
export class MockSpotifyClient implements SpotifyClient {
  private mockTracks: Track[] = []
  private mockFeatures: AudioFeatures[] = []

  setMockData(tracks: Track[], features: AudioFeatures[]): void {
    this.mockTracks = tracks
    this.mockFeatures = features
  }

  async getUserProfile(): Promise<{ data: { id: string; displayName: string } | null; error: string | null }> {
    return {
      data: { id: 'mock-user', displayName: 'Test User' },
      error: null,
    }
  }

  async getLikedSongsCount(): Promise<{ data: number | null; error: string | null }> {
    return { data: this.mockTracks.length, error: null }
  }

  async getLikedSongs(): Promise<{ data: Track[] | null; error: string | null }> {
    return { data: this.mockTracks, error: null }
  }

  async getAudioFeatures(trackIds: string[]): Promise<{ data: AudioFeatures[] | null; error: string | null }> {
    const features = this.mockFeatures.filter((f) => trackIds.includes(f.id))
    return { data: features, error: null }
  }

  async createPlaylist(): Promise<{ data: SpotifyPlaylist | null; error: string | null }> {
    return {
      data: {
        id: 'mock-playlist',
        name: 'Mock Playlist',
        uri: 'spotify:playlist:mock-playlist',
        external_urls: { spotify: 'https://open.spotify.com/playlist/mock-playlist' },
      },
      error: null,
    }
  }
}
