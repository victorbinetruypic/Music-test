import type { SpotifyPlaybackState } from './types'

export type CrossfadeStatus = 'idle' | 'fading-out' | 'fading-in'

export interface CrossfadeCallbacks {
  getState: () => Promise<SpotifyPlaybackState | null>
  setVolume: (volume: number) => Promise<{ error: string | null }>
  onStatusChange: (status: CrossfadeStatus) => void
  onTrackChange: () => void
}

/**
 * CrossfadeEngine — volume-based crossfade for Spotify Web Playback SDK.
 *
 * Polls getState() every 500ms. When remaining time ≤ fadeDuration + 500ms,
 * ramps volume down. When track change is detected, ramps volume up.
 *
 * Fade durations are tempo-based:
 *   60 BPM → 5s, 120 BPM → 3s, 180 BPM → 1.5s
 */
export class CrossfadeEngine {
  private callbacks: CrossfadeCallbacks
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private fadeInterval: ReturnType<typeof setInterval> | null = null
  private userVolume = 50 // 0-100, tracks what the user has set
  private status: CrossfadeStatus = 'idle'
  private currentTrackUri: string | null = null
  private currentTempo: number = 120
  private enabled = true
  private isFading = false

  constructor(callbacks: CrossfadeCallbacks) {
    this.callbacks = callbacks
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopFade()
      this.setStatus('idle')
    }
  }

  setUserVolume(volume: number): void {
    this.userVolume = volume
    // If user changes volume mid-fade, we adjust
    // but don't interrupt the fade
  }

  setTempo(tempo: number): void {
    this.currentTempo = tempo
  }

  startPolling(): void {
    this.stopPolling()
    this.pollInterval = setInterval(() => this.poll(), 500)
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.stopFade()
    this.setStatus('idle')
  }

  /**
   * Called when a new track starts playing. Triggers fade-in.
   */
  handleTrackChange(newUri: string): void {
    const wasTracking = this.currentTrackUri !== null
    this.currentTrackUri = newUri

    if (!this.enabled) return

    // If we were fading out or the track changed unexpectedly, restore volume
    if (wasTracking && (this.status === 'fading-out' || this.isFading)) {
      this.stopFade()
      this.fadeIn()
    }
  }

  private async poll(): Promise<void> {
    if (!this.enabled) return

    const state = await this.callbacks.getState()
    if (!state || state.paused) return

    const { position, duration } = state
    const trackUri = state.track_window?.current_track?.uri

    // Always check for track changes, even during fading
    if (trackUri && trackUri !== this.currentTrackUri) {
      this.currentTrackUri = trackUri
      this.callbacks.onTrackChange()
      this.fadeIn()
      return
    }

    // Only trigger new fades if not already fading
    if (this.isFading) return

    // Safety: only trigger if track > 30s and position > 10s
    if (duration < 30000 || position < 10000) return

    const remaining = duration - position
    const fadeDuration = this.getFadeDuration()

    // Trigger fade-out when remaining time ≤ fadeDuration + 500ms
    if (remaining <= fadeDuration + 500 && remaining > 0) {
      this.fadeOut(fadeDuration)
    }
  }

  /**
   * Get fade duration in ms based on tempo.
   * 60 BPM → 5000ms, 120 BPM → 3000ms, 180 BPM → 1500ms
   */
  private getFadeDuration(): number {
    const tempo = Math.max(60, Math.min(180, this.currentTempo))
    // Linear interpolation: 60→5000, 180→1500
    const duration = 5000 - ((tempo - 60) / 120) * 3500
    return Math.round(duration)
  }

  private fadeOut(durationMs: number): void {
    if (this.isFading) return
    this.isFading = true
    this.setStatus('fading-out')

    const startVolume = this.userVolume
    const steps = Math.max(1, Math.floor(durationMs / 100))
    const stepDuration = durationMs / steps
    let step = 0

    this.fadeInterval = setInterval(() => {
      step++
      const progress = step / steps

      // Ease-out curve: volume = userVolume * (1 - progress)²
      const volume = Math.round(startVolume * Math.pow(1 - progress, 2))
      this.callbacks.setVolume(Math.max(0, volume))

      if (step >= steps) {
        this.stopFade()
      }
    }, stepDuration)
  }

  private fadeIn(): void {
    this.stopFade()
    this.isFading = true
    this.setStatus('fading-in')

    const targetVolume = this.userVolume
    const durationMs = 1500
    const steps = 15
    const stepDuration = durationMs / steps
    let step = 0

    // Start from 0
    this.callbacks.setVolume(0)

    this.fadeInterval = setInterval(() => {
      step++
      const progress = step / steps

      // Ease-in curve: volume = userVolume * progress²
      const volume = Math.round(targetVolume * Math.pow(progress, 2))
      this.callbacks.setVolume(Math.min(targetVolume, volume))

      if (step >= steps) {
        this.stopFade()
        this.callbacks.setVolume(targetVolume)
        this.setStatus('idle')
      }
    }, stepDuration)
  }

  private stopFade(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval)
      this.fadeInterval = null
    }
    this.isFading = false
  }

  private setStatus(status: CrossfadeStatus): void {
    if (this.status !== status) {
      this.status = status
      this.callbacks.onStatusChange(status)
    }
  }

  destroy(): void {
    this.stopPolling()
    this.stopFade()
  }
}
