# SessionStorage Caching Strategy - Dashboard Tracks

## Problem Solved

**Before**: When navigating away from `/dashboard` and returning, tracks reloaded with a loading spinner and a new backend request was made.

**After**: Tracks load instantly from browser cache (sessionStorage) if available, with no loading spinner and no backend call.

---

## How It Works

### Cache Strategy: SessionStorage + 5-Minute TTL

#### 1. Cache Structure
```typescript
interface CachedTracks {
  tracks: Track[]
  cachedAt: number  // Unix timestamp in milliseconds
}
```

Cache key: `top_tracks_{spotifyId}`

Example:
```
sessionStorage["top_tracks_spotify_abc123"] = {
  "tracks": [...],
  "cachedAt": 1708512345678
}
```

#### 2. Cache Lifecycle

**First Load (Cache Miss)**
```
1. Component mounts
2. Check sessionStorage for "top_tracks_{spotifyId}"
3. No cache found (or expired)
4. Fetch from backend
5. Save to sessionStorage with current timestamp
6. Display tracks
```

**Second Load (Cache Hit - < 5 mins)**
```
1. Component mounts (e.g., returning from /stats)
2. Check sessionStorage
3. Cache found and NOT expired
4. Load tracks instantly
5. NO loading spinner
6. NO backend request
```

**Cache Expired (≥ 5 mins old)**
```
1. Check sessionStorage
2. Cache found but EXPIRED
3. Remove expired cache
4. Fetch fresh data from backend
5. Update cache with new timestamp
```

#### 3. Expiration Logic

```typescript
const now = Date.now()
const age = now - cachedTracks.cachedAt
const isExpired = age > CACHE_DURATION_MS  // 5 minutes = 300,000 ms

if (isExpired) {
  sessionStorage.removeItem(cacheKey)
  return null  // Treat as cache miss
}
```

---

## Key Features

✅ **Smart Loading State**
- If loading from cache → `loading = false` (no spinner)
- If fetching from backend → `loading = true` (show spinner)

✅ **Per-User Caching**
- Cache keyed by `spotifyId`
- Each user has separate cache
- No data leakage between users

✅ **Session-Based**
- `sessionStorage` automatically clears when tab closes
- Data not persisted across browser restart
- Cleaner than localStorage for session data

✅ **5-Minute TTL**
- Cache expires after 5 minutes
- Ensures data freshness
- Configurable via `CACHE_DURATION_MS`

✅ **Error Handling**
- JSON parsing errors silently cleared
- SessionStorage unavailability handled gracefully
- Falls back to backend fetch on cache errors

✅ **Logout Support**
- `logout()` clears both localStorage and sessionStorage cache
- Prevents cached data from stale sessions

---

## Implementation Details

### Cache Helper Functions

#### `getFromCache(spotifyId: string): Track[] | null`
- Retrieves cached tracks if valid
- Returns `null` if cache missing/expired/invalid
- Automatically removes expired cache
- Safe JSON parsing with try-catch

#### `saveToCache(spotifyId: string, tracks: Track[]): void`
- Saves tracks with timestamp to sessionStorage
- Wraps in try-catch for unavailable sessionStorage
- Silent failure (no errors thrown)

#### `clearCache(spotifyId: string): void`
- Manually clears cache for a user
- Called during logout
- Safe to call multiple times

### Dashboard Component Logic

```typescript
const fetchTracks = async () => {
  // Check cache first
  const cachedTracks = getFromCache(spotifyId)

  if (cachedTracks && cachedTracks.length > 0) {
    // FAST PATH: Load from cache, no spinner
    setTracks(cachedTracks)
    setIsFromCache(true)
    setLoading(false)
    return
  }

  // SLOW PATH: Fetch from backend, show spinner
  setLoading(true)
  
  const response = await fetch(...)
  const data = await response.json()

  setTracks(data)
  
  // Update cache for future visits
  saveToCache(spotifyId, data)
}
```

---

## Edge Cases Handled

### Case 1: User Switches Spotify Accounts
```
Old cache key: top_tracks_spotify_old_id
New cache key: top_tracks_spotify_new_id
→ Different keys, no collision ✓
```

### Case 2: Logout and Login Again
```
1. User logs out → logout() clears cache
2. User logs in with different Spotify ID
3. Cache keys are different
4. Fresh data fetched ✓
```

### Case 3: Browser SessionStorage Full
```
saveToCache() called
→ sessionStorage.setItem() throws error
→ Caught and silently handled
→ No crash, app continues ✓
```

### Case 4: Corrupted Cache Data
```
Cached JSON invalid
→ JSON.parse() throws error
→ Caught, cache removed
→ Falls back to backend fetch ✓
```

### Case 5: Tab Closed/Browser Restarted
```
sessionStorage auto-clears
→ Next login treats as cache miss
→ Fresh fetch from backend ✓
```

---

## Performance Impact

### Without Caching
```
Navigate /dashboard → /stats → /dashboard
→ 3 backend requests
→ 2 loading spinners shown
→ ~2-3 seconds wait time
```

### With Caching
```
Navigate /dashboard → /stats → /dashboard
→ 1 backend request (first load)
→ 0 loading spinners on return
→ Instant display from sessionStorage
→ Save ~200-500ms per return visit
```

---

## Configuration

### Change Cache Duration
Edit in `dashboard/page.tsx`:
```typescript
const CACHE_DURATION_MS = 5 * 60 * 1000  // Change this value

// Examples:
// 1 minute:  1 * 60 * 1000
// 10 minutes: 10 * 60 * 1000
// 30 minutes: 30 * 60 * 1000
```

### Disable Caching (for debugging)
Change `getFromCache()` to always return `null`:
```typescript
const getFromCache = (spotifyId: string): Track[] | null => {
  return null  // Always fetch fresh
}
```

---

## Testing Checklist

- [ ] First load: Fetches from backend, shows spinner
- [ ] Navigate away and back within 5 mins: Loads from cache instantly, no spinner
- [ ] Wait 5+ mins and return: Fetches fresh data, shows spinner
- [ ] Logout: Cache cleared, next login fetches fresh
- [ ] Refresh page: Loads from cache (if within 5 mins)
- [ ] Close tab and reopen: SessionStorage cleared, fresh fetch
- [ ] Multiple users on same browser: Different cache keys, no conflicts
- [ ] Browser DevTools → Application → Session Storage: See cache entries

---

## Browser Compatibility

✅ **SessionStorage Support**
- Chrome/Edge/Firefox/Safari: All modern versions
- IE 8+: Supported
- Mobile browsers: Supported

✅ **JSON.stringify/parse**
- All modern browsers
- Safe fallback with try-catch

---

## Future Enhancements

1. **Add Refresh Button**: Let users force refresh without waiting 5 mins
2. **Cache Size Limit**: Clear oldest cache if sessionStorage gets full
3. **Analytics**: Track cache hit rate for monitoring
4. **Prefetch**: Preload data on background tabs
5. **Incremental Update**: Only cache new/changed tracks
