# /spotify-status — Check Spotify API Health

Check the current state of Spotify API connectivity and caches before development.

## Steps

### 1. Check Rate Limit Status
- Read the request queue state in `src/lib/spotify/request-queue.ts` to understand current config
- If the dev server is running, try to determine if we're currently rate-limited by checking browser console output or recent server logs

### 2. Check Cache State
- Read IndexedDB cache stats by looking at what `getCachedTracks()`, `getTracksCacheTimestamp()`, `getAllCachedFeatures()`, and `getCacheTimestamp()` would return
- Report: number of cached tracks, number of cached audio features, cache age

### 3. Check Token Status
- Look at `music-test/.env.local` to verify credentials exist (do NOT display the actual values)
- Check if sessionStorage profile cache exists by looking at recent server logs

### 4. Report Summary
Display a table:
| Check | Status |
|-------|--------|
| Spotify credentials | Present / Missing |
| Dev server | Running / Down |
| Rate limit | OK / Banned (~Xh remaining) |
| Cached tracks | X tracks (Xh old) / Empty |
| Cached audio features | X features / Empty |
| Session profile cache | Cached / Empty |

If rate-limited, calculate approximate time remaining and advise waiting.
