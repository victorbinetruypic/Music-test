import { openDB, type IDBPDatabase } from 'idb'

import type { AudioFeatures, Track } from '@/types'

const DB_NAME = 'music-test'
const DB_VERSION = 1

interface MusicTestDB {
  'audio-features': {
    key: string
    value: AudioFeatureCacheEntry
    indexes: { 'by-timestamp': number }
  }
  'tracks': {
    key: string
    value: TrackCacheEntry
  }
  'journey-history': {
    key: string
    value: JourneyHistoryEntry
    indexes: { 'by-date': string }
  }
}

export interface AudioFeatureCacheEntry {
  id: string
  features: AudioFeatures
  cachedAt: number
}

export interface TrackCacheEntry {
  id: string
  track: Track
  cachedAt: number
}

export interface JourneyHistoryEntry {
  id: string
  mood: string
  duration: number
  songCount: number
  completedAt: string
  trackIds: string[]
}

let dbPromise: Promise<IDBPDatabase<MusicTestDB>> | null = null

function getDB(): Promise<IDBPDatabase<MusicTestDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MusicTestDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Audio features store
        if (!db.objectStoreNames.contains('audio-features')) {
          const featuresStore = db.createObjectStore('audio-features', { keyPath: 'id' })
          featuresStore.createIndex('by-timestamp', 'cachedAt')
        }

        // Tracks store
        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' })
        }

        // Journey history store
        if (!db.objectStoreNames.contains('journey-history')) {
          const historyStore = db.createObjectStore('journey-history', { keyPath: 'id' })
          historyStore.createIndex('by-date', 'completedAt')
        }
      },
    })
  }
  return dbPromise
}

// Audio Features Cache
export async function getCachedAudioFeatures(
  trackIds: string[]
): Promise<{ cached: AudioFeatures[]; uncached: string[] }> {
  const db = await getDB()
  const cached: AudioFeatures[] = []
  const uncached: string[] = []

  for (const id of trackIds) {
    const entry = await db.get('audio-features', id)
    if (entry) {
      cached.push(entry.features)
    } else {
      uncached.push(id)
    }
  }

  return { cached, uncached }
}

export async function cacheAudioFeatures(features: AudioFeatures[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('audio-features', 'readwrite')
  const now = Date.now()

  await Promise.all([
    ...features.map((f) =>
      tx.store.put({
        id: f.id,
        features: f,
        cachedAt: now,
      })
    ),
    tx.done,
  ])
}

export async function getAllCachedFeatures(): Promise<AudioFeatures[]> {
  const db = await getDB()
  const entries = await db.getAll('audio-features')
  return entries.map((e) => e.features)
}

export async function getCacheTimestamp(): Promise<number | null> {
  const db = await getDB()
  const entries = await db.getAllFromIndex('audio-features', 'by-timestamp')
  if (entries.length === 0) return null
  // Return the oldest timestamp (when caching started)
  return entries[0].cachedAt
}

export async function clearAudioFeaturesCache(): Promise<void> {
  const db = await getDB()
  await db.clear('audio-features')
}

// Tracks Cache
export async function cacheTracks(tracks: Track[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('tracks', 'readwrite')
  const now = Date.now()

  await Promise.all([
    ...tracks.map((t) =>
      tx.store.put({
        id: t.id,
        track: t,
        cachedAt: now,
      })
    ),
    tx.done,
  ])
}

export async function getCachedTracks(): Promise<Track[]> {
  const db = await getDB()
  const entries = await db.getAll('tracks')
  return entries.map((e) => e.track)
}

export async function clearTracksCache(): Promise<void> {
  const db = await getDB()
  await db.clear('tracks')
}

// Journey History
export async function saveJourneyToHistory(entry: JourneyHistoryEntry): Promise<void> {
  const db = await getDB()
  await db.put('journey-history', entry)
}

export async function getLastJourney(): Promise<JourneyHistoryEntry | null> {
  const db = await getDB()
  const entries = await db.getAllFromIndex('journey-history', 'by-date')
  if (entries.length === 0) return null
  // Return the most recent (last in sorted array)
  return entries[entries.length - 1]
}

export async function getJourneyHistory(limit: number = 10): Promise<JourneyHistoryEntry[]> {
  const db = await getDB()
  const entries = await db.getAllFromIndex('journey-history', 'by-date')
  // Return most recent first, limited
  return entries.reverse().slice(0, limit)
}

export async function clearJourneyHistory(): Promise<void> {
  const db = await getDB()
  await db.clear('journey-history')
}

// Utility: Clear all caches
export async function clearAllCaches(): Promise<void> {
  await Promise.all([
    clearAudioFeaturesCache(),
    clearTracksCache(),
    clearJourneyHistory(),
  ])
}
