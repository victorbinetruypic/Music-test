import type {
  PlayerService,
  PlayerServiceCallbacks,
  SpotifyPlayer,
  SpotifyPlaybackState,
} from './types'

declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayer
    }
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

export class RealPlayerService implements PlayerService {
  private player: SpotifyPlayer | null = null
  private deviceId: string | null = null
  private token: string | null = null
  private callbacks: PlayerServiceCallbacks = {}

  // Store listener references for cleanup
  private listeners: Map<string, (data: unknown) => void> = new Map()

  async initialize(token: string, callbacks: PlayerServiceCallbacks): Promise<boolean> {
    this.token = token
    this.callbacks = callbacks

    // Load SDK script if not already loaded
    if (!window.Spotify) {
      await this.loadSDKScript()
    }

    return new Promise((resolve) => {
      const initPlayer = () => {
        if (!window.Spotify) {
          callbacks.onError?.({ message: 'Spotify SDK failed to load' })
          resolve(false)
          return
        }

        this.player = new window.Spotify.Player({
          name: 'Music-test Player',
          getOAuthToken: (cb) => {
            if (this.token) cb(this.token)
          },
          volume: 0.5,
        })

        // Create and store listener references for proper cleanup
        const initErrorListener = (e: unknown) => {
          callbacks.onError?.({ message: (e as { message: string }).message })
        }
        const authErrorListener = (e: unknown) => {
          callbacks.onError?.({ message: (e as { message: string }).message })
        }
        const accountErrorListener = (e: unknown) => {
          callbacks.onError?.({ message: (e as { message: string }).message })
        }
        const playbackErrorListener = (e: unknown) => {
          callbacks.onError?.({ message: (e as { message: string }).message })
        }
        const stateChangedListener = (state: unknown) => {
          callbacks.onPlayerStateChanged?.(state as SpotifyPlaybackState | null)
        }
        const readyListener = (data: unknown) => {
          const { device_id } = data as { device_id: string }
          this.deviceId = device_id
          callbacks.onReady?.(device_id)
          resolve(true)
        }
        const notReadyListener = (data: unknown) => {
          const { device_id } = data as { device_id: string }
          callbacks.onNotReady?.(device_id)
        }
        const autoplayFailedListener = () => {
          callbacks.onAutoPlayFailed?.()
        }

        // Store listeners for cleanup
        this.listeners.set('initialization_error', initErrorListener)
        this.listeners.set('authentication_error', authErrorListener)
        this.listeners.set('account_error', accountErrorListener)
        this.listeners.set('playback_error', playbackErrorListener)
        this.listeners.set('player_state_changed', stateChangedListener)
        this.listeners.set('ready', readyListener)
        this.listeners.set('not_ready', notReadyListener)
        this.listeners.set('autoplay_failed', autoplayFailedListener)

        // Register listeners
        this.player.addListener('initialization_error', initErrorListener)
        this.player.addListener('authentication_error', authErrorListener)
        this.player.addListener('account_error', accountErrorListener)
        this.player.addListener('playback_error', playbackErrorListener)
        this.player.addListener('player_state_changed', stateChangedListener)
        this.player.addListener('ready', readyListener)
        this.player.addListener('not_ready', notReadyListener)
        this.player.addListener('autoplay_failed', autoplayFailedListener)

        // Connect to the player
        this.player.connect()
      }

      if (window.Spotify) {
        initPlayer()
      } else {
        window.onSpotifyWebPlaybackSDKReady = initPlayer
      }
    })
  }

