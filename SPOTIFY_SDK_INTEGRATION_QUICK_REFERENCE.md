# Spotify Web Playback SDK Integration - Quick Reference

## Current Status Analysis

| Component | Current State | SDK Compatible? | Changes Needed |
|-----------|---------------|-----------------|----------------|
| **OAuth Scopes** | `user-top-read user-read-email` | ❌ NO | Add: `streaming user-read-playback-state user-modify-playback-state` |
| **Token Storage** | Database only (PostgreSQL) | ❌ NO | Expose via `/auth/current-token` endpoint |
| **Token Access** | Not sent to frontend | ❌ NO | Use HTTP-only cookies + proxy endpoint |
| **Token Refresh** | ✅ Implemented in backend | ✅ YES | Update to auto-refresh before return |
| **CORS Config** | ✅ Correct | ✅ YES | No changes needed |
| **HTTPS** | ✅ Both domains | ✅ YES | Already met |
| **Database Models** | Sufficient | ✅ YES | No changes needed |
| **Frontend Auth** | ✅ Context-based | ✅ YES | Add PlayerContext for SDK |

---

## Key Findings

### 1. OAuth Scopes
**Current**: `user-top-read user-read-email`  
**Needed**: Add `streaming user-read-playback-state user-modify-playback-state`  
**Action**: One-line change in `auth.py` line 29

### 2. Access Token Flow (The Main Challenge)
**Problem**: Tokens stored in DB, never sent to frontend (secure, but incompatible)  
**Solution**: HTTP-Only Cookie + `/auth/current-token` endpoint  
**Why This Approach**:
- Tokens stored in HTTP-only cookies (XSS-safe)
- `/auth/current-token` endpoint returns token to JavaScript
- Auto-refreshes if token is expiring
- Follows OAuth 2.0 best practices

### 3. Backend Changes Required
- ✅ Update scopes (1 line change)
- ✅ Set HTTP-only cookies in `/auth/callback`
- ✅ Create `/auth/current-token` endpoint (new)
- ✅ Create `/auth/logout` endpoint (new)
- ✅ Update token refresh logic
- ❌ No database schema changes
- ❌ No new routes for playback (SDK handles directly)

### 4. Frontend Changes Required
- ✅ Load Spotify SDK in root layout
- ✅ Create `PlayerContext.tsx` for SDK state
- ✅ Create `PlayerBar.tsx` component
- ✅ Create `useSpotifySDK.ts` hook
- ✅ Update TrackCard to use player instead of redirect
- ❌ No authentication changes needed (existing context works)

### 5. Deployment Checklist
- [ ] Update Spotify Developer Dashboard redirect URI
- [x] HTTPS on both domains (already met)
- [x] CORS configured correctly (already done)
- [ ] Test token endpoint on Render
- [ ] Test SDK on Vercel

---

## Implementation Phases (Priority Order)

| Phase | Duration | Priority | Work |
|-------|----------|----------|------|
| **1. OAuth Setup** | 2-3h | 🔴 CRITICAL | Update scopes, add HTTP-only cookies, create token endpoint |
| **2. SDK Setup** | 2-3h | 🔴 CRITICAL | Load SDK, create PlayerContext, test initialization |
| **3. Player UI** | 3-4h | 🔴 CRITICAL | PlayerBar, DeviceSelector components |
| **4. Playback Control** | 3-4h | 🟡 HIGH | Implement play/pause/next/device switching |
| **5. Track Integration** | 2-3h | 🟡 HIGH | Update cards to use player |
| **6. Testing** | 2-3h | 🔴 CRITICAL | Token refresh, device switching, edge cases |
| **7. Deployment** | 1-2h | 🔴 CRITICAL | Deploy & verify |

**Total**: 15-22 hours

---

## Critical Implementation Details

### HTTP-Only Cookie Setup (MUST DO)
```python
response.set_cookie(
    key="spotify_access_token",
    value=access_token,
    httponly=True,      # ← JavaScript cannot read
    secure=True,        # ← HTTPS only
    samesite="lax",     # ← CSRF protection
    max_age=3600,       # ← 1 hour expiry
)
```

### Token Endpoint (MUST CREATE)
```python
@router.get("/auth/current-token")
async def get_current_token(request: Request, db: Session):
    # Returns fresh token, auto-refreshing if needed
    # Called by SDK initialization
    return {"access_token": token}
```

