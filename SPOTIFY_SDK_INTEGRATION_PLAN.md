# Spotify Web Playback SDK Integration Plan

**Status**: Planning Phase (No Implementation)  
**Date**: March 1, 2026  
**Project**: Music Recommender - AI-Powered Spotify Recommendations

---

## Executive Summary

This document provides a comprehensive analysis of integrating the Spotify Web Playback SDK into your existing full-stack application. The plan identifies required changes, architectural decisions, security considerations, and implementation sequence.

**Key Finding**: Your current architecture has a significant hurdle—the access token is never sent to the frontend, which is a security best practice but incompatible with Web Playback SDK usage. We must decide on a token exposure strategy.

---

## 1. OAuth & Scopes Analysis

### Current Scopes

**Status**: ❌ INSUFFICIENT FOR PLAYBACK

**Current Implementation** (in `backend/app/routes/auth.py:29`):
```python
"scope": "user-top-read user-read-email",
```

**Scopes Breakdown**:
- ✅ `user-top-read` — Read user's top tracks and artists
- ✅ `user-read-email` — Read email address
- ❌ `streaming` — Required for Web Playback SDK
- ❌ `user-read-playback-state` — Required to query current playback
- ❌ `user-modify-playback-state` — Required to control playback

### Required Scopes for Web Playback SDK

| Scope | Purpose | Priority |
|-------|---------|----------|
| `streaming` | Play music on Spotify Connect devices | **REQUIRED** |
| `user-read-playback-state` | Read current playback device & state | **REQUIRED** |
| `user-modify-playback-state` | Play, pause, next, previous, volume | **REQUIRED** |
| `user-read-currently-playing` | Get currently playing track | Optional (nice-to-have) |
| `user-library-modify` | Save/unsave tracks | Optional |
| `user-library-read` | Check saved tracks | Optional |

### Exact Changes Required in `auth.py`

**File**: `/backend/app/routes/auth.py`  
**Line**: 29

**Current**:
```python
"scope": "user-top-read user-read-email",
```

**Should Change To**:
```python
"scope": "user-top-read user-read-email streaming user-read-playback-state user-modify-playback-state",
```

**Migration Strategy**:
- Users with existing auth will need to **re-authenticate** to grant new scopes
- The app should detect when new scopes are missing and prompt re-login
- No breaking change if you make this a background redirect

### Scope Validation Consideration

