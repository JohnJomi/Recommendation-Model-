# AI Recommendations Frontend Implementation

## Overview

Complete frontend implementation for AI-powered music recommendations using Spotify data and Google Gemini API.

## Components & Files

### 1. **AIRecommendations.tsx** (`/components/AIRecommendations.tsx`)

Main component that displays AI-generated music recommendations in a card grid.

#### Features:
- ✅ Fetches recommendations from `GET /recommendations?spotify_id={id}`
- ✅ Displays cards in responsive grid (1-4 columns)
- ✅ Loading state with skeleton cards
- ✅ Error state with helpful messaging
- ✅ Empty state handling
- ✅ Cache management (24-hour TTL)
- ✅ Regenerate button to fetch fresh recommendations
- ✅ Open in Spotify button for each track
- ✅ Black/white/gray theme matching design system
- ✅ Smooth hover effects and transitions

#### Props:
```tsx
interface AIRecommendationsProps {
  spotifyId: string | null      // User's Spotify ID
  isDarkMode: boolean           // Theme preference
}
```

#### Cache Strategy:
- Uses `sessionStorage` with 24-hour TTL
- Auto-clears expired cache
- "Regenerate" button clears cache and fetches fresh data
- Graceful fallback if cache is unavailable

### 2. **formatDuration.ts** (`/lib/formatDuration.ts`)

Utility function to format milliseconds to mm:ss format.

```tsx
// Usage
formatDuration(180000)  // Returns "3:00"
formatDuration(210500)  // Returns "3:30"
```

### 3. **Recommendations Page** (`/app/recommendations/page.tsx`)

Integration example showing how to use AIRecommendations component.

#### Features:
- ✅ Authentication check (redirects to login if needed)
- ✅ Loading state while checking auth
- ✅ Navbar integration
- ✅ Proper spacing and layout
- ✅ Dark/light mode support
- ✅ Responsive design

## Integration Guide

### Using the Component in Any Page:

```tsx
import AIRecommendations from "@/components/AIRecommendations"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"

export default function MyPage() {
  const { spotifyId } = useAuth()
  const { isDarkMode } = useTheme()

  return (
    <div className="max-w-7xl mx-auto px-8 py-16">
      <AIRecommendations spotifyId={spotifyId} isDarkMode={isDarkMode} />
    </div>
  )
}
```

## Backend API Contract

### Endpoint
```
GET /recommendations?spotify_id={spotify_id}
```

### Response Format
```json
[
  {
    "id": "spotify_track_id",
    "title": "Track Name",
    "artist": "Artist Name",
    "release_year": 2020,
    "duration_ms": 210000,
    "album_image": "https://i.scdn.co/image/...",
    "spotify_url": "https://open.spotify.com/track/..."
  },
  ...
]
```

### Error Handling
- **Network errors**: Displays centered error message with retry suggestion
- **Empty response**: Shows "No recommendations available" message
- **Auth issues**: Handled by parent page (redirects to login)

## Card Layout

Each recommendation card displays:
```
┌─────────────────────┐
│                     │
│   Album Image       │  (Square, object-cover)
│   (Hover Scale)     │
│                     │
├─────────────────────┤
│ Song Title          │  (Bold, truncated)
│ Artist Name         │  (Gray, lighter)
│                     │
│ Duration:    3:45   │  (Metadata row)
│ Released:    2020   │  (Metadata row)
│                     │
│ [Open in Spotify]   │  (Subtle border button)
└─────────────────────┘
```

## Styling System

### Theme Colors (Black/White/Gray only)

**Dark Mode:**
- Background: `from-gray-900 via-gray-800 to-gray-900`
- Card background: `bg-gray-800`
- Text: `text-white` (primary), `text-gray-400` (secondary)
- Borders: `border-gray-700`
- Hover: `bg-gray-700`

**Light Mode:**
- Background: `bg-white`
- Card background: `bg-white/80`
- Text: `text-gray-900` (primary), `text-gray-600` (secondary)
- Borders: `border-gray-200`
- Hover: `bg-gray-50`

### Responsive Breakpoints

```
Mobile:   grid-cols-1
Tablet:   sm:grid-cols-2
Desktop:  md:grid-cols-3
Wide:     lg:grid-cols-4
```

## Loading States

### Skeleton Cards
- Displays 12 skeleton cards while loading
- Matches card dimensions and layout
- Smooth pulse animation
- Clears when real data loads

### Button States
```
// Idle
"Regenerate"

// Regenerating
"⟳ Regenerating..."

// Disabled states (loading, no auth)
opacity-50 cursor-not-allowed
```

## Caching Behavior

### First Load
1. Check sessionStorage cache
2. If valid (< 24h): Load from cache instantly
3. If expired/missing: Fetch from backend
4. Save fresh data to cache

### Regenerate Click
1. Clear cache for user
2. Fetch fresh recommendations
3. Save new data to cache
4. Update UI

### Cache Keys
```
ai_recommendations_{spotifyId}
```

## TypeScript Interfaces

```tsx
interface Recommendation {
  id: string              // Spotify track ID
  title: string           // Song title
  artist: string          // Artist name
  release_year: number    // Year released
  duration_ms: number     // Duration in milliseconds
  album_image: string     // Album artwork URL
  spotify_url: string     // Spotify track link
}

interface CachedRecommendations {
  recommendations: Recommendation[]
  cachedAt: number        // Timestamp in milliseconds
}
```

## Error Handling

### Network Error
```
"Failed to fetch recommendations"
"Try regenerating recommendations or check your connection."
```

### Empty Response
```
"No recommendations available"
"Try regenerating recommendations or listen to more music on Spotify."
```

### Auth Error
Handled by parent page - redirects to login

## Accessibility & UX

✅ Keyboard navigable
✅ Hover feedback on all interactive elements
✅ Smooth transitions (300ms duration)
✅ Loading skeleton provides visual continuity
✅ Clear error messaging
✅ Open in Spotify links open new tab
✅ Responsive on all screen sizes

## Performance

- **Initial Load**: Instant from cache if available
- **Network Load**: Depends on backend API response time
- **Cache Hit**: < 1ms (no network request)
- **Grid Rendering**: Optimized with React keys
- **Image Loading**: Next.js Image component with lazy loading
- **Memory**: sessionStorage size-aware with graceful failure

## Testing Checklist

- [ ] Component loads with valid spotifyId
- [ ] Skeleton cards display while loading
- [ ] Cards populate when data arrives
- [ ] Hover effects work on cards
- [ ] "Open in Spotify" buttons open new tabs
- [ ] Regenerate button clears cache and refetches
- [ ] Error state displays on network failure
- [ ] Empty state shows with no data
- [ ] Theme switching works correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] No auth -> redirects to login
- [ ] Cache persists on page reload
- [ ] Cache expires after 24 hours

## Future Enhancements

- [ ] Add "Add to Playlist" button
- [ ] Track recommendation history
- [ ] Sort/filter recommendations
- [ ] Share recommendations via URL
- [ ] Listen preview with player
- [ ] Save favorite recommendations
- [ ] Compare with Top Tracks
