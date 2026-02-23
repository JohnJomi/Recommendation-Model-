# Code Examples & Quick Reference

## Using AIRecommendations Component

### Basic Integration
```tsx
import AIRecommendations from "@/components/AIRecommendations"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"

export default function MyPage() {
  const { spotifyId } = useAuth()
  const { isDarkMode } = useTheme()

  return (
    <AIRecommendations 
      spotifyId={spotifyId} 
      isDarkMode={isDarkMode} 
    />
  )
}
```

### With Custom Layout
```tsx
export default function DashboardSection() {
  const { spotifyId } = useAuth()
  const { isDarkMode } = useTheme()

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-8">
        {/* Your header here */}
        <h2 className="text-4xl font-bold mb-12">Recommendations</h2>
        
        {/* Component */}
        <AIRecommendations 
          spotifyId={spotifyId} 
          isDarkMode={isDarkMode} 
        />
      </div>
    </section>
  )
}
```

### With Loading Skeleton
```tsx
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import dynamic from "next/dynamic"

const AIRecommendations = dynamic(
  () => import("@/components/AIRecommendations"),
  { ssr: false }
)

export default function LazyPage() {
  const { spotifyId } = useAuth()
  const { isDarkMode } = useTheme()

  if (!spotifyId) return <div>Loading...</div>

  return (
    <AIRecommendations 
      spotifyId={spotifyId} 
      isDarkMode={isDarkMode} 
    />
  )
}
```

## Using formatDuration Utility

### Basic Usage
```tsx
import { formatDuration } from "@/lib/formatDuration"

// Basic formatting
const duration1 = formatDuration(180000)   // "3:00"
const duration2 = formatDuration(210500)   // "3:30"
const duration3 = formatDuration(3600000)  // "60:00"

// In JSX
<span>{formatDuration(track.duration_ms)}</span>
```

### In Component Logic
```tsx
const formatTrackInfo = (track: Recommendation) => {
  return {
    ...track,
    formattedDuration: formatDuration(track.duration_ms),
    displayYear: track.release_year || "—"
  }
}
```

### With Type Safety
```tsx
import type { Recommendation } from "@/types"
import { formatDuration } from "@/lib/formatDuration"

export function TrackCard({ track }: { track: Recommendation }) {
  return (
    <div>
      <h3>{track.title}</h3>
      <p>Duration: {formatDuration(track.duration_ms)}</p>
    </div>
  )
}
```

## Type Definitions

### Recommendation Type
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
```

### Using with Custom Hooks
```tsx
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"

// Custom hook combining both
export function useUserPreferences() {
  const auth = useAuth()
  const theme = useTheme()
  
  return {
    spotifyId: auth.spotifyId,
    isDarkMode: theme.isDarkMode,
    isLoading: auth.isLoading,
  }
}

// Usage
export default function Page() {
  const { spotifyId, isDarkMode, isLoading } = useUserPreferences()
  
  return <AIRecommendations spotifyId={spotifyId} isDarkMode={isDarkMode} />
}
```

## Advanced Patterns

### Prefetching Recommendations
```tsx
async function prefetchRecommendations(spotifyId: string) {
  const API_BASE_URL = "https://aliza-overcomplacent-isabell.ngrok-free.dev"
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/recommendations?spotify_id=${spotifyId}`,
      {
        headers: { "ngrok-skip-browser-warning": "true" },
        credentials: "include",
      }
    )
    return await response.json()
  } catch (error) {
    console.error("Prefetch failed:", error)
    return null
  }
}
```

### Custom Fetch with Retry Logic
```tsx
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
        credentials: "include",
      })
      if (response.ok) return response
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
  throw new Error("Max retries exceeded")
}
```

### Caching Utility Expansion
```tsx
// Custom cache with TTL management
class RecommendationCache {
  private ttl: number

  constructor(ttlMs: number = 24 * 60 * 60 * 1000) {
    this.ttl = ttlMs
  }

  get(key: string) {
    const cached = sessionStorage.getItem(key)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > this.ttl) {
      sessionStorage.removeItem(key)
      return null
    }

    return data
  }

  set(key: string, data: any) {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    )
  }

  clear(key: string) {
    sessionStorage.removeItem(key)
  }

  clearAll(pattern?: string) {
    Object.keys(sessionStorage)
      .filter(key => !pattern || key.includes(pattern))
      .forEach(key => sessionStorage.removeItem(key))
  }
}

// Usage
const cache = new RecommendationCache()
const recs = cache.get("ai_recommendations_123")
cache.set("ai_recommendations_123", data)
```

## Event Handling Examples

### Opening Spotify Links
```tsx
// In component
const handleOpenSpotify = (url: string, e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  window.open(url, "_blank")
}

// With analytics (example)
const handleOpenSpotifyWithTracking = (url: string, trackId: string, e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  
  // Track event
  console.log("Opened Spotify:", trackId)
  
  window.open(url, "_blank")
}
```

### Handling Regenerate Action
```tsx
const handleRegenerate = async (spotifyId: string) => {
  try {
    setIsRegenerating(true)
    clearCache(spotifyId)
    
    const data = await fetchRecommendations(spotifyId)
    setRecommendations(data)
    
    // Success callback
    onRecommendationsRefreshed?.(data)
  } catch (error) {
    setError("Failed to regenerate recommendations")
  } finally {
    setIsRegenerating(false)
  }
}
```

## Error Scenarios & Solutions

### Scenario: User not authenticated
```tsx
// Component handles this:
// - Shows error message
// - Suggests logging in
// - Parent page redirects to login

if (!spotifyId) {
  return <ErrorState message="Please log in to see recommendations" />
}
```

### Scenario: Backend API unavailable
```tsx
// Component displays:
// - "Failed to fetch recommendations"
// - Retry suggestion
// - Regenerate button to retry

catch (error) {
  setError("Failed to fetch recommendations")
  // User clicks "Regenerate" to retry
}
```

### Scenario: Cache corruption
```tsx
// Component gracefully handles:
// - Clears invalid cache
// - Fetches fresh data
// - No user-visible error

try {
  const parsed = JSON.parse(cached)
  // ...
} catch {
  sessionStorage.removeItem(key)  // Clear corrupted cache
  return null  // Fallback to fresh fetch
}
```

## Dark Mode Implementation

### Conditional Styling Pattern
```tsx
// Pattern used throughout component
className={`
  transition-colors duration-300
  ${isDarkMode ? "dark-classes" : "light-classes"}
`}

// Examples
text: ${isDarkMode ? "text-white" : "text-gray-900"}
border: ${isDarkMode ? "border-gray-700" : "border-gray-200"}
bg: ${isDarkMode ? "bg-gray-800" : "bg-white"}
```

## File Structure

```
frontend/
├── components/
│   └── AIRecommendations.tsx       # Main component
├── lib/
│   └── formatDuration.ts           # Utility function
├── app/
│   └── recommendations/
│       └── page.tsx                # Integration example
├── context/
│   ├── AuthContext.tsx             # (existing)
│   └── ThemeContext.tsx            # (existing)
└── IMPLEMENTATION_GUIDE.md         # This file
```

## Common Mistakes to Avoid

❌ **DON'T:**
- Forget to pass `isDarkMode` prop
- Use hardcoded colors instead of theme vars
- Fetch without `ngrok-skip-browser-warning` header
- Forget to handle null `spotifyId`

✅ **DO:**
- Always pass both `spotifyId` and `isDarkMode`
- Use existing theme classes
- Include ngrok header for API calls
- Check authentication before rendering
- Use TypeScript interfaces
