import type {
  SpotifyUserProfile,
  SpotifyPaginated,
  SpotifySavedTrack,
  SpotifyAudioFeatures,
  SpotifyPlaylist,
  SpotifyTrack,
  SpotifyRecommendationsResponse,
  SpotifyRecentlyPlayedResponse,
} from './types'
import type { Track, AudioFeatures } from '@/types'
import { enqueueRequest } from './request-queue'

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export interface RecommendationOptions {
  seedTrackIds: string[]
  targetEnergy?: number
  targetValence?: number
  targetTempo?: number
  targetDanceability?: number
  maxPopularity?: number
  limit?: number
}

export interface SpotifyClient {
  getUserProfile(): Promise<{ data: { id: string; displayName: string } | null; error: string | null }>
  getLikedSongsCount(): Promise<{ data: number | null; error: string | null }>
  getLikedSongs(limit?: number, offset?: number): Promise<{ data: Track[] | null; error: string | null }>
  getAudioFeatures(trackIds: string[]): Promise<{ data: AudioFeatures[] | null; error: string | null }>
  getAudioFeaturesMap(trackIds: string[]): Promise<{ data: Map<string, AudioFeatures> | null; error: string | null }>
  getRecommendations(options: RecommendationOptions): Promise<{ data: Track[] | null; error: string | null }>
  getRecentlyPlayed(limit?: number): Promise<{ data: Array<{ track: Track; playedAt: string }> | null; error: string | null }>
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
    options: RequestInit = {},
    context: { authRetries?: number; rateRetries?: number } = {}
  ): Promise<{ data: T | null; error: string | null }> {
    const authRetries = context.authRetries ?? 0
    const rateRetries = context.rateRetries ?? 0

    try {
      const response = await enqueueRequest(() =>
        fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })
      )

      if (response.status === 401) {
        if (this.onTokenExpired && authRetries < 1) {
          const newToken = await this.onTokenExpired()
          if (newToken) {
            this.accessToken = newToken
            return this.fetch(endpoint, options, { authRetries: authRetries + 1, rateRetries })
          }
        }
        return { data: null, error: 'Your session has expired. Please reconnect.' }
      }

      if (response.status === 429) {
        if (rateRetries < 5) {
          const retryAfter = Math.max(parseInt(response.headers.get('Retry-After') || '2', 10), 2)
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
          return this.fetch(endpoint, options, { authRetries, rateRetries: rateRetries + 1 })
        }
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
        key: f.key,
        mode: f.mode,
        loudness: f.loudness,
        acousticness: f.acousticness,
        instrumentalness: f.instrumentalness,
        speechiness: f.speechiness,
        liveness: f.liveness,
        time_signature: f.time_signature,
      }))

    return { data: features, error: null }
  }

  async getAudioFeaturesMap(
    trackIds: string[]
  ): Promise<{ data: Map<string, AudioFeatures> | null; error: string | null }> {
    const { data, error } = await this.getAudioFeatures(trackIds)
    if (error || !data) {
      return { data: null, error: error || 'Failed to load audio features' }
    }
    const map = new Map<string, AudioFeatures>()
    for (const f of data) {
      map.set(f.id, f)
    }
    return { data: map, error: null }
  }

  async getRecommendations(
    options: RecommendationOptions
  ): Promise<{ data: Track[] | null; error: string | null }> {
    const params = new URLSearchParams({
      seed_tracks: options.seedTrackIds.slice(0, 5).join(','),
      limit: String(options.limit ?? 20),
    })

    if (options.targetEnergy !== undefined) params.set('target_energy', String(options.targetEnergy))
    if (options.targetValence !== undefined) params.set('target_valence', String(options.targetValence))
    if (options.targetTempo !== undefined) params.set('target_tempo', String(options.targetTempo))
    if (options.targetDanceability !== undefined) params.set('target_danceability', String(options.targetDanceability))
    if (options.maxPopularity !== undefined) params.set('max_popularity', String(options.maxPopularity))

    const { data, error } = await this.fetch<SpotifyRecommendationsResponse>(
      `/recommendations?${params.toString()}`
    )

    if (error || !data) {
      return { data: null, error: error || 'Failed to get recommendations' }
    }

    const tracks: Track[] = data.tracks.map((t) => mapSpotifyTrack(t))
    return { data: tracks, error: null }
  }

  async getRecentlyPlayed(
    limit: number = 50
  ): Promise<{ data: Array<{ track: Track; playedAt: string }> | null; error: string | null }> {
    const { data, error } = await this.fetch<SpotifyRecentlyPlayedResponse>(
      `/me/player/recently-played?limit=${Math.min(limit, 50)}`
    )

    if (error || !data) {
      return { data: null, error: error || 'Failed to get recently played' }
    }

    const items = data.items.map((item) => ({
      track: mapSpotifyTrack(item.track),
      playedAt: item.played_at,
    }))
    return { data: items, error: null }
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

      // Delay between batches to avoid rate limiting
      if (i + 100 < trackUris.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
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

  async getAudioFeaturesMap(trackIds: string[]): Promise<{ data: Map<string, AudioFeatures> | null; error: string | null }> {
    const features = this.mockFeatures.filter((f) => trackIds.includes(f.id))
    const map = new Map<string, AudioFeatures>()
    for (const f of features) map.set(f.id, f)
    return { data: map, error: null }
  }

  async getRecommendations(): Promise<{ data: Track[] | null; error: string | null }> {
    return { data: [], error: null }
  }

  async getRecentlyPlayed(): Promise<{ data: Array<{ track: Track; playedAt: string }> | null; error: string | null }> {
    return { data: [], error: null }
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
