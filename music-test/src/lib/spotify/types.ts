// Spotify API Response Types

export interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
  refresh_token: string
}

export interface SpotifyUserProfile {
  id: string
  display_name: string | null
  email: string
  images: Array<{ url: string }>
}

export interface SpotifyPaginated<T> {
  href: string
  items: T[]
  limit: number
  next: string | null
  offset: number
  previous: string | null
  total: number
}

export interface SpotifySavedTrack {
  added_at: string
  track: SpotifyTrack
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  artists: Array<{ id: string; name: string }>
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
  }
}

export interface SpotifyAudioFeatures {
  id: string
  energy: number
  valence: number
  tempo: number
  danceability: number
  acousticness: number
  instrumentalness: number
  liveness: number
  speechiness: number
  loudness: number
  mode: number
  key: number
  time_signature: number
}

export interface SpotifyPlaylist {
  id: string
  name: string
  external_urls: {
    spotify: string
  }
  uri: string
}

export interface SpotifyRecommendationsResponse {
  tracks: SpotifyTrack[]
  seeds: Array<{
    id: string
    type: 'artist' | 'track' | 'genre'
    initialPoolSize: number
    afterFilteringSize: number
    afterRelinkingSize: number
  }>
}

export interface SpotifyRecentlyPlayedResponse {
  items: Array<{
    track: SpotifyTrack
    played_at: string
  }>
  next: string | null
  cursors: { after: string; before: string } | null
  limit: number
}

export interface SpotifyError {
  error: {
    status: number
    message: string
  }
}
