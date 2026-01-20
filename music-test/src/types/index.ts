// Music-test Type Definitions
// See architecture.md for detailed type specifications

export interface Track {
  id: string
  name: string
  artist: string
  album: string
  uri: string
  durationMs: number
}

export interface AudioFeatures {
  id: string
  energy: number      // 0.0 to 1.0
  valence: number     // 0.0 to 1.0 (musical positiveness)
  tempo: number       // BPM
  danceability: number // 0.0 to 1.0
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
