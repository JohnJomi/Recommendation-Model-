# Quick Start Guide - AI Recommendations Frontend

## 🚀 Get Started in 5 Minutes

### Option 1: Just Use It (Recommended)

The `/recommendations` page is already set up and ready to use:

```bash
# Start the development server
cd frontend
npm run dev

# Open in browser
http://localhost:3000/recommendations

# You should see:
# 1. Navbar (with dark mode toggle)
# 2. "AI Recommendations" section
# 3. Loading skeletons while fetching
# 4. Grid of recommendation cards
# 5. "Regenerate" button to fetch fresh data
```

**That's it!** The component handles everything internally.

### Option 2: Integrate Into Another Page

Want to show recommendations elsewhere?

```tsx
// 1. Open your page file (e.g., dashboard/page.tsx)

// 2. Add import at the top:
import AIRecommendations from "@/components/AIRecommendations"

// 3. Inside component, get auth & theme:
const { spotifyId } = useAuth()
const { isDarkMode } = useTheme()

// 4. Add to JSX:
<AIRecommendations spotifyId={spotifyId} isDarkMode={isDarkMode} />

// Done! ✅
```

## 📊 What Happens When You Load

```
1. Page loads
   ↓
2. Check auth (redirects if not logged in)
   ↓
3. Component mounts
   ↓
4. Check sessionStorage cache
   ├─ Cache valid? Load instantly ✨
   └─ Cache missing/expired? Fetch from API
   ↓
5. Show loading skeleton cards
   ↓
6. Fetch from: GET /recommendations?spotify_id={id}
   ↓
7. Parse response + save to cache
   ↓
8. Render 12-15 beautiful cards
   ↓
9. User hovers: card scales up ✨
   ↓
10. User clicks "Open in Spotify": opens in new tab
    ↓
11. User clicks "Regenerate": clears cache, repeats step 5-8
```

## 🎨 Visual Result

**Dark Mode:**
```
┌─────────────────────────────────────────────────────┐
│ AI                               [Regenerate ▔▔▔▔]│  Dark gray bg
│ Recommendations                                     │
│ Personalized tracks selected just for you          │
├─────────────────────────────────────────────────────┤
│ [Image]  [Image]  [Image]  [Image]                 │  4-column grid
│  Song     Song     Song     Song                    │  Cards with
│ Artist   Artist   Artist   Artist                   │  hover effect
│ [Open]   [Open]   [Open]   [Open]                   │
└─────────────────────────────────────────────────────┘
```

**Light Mode:**
```
┌─────────────────────────────────────────────────────┐
│ AI                               [Regenerate ▔▔▔▔]│  White bg
│ Recommendations                                     │
│ Personalized tracks selected just for you          │
├─────────────────────────────────────────────────────┤
│ [Image]  [Image]  [Image]  [Image]                 │  4-column grid
│  Song     Song     Song     Song                    │  Cards with
│ Artist   Artist   Artist   Artist                   │  hover effect
│ [Open]   [Open]   [Open]   [Open]                   │
└─────────────────────────────────────────────────────┘
```

## 🧪 Test It Out

### Test 1: Load Page
```
✅ Navigate to /recommendations
✅ Should show loading skeletons
✅ After 1-2 seconds, cards appear with images
✅ Each card shows title, artist, duration, year
```

### Test 2: Regenerate
```
✅ Click "Regenerate" button
✅ Should show "Regenerating..." with spinner
✅ Skeletons appear again
✅ New recommendations load
```

### Test 3: Open Spotify
```
✅ Click any "Open in Spotify" button
✅ New tab opens to Spotify track
✅ You can play it directly
```

### Test 4: Dark Mode
```
✅ Click theme toggle in navbar
✅ Colors change to dark theme
✅ Text remains readable
✅ Theme persists on page refresh
```

### Test 5: Responsive
```
✅ Resize browser to mobile (< 640px)
   - Shows 1 card per row
✅ Resize to tablet (640px - 768px)
   - Shows 2 cards per row
✅ Resize to desktop (> 1024px)
   - Shows 4 cards per row
```

## 📱 Files You Need to Know About

### Main Component
**File:** `/components/AIRecommendations.tsx`

This is the star. It does all the work:
- Fetches recommendations
- Manages state (loading, error, data)
- Displays cards
- Handles regenerate
- Caching logic

You don't need to edit this unless you want custom behavior.

### Utility Function
**File:** `/lib/formatDuration.ts`

Simple helper that converts ms to mm:ss:
```tsx
formatDuration(210000)  // Returns "3:30"
```

