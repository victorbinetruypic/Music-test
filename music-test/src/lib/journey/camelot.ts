/**
 * Camelot Wheel — maps Spotify's (key, mode) to DJ-standard Camelot codes.
 *
 * Spotify key: 0=C, 1=C#, 2=D, ... 11=B
 * Spotify mode: 0=minor, 1=major
 *
 * Camelot codes: number (1-12) + letter (A=minor, B=major)
 * Two keys are compatible if:
 *   - Same code (identical key)
 *   - Same letter, numbers differ by 1 (adjacent on wheel, wraps 12→1)
 *   - Same number, different letter (relative major/minor)
 */

export interface CamelotCode {
  number: number // 1-12
  letter: 'A' | 'B' // A=minor, B=major
}

// Mapping: [key][mode] → CamelotCode
// key 0-11 (C through B), mode 0=minor, 1=major
const CAMELOT_MAP: Record<number, Record<number, CamelotCode>> = {
  0:  { 0: { number: 5, letter: 'A' },  1: { number: 8, letter: 'B' } },   // C minor / C major
  1:  { 0: { number: 12, letter: 'A' }, 1: { number: 3, letter: 'B' } },   // C# minor / C# major
  2:  { 0: { number: 7, letter: 'A' },  1: { number: 10, letter: 'B' } },  // D minor / D major
  3:  { 0: { number: 2, letter: 'A' },  1: { number: 5, letter: 'B' } },   // Eb minor / Eb major
  4:  { 0: { number: 9, letter: 'A' },  1: { number: 12, letter: 'B' } },  // E minor / E major
  5:  { 0: { number: 4, letter: 'A' },  1: { number: 7, letter: 'B' } },   // F minor / F major
  6:  { 0: { number: 11, letter: 'A' }, 1: { number: 2, letter: 'B' } },   // F# minor / F# major
  7:  { 0: { number: 6, letter: 'A' },  1: { number: 9, letter: 'B' } },   // G minor / G major
  8:  { 0: { number: 1, letter: 'A' },  1: { number: 4, letter: 'B' } },   // Ab minor / Ab major
  9:  { 0: { number: 8, letter: 'A' },  1: { number: 11, letter: 'B' } },  // A minor / A major
  10: { 0: { number: 3, letter: 'A' },  1: { number: 6, letter: 'B' } },   // Bb minor / Bb major
  11: { 0: { number: 10, letter: 'A' }, 1: { number: 1, letter: 'B' } },   // B minor / B major
}

/**
 * Convert Spotify (key, mode) to Camelot code.
 * Returns null if key/mode are invalid or undefined.
 */
export function toCamelot(key: number | undefined, mode: number | undefined): CamelotCode | null {
  if (key === undefined || mode === undefined) return null
  if (!Number.isFinite(key) || !Number.isFinite(mode)) return null
  if (key < 0 || key > 11 || (mode !== 0 && mode !== 1)) return null
  return CAMELOT_MAP[key][mode]
}

/**
 * Calculate the circular distance between two Camelot numbers (1-12).
 * Returns 0-6 (wraps around the wheel).
 */
function circularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b)
  return Math.min(diff, 12 - diff)
}

/**
 * Calculate Camelot distance between two codes.
 * Returns 0 for identical, 1 for adjacent/relative, higher for incompatible.
 */
export function camelotDistance(a: CamelotCode, b: CamelotCode): number {
  // Same code = distance 0
  if (a.number === b.number && a.letter === b.letter) return 0

  // Same number, different letter (relative major/minor) = distance 1
  if (a.number === b.number && a.letter !== b.letter) return 1

  // Same letter, adjacent numbers = distance 1
  if (a.letter === b.letter && circularDistance(a.number, b.number) === 1) return 1

  // Everything else: circular distance on the wheel
  const numDist = circularDistance(a.number, b.number)
  const letterPenalty = a.letter !== b.letter ? 1 : 0
  return numDist + letterPenalty
}