### SDK Initialization (MUST IMPLEMENT)
```typescript
const token = await fetch("/auth/current-token").then(r => r.json());
const player = new Spotify.Player({
  getOAuthToken: callback => callback(token.access_token),
  name: "MusicFlow Player",
});
player.connect();
```

---

## Security Summary

| Aspect | Status | How Secured |
|--------|--------|------------|
| Token Storage | ✅ SAFE | HTTP-only cookies (XSS-proof) |
| Token Transmission | ✅ SAFE | HTTPS everywhere |
| CSRF Attacks | ✅ SAFE | SameSite=Lax cookie flag |
| Token Logging | ✅ SAFE | Never log sensitive data |
| Token Expiry | ✅ SAFE | Auto-refresh before return |
| Frontend Exposure | ✅ SAFE | Token only in memory briefly |
| Database Security | ✅ SAFE | Tokens encrypted at rest (PostgreSQL) |

---

## Token Flow Diagram

```
1. User clicks "Sign In"
   ↓
2. Browser → /auth/login
   ↓
3. Redirects to Spotify OAuth
   ↓
4. User authorizes app (grants scopes)
   ↓
5. Spotify → /auth/callback?code=...
   ↓
6. Backend exchanges code for tokens
   ↓
7. Backend sets HTTP-only cookies
   └─ spotify_access_token (1 hour)
   └─ spotify_refresh_token (30 days)
   ↓
8. Browser redirects to /dashboard
   ↓
9. Frontend initializes Spotify SDK
   ├─ Calls /auth/current-token
   │  ├─ Browser sends cookies automatically (CORS with credentials)
   │  └─ Backend refreshes if needed, returns token
   │
10. SDK initializes with token
    ├─ Generates device_id
    ├─ Becomes playback device
    └─ Ready to play music
```

---

## DO NOT FORGET

### Before Implementation
- [ ] Review full plan document (SPOTIFY_SDK_INTEGRATION_PLAN.md)
- [ ] Check if 3rd party SDKs needed (none for basic playback)
- [ ] Verify Spotify API quotas (generous for standard apps)
- [ ] Plan for token refresh edge cases

### During Implementation
- [ ] Always use HTTPS in production
- [ ] Never log access tokens
- [ ] Set cookie flags correctly (httponly, secure, samesite)
- [ ] Test token refresh during playback
- [ ] Handle SDK initialization failures gracefully

### After Deployment
- [ ] Monitor token refresh rate
- [ ] Check for playback failures in logs
- [ ] Test device switching with real phones
- [ ] Verify CORS headers in production
- [ ] Update Spotify Developer Dashboard redirect URI

---

## What WON'T Change

✅ No database schema changes  
✅ No changes to recommendation service  
✅ No changes to Gemini integration  
✅ No changes to top tracks/artists endpoints  
✅ No changes to authentication context (except adding PlayerContext)  
✅ No package.json changes needed  
✅ No new Python dependencies  

---

## Common Questions

**Q: Do I need to store device_id in database?**  
A: No. Device ID is session-specific and auto-generated by SDK.

**Q: What if user has multiple browser tabs?**  
A: Each tab gets separate device_id. Playback transfers between them.

**Q: Can I skip HTTP-only cookies?**  
A: No. It's essential for security. Spotify recommends this approach.

**Q: What happens when token expires?**  
A: Auto-refreshed by `/auth/current-token` endpoint before returning.

**Q: Do I need a separate payment plan?**  
A: No. Web Playback SDK is free for all Spotify API tier plans.

**Q: Can I use the Web Playback SDK on mobile?**  
A: Limited. Works in mobile browsers but Spotify app recommended for mobile.

---

## Success Criteria

After implementation, these should work:

- [ ] User can sign in via Spotify OAuth
- [ ] Player appears in browser (PlayerBar)
- [ ] Clicking track plays in browser player
- [ ] Play/pause buttons work
- [ ] Next/previous buttons work
- [ ] Device selector shows available devices
- [ ] Device switching works (phone → browser)
- [ ] Volume control works
- [ ] Progress bar seeks
- [ ] Token refreshes automatically
- [ ] Session persists after browser refresh
- [ ] Logout clears all tokens
- [ ] Works on mobile devices (responsive)

---

**Next Steps**:
1. Read full plan document
2. Discuss with team (especially token exposure strategy)
3. Update Spotify Developer Dashboard
4. Begin Phase 1: OAuth & Authentication
5. Proceed through phases in order

**Questions?** Review SPOTIFY_SDK_INTEGRATION_PLAN.md for detailed explanations.