⚠️ **Important**: Add validation in your auth flow to detect scope changes:
- Option 1: Store scopes in User model
- Option 2: Parse from Spotify API `/me` endpoint response (doesn't provide scope info)
- Option 3: Test scope availability at runtime

---

## 2. Access Token Flow Analysis

### Current Token Architecture

**Status**: ❌ NOT COMPATIBLE WITH WEB PLAYBACK SDK

#### How Tokens Currently Flow

```
1. Backend receives auth code from Spotify
   └─ /auth/callback?code=... (via OAuth redirect)

2. Backend exchanges code for tokens
   └─ Access Token + Refresh Token + Expiry stored in User model

3. Backend fetches user profile
   └─ GET /v1/me with access token

4. Backend redirects to frontend
   └─ /dashboard?spotify_id={spotify_id}
   └─ NO token is sent to frontend

5. Frontend requests data via API
   └─ GET /tracks/top?spotify_id=USER_ID
   └─ Backend uses stored token to call Spotify API
   └─ Returns enriched data to frontend
```

**Current Storage Location** (User Model):
```python
# backend/app/models/user.py
access_token = Column(String, nullable=False)
refresh_token = Column(String, nullable=False)
token_expiry = Column(DateTime, nullable=False)
```

### Web Playback SDK Token Requirement

**SDK Requirement**: The Spotify Web Playback SDK **MUST receive the access token in the browser**.

```javascript
const token = "YOUR_ACCESS_TOKEN_HERE";
Spotify.Player({
  name: "MusicFlow Player",
  getOAuthToken: callback => {
    callback(token);  // ← SDK calls this to get token
  },
  // ...
});
```

### Current Token Access from Frontend

**Analysis**:
- ❌ Access token is **NEVER sent to frontend** (secure, but incompatible)
- ❌ Frontend only knows `spotify_id` (passed via URL query param)
- ❌ Backend holds tokens in database
- ✅ Backend can refresh tokens automatically

### Solution Options

You have 3 options. Each has tradeoffs:

---

## 2a. Option A: Return Token in OAuth Callback

**Mechanism**: After OAuth callback, return access token to frontend via response body instead of redirect

**Implementation**:
```python
# Current behavior: Redirect (no token sent)
return RedirectResponse(url=frontend_url)

# Option A: Send token in response/cookie
# Return JSON with tokens + spotify_id
{
  "access_token": "...",
  "spotify_id": "...",
  "expires_in": 3600
}
```

**Frontend**: Store token (sessionStorage or localStorage)

**Pros**:
- Simple, straightforward implementation
- SDK can access token immediately
- No additional API calls needed

**Cons**:
- ⚠️ **Major Security Risk**: Tokens in sessionStorage/localStorage are XSS-vulnerable
- Token can be stolen by any script on page
- Spotify recommends against client-side token storage
- Violates OAuth 2.0 best practices

**Verdict**: ❌ **NOT RECOMMENDED** - Security risk

---

## 2b. Option B: Token in HTTP-Only Cookie (Recommended)

**Mechanism**: Store ONLY `spotify_id` in HTTP-only cookie. Keep `access_token` and `refresh_token` in PostgreSQL database.

**Implementation**:
```python
from fastapi import Response

@router.get("/callback")
async def callback(code: str, db: Session = Depends(get_db)) -> Response:
    # ... fetch tokens and user profile ...
    response = RedirectResponse(url=frontend_url)
    
    # Set HTTP-only cookie with ONLY spotify_id (identity)
    response.set_cookie(
        key="spotify_id",
        value=spotify_id,
        httponly=True,
        secure=True,  # HTTPS only in production
        samesite="lax",
        max_age=30 * 24 * 60 * 60,  # 30 days
    )
    
    # Store access_token and refresh_token in database (source of truth)
    # (already done via db.commit())
    
    return response
```

**Token Storage Architecture**:
- **Cookie**: `spotify_id` only (identity/session)
- **Database**: `access_token`, `refresh_token`, `token_expiry` (source of truth)

**Token Retrieval & Refresh**:
```python
@router.get("/auth/current-token")
async def get_current_token(request: Request, db: Session = Depends(get_db)):
    # Read spotify_id from cookie (identity)
    spotify_id = request.cookies.get("spotify_id")
    if not spotify_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Fetch user from database
    user = db.query(User).filter(User.spotify_id == spotify_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Refresh token if expired (within 5 minutes of expiry)
    if user.token_expiry - datetime.now() < timedelta(minutes=5):
        await _refresh_access_token(user, db)
    
    # Return fresh token
    return {"access_token": user.access_token}
```

**Frontend SDK Initialization**:
```typescript
// Fetch token using credentials to send cookies
const response = await fetch("/auth/current-token", {
  credentials: "include",  // ← CRITICAL: Send HTTP-only cookies
});
const data = await response.json();

Spotify.Player({
  getOAuthToken: callback => callback(data.access_token),
});
```

**Pros**:
- ✅ Tokens NEVER exposed in cookies (only in database)
- ✅ Tokens NEVER stored in JavaScript memory
- ✅ Prevents XSS token theft
- ✅ Follows OAuth 2.0 best practices
- ✅ Database is source of truth
- ✅ Clean separation: Cookie = Identity, DB = Secrets
- ✅ Automatic browser token transmission with `credentials: "include"`

**Cons**:
- Requires `/auth/current-token` endpoint
- Token must be fetched before SDK initialization
- Must use `credentials: "include"` in all API calls

**Verdict**: ✅ **RECOMMENDED** - Best security/functionality balance

---

## 2c. Option C: Backend Proxy for Playback Commands

**Mechanism**: Frontend never gets token; all Spotify API calls go through backend

**Implementation**:
```
Frontend (User clicks "Play")
  ↓
/playback/play (POST)
  ↓
Backend retrieves user + access token from DB
  ↓
Backend calls Spotify API with token
  ↓
Response sent back to frontend
```

**Pros**:
- Maximum security: Token never exposed to frontend
- Matches current architecture
- Can add authentication/authorization checks
- Easy to audit

**Cons**:
- Web Playback SDK cannot be initialized from frontend
- Requires custom player UI (cannot use SDK's device selection)
- Heavy backend load (every playback action needs API call)
- **SDK devices list cannot be accessed** (SDK needs direct token)
- Latency for every play/pause action

**Verdict**: ❌ **NOT VIABLE** - Defeats purpose of Web Playback SDK

---

## Recommended Approach: **Option B (HTTP-Only Cookie + Proxy Endpoint)**

This balances security with functionality:

1. ✅ Tokens in HTTP-only cookies (XSS-safe)
2. ✅ `/auth/current-token` endpoint for SDK initialization
3. ✅ Automatic browser token transmission via CORS
4. ✅ Follows Spotify & OAuth best practices
5. ✅ Works with existing architecture

---

## 3. Refresh Token Handling

### Current Implementation

**Status**: ✅ **Already exists, will be reused**

**Where Implemented**:
- `backend/app/routes/tracks.py` — Refreshes token before API calls
- `backend/app/services/recommendation_service.py` — Refreshes token before search

**Token Storage**:
- `user.access_token` — Current access token
- `user.refresh_token` — Long-lived refresh token (30 days)
- `user.token_expiry` — Expiry timestamp

---

### Simplified Refresh Strategy for Web Playback SDK

**Strategy**: Passive refresh only (no background polling or aggressive refresh)

**Implementation Location**: Inside `/auth/current-token` endpoint

**How It Works**:
```python
@router.get("/auth/current-token")
async def get_current_token(request: Request, db: Session = Depends(get_db)):
    spotify_id = request.cookies.get("spotify_id")
    
    user = db.query(User).filter(User.spotify_id == spotify_id).first()
    
    # Only refresh if token is expiring soon (within 5 minutes)
    if user.token_expiry - datetime.now() < timedelta(minutes=5):
        await _refresh_access_token(user, db)
    
    # Return fresh token
    return {"access_token": user.access_token}
```

**Pros**:
- ✅ Simple: Only refresh when requested
- ✅ Efficient: No background polling
- ✅ Automatic: Frontend doesn't need to manage refresh
- ✅ Reliable: Token is always fresh when returned

**Cons**:
- Initial `/auth/current-token` call adds ~100-200ms if refresh needed

**Token Expiry Timeline**:
- Spotify gives 3600 seconds (1 hour)
- Refresh at 5 min before expiry
- Safe margin for any edge cases

---

### What NOT to do

❌ **Remove**:
- Background refresh intervals
- Periodic token sync endpoints
- Frontend polling
- Multiple token endpoints

**Keep only**:
- ✅ Passive refresh inside `/auth/current-token`
- ✅ Existing refresh logic in `tracks.py` and `recommendation_service.py`

---

## 4. Backend Changes Required

### Architecture Decision: Direct SDK Communication

**Decision**: ❌ **NO backend playback routes needed**

**Rationale**:
- The Spotify Web Playback SDK communicates directly with Spotify API
- Adding backend proxy routes increases latency unnecessarily
- Backend complexity is not justified for direct device control
- SDK already handles device switching, playback state, etc.

**Backend Responsibility** (limited scope):
- OAuth authentication
- Token storage and management
- `/auth/current-token` endpoint for SDK initialization
- Token refresh logic (before returning to frontend)

**SDK Responsibility** (direct communication):
- Play, pause, next, previous
- Volume control
- Device switching
- Seeking
- All playback state management

---

### New Files to Create

#### A. `backend/app/routes/auth.py` — Major Updates (Already Exists)

**Changes Required**:

1. **Update OAuth scopes** (line 29)
2. **Set HTTP-only cookie for `spotify_id`** (callback endpoint)
3. **Add `/auth/current-token` endpoint** (new)
4. **Add token refresh logic** (new or import from service)
5. **Add `/auth/logout` endpoint** (to clear cookies)

**New Endpoints**:
```python
GET  /auth/login          # Existing - redirect to Spotify (update scopes)
GET  /auth/callback       # Existing - set spotify_id cookie
GET  /auth/current-token  # NEW - fetch & refresh token, return access_token
POST /auth/logout         # NEW - clear cookies
GET  /auth/validate       # NEW - check if authenticated
```

**Implementation Details**:
```python
# auth.py changes:

# 1. Update scopes (line 29)
"scope": "user-top-read user-read-email streaming user-read-playback-state user-modify-playback-state"

# 2. In callback, set spotify_id cookie
response.set_cookie(
    key="spotify_id",
    value=spotify_id,
    httponly=True,
    secure=True,
    samesite="lax",
    max_age=30 * 24 * 60 * 60,
)

# 3. Add current-token endpoint
@router.get("/auth/current-token")
async def get_current_token(request: Request, db: Session = Depends(get_db)):
    spotify_id = request.cookies.get("spotify_id")
    if not spotify_id:
        raise HTTPException(status_code=401)
    
    user = db.query(User).filter(User.spotify_id == spotify_id).first()
    if not user:
        raise HTTPException(status_code=401)
    
    # Passive refresh: only refresh if expiring
    if user.token_expiry - datetime.now() < timedelta(minutes=5):
        await _refresh_access_token(user, db)
    
    return {"access_token": user.access_token}
```

---

### Modifications to Existing Files

#### B. `backend/app/main.py` — Verify CORS Configuration

**Current CORS** (line 16-22):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,  # ✅ Required for credentials: "include"
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

**Status**: ✅ **Already correct!**

**Why Important**: 
- `allow_credentials=True` enables HTTP-only cookies to be sent
- Frontend fetch calls with `credentials: "include"` will work
- CORS will validate cookie transmission

---

#### C. `backend/app/models/user.py` — No Changes Needed

**Current Fields**: ✅ **Sufficient for playback**

```python
class User(Base):
    id: UUID
    spotify_id: String (unique)
    email: String
    display_name: String
    access_token: String          # ← Source of truth
    refresh_token: String         # ← Source of truth
    token_expiry: DateTime        # ← Manages refresh timing
    created_at: DateTime
```

**Verdict**: ❌ **NO schema changes needed** — Keep session-based architecture

---

### No Backend Playback Routes

❌ **Do NOT create**:
- `/playback/play`
- `/playback/pause`
- `/playback/next`
- `/playback/previous`
- `/playback/device`
- `/playback/volume`
- `/playback/state`

**Reason**: SDK communicates directly with Spotify API. Backend proxy routes are unnecessary overhead.

---

### Simplified Backend Scope

**Only** the following backend responsibilities:

| Responsibility | File | Endpoint |
|---|---|---|
| OAuth redirect to Spotify | `auth.py` | `GET /auth/login` |
| Handle OAuth callback | `auth.py` | `GET /auth/callback` |
| Return fresh token | `auth.py` | `GET /auth/current-token` |
| Clear session | `auth.py` | `POST /auth/logout` |
| Check authentication | `auth.py` | `GET /auth/validate` |
| Get top tracks | `tracks.py` | `GET /tracks/top` |
| Get top artists | `artists.py` | `GET /artists/top` |
| Get AI recommendations | `recommendations.py` | `GET /recommendations` |

**Everything else**: Handled by Spotify SDK on frontend

## 5. Frontend Integration Planning

### Where to Load Spotify SDK Script

**Options**:

#### Option 1: Load in `layout.tsx` (ROOT LAYOUT)
```typescript
// frontend/app/layout.tsx
import { useEffect } from "react"

export default function RootLayout({ children }) {
  useEffect(() => {
    // Load Spotify SDK globally
    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true
    document.body.appendChild(script)
    
    // Wait for SDK to be ready
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("Spotify SDK is ready")
    }
  }, [])
  
  return (/* ... */)
}
```

**Pros**: SDK loads globally, available everywhere  
**Cons**: Loads even for non-authenticated users

#### Option 2: Load in Dashboard (CONDITIONAL)
```typescript
// frontend/app/dashboard/page.tsx
useEffect(() => {
  if (!spotifyId) return // Don't load if not logged in
  
  const script = document.createElement("script")
  script.src = "https://sdk.scdn.co/spotify-player.js"
  document.body.appendChild(script)
}, [spotifyId])
```

**Pros**: Only loads for authenticated users  
**Cons**: Not available in other pages

#### Option 3: Load in Vercel Environment
```typescript
// frontend/next.config.ts
const nextConfig = {
  // Include Spotify SDK in external scripts
  experimental: {
    scrollRestoration: true,
  },
}
```

**Verdict**: ✅ **Option 1 (Root Layout)** — Simplest, loads once

---

### Player Context vs Component-Based

**Recommendation**: Create **PlayerContext + Provider** + **PlayerBar Component**

```
PlayerContext
  ├─ isPlaying: boolean
  ├─ currentTrack: Track | null
  ├─ deviceId: string | null
  ├─ devices: SpotifyDevice[]
  ├─ position: number
  ├─ duration: number
  ├─ methods: play(), pause(), next(), etc.
  └─ listeners: Spotify SDK listeners

PlayerBar.tsx (Global Component)
  ├─ Display current track
  ├─ Play/pause buttons
  ├─ Progress bar
  ├─ Device selector
  └─ Volume control

Layout.tsx
  ├─ <PlayerProvider>
  ├─ {children}
  └─ <PlayerBar />
```

### New Frontend Files to Create

#### A. `frontend/context/PlayerContext.tsx` (NEW)

**Responsibilities**:
- Initialize Spotify SDK
- Manage playback state
- Handle device selection
- Sync with SDK listeners

**State Structure**:
```typescript
interface PlayerContextType {
  // State
  isPlaying: boolean
  currentTrack: SpotifyTrack | null
  devices: SpotifyDevice[]
  selectedDeviceId: string | null
  position: number
  duration: number
  isReady: boolean
  
  // Methods
  play: (uri: string) => Promise<void>
  pause: () => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  seek: (position: number) => Promise<void>
  setDevice: (deviceId: string) => Promise<void>
  setVolume: (volume: number) => void
  
  // Listeners
  onTrackChange: (callback: (track: SpotifyTrack) => void) => void
}
```

---

#### B. `frontend/components/Player/PlayerBar.tsx` (NEW)

**Features**:
- Current track display
- Album art
- Play/pause button
- Previous/next buttons
- Progress bar with seek
- Volume control
- Device selector dropdown
- Share button

---

#### C. `frontend/components/Player/DeviceSelector.tsx` (NEW)

**Functionality**:
- List available Spotify devices
- Show device type (phone, desktop, speaker)
- Transfer playback to selected device
- Show current device indicator

---

#### D. `frontend/hooks/useSpotifySDK.ts` (NEW)

**Purpose**: Custom hook to manage SDK initialization & player instance

```typescript
export const useSpotifySDK = () => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  
  useEffect(() => {
    if (window.Spotify) {
      const player = new window.Spotify.Player({/* ... */})
      player.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id)
        setIsReady(true)
      })
      player.connect()
      setPlayer(player)
    }
  }, [])
  
  return { player, isReady, deviceId }
}
```

---

#### E. `frontend/lib/spotify-sdk.ts` (NEW)

**Purpose**: Spotify Web Playback SDK type definitions & utilities

```typescript
// Extend global Window type
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: typeof Spotify
  }
}

// Spotify namespace types
namespace Spotify {
  interface Player {
    addListener: (event: string, callback: Function) => void
    connect: () => Promise<boolean>
    disconnect: () => void
    getCurrentState: () => Promise<PlaybackState | null>
    // ... more methods
  }
  
  interface PlaybackState {
    track_window: {
      current_track: Track
      next_tracks: Track[]
      previous_tracks: Track[]
    }
    playback_position: number
    is_playing: boolean
    is_paused: boolean
  }
}
```

---

### Device ID Management & Activation

**🔴 CRITICAL STEP**: After SDK initialization and receiving `device_id`, you MUST transfer playback to that device.

**Why**: Without this step, the browser is registered as a device but playback won't work. Spotify requires an explicit device activation/transfer.

**Implementation Flow**:
```typescript
const player = new Spotify.Player({
  name: "MusicFlow Player",
  getOAuthToken: callback => {
    // Fetch token using credentials to send cookies
    fetch("/auth/current-token", { credentials: "include" })
      .then(r => r.json())
      .then(data => callback(data.access_token))
  },
})

// Register listeners
player.addListener("ready", ({ device_id }) => {
  console.log("Device ID:", device_id)
  
  // 🔴 CRITICAL: Transfer playback to browser device
  setPlaybackDevice(device_id)
  
  // Store device_id in PlayerContext
  setDeviceId(device_id)
})

// Connect player
player.connect()

// Function to transfer playback
async function setPlaybackDevice(deviceId: string) {
  const token = await fetch("/auth/current-token", { 
    credentials: "include" 
  }).then(r => r.json())
  
  // Call Spotify API directly to transfer playback
  await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      device_ids: [deviceId],
      play: false,
    }),
  })
}
```

**Device Flow**:
1. SDK initializes → generates `device_id`
2. `ready` listener fires with `device_id`
3. **CALL `setPlaybackDevice(device_id)` immediately** ← CRITICAL
4. Browser becomes active playback device
5. User can now play music via player
6. Spotify recognizes browser as playback target

**Storage**:
- Store `device_id` in PlayerContext state
- Use for subsequent playback commands
- Device ID is session-specific (changes per init)

---

## 6. Deployment Considerations

### Spotify Developer Dashboard Changes

#### Update OAuth Redirect URI

**Current** (in `.env`):
```
SPOTIFY_REDIRECT_URI=http://localhost:8000/auth/callback
```

**For Production**:
```
SPOTIFY_REDIRECT_URI=https://recommendation-model-b8bn.onrender.com/auth/callback
```

**Steps**:
1. Go to Spotify Developer Dashboard
2. Edit your app
3. In "Redirect URIs" section
4. Add: `https://recommendation-model-b8bn.onrender.com/auth/callback`
5. **Keep localhost version** for development
6. Save

---

### Web Playback SDK Domain Settings

**Important**: Spotify SDK can run on any domain by default

**No explicit registration needed**, BUT:
- Verify bundle is served over HTTPS (required for playback)
- SDK checks origin via CORS headers
- CORS configuration in FastAPI handles this

**What to verify**:
- ✅ Frontend domain has HTTPS (Vercel provides this)
- ✅ Backend domain has HTTPS (Render provides this)
- ✅ ALLOWED_ORIGINS includes frontend domain

---

### HTTPS Requirements

**Spotify Web Playback SDK REQUIRES HTTPS**

| Environment | Status | Requirement |
|------------|--------|------------|
| Localhost | ✅ | Works for dev (HTTP allowed) |
| Vercel (Frontend) | ✅ | Always HTTPS |
| Render (Backend) | ✅ | Always HTTPS |
| Production | ✅ | Both must be HTTPS |

**Current Status**: ✅ Already meets requirements (both services use HTTPS in production)

---

### Environment Variables

**Backend (Render)**:
```env
# New variables NOT needed for SDK integration
# Existing configuration is sufficient:
DATABASE_URL=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=https://recommendation-model-b8bn.onrender.com/auth/callback
GEMINI_API_KEY=...
ENVIRONMENT=production
FRONTEND_URL=https://recommendation-model-iota.vercel.app
ALLOWED_ORIGINS=https://recommendation-model-iota.vercel.app
```

**Frontend (Vercel)**:
```env
# Only variable needed (already exists)
NEXT_PUBLIC_API_BASE_URL=https://recommendation-model-b8bn.onrender.com
```

---

## 7. Database Impact

### Model Modifications Needed

**Current `User` Model** (Sufficient):
```python
class User(Base):
    id: UUID
    spotify_id: String (unique)
    email: String
    display_name: String
    access_token: String
    refresh_token: String
    token_expiry: DateTime
    created_at: DateTime
```

**Question**: Should we store playback-related data?

| Field | Needed? | Rationale |
|-------|---------|-----------|
| `preferred_device_id` | ❌ | Session-specific, changes per login |
| `preferred_device_name` | ❌ | For UX, but frontendcan store locally |
| `last_track_played` | ❌ | Spotify provides this via API |
| `playback_history` | ❌ | Use Spotify API instead |
| `device_id` | ❌ | Regenerated per session |
| `last_playback_sync` | ⚠️ | Optional: for analytics |

### Recommendation

**❌ NO DATABASE CHANGES NEEDED**

**Rationale**:
- Playback is fundamentally session-based
- Device ID is ephemeral (changes per SDK init)
- Spotify API provides all playback state
- Keep it stateless for simpler architecture

**Exception**: If you want analytics/logging:
```python
class PlaybackEvent(Base):
    id: UUID
    spotify_id: String  # Foreign key
    event_type: String  # "play", "pause", "skip"
    track_uri: String
    device_type: String
    timestamp: DateTime
```

---

## 8. Security Concerns

### Token Architecture Security

**Strategy**: Cookies = Identity, Database = Secrets

**Implementation**:
- HTTP-only cookie: `spotify_id` only
- PostgreSQL database: `access_token`, `refresh_token`, `token_expiry`

**Security Model**:
```
User Authenticates
  ↓
Backend validates via Spotify OAuth
  ↓
Sets HTTP-only cookie with spotify_id
  ↓
Stores tokens in database (encrypted at rest)
  ↓
Frontend sends credentials: "include" with fetch
  ↓
Backend reads cookie, looks up user, returns fresh token
  ↓
Token never stored in JavaScript or localStorage
  ↓
XSS-safe, CSRF-protected, OAuth-compliant
```

---

### Risk Analysis

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **XSS Attack** | 🔴 HIGH | HTTP-only cookies block JavaScript access |
| **CSRF Attack** | 🟡 MEDIUM | SameSite=Lax cookie flag prevents forged requests |
| **Token Interception** | 🔴 HIGH | HTTPS everywhere (required by SDK) |
| **Database Breach** | � MEDIUM | Tokens encrypted at rest in PostgreSQL |
| **Token in Logs** | 🟡 MEDIUM | Never log access tokens |
| **Missing credentials: include** | 🔴 CRITICAL | Frontend must use `credentials: "include"` |
| **Session Hijacking** | 🟡 MEDIUM | Short token lifetime (1 hour) |
| **Stale Token Usage** | � MEDIUM | Auto-refresh before returning |

---

### Critical Frontend Requirement: credentials: "include"

⚠️ **This is essential for the architecture to work**

When fetching token from backend, MUST include credentials:
```typescript
// ✅ CORRECT - Sends HTTP-only cookies
fetch("/auth/current-token", { 
  credentials: "include" 
})

// ❌ WRONG - Cookies not sent, authentication fails
fetch("/auth/current-token")

// ✅ CORRECT - Spotify direct API calls with token
fetch("https://api.spotify.com/v1/me/player", {
  headers: {
    "Authorization": `Bearer ${token}`,
  },
})
```

---

### Best Practices

#### 1. HTTP-Only Cookie Configuration

```python
response.set_cookie(
    key="spotify_id",
    value=spotify_id,
    httponly=True,      # ✅ JavaScript cannot read
    secure=True,        # ✅ HTTPS only (production)
    samesite="lax",     # ✅ CSRF protection
    max_age=30*24*60*60, # ✅ 30 days
    path="/",           # ✅ Available to all paths
    domain=None,        # ✅ Current domain only
)
```

#### 2. Token Endpoint Security

```python
@router.get("/auth/current-token")
async def get_current_token(request: Request, db: Session = Depends(get_db)):
    # ✅ Only accessible with valid spotify_id cookie
    spotify_id = request.cookies.get("spotify_id")
    if not spotify_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = db.query(User).filter(User.spotify_id == spotify_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # ✅ Refresh if expiring soon
    if user.token_expiry - datetime.now() < timedelta(minutes=5):
        await _refresh_access_token(user, db)
    
    # ✅ Return only access_token (never refresh_token)
    return {"access_token": user.access_token}
```

#### 3. Frontend Token Usage

```typescript
// ✅ CORRECT: Fetch token and use immediately
const response = await fetch("/auth/current-token", { 
  credentials: "include" 
})
const data = await response.json()

// Use in SDK immediately
Spotify.Player({
  getOAuthToken: callback => callback(data.access_token),
})

// ❌ DON'T: Store in localStorage
localStorage.setItem("access_token", data.access_token)

// ❌ DON'T: Log the token
console.log("Token:", data.access_token)

// ❌ DON'T: Keep in memory longer than needed
let token = data.access_token
// ... later ...
token = null  // Clear from memory
```

#### 4. Logout Endpoint

```python
@router.post("/auth/logout")
async def logout(response: Response):
    # Clear spotify_id cookie (and any other session cookies)
    response.delete_cookie("spotify_id", path="/")
    
    # Optional: Also redirect to homepage
    return RedirectResponse(url=settings.FRONTEND_URL, status_code=302)
```

---

### What Token Rotation Strategy to Use

**Strategy**: Passive refresh only

- Token refreshed when `/auth/current-token` is called
- If token is within 5 min of expiry, refresh it before returning
- No background polling needed
- No periodic sync needed
- Frontend doesn't manage refresh lifecycle

**Why This Works**:
- Every SDK initialization calls `/auth/current-token`
- Every track click might call it again
- Token is always fresh when needed
- Simple, efficient, reliable

---

## Implementation Order & Phases

### Phase 1: OAuth & Token Foundation (2-3 hours)

**Objective**: Update auth flow to support SDK

**Backend Changes**:
1. Update OAuth scopes in `auth.py` (line 29)
2. Set HTTP-only cookie for `spotify_id` in callback
3. Create `/auth/current-token` endpoint
4. Create `/auth/logout` endpoint
5. Implement passive token refresh logic
6. Update Spotify Developer Dashboard redirect URI

**Verification**:
- OAuth flow completes without errors
- `spotify_id` cookie is set (check DevTools → Application → Cookies)
- `/auth/current-token` returns `{"access_token": "..."}`
- Token refresh works (test with expired token)

---

### Phase 2: Spotify SDK Setup (2-3 hours)

**Objective**: Initialize SDK and get device_id

**Frontend Changes**:
1. Load Spotify SDK script in root layout
2. Create `PlayerContext.tsx` for SDK state
3. Create `useSpotifySDK.ts` hook
4. Implement `getOAuthToken` callback (uses `credentials: "include"`)
5. Handle SDK ready event
6. **CRITICAL: Implement device transfer**

**Verification**:
- SDK loads without errors (console: "Spotify SDK Ready")
- Device ID is generated (console: "Device ID: xxx")
- Device transfer succeeds (browser becomes playback device)
- Token fetch includes credentials (Network tab: includes cookies)

---

### Phase 3: Player UI Components (3-4 hours)

**Objective**: Build player interface

**Frontend Components**:
1. Create `PlayerBar.tsx` (global component)
2. Create `DeviceSelector.tsx` (dropdown)
3. Add play/pause buttons
4. Add next/previous buttons
5. Add progress bar with seek
6. Add volume control
7. Style for dark/light modes

**Verification**:
- Components visible on dashboard
- No console errors
- Device selector shows Spotify devices
- Buttons are clickable

---

### Phase 4: Playback Control Integration (3-4 hours)

**Objective**: Wire up playback logic

**Frontend Logic**:
1. Implement SDK `play()` method
2. Implement `pause()`, `next()`, `previous()`
3. Implement device switching
4. Implement volume control
5. Handle SDK listeners (player_state_changed, etc.)
6. Sync UI with playback state

**Testing**:
- Play music from player
- All buttons work
- Device switching works
- Volume control works
- Playback state updates in real-time

---

### Phase 5: Track Card Integration (2-3 hours)

**Objective**: Make tracks playable from cards

**Frontend Changes**:
1. Replace `window.open(spotify_url)` with SDK play
2. Update `TrackCard.tsx` onClick handler
3. Update `ArtistCard.tsx` onClick handler
4. Update `AIRecommendations.tsx` onClick handler
5. Add "Now Playing" indicator
6. Display current track in PlayerBar

**Testing**:
- Click track card → plays immediately
- Current track displays in PlayerBar
- Progress bar updates
- Next track in queue visible (if implemented)

---

### Phase 6: Testing & Edge Cases (2-3 hours)

**Objective**: Ensure reliability

**Testing Checklist**:
1. Token refresh during playback (play for 1+ hour)
2. Device switching mid-playback
3. SDK reconnection after disconnect
4. Browser refresh (should restore state if possible)
5. Logout and re-login
6. Mobile browser responsiveness
7. Multiple browser tabs (each gets device_id)
8. Network errors and recovery

**Edge Cases**:
- What if SDK fails to initialize?
- What if device activation fails?
- What if token refresh fails?
- What if multiple tabs play simultaneously?
- What if user closes Spotify app?

---

### Phase 7: Deployment & Production (1-2 hours)

**Objective**: Launch to production

**Backend (Render)**:
1. Deploy code changes to Render
2. Verify env variables are set
3. Test `/auth/current-token` on production URL
4. Verify HTTPS is enforced

**Frontend (Vercel)**:
1. Deploy code changes to Vercel
2. Verify env variable `NEXT_PUBLIC_API_BASE_URL` is set
3. Test full OAuth flow on production
4. Verify HTTPS is enforced

**Final Verification**:
1. Login with Spotify account (production)
2. SDK initializes and gets device_id
3. Play music from player
4. Switch devices
5. Logout works
6. Browser refresh restores state

---

## Risk Assessment & Edge Cases

### High-Risk Items

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Missing credentials: "include"** | 🔴 CRITICAL | Must use `credentials: "include"` in all fetch calls to token endpoint |
| **SDK initialization fails** | 🔴 HIGH | Graceful fallback to Spotify link, error logging |
| **Device activation fails** | � HIGH | Retry device transfer, show user warning |
| **Token expires mid-playback** | 🟡 MEDIUM | Request new token for next action |
| **Device disconnect** | 🟡 MEDIUM | Auto-reconnect, show offline message |

### Medium-Risk Items

| Risk | Mitigation |
|------|-----------|
| **CORS issues** | Verify frontend domain in ALLOWED_ORIGINS, test credentials: "include" |
| **Cookie not sent** | Check Secure/SameSite flags match environment |
| **SDK script fails to load** | Add fallback to Spotify link, CDN backup |
| **No available devices** | Show message, check if Spotify app is open |
| **Multiple browser tabs** | Each gets separate device_id, last active device used |

### Low-Risk Items

| Risk | Mitigation |
|------|-----------|
| **Volume not working** | Check browser permissions |
| **Dark mode rendering** | CSS already handles both modes |
| **Responsive layout** | Mobile-first design |
| **Network latency** | Token fetch adds ~100-200ms, acceptable |

---

## Summary: Final Architecture

### Backend Responsibilities

1. **OAuth Authentication**
   - Redirect to Spotify authorization
   - Handle OAuth callback
   - Exchange authorization code for tokens

2. **Token Storage & Management**
   - Store `access_token`, `refresh_token`, `token_expiry` in PostgreSQL
   - Keep `spotify_id` in database as well
   - Never expose tokens to frontend

3. **Token Delivery**
   - `/auth/current-token` endpoint
   - Checks `spotify_id` cookie (identity)
   - Looks up user in database
   - Auto-refreshes token if expiring
   - Returns fresh `access_token` only

4. **Session Management**
   - Set HTTP-only cookie with `spotify_id`
   - `/auth/logout` endpoint clears cookie
   - CORS allows credentials with proper configuration

5. **Existing Features** (unchanged)
   - `/tracks/top` — Get user's top tracks
   - `/artists/top` — Get user's top artists
   - `/recommendations` — Get AI recommendations

---

### Frontend Responsibilities

1. **SDK Initialization**
   - Load Spotify SDK script in root layout
   - Create PlayerContext for state management
   - Fetch token using `credentials: "include"`
   - Initialize Spotify.Player with token

2. **Device Activation** (Critical)
   - Receive `device_id` from SDK ready event
   - **IMMEDIATELY** transfer playback to browser device
   - Store `device_id` in PlayerContext

3. **Playback Control**
   - Play, pause, next, previous via SDK methods
   - Volume control via SDK
   - Device switching via Spotify API + SDK
   - Progress bar and seeking via SDK

4. **UI Components**
   - PlayerBar component (global)
   - DeviceSelector component
   - Play/pause buttons
   - Progress bar
   - Volume control
   - Current track display

5. **Track Integration**
   - Replace "Open in Spotify" with player control
   - TrackCard click → play via SDK
   - ArtistCard click → play via SDK
   - AIRecommendations click → play via SDK

---

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER AUTHENTICATION                    │
└─────────────────────────────────────────────────────────────┘

Frontend: User clicks "Sign In"
  ↓
Backend: GET /auth/login
  ↓
Spotify OAuth: Authorization flow
  ↓
Spotify: Redirects with auth code
  ↓
Backend: GET /auth/callback?code=...
  ├─ Exchanges code for access_token, refresh_token
  ├─ Stores tokens in PostgreSQL
  └─ Sets HTTP-only cookie with spotify_id
  ↓
Backend: Redirects to frontend /dashboard
  ↓
Frontend: Authenticated, ready for playback


┌─────────────────────────────────────────────────────────────┐
│                        SDK INITIALIZATION                     │
└─────────────────────────────────────────────────────────────┘

Frontend: Loads Spotify SDK in layout
  ↓
Frontend: Calls getToken() function
  ├─ fetch("/auth/current-token", { credentials: "include" })
  │   ↓
  │ Backend: Reads spotify_id from cookie
  │   ├─ Looks up user in database
  │   ├─ Checks if token is expiring (5 min rule)
  │   └─ Returns fresh access_token
  │   ↓
  │ Frontend: Receives access_token
  └─ Passes to Spotify.Player via getOAuthToken callback
  ↓
Spotify.Player: Initializes with token
  ├─ Generates device_id
  └─ Fires "ready" event
  ↓
Frontend: Receives ready event
  ├─ Stores device_id in PlayerContext
  ├─ **CALLS setPlaybackDevice(device_id)** ← CRITICAL
  │   └─ Transfers playback to browser
  └─ Player now ready for music


┌─────────────────────────────────────────────────────────────┐
│                        PLAYBACK CONTROL                       │
└─────────────────────────────────────────────────────────────┘

User: Clicks play button / track card
  ↓
Frontend: Calls SDK method (e.g., player.resume())
  ↓
Spotify SDK: Communicates directly with Spotify
  ├─ Uses token stored in browser memory (from /auth/current-token)
  └─ Spotify validates token and plays music
  ↓
Player: Music plays on browser speaker
  ↓
SDK Listener: Emits playback_changed event
  ↓
Frontend: Updates PlayerBar with current track
  ├─ Album art
  ├─ Track name
  ├─ Artist
  ├─ Progress
  └─ Duration


┌─────────────────────────────────────────────────────────────┐
│                        DEVICE SWITCHING                       │
└─────────────────────────────────────────────────────────────┘

User: Clicks device selector
  ↓
Frontend: Gets fresh token from /auth/current-token
  ├─ fetch("/auth/current-token", { credentials: "include" })
  └─ Backend returns fresh access_token
  ↓
Frontend: Calls Spotify API directly
  ├─ PUT /v1/me/player
  ├─ Headers: Authorization: Bearer {token}
  └─ Body: { device_ids: [new_device_id], play: true/false }
  ↓
Spotify API: Transfers playback to selected device
  ↓
Player: Updates device and continues playback


┌─────────────────────────────────────────────────────────────┐
│                        LOGOUT                                 │
└─────────────────────────────────────────────────────────────┘

User: Clicks logout
  ↓
Frontend: POST /auth/logout
  ↓
Backend: Clears spotify_id cookie
  ↓
Frontend: Clears PlayerContext state
  ↓
Player: Disconnects from SDK
  ↓
User: Redirected to login page
```

---

### Token Flow Summary

| Step | Component | Data | Storage |
|------|-----------|------|---------|
| 1. OAuth | Spotify → Backend | `access_token`, `refresh_token` | PostgreSQL |
| 2. Session | Backend → Frontend | `spotify_id` | HTTP-only cookie |
| 3. Token Request | Frontend → Backend | Cookie with `spotify_id` | (in request) |
| 4. Token Lookup | Backend | Query user by `spotify_id` | PostgreSQL read |
| 5. Token Refresh | Backend | If expiring, call Spotify | PostgreSQL update |
| 6. Token Return | Backend → Frontend | `access_token` | Browser memory (temp) |
| 7. SDK Init | Frontend | Pass token to `getOAuthToken` | SDK internal |
| 8. Playback | SDK → Spotify | Use token directly | (in authorization header) |

---

## Security Checklist

- [ ] HTTP-only cookies configured with `httponly=True`
- [ ] Secure flag set to `True` for HTTPS-only
- [ ] SameSite set to `Lax` for CSRF protection
- [ ] Token refresh implemented before expiry
- [ ] `/auth/current-token` endpoint secured
- [ ] CORS allows frontend domain only
- [ ] No tokens logged in backend
- [ ] No tokens in URL or localStorage
- [ ] HTTPS enforced in production
- [ ] Spotify redirect URI updated in dashboard

---

## Final Recommendations

### ✅ DO

1. **Use HTTP-Only Cookies** (Option B) for token storage
2. **Auto-refresh tokens** before expiry (in `/auth/current-token`)
3. **Create PlayerContext** for centralized SDK state
4. **Keep playback session-based** (no DB storage needed)
5. **Load SDK in root layout** for global availability
6. **Test device switching** extensively
7. **Add error handling** for SDK failures
8. **Monitor token expiry** in production

### ❌ DON'T

1. ❌ Store tokens in localStorage/sessionStorage
2. ❌ Log tokens anywhere
3. ❌ Put tokens in URL query parameters
4. ❌ Use Option A (unsecured response body)
5. ❌ Create database playback tables (unnecessary)
6. ❌ Skip HTTPS in production
7. ❌ Ignore token refresh
8. ❌ Expose `spotify_id` in places other than cookies

---

## Questions to Consider Before Implementation

Before you start building, discuss these with your team:

1. **Do you want backend playback logging/analytics?**
   - If yes: Create optional `PlaybackEvent` table
   - If no: Keep purely session-based

2. **Should device preference persist across sessions?**
   - If yes: Add `preferred_device_id` to User model
   - If no: Current architecture is fine

3. **Do you want a queue/playlist preview?**
   - If yes: Create Queue UI component + service
   - If no: Keep simple player

4. **Should users see playback history?**
   - If yes: Use Spotify API `/v1/me/player/recently-played`
   - If no: Not needed

5. **Do you want background playback (popup player)?**
   - If yes: Implement floating player bar
   - If no: Player stays in PlayerBar

6. **Should the SDK player be the primary interface?**
   - If yes: Replace Spotify redirect links
   - If no: Keep both options (player + fallback link)

---

## Conclusion

Integrating Spotify Web Playback SDK is **feasible and recommended** for your architecture. The key decisions are:

1. ✅ Use **HTTP-only cookie for `spotify_id` only** (tokens stay in DB)
2. ✅ Create **`/auth/current-token` endpoint** for SDK access
3. ✅ Implement **automatic device activation** after SDK init
4. ✅ Use **passive token refresh** (no background polling)
5. ✅ SDK communicates **directly with Spotify** (no backend proxy)

**Estimated Total Effort**: 15-20 hours across 7 phases

**Risk Level**: Low-Medium (SDK is stable, main risk is device activation)

This plan balances **security**, **functionality**, and **simplicity** while maintaining your existing architecture.

---

**Document Created**: March 1, 2026  
**Last Updated**: March 1, 2026 (Architectural Refinement)  
**Status**: Ready for Implementation  
**Next Step**: Approve plan and begin Phase 1 (OAuth & Token Foundation)

---

## Master Implementation Checklist

Use this checklist to track progress during implementation.

### Phase 1 – OAuth & Token Foundation

**Backend Changes**:
- [ ] Open `/backend/app/routes/auth.py`
- [ ] Update OAuth scopes (line 29):
  - [ ] Add `streaming`
  - [ ] Add `user-read-playback-state`
  - [ ] Add `user-modify-playback-state`
- [ ] Modify `/auth/callback` endpoint:
  - [ ] Set HTTP-only cookie for `spotify_id`
  - [ ] Keep tokens in PostgreSQL only
- [ ] Create `/auth/current-token` endpoint:
  - [ ] Read `spotify_id` from cookie
  - [ ] Fetch user from database
  - [ ] Check if token is expiring (within 5 min)
  - [ ] Call `_refresh_access_token()` if needed
  - [ ] Return `{"access_token": token}`
- [ ] Create `/auth/logout` endpoint:
  - [ ] Clear `spotify_id` cookie
  - [ ] Return 200 OK
- [ ] Test OAuth callback sets cookie correctly
- [ ] Test `/auth/current-token` returns fresh token
- [ ] Test token refresh logic
- [ ] Update Spotify Developer Dashboard:
  - [ ] Add redirect URI: `https://recommendation-model-b8bn.onrender.com/auth/callback`
  - [ ] Keep localhost version for dev

**Verification**:
- [ ] OAuth flow works end-to-end
- [ ] Cookie appears in DevTools
- [ ] Token endpoint returns valid access_token
- [ ] Token refresh triggers automatically

---

### Phase 2 – SDK Initialization

**Frontend Changes**:
- [ ] Edit `/frontend/app/layout.tsx`:
  - [ ] Load Spotify SDK script in useEffect
  - [ ] Handle `window.onSpotifyWebPlaybackSDKReady`
- [ ] Create `/frontend/context/PlayerContext.tsx`:
  - [ ] Define PlayerContextType interface
  - [ ] Implement PlayerProvider component
  - [ ] Create usePlayer hook
  - [ ] Manage: isPlaying, currentTrack, deviceId, devices, position, duration
- [ ] Create `/frontend/hooks/useSpotifySDK.ts`:
  - [ ] Initialize Spotify.Player with getOAuthToken callback
  - [ ] Register event listeners (ready, player_state_changed, etc.)
  - [ ] Implement getOAuthToken function:
    - [ ] Use `credentials: "include"` in fetch
    - [ ] Call `/auth/current-token`
    - [ ] Return access token to callback
  - [ ] Handle ready event:
    - [ ] Extract device_id
    - [ ] **Call device transfer function immediately** ← CRITICAL
    - [ ] Store device_id in context
- [ ] Implement device transfer function:
  - [ ] Fetch fresh token from `/auth/current-token`
  - [ ] Call Spotify API: `PUT /v1/me/player`
  - [ ] Transfer playback to browser device
- [ ] Test SDK loads without errors
- [ ] Test device_id is generated
- [ ] Test device transfer succeeds

**Verification**:
- [ ] Console: "Spotify SDK is ready"
- [ ] Console: "Device ID: [id]"
- [ ] Browser shows as playback device in Spotify app
- [ ] Network tab shows credentials: "include" in fetch calls

---

### Phase 3 – Player UI Components

**Frontend Components**:
- [ ] Create `/frontend/components/Player/PlayerBar.tsx`:
  - [ ] Display current track (name, artist)
  - [ ] Display album art
  - [ ] Show play/pause button
  - [ ] Show next/previous buttons
  - [ ] Show progress bar with current time and duration
  - [ ] Show volume control
  - [ ] Link to device selector
  - [ ] Style for dark/light modes
- [ ] Create `/frontend/components/Player/DeviceSelector.tsx`:
  - [ ] Fetch available devices from context
  - [ ] Show device name and type
  - [ ] Highlight current active device
  - [ ] On selection, call setDevice() from context
- [ ] Add PlayerBar to layout:
  - [ ] Import PlayerBar in `layout.tsx`
  - [ ] Place below {children}
  - [ ] Ensure it doesn't cover content
- [ ] Test all UI elements render correctly
- [ ] Test buttons are clickable
- [ ] Test styles apply in both themes

**Verification**:
- [ ] PlayerBar visible on dashboard
- [ ] DeviceSelector shows devices
- [ ] No console errors
- [ ] Responsive on mobile

---

### Phase 4 – Playback Control Logic

**Frontend Playback Methods**:
- [ ] Implement in PlayerContext:
  - [ ] `play(uri: string)` — Play specific track
  - [ ] `pause()` — Pause playback
  - [ ] `next()` — Skip to next track
  - [ ] `previous()` — Go to previous track
  - [ ] `seek(position: number)` — Seek to position (ms)
  - [ ] `setVolume(volume: number)` — Set volume 0-100
  - [ ] `setDevice(deviceId: string)` — Transfer to device
- [ ] Register SDK event listeners:
  - [ ] `player_state_changed` — Update context state
  - [ ] `initialization_error` — Log errors
  - [ ] `authentication_error` — Handle token issues
  - [ ] `account_error` — Handle account issues
- [ ] Handle playback state updates:
  - [ ] Update `isPlaying` in context
  - [ ] Update `currentTrack` with track info
  - [ ] Update `position` and `duration`
  - [ ] Update UI in real-time
- [ ] Test all methods work
- [ ] Test state updates propagate to UI
- [ ] Test device switching works
- [ ] Test volume control works

**Verification**:
- [ ] Play button starts music
- [ ] Pause button stops music
- [ ] Next/previous buttons work
- [ ] Progress bar updates
- [ ] Device selector works
- [ ] Volume changes affect playback

---

### Phase 5 – Track Card Integration

**Frontend Track Cards**:
- [ ] Edit `/frontend/components/TrackCard.tsx`:
  - [ ] Replace `onClick: () => window.open(spotify_url, "_blank")`
  - [ ] With: `onClick: () => player.play(track.uri)`
  - [ ] Add "Now Playing" indicator if track matches current
- [ ] Edit `/frontend/components/ArtistCard.tsx`:
  - [ ] Update onClick to play artist context (if available)
  - [ ] Or use first artist album
- [ ] Edit `/frontend/components/AIRecommendations.tsx`:
  - [ ] Replace Spotify link with SDK play
  - [ ] Use recommendation's track URI
- [ ] Test clicking track plays immediately
- [ ] Test current track displays in PlayerBar
- [ ] Test progress bar updates
- [ ] Test multiple cards can be clicked

**Verification**:
- [ ] Track cards have clickable title/image
- [ ] Clicking plays in browser
- [ ] Current track highlights in PlayerBar
- [ ] No Spotify app redirect needed

---

### Phase 6 – Testing & Edge Cases

**Testing Scenarios**:
- [ ] **Token Refresh**:
  - [ ] Play music
  - [ ] Wait near token expiry (1 hour)
  - [ ] Try to seek or next
  - [ ] Token should auto-refresh
- [ ] **Device Switching**:
  - [ ] Play on browser
  - [ ] Switch to phone in DeviceSelector
  - [ ] Music should continue on phone
  - [ ] Switch back to browser
  - [ ] Music should return to browser
- [ ] **SDK Reconnection**:
  - [ ] Close browser DevTools (SDK pause)
  - [ ] Resume playback
  - [ ] Player should reconnect
- [ ] **Browser Refresh**:
  - [ ] Play music
  - [ ] Refresh page
  - [ ] Check if state persists (might need to click play again)
- [ ] **Logout**:
  - [ ] Click logout
  - [ ] Verify cookie is cleared
  - [ ] Player should disconnect
  - [ ] Redirect to login
- [ ] **Re-login**:
  - [ ] Login again
  - [ ] SDK should reinitialize
  - [ ] New device_id should be generated
- [ ] **Mobile**:
  - [ ] Test on iPhone/Android
  - [ ] PlayerBar should be responsive
  - [ ] Buttons should be touch-friendly
  - [ ] DeviceSelector should be usable
- [ ] **Multiple Tabs**:
  - [ ] Open app in 2 browser tabs
  - [ ] Each gets separate device_id
  - [ ] Playing in one tab affects playback
  - [ ] Verify SDK handles tab conflicts

**Edge Cases**:
- [ ] SDK fails to load (add fallback to Spotify link)
- [ ] Token endpoint returns 401 (re-auth flow)
- [ ] Device activation fails (show error, retry)
- [ ] No devices available (show message)
- [ ] User closes Spotify app (SDK handles gracefully)
- [ ] Network goes offline (SDK queues commands)

**Verification**:
- [ ] All scenarios tested without errors
- [ ] Playback continues smoothly
- [ ] Device switching works reliably
- [ ] Mobile is usable
- [ ] Error messages are helpful

---

### Phase 7 – Deployment & Final Verification

**Backend Deployment**:
- [ ] Push backend changes to GitHub
- [ ] Deploy to Render
- [ ] Verify environment variables are set on Render:
  - [ ] `DATABASE_URL`
  - [ ] `SPOTIFY_CLIENT_ID`
  - [ ] `SPOTIFY_CLIENT_SECRET`
  - [ ] `SPOTIFY_REDIRECT_URI` (production URL)
  - [ ] `GEMINI_API_KEY`
  - [ ] `ENVIRONMENT=production`
  - [ ] `FRONTEND_URL` (production Vercel URL)
  - [ ] `ALLOWED_ORIGINS` (production Vercel domain)
- [ ] Test `/auth/current-token` on production
- [ ] Verify HTTPS is enforced

**Frontend Deployment**:
- [ ] Push frontend changes to GitHub
- [ ] Deploy to Vercel
- [ ] Verify environment variables are set on Vercel:
  - [ ] `NEXT_PUBLIC_API_BASE_URL` (production Render URL)
- [ ] Test in production environment
- [ ] Verify HTTPS is enforced

**Final Verification (Production)**:
- [ ] [ ] Login with Spotify (OAuth flow)
- [ ] [ ] SDK initializes (check DevTools)
- [ ] [ ] Device ID is generated
- [ ] [ ] Device transfer succeeds
- [ ] [ ] Play music from player
- [ ] [ ] Play music from track cards
- [ ] [ ] Switch devices
- [ ] [ ] All buttons work (play, pause, next, previous, volume)
- [ ] [ ] Progress bar updates
- [ ] [ ] Logout works
- [ ] [ ] Re-login works
- [ ] [ ] Mobile responsiveness OK
- [ ] [ ] No console errors
- [ ] [ ] HTTPS on both frontend and backend

**Monitoring**:
- [ ] Set up error logging (Sentry, LogRocket, etc.)
- [ ] Monitor token refresh rate
- [ ] Monitor SDK initialization failures
- [ ] Monitor device activation failures
- [ ] Monitor playback errors

---

**Checklist Status**: Use this to track progress week by week.

**Week 1**: Phases 1-2 (OAuth + SDK)  
**Week 2**: Phases 3-4 (UI + Logic)  
**Week 3**: Phases 5-6 (Integration + Testing)  
**Week 4**: Phase 7 (Deployment + Launch)

---
