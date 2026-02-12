/**
 * Centralized request queue for Spotify API calls.
 * Limits concurrent requests and enforces minimum spacing to avoid rate limits.
 */

const MAX_CONCURRENT = 3
const MIN_SPACING_MS = 200 // Minimum ms between request starts
const MAX_QUEUE_SIZE = 50

interface QueuedRequest<T> {
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

let activeCount = 0
let lastRequestTime = 0
const queue: QueuedRequest<unknown>[] = []

function processQueue(): void {
  if (queue.length === 0 || activeCount >= MAX_CONCURRENT) return

  const now = Date.now()
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
 * Enqueue a Spotify API request. Respects concurrency and spacing limits.
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
