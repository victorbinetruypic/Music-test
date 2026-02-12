import type { TrackWithFeatures } from '@/lib/journey/types'
import type { Track, AudioFeatures, Mood } from '@/types'
import { calculateMoodMatchScore } from '@/lib/journey/matcher'

export interface ForgottenGemsOptions {
  allLikedTracks: Track[]
  recentlyPlayedIds: Set<string>
  mood: Mood
  featuresMap: Map<string, AudioFeatures>
  count: number
}

/**
 * Find "forgotten gems" — liked songs the user hasn't played recently
 * that match the current mood. These serve as emotional anchors in the
 * opening phase of a journey.
 */
export function findForgottenGems(options: ForgottenGemsOptions): TrackWithFeatures[] {
  const { allLikedTracks, recentlyPlayedIds, mood, featuresMap, count } = options

  if (count <= 0) return []

  // Filter to tracks not recently played and that have features
  const candidates = allLikedTracks.filter(
    (t) => !recentlyPlayedIds.has(t.id) && featuresMap.has(t.id)
  )

  if (candidates.length === 0) return []

  // Score by mood match
  const scored = candidates.map((track) => {
    const features = featuresMap.get(track.id)!
    const twf: TrackWithFeatures = { track, features }
    const score = calculateMoodMatchScore(twf, mood)
    return { twf, score }
  })

  // Sort by mood match descending, take top N
  scored.sort((a, b) => b.score - a.score)

  return scored
    .slice(0, count)
    .filter((s) => s.score >= 0.4) // only include reasonable matches
    .map(({ twf }) => ({
      track: { ...twf.track, isForgottenGem: true },
      features: twf.features,
    }))
}
