import { create } from 'zustand'

interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface UserProfile {
  id: string
  displayName: string
  likedSongsCount: number | null
}

interface AuthStore {
  // State
  tokens: SpotifyTokens | null
  user: UserProfile | null
  isAuthenticated: boolean
  isLoggingIn: boolean
  isRefreshingToken: boolean
  error: string | null

  // Actions
  setTokens: (tokens: SpotifyTokens) => void
  setUser: (user: UserProfile) => void
  setLikedSongsCount: (count: number) => void
  setIsLoggingIn: (value: boolean) => void
  setError: (message: string | null) => void
  logout: () => void
  loadFromStorage: () => void
}

const STORAGE_KEY = 'music-test-auth'

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  tokens: null,
  user: null,
  isAuthenticated: false,
  isLoggingIn: false,
  isRefreshingToken: false,
  error: null,

  // Actions
  setTokens: (tokens) => {
    // Persist to localStorage
    const currentData = get()
    const storageData = {
      tokens,
      user: currentData.user,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
    } catch {
      // localStorage may be full or unavailable
    }

    set({
      tokens,
      isAuthenticated: true,
      error: null,
    })
  },

  setUser: (user) => {
    // Persist to localStorage
    const currentData = get()
    const storageData = {
      tokens: currentData.tokens,
      user,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
    } catch {
      // localStorage may be full or unavailable
    }

    set({ user })
  },

  setLikedSongsCount: (count) => {
    const currentUser = get().user
    if (currentUser) {
      const updatedUser = { ...currentUser, likedSongsCount: count }
      get().setUser(updatedUser)
    }
  },

  setIsLoggingIn: (value) => {
    set({ isLoggingIn: value })
  },

  setError: (message) => {
    set({ error: message })
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage may be unavailable
    }
    set({
      tokens: null,
      user: null,
      isAuthenticated: false,
      isLoggingIn: false,
      error: null,
    })
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.tokens) {
          // Check if token is expired
          const now = Date.now()
          if (data.tokens.expiresAt > now) {
            set({
              tokens: data.tokens,
              user: data.user || null,
              isAuthenticated: true,
            })
          } else {
            // Token expired, will need refresh
            set({
              tokens: data.tokens,
              user: data.user || null,
              isAuthenticated: false, // Mark as not authenticated until refresh
            })
          }
        }
      }
    } catch {
      // Invalid storage data, clear it
      localStorage.removeItem(STORAGE_KEY)
    }
  },
}))
