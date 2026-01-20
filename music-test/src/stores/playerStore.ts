import { create } from 'zustand'

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

interface PlayerStore {
  // State
  playbackState: PlaybackState
  deviceId: string | null
  isPremium: boolean | null
  isSDKReady: boolean
  currentPosition: number // ms into current track
  duration: number // total duration of current track in ms
  volume: number // 0-100
  error: string | null

  // Actions
  setPlaybackState: (state: PlaybackState) => void
  setDeviceId: (id: string | null) => void
  setIsPremium: (value: boolean | null) => void
  setSDKReady: (ready: boolean) => void
  setPosition: (ms: number) => void
  setDuration: (ms: number) => void
  setVolume: (volume: number) => void
  setError: (message: string | null) => void
  reset: () => void
}

const initialState = {
  playbackState: 'idle' as PlaybackState,
  deviceId: null,
  isPremium: null,
  isSDKReady: false,
  currentPosition: 0,
  duration: 0,
  volume: 50,
  error: null,
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initialState,

  setPlaybackState: (playbackState) => {
    set({ playbackState, error: playbackState === 'error' ? undefined : null })
  },

  setDeviceId: (deviceId) => {
    set({ deviceId })
  },

  setIsPremium: (isPremium) => {
    set({ isPremium })
  },

  setSDKReady: (isSDKReady) => {
    set({ isSDKReady })
  },

  setPosition: (currentPosition) => {
    set({ currentPosition })
  },

  setDuration: (duration) => {
    set({ duration })
  },

  setVolume: (volume) => {
    set({ volume: Math.max(0, Math.min(100, volume)) })
  },

  setError: (error) => {
    set({ error, playbackState: error ? 'error' : 'idle' })
  },

  reset: () => {
    set(initialState)
  },
}))

// Helper functions
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function getProgressPercent(position: number, duration: number): number {
  if (duration === 0) return 0
  return (position / duration) * 100
}
