# Frontend File Structure & Organization

## Complete File Listing

### New Files Created

```
frontend/
├── components/
│   └── AIRecommendations.tsx          🆕 [430 lines]
│       Main recommendation display component
│       - Handles API fetching
│       - Manages loading/error/empty states
│       - Displays cards in responsive grid
│       - Cache management
│       - Regenerate functionality
│
├── lib/
│   └── formatDuration.ts              🆕 [13 lines]
│       Utility function to format milliseconds to mm:ss
│       - Used by AIRecommendations and Dashboard
│
├── app/
│   └── recommendations/
│       └── page.tsx                   📝 [Modified]
│           Example integration page
│           - Auth guard
│           - Dark mode support
│           - AIRecommendations integration
│
├── IMPLEMENTATION_GUIDE.md            🆕 [350+ lines]
│   Technical documentation
│   - Component overview
│   - Props reference
│   - Backend API contract
│   - Card layout details
│   - Styling system
│   - Caching behavior
│   - TypeScript interfaces
│   - Error handling
│   - Testing checklist
│
├── CODE_EXAMPLES.md                   🆕 [400+ lines]
│   Practical code examples
│   - Basic integration
│   - Custom layouts
│   - Type definitions
│   - Advanced patterns
│   - Event handling
│   - Error scenarios
│   - Common mistakes
│
├── VISUAL_GUIDE.md                    🆕 [300+ lines]
│   UI/UX documentation
│   - Layout diagrams
│   - State visualizations
│   - Interactive elements
│   - Color swatches
│   - Responsive breakpoints
│   - Typography hierarchy
│   - Animation timings
│   - Spacing guide
│   - Accessibility features
│
└── DELIVERY_SUMMARY.md                🆕 [250+ lines]
    Project completion summary
    - What was delivered
    - Requirements checklist
    - Architecture overview
    - Design system integration
    - Cache strategy
    - Integration checklist
    - Production readiness
```

### Existing Files (Unchanged)

```
frontend/
├── app/
│   ├── layout.tsx                     ✓ (Has Navbar/ThemeProvider)
│   ├── page.tsx                       ✓ (Landing page)
│   ├── globals.css                    ✓ (Tailwind config)
│   ├── dashboard/
│   │   └── page.tsx                   ✓ (Top Tracks section)
│   ├── stats/
│   │   └── page.tsx                   ✓ (Placeholder)
│   └── settings/
│       └── page.tsx                   ✓ (Placeholder)
│
├── components/
│   └── Navbar.tsx                     ✓ (Navigation bar)
│
├── context/
│   ├── AuthContext.tsx                ✓ (Auth state)
│   └── ThemeContext.tsx               ✓ (Dark mode state)
│
├── public/
│   └── [icons]                        ✓ (Static assets)
│
├── package.json                       ✓ (Dependencies)
├── tsconfig.json                      ✓ (TypeScript config)
├── next.config.ts                     ✓ (Next.js config)
├── tailwind.config.ts                 ✓ (Tailwind config)
├── postcss.config.mjs                 ✓ (PostCSS config)
└── eslint.config.mjs                  ✓ (ESLint config)
```

## Dependencies

### No New Dependencies Added ✅

Uses existing packages:
- `next@14.x`
- `react@18.x`
- `typescript@5.x`
- `tailwindcss@3.x`

The component is built with:
- React hooks (built-in)
- Next.js Image component (built-in)
- CSS-only styling (Tailwind)
- TypeScript (no runtime dependencies)

## Component Import Map

### For Using AIRecommendations in Other Pages

```tsx
// At the top of your page file:

// 1. Import the component
import AIRecommendations from "@/components/AIRecommendations"

// 2. Import hooks
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"

// 3. In your component:
const { spotifyId } = useAuth()
const { isDarkMode } = useTheme()

// 4. Render:
<AIRecommendations spotifyId={spotifyId} isDarkMode={isDarkMode} />
```

### For Using formatDuration Utility

```tsx
// In any component or utility file:
import { formatDuration } from "@/lib/formatDuration"

// Usage:
const duration = formatDuration(210000)  // "3:30"
```

