# Visual Guide & UI Layout

## Component Layout

### Header Section (Desktop)
```
┌─────────────────────────────────────────────────────────────┐
│ AI                                                           │
│ Recommendations               [Regenerate Button]           │
│ Personalized tracks selected just for you                   │
└─────────────────────────────────────────────────────────────┘
```

### Card Grid Layouts

#### 1 Column (Mobile)
```
┌──────────────┐
│ Album Image  │
│              │
├──────────────┤
│ Song Title   │
│ Artist Name  │
│ Duration: 3:45
│ Released: 2020
│ [Open Spotify]
└──────────────┘
```

#### 2 Columns (Tablet)
```
┌──────────────┐ ┌──────────────┐
│ Album Image  │ │ Album Image  │
│              │ │              │
├──────────────┤ ├──────────────┤
│ Song Title   │ │ Song Title   │
│ Artist Name  │ │ Artist Name  │
│ Duration: 3:45│ │ Duration: 3:45
│ Released: 2020│ │ Released: 2020
│ [Open Spotify]│ │ [Open Spotify]
└──────────────┘ └──────────────┘
```

#### 4 Columns (Desktop)
```
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ Album │ │ Album │ │ Album │ │ Album │
│ Image │ │ Image │ │ Image │ │ Image │
├───────┤ ├───────┤ ├───────┤ ├───────┤
│ Title │ │ Title │ │ Title │ │ Title │
│ Artist│ │ Artist│ │ Artist│ │ Artist│
│ 3:45  │ │ 3:45  │ │ 3:45  │ │ 3:45  │
│ 2020  │ │ 2020  │ │ 2020  │ │ 2020  │
│ [Open]│ │ [Open]│ │ [Open]│ │ [Open]│
└───────┘ └───────┘ └───────┘ └───────┘
```

## State Visualization

### State: Loading
```
┌─────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░│  <- Skeleton pulse
│ ░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────┘
```

### State: Success
```
┌─────────────────────────┐
│ [ALBUM IMAGE]           │
│                         │
├─────────────────────────┤
│ Beautiful Song Title    │
│ Famous Artist Name      │
│ Duration:      3:45     │
│ Released:      2020     │
│ [Open in Spotify]       │
└─────────────────────────┘
```

### State: Error
```
╔═════════════════════════════════════╗
║  Failed to fetch recommendations   ║
║                                     ║
║  Try regenerating recommendations   ║
║  or check your connection.          ║
╚═════════════════════════════════════╝
```

### State: Empty
```
╔═════════════════════════════════════╗
║  No recommendations available       ║
║                                     ║
║  Try regenerating recommendations   ║
║  or listen to more music on Spotify.║
╚═════════════════════════════════════╝
```

## Interactive Elements

### Regenerate Button States

#### Idle (enabled)
```
┌─────────────────────┐
│  Regenerate         │
└─────────────────────┘
(Clickable, hover shows bg change)
```

#### Regenerating (disabled)
```
┌─────────────────────┐
│  ⟳ Regenerating...  │  (Spinner animates)
└─────────────────────┘
(Disabled, faded)
```

### Card Hover Effects

#### Default State
```
┌──────────────┐
│ Album Image  │  <- 1x scale
│              │
├──────────────┤
│ Song Title   │
│ Artist Name  │
│ [Open Spotify]
└──────────────┘
```

#### Hover State
```
  ╔═══════════════╗
  ║ Album Image  ║  <- 1.05x scale
  ║              ║
  ╠═══════════════╣
  ║ Song Title   ║  <- Image zoomed 110%
  ║ Artist Name  ║
  ║ [Open Spotify]│
  ╚═══════════════╝
  (Shadow appears, elevation effect)
```

### Open in Spotify Button

#### Dark Mode - Idle
```
┌────────────────────────┐
│  Open in Spotify       │  (gray-600 border)
└────────────────────────┘
```

#### Dark Mode - Hover
```
┌────────────────────────┐
│  Open in Spotify       │  (gray-500 border)
└────────────────────────┘  (bg-gray-700 background)
```

#### Light Mode - Idle
```
┌────────────────────────┐
│  Open in Spotify       │  (gray-300 border)
└────────────────────────┘
```

#### Light Mode - Hover
```
┌────────────────────────┐
│  Open in Spotify       │  (gray-400 border)
└────────────────────────┘  (bg-gray-100 background)
```

## Color Swatches