  private loadSDKScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('spotify-player-script')) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.id = 'spotify-player-script'
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Spotify SDK'))
      document.body.appendChild(script)
    })
  }

  disconnect(): void {
    if (this.player) {
      // Remove all event listeners before disconnecting
      for (const [event, listener] of this.listeners.entries()) {
        this.player.removeListener(event, listener)
      }
      this.listeners.clear()

      this.player.disconnect()
      this.player = null
      this.deviceId = null
    }
  }

  async play(uris: string[], startIndex: number = 0): Promise<{ error: string | null }> {
    if (!this.deviceId || !this.token) {
      return { error: 'Player not initialized' }
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris,
            offset: { position: startIndex },
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { error: errorData.error?.message || `Playback failed: ${response.status}` }
      }

      return { error: null }
    } catch {
      return { error: 'Network error during playback' }
    }
  }

  async pause(): Promise<{ error: string | null }> {
    if (!this.player) {
      return { error: 'Player not initialized' }
    }

    try {
      await this.player.pause()
      return { error: null }
    } catch {
      return { error: 'Failed to pause' }
    }
  }

  async resume(): Promise<{ error: string | null }> {
    if (!this.player) {
      return { error: 'Player not initialized' }
    }

    try {
      await this.player.resume()
      return { error: null }
    } catch {
      return { error: 'Failed to resume' }
    }
  }

  async skip(): Promise<{ error: string | null }> {
    if (!this.player) {
      return { error: 'Player not initialized' }
    }

    try {
      await this.player.nextTrack()
      return { error: null }
    } catch {
      return { error: 'Failed to skip' }
    }
  }

  async seek(positionMs: number): Promise<{ error: string | null }> {
    if (!this.player) {
      return { error: 'Player not initialized' }
    }

    try {
      await this.player.seek(positionMs)
      return { error: null }
    } catch {
      return { error: 'Failed to seek' }
    }
  }

  async setVolume(volume: number): Promise<{ error: string | null }> {
    if (!this.player) {
      return { error: 'Player not initialized' }
    }

    try {
      // Spotify SDK volume is 0-1
      await this.player.setVolume(volume / 100)
      return { error: null }
    } catch {
      return { error: 'Failed to set volume' }
    }
  }

  async getState(): Promise<SpotifyPlaybackState | null> {
    if (!this.player) return null
    return this.player.getCurrentState()
  }

  getDeviceId(): string | null {
    return this.deviceId
  }
}

// Mock player for testing
export class MockPlayerService implements PlayerService {
  private deviceId: string | null = 'mock-device-id'
  private callbacks: PlayerServiceCallbacks = {}
  private isPlaying = false
  private currentPosition = 0
  private mockTracks: string[] = []
  private currentIndex = 0

  async initialize(_token: string, callbacks: PlayerServiceCallbacks): Promise<boolean> {
    this.callbacks = callbacks
    // Simulate SDK loading delay
    await new Promise((resolve) => setTimeout(resolve, 100))
    callbacks.onReady?.(this.deviceId!)
    return true
  }

  disconnect(): void {
    this.deviceId = null
    this.isPlaying = false
  }

  async play(uris: string[], startIndex: number = 0): Promise<{ error: string | null }> {
    this.mockTracks = uris
    this.currentIndex = startIndex
    this.isPlaying = true
    this.currentPosition = 0
    this.emitStateChange()
    return { error: null }
  }

  async pause(): Promise<{ error: string | null }> {
    this.isPlaying = false
    this.emitStateChange()
    return { error: null }
  }

  async resume(): Promise<{ error: string | null }> {
    this.isPlaying = true
    this.emitStateChange()
    return { error: null }
  }

  async skip(): Promise<{ error: string | null }> {
    if (this.currentIndex < this.mockTracks.length - 1) {
      this.currentIndex++
      this.currentPosition = 0
      this.emitStateChange()
    }
    return { error: null }
  }

  async seek(positionMs: number): Promise<{ error: string | null }> {
    this.currentPosition = positionMs
    this.emitStateChange()
    return { error: null }
  }

  async setVolume(_volume: number): Promise<{ error: string | null }> {
    return { error: null }
  }

  async getState(): Promise<SpotifyPlaybackState | null> {
    if (this.mockTracks.length === 0) return null

    return {
      context: { uri: null, metadata: {} },
      disallows: {},
      duration: 200000, // 3:20
      paused: !this.isPlaying,
      position: this.currentPosition,
      repeat_mode: 0,
      shuffle: false,
      track_window: {
        current_track: {
          uri: this.mockTracks[this.currentIndex],
          id: this.mockTracks[this.currentIndex].split(':')[2],
          type: 'track',
          media_type: 'audio',
          name: 'Mock Track',
          is_playable: true,
          album: {
            uri: 'spotify:album:mock',
            name: 'Mock Album',
            images: [{ url: '', height: 300, width: 300 }],
          },
          artists: [{ uri: 'spotify:artist:mock', name: 'Mock Artist' }],
        },
        previous_tracks: [],
        next_tracks: [],
      },
    }
  }

  getDeviceId(): string | null {
    return this.deviceId
  }

  private emitStateChange(): void {
    this.getState().then((state) => {
      this.callbacks.onPlayerStateChanged?.(state)
    })
  }
}
