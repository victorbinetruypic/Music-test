/**
 * Centralized request queue for Spotify API calls.
 *
 * - Serial execution (1 at a time) to avoid 429 cascades
 * - 300ms minimum spacing between requests
 * - Global pause when a 429 is detected — ALL queued requests wait
 * - Queue size cap to prevent runaway accumulation
 */

const MIN_SPACING_MS = 1000
const MAX_QUEUE_SIZE = 50

interface QueuedRequest<T> {
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

let activeCount = 0
let lastRequestTime = 0
let pausedUntil = 0 // Timestamp: queue is frozen until this time
const queue: QueuedRequest<unknown>[] = []

/**
 * Called by the client when a 429 is received.
 * Pauses ALL queued requests for the given duration.
 */
export function pauseQueue(seconds: number): void {
  const until = Date.now() + seconds * 1000
  // Only extend, never shorten an existing pause
  if (until > pausedUntil) {
    pausedUntil = until
  }
}

function processQueue(): void {
  if (queue.length === 0 || activeCount >= 1) return

  const now = Date.now()

  // Global pause from 429
  if (now < pausedUntil) {
    setTimeout(processQueue, pausedUntil - now + 200)
    return
  }

  // Minimum spacing
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_SPACING_MS) {
    setTimeout(processQueue, MIN_SPACING_MS - timeSinceLastRequest)
    return
  }

  const item = queue.shift()!
  activeCount++
  lastRequestTime = Date.now()

  item.execute()
    .then(item.resolve)
    .catch(item.reject)
    .finally(() => {
      activeCount--
      processQueue()
    })
}

/**
 * Enqueue a Spotify API request. Respects spacing and global 429 pause.
 */
export function enqueueRequest<T>(execute: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (queue.length >= MAX_QUEUE_SIZE) {
      reject(new Error('Too many pending requests. Please wait.'))
      return
    }
    queue.push({ execute, resolve, reject } as QueuedRequest<unknown>)
    processQueue()
  })
}