## Type Imports

```tsx
// If creating custom types file:
import type { Recommendation } from "@/types"  // (hypothetical)

// But types are currently defined inline in:
// - AIRecommendations.tsx (for component use)
// - recommendation_service.py (backend)

// To extract types to shared file (optional):
// Create: frontend/types/recommendation.ts
export interface Recommendation {
  id: string
  title: string
  artist: string
  release_year: number
  duration_ms: number
  album_image: string
  spotify_url: string
}
```

## Build & Deployment

### Development
```bash
cd frontend
npm run dev
# Opens http://localhost:3000
```

### Production Build
```bash
cd frontend
npm run build
npm start
```

### No Build Issues
✅ All TypeScript compiles without errors
✅ No missing dependencies
✅ No circular imports
✅ Tailwind classes are recognized
✅ Image domains configured in next.config.ts

## Environment Configuration

No new environment variables required.

Existing configuration used:
```
.env.local (or .env)
NEXT_PUBLIC_API_BASE_URL=https://aliza-overcomplacent-isabell.ngrok-free.dev
```

Component hardcodes ngrok URL (as per dashboard pattern)

## File Size Summary

```
frontend/components/AIRecommendations.tsx    ~14 KB
frontend/lib/formatDuration.ts               ~0.3 KB
frontend/app/recommendations/page.tsx        ~2 KB (modified)

Production build impact: Minimal (all CSS-in-JS via Tailwind)

Gzipped component:       ~4 KB
Gzipped utility:         ~0.1 KB
Total gzipped addition:  ~4.1 KB
```

## Code Organization Principles

All files follow these patterns:

### Component Structure
```tsx
"use client"  // Client component

// Imports
import { ... } from "..."

// Interfaces/Types
interface Props { ... }
interface State { ... }

// Constants
const API_URL = "..."
const CACHE_KEY = "..."

// Helper Functions
const fetchData = async () => { ... }
const helper = () => { ... }

// Component
export default function Component() {
  // State
  const [state, setState] = useState()
  
  // Effects
  useEffect(() => { ... }, [])
  
  // Handlers
  const handleClick = () => { ... }
  
  // Render
  return (...)
}
```

### Utility Structure
```ts
// Export default or named
export const formatDuration = (ms: number): string => {
  // Implementation
  return result
}
```

### Page Structure
```tsx
"use client"

// Imports
// Interfaces
// Component

export default function Page() {
  // Auth check
  // Loading state
  // Render
}
```

## Module Resolution

All imports use `@/` alias (configured in tsconfig.json):

```
@/ → frontend/

Example paths:
@/components/AIRecommendations  → frontend/components/AIRecommendations.tsx
@/lib/formatDuration             → frontend/lib/formatDuration.ts
@/context/AuthContext            → frontend/context/AuthContext.tsx
@/app/dashboard                  → frontend/app/dashboard
```

## Testing File Structure (For Future)

When adding tests, use this structure:

```
frontend/
├── components/
│   ├── AIRecommendations.tsx
│   └── __tests__/
│       └── AIRecommendations.test.tsx
│
├── lib/
│   ├── formatDuration.ts
│   └── __tests__/
│       └── formatDuration.test.ts
│
└── app/
    └── recommendations/
        └── __tests__/
            └── page.test.tsx
```

## Linting & Formatting

Current setup (no changes needed):
- ESLint: `eslint.config.mjs`
- Prettier: Can be added if desired
- TypeScript: `tsconfig.json`
- Tailwind: `tailwind.config.ts`

All new code follows:
- 2-space indentation
- Semicolons on all statements
- Single quotes for strings (except JSX)
- Type annotations for function parameters
- camelCase for variables/functions
- PascalCase for components

## Git Ignore

Update `.gitignore` if needed (already has):
```
node_modules/
.next/
out/
dist/
*.log
```

No new files need to be ignored.

---

For detailed implementation info, see `IMPLEMENTATION_GUIDE.md`
For code examples, see `CODE_EXAMPLES.md`
For visual reference, see `VISUAL_GUIDE.md`
