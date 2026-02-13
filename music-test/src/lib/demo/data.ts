import type { Track, Journey, JourneyPhase } from '@/types'

interface DemoTrack extends Track {
  energy: number
  valence: number
}

export const DEMO_TRACKS: DemoTrack[] = [
  { id: '1', name: 'Bohemian Rhapsody', artist: 'Queen', artistId: 'demo-queen', album: 'A Night at the Opera', uri: 'spotify:track:1', durationMs: 354000, energy: 0.4, valence: 0.3 },
  { id: '2', name: 'Stairway to Heaven', artist: 'Led Zeppelin', artistId: 'demo-ledzep', album: 'Led Zeppelin IV', uri: 'spotify:track:2', durationMs: 482000, energy: 0.5, valence: 0.4 },
  { id: '3', name: 'Hotel California', artist: 'Eagles', artistId: 'demo-eagles', album: 'Hotel California', uri: 'spotify:track:3', durationMs: 390000, energy: 0.5, valence: 0.5 },
  { id: '4', name: 'Comfortably Numb', artist: 'Pink Floyd', artistId: 'demo-pinkfloyd', album: 'The Wall', uri: 'spotify:track:4', durationMs: 382000, energy: 0.4, valence: 0.3 },
  { id: '5', name: 'Sweet Child O Mine', artist: "Guns N' Roses", artistId: 'demo-gnr', album: 'Appetite for Destruction', uri: 'spotify:track:5', durationMs: 356000, energy: 0.8, valence: 0.7 },
  { id: '6', name: 'November Rain', artist: "Guns N' Roses", artistId: 'demo-gnr', album: 'Use Your Illusion I', uri: 'spotify:track:6', durationMs: 537000, energy: 0.6, valence: 0.4 },
  { id: '7', name: 'Purple Rain', artist: 'Prince', artistId: 'demo-prince', album: 'Purple Rain', uri: 'spotify:track:7', durationMs: 520000, energy: 0.5, valence: 0.3 },
  { id: '8', name: 'Dream On', artist: 'Aerosmith', artistId: 'demo-aerosmith', album: 'Aerosmith', uri: 'spotify:track:8', durationMs: 268000, energy: 0.7, valence: 0.5 },
  { id: '9', name: 'Wish You Were Here', artist: 'Pink Floyd', artistId: 'demo-pinkfloyd', album: 'Wish You Were Here', uri: 'spotify:track:9', durationMs: 334000, energy: 0.3, valence: 0.3 },
  { id: '10', name: 'Free Bird', artist: 'Lynyrd Skynyrd', artistId: 'demo-skynyrd', album: 'Pronounced Leh-nerd Skin-nerd', uri: 'spotify:track:10', durationMs: 545000, energy: 0.7, valence: 0.6 },
]

export const DEMO_TRACKS_BASIC: Track[] = DEMO_TRACKS.map(({ energy, valence, ...track }) => track)

const DEMO_PHASES: JourneyPhase[] = [
  { phase: 'opening', tracks: DEMO_TRACKS_BASIC.slice(0, 3), startIndex: 0, endIndex: 2 },
  { phase: 'build', tracks: DEMO_TRACKS_BASIC.slice(3, 6), startIndex: 3, endIndex: 5 },
  { phase: 'peak', tracks: DEMO_TRACKS_BASIC.slice(6, 8), startIndex: 6, endIndex: 7 },
  { phase: 'resolve', tracks: DEMO_TRACKS_BASIC.slice(8, 10), startIndex: 8, endIndex: 9 },
]

export const DEMO_JOURNEY: Journey = {
  id: 'demo-journey',
  tracks: DEMO_TRACKS_BASIC,
  mood: 'chill',
  duration: 60,
  phases: DEMO_PHASES,
  createdAt: new Date().toISOString(),
}