### Recommendations Page
**File:** `/app/recommendations/page.tsx`

Example integration showing:
- Auth check
- Dark mode support
- Component usage

You can copy this pattern to other pages.

## 🔧 Common Tasks

### Task 1: Use in Different Page

```tsx
// Copy-paste this into your page:
import AIRecommendations from "@/components/AIRecommendations"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"

export default function YourPage() {
  const { spotifyId } = useAuth()
  const { isDarkMode } = useTheme()

  return (
    <div className="max-w-7xl mx-auto px-8 py-16">
      <AIRecommendations spotifyId={spotifyId} isDarkMode={isDarkMode} />
    </div>
  )
}
```

### Task 2: Style the Container

```tsx
// Add wrapper classes:
<div className="bg-white dark:bg-gray-900">
  <AIRecommendations spotifyId={spotifyId} isDarkMode={isDarkMode} />
</div>
```

### Task 3: Add Section Padding

```tsx
<section className="py-16">
  <AIRecommendations spotifyId={spotifyId} isDarkMode={isDarkMode} />
</section>
```

### Task 4: Use formatDuration Elsewhere

```tsx
import { formatDuration } from "@/lib/formatDuration"

// In any component:
<span>{formatDuration(track.duration_ms)}</span>
```

## ⚠️ Common Issues & Fixes

### Issue: "Component not found"
```
Error: Cannot find module '@/components/AIRecommendations'
Fix: Make sure file is at: frontend/components/AIRecommendations.tsx
```

### Issue: "Cards show 'No recommendations'"
```
Reason: Backend API returned empty array
Fix: Check that backend is running and /recommendations endpoint works
```

### Issue: "API call fails (network error)"
```
Error: Failed to fetch recommendations
Fix: 
1. Make sure ngrok is running
2. Check API_BASE_URL in component
3. Backend must be responding to /recommendations?spotify_id={id}
```

### Issue: "spotifyId is null"
```
Reason: User not authenticated
Fix: Make sure user logged in via Spotify first
Component redirects to login automatically
```

### Issue: "Images don't load"
```
Reason: Image domains not configured
Fix: Already done in next.config.ts for i.scdn.co
If you add new image sources, add them there
```

## 📚 Documentation Files

Detailed docs in your project:

- **`IMPLEMENTATION_GUIDE.md`** - How everything works
- **`CODE_EXAMPLES.md`** - Copy-paste examples
- **`VISUAL_GUIDE.md`** - UI layouts and design
- **`FILE_STRUCTURE.md`** - Project organization
- **`DELIVERY_SUMMARY.md`** - What was delivered

## 🎯 API Contract

Component calls this backend endpoint:

```
GET /recommendations?spotify_id={user_id}

Response (200 OK):
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

Response (Error):
- 400: Missing spotify_id
- 401: Unauthorized
- 500: Server error
```

## 💾 Caching

Component automatically caches recommendations for 24 hours:

```
First load:    Fetch from API (1-2 seconds)
Second load:   Load from cache (instant!)
After 24h:     Cache expires, fetch again
Click regen:   Clear cache, fetch fresh
```

## 🚨 Before Going to Production

- [ ] Backend is deployed and running
- [ ] ngrok URL is updated (or use real domain)
- [ ] All tests pass in browser
- [ ] Dark/light mode works
- [ ] Cards look good on all screen sizes
- [ ] "Open in Spotify" opens successfully
- [ ] Cache works (verify via DevTools)
- [ ] Error states are tested

## 🎓 Next Steps

1. **Test the existing page:** `/recommendations`
2. **Read the docs:** See `IMPLEMENTATION_GUIDE.md`
3. **Copy to other pages:** Use the pattern shown above
4. **Customize if needed:** Add styles, change layout
5. **Deploy:** Push to production

## 📞 Quick Reference

### Props
```tsx
<AIRecommendations 
  spotifyId={string | null}  // User's Spotify ID
  isDarkMode={boolean}        // Current theme
/>
```

### States Handled
- ✅ Loading (skeleton cards)
- ✅ Success (card grid)
- ✅ Error (error message)
- ✅ Empty (empty state)
- ✅ Regenerating (button spinner)

### Features
- ✅ Responsive grid (1-4 columns)
- ✅ Caching (24-hour TTL)
- ✅ Dark/light mode
- ✅ Hover effects
- ✅ Regenerate button
- ✅ Open in Spotify
- ✅ Error handling
- ✅ No external dependencies

---

**Ready to go!** 🎉

Questions? Check the documentation files or inspect the component code.