### Dark Mode Colors
```
┌─────────────────────────────────────────────┐
│ Background:  ■ #111827 (gray-900)           │
│ Card BG:     ■ #1F2937 (gray-800)           │
│ Primary Text:■ #FFFFFF (white)              │
│ Secondary:   ■ #9CA3AF (gray-400)           │
│ Border:      ■ #374151 (gray-700)           │
│ Hover BG:    ■ #374151 (gray-700)           │
└─────────────────────────────────────────────┘
```

### Light Mode Colors
```
┌─────────────────────────────────────────────┐
│ Background:  ■ #FFFFFF (white)              │
│ Card BG:     ■ #FFFFFF/80 (white w/ 80%)    │
│ Primary Text:■ #111827 (gray-900)           │
│ Secondary:   ■ #4B5563 (gray-600)           │
│ Border:      ■ #E5E7EB (gray-200)           │
│ Hover BG:    ■ #F9FAFB (gray-50)            │
└─────────────────────────────────────────────┘
```

## Responsive Breakpoints

### Mobile (< 640px)
```
320px ─────────────────────────────────────── 640px
       [Card at 100% width with padding]
       
       Total cards shown: 3-4 per screen
       Grid: grid-cols-1
       Gaps: 1.5rem
```

### Tablet (640px - 768px)
```
640px ──────────────────────────────────── 768px
      [Card][Card]
      [Card][Card]
      
      Total cards: 2 per row
      Grid: sm:grid-cols-2
      Gaps: 1.5rem
```

### Desktop (768px - 1024px)
```
768px ──────────────────────────────────────────── 1024px
      [Card][Card][Card]
      [Card][Card][Card]
      
      Total cards: 3 per row
      Grid: md:grid-cols-3
      Gaps: 1.5rem
```

### Wide (> 1024px)
```
1024px ─────────────────────────────────────────────────── Max (1280px)
       [Card][Card][Card][Card]
       [Card][Card][Card][Card]
       
       Total cards: 4 per row
       Grid: lg:grid-cols-4
       Gaps: 1.5rem
```

## Typography Hierarchy

### Header Section
```
┌─────────────────────────────────────────┐
│ AI                              [Font: 48px]
│ Recommendations                 [Font: 48px]
│                                 [Weight: Bold]
│                                 [Dark: white]
│                                 [Light: gray-900]
│
│ Personalized tracks selected...  [Font: 18px]
│                                  [Weight: Normal]
│                                  [Dark: gray-400]
│                                  [Light: gray-600]
└─────────────────────────────────────────┘
```

### Card Typography
```
┌──────────────────────┐
│ [Album Image Area]   │
├──────────────────────┤
│ Song Title           │ [Font: 16px, Bold]
│                      │ [Dark: white, Light: gray-900]
│ Artist Name          │ [Font: 14px, Normal]
│                      │ [Dark: gray-400, Light: gray-600]
│                      │ [Truncated if too long]
│ Duration:    3:45    │ [Font: 14px]
│ Released:    2020    │ [Label: gray, Value: darker]
│                      │
│ [Open in Spotify]    │ [Font: 14px, Medium weight]
└──────────────────────┘
```

## Animation Timings

All transitions use `duration-300` (300ms):

```
Color changes:    300ms ease
Hover scale:      300ms ease
Image zoom:       300ms ease
Opacity changes:  300ms ease
Skeleton pulse:   Built-in animate-pulse
Spinner:          Built-in animate-spin
```

## Spacing Guide

```
Container padding:      1.5rem (24px)
Grid gaps:              1.5rem (24px)
Card padding:           1.25rem (20px)
Section margins:        3rem (48px) vertical

Header margin bottom:   3rem (48px)
Title margin bottom:    0.75rem (12px)
Description margin:     1rem (16px)

Card title margin:      0.25rem (4px)
Card artist margin:     0.75rem (12px)
Card metadata spacing:  0.5rem (8px) between items
Card button margin:     1rem (16px) top
```

## Z-index Hierarchy

```
Component z-indices:
- Base card:        (no z-index) = 0
- Hover shadow:     (no z-index) = 0 (CSS shadow, not z-index)
- Navbar (parent):  Should be higher
- Loading spinner:  (no z-index) = 0

Note: All relative positioning, no z-index conflicts
```

## Accessibility Features

```
✓ Keyboard navigable
  - Tab to buttons
  - Enter to activate
  
✓ Focus states
  - Buttons show focus ring on :focus-visible
  
✓ Semantic HTML
  - <button> elements for interactivity
  - Proper heading hierarchy
  
✓ Color contrast
  - WCAG AA compliant
  - Not color-only information
  
✓ Screen reader friendly
  - Alt text on images
  - Descriptive button labels
  - Error messages readable
```

---

For detailed implementation, see `IMPLEMENTATION_GUIDE.md`
