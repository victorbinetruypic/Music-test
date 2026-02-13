# /dev-server — Restart the Dev Server

Kill any running dev server, clean the Turbopack cache, and start fresh.

## Steps

1. Stop any running background dev server tasks
2. Kill any process on port 3000: `lsof -ti:3000 | xargs kill -9 2>/dev/null`
3. Remove the Turbopack cache: `rm -rf music-test/.next`
4. Start the dev server in background: `cd music-test && npm run dev`
5. Wait for "Ready" in the output, then confirm it's running

Report the URL (http://127.0.0.1:3000) when ready.
