// Music-test Type Definitions
// See architecture.md for detailed type specifications

export interface Track {
  id: string
  name: string
  artist: string
  album: string
  uri: string
  durationMs: number
  isDiscovery?: boolean
  isForgottenGem?: boolean
}

export interface AudioFeatures {
  id: string
  energy: number      // 0.0 to 1.0
  valence: number     // 0.0 to 1.0 (musical positiveness)
  tempo: number       // BPM
  danceability: number // 0.0 to 1.0
  key?: number         // 0-11 (pitch class, C=0, C#=1, ..., B=11)
  mode?: number        // 0 = minor, 1 = major
  loudness?: number    // dB (typically -60 to 0)
  acousticness?: number     // 0.0 to 1.0
  instrumentalness?: number // 0.0 to 1.0
  speechiness?: number      // 0.0 to 1.0
  liveness?: number         // 0.0 to 1.0
  time_signature?: number   // beats per bar (3-7)
}

export type Mood = 'energetic' | 'chill' | 'melancholic' | 'focused' | 'uplifting' | 'dark'

export type Phase = 'opening' | 'build' | 'peak' | 'resolve'

export interface Journey {
  id: string
  mood: Mood
  duration: number // minutes
  tracks: Track[]
  phases: JourneyPhase[]
  createdAt: string
}

export interface JourneyPhase {
  phase: Phase
  tracks: Track[]
  startIndex: number
  endIndex: number
}

export type Duration = 30 | 60 | 120 | 'open-ended'
