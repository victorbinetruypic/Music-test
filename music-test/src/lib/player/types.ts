// Spotify Web Playback SDK types
export interface SpotifyPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, callback: (data: unknown) => void): boolean
  removeListener(event: string, callback?: (data: unknown) => void): boolean
  getCurrentState(): Promise<SpotifyPlaybackState | null>
  setName(name: string): Promise<void>
  getVolume(): Promise<number>
  setVolume(volume: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
  seek(positionMs: number): Promise<void>
  previousTrack(): Promise<void>
  nextTrack(): Promise<void>
}

export interface SpotifyPlaybackState {
  context: {
    uri: string | null
    metadata: Record<string, unknown>
  }
  disallows: {
    pausing?: boolean
    peeking_next?: boolean
    peeking_prev?: boolean
    resuming?: boolean
    seeking?: boolean
    skipping_next?: boolean
    skipping_prev?: boolean
  }
  duration: number
  paused: boolean
  position: number
  repeat_mode: number
  shuffle: boolean
  track_window: {
    current_track: SpotifyWebPlaybackTrack
    previous_tracks: SpotifyWebPlaybackTrack[]
    next_tracks: SpotifyWebPlaybackTrack[]
  }
}

export interface SpotifyWebPlaybackTrack {
  uri: string
  id: string
  type: string
  media_type: string
  name: string
  is_playable: boolean
  album: {
    uri: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
  }
  artists: Array<{ uri: string; name: string }>
}

export interface WebPlaybackError {
  message: string
}

export interface PlayerServiceCallbacks {
  onReady?: (deviceId: string) => void
  onNotReady?: (deviceId: string) => void
  onPlayerStateChanged?: (state: SpotifyPlaybackState | null) => void
  onError?: (error: WebPlaybackError) => void
  onAutoPlayFailed?: () => void
}

export interface PlayerService {
  initialize(token: string, callbacks: PlayerServiceCallbacks): Promise<boolean>
  disconnect(): void
  play(uris: string[], startIndex?: number): Promise<{ error: string | null }>
  pause(): Promise<{ error: string | null }>
  resume(): Promise<{ error: string | null }>
  skip(): Promise<{ error: string | null }>
  seek(positionMs: number): Promise<{ error: string | null }>
  setVolume(volume: number): Promise<{ error: string | null }>
  getState(): Promise<SpotifyPlaybackState | null>
  getDeviceId(): string | null
}
