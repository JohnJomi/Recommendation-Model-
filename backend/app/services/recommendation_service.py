"""
Hybrid AI recommendation generator using Gemini API with database caching.
Handles fetching cached recommendations or generating new ones via Gemini.
Enriches recommendations with Spotify track IDs.
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Any

import httpx
from google import genai
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.models.user_recommendation import UserRecommendation
from app.models.user_top_track import UserTopTrack
from app.models.song_cache import SongCache

SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"


async def _refresh_spotify_token(user: User, db: Session) -> str:
    """Refresh Spotify access token and return the new token."""
    if not user.refresh_token:
        return user.access_token
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                SPOTIFY_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": user.refresh_token,
                },
                auth=httpx.BasicAuth(
                    settings.SPOTIFY_CLIENT_ID,
                    settings.SPOTIFY_CLIENT_SECRET,
                ),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            token_data: dict[str, Any] = resp.json()
            access_token: str = token_data["access_token"]
            new_refresh_token: str | None = token_data.get("refresh_token")
            
            user.access_token = access_token
            if new_refresh_token:
                user.refresh_token = new_refresh_token
            db.add(user)
            db.commit()
            return access_token
    except Exception:
        return user.access_token


async def _enrich_recommendation_with_spotify(
    title: str, artist: str, access_token: str, user: User, db: Session
) -> dict[str, Any] | None:
    """
    Search Spotify for a track and return enriched metadata.
    Returns dict with id, title, artist, release_year, duration_ms.
    Returns None if not found.
    """
    search_query = f"track:{title} artist:{artist}"
    
    print(f"[SPOTIFY SEARCH] Query: {search_query}")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                SPOTIFY_SEARCH_URL,
                params={
                    "q": search_query,
                    "type": "track",
                    "limit": 1,
                },
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            print(f"[SPOTIFY SEARCH] Initial Status: {resp.status_code}")
            
            if resp.status_code == 429:
                print("[SPOTIFY SEARCH] Rate limited (429), waiting and retrying...")
                retry_after = resp.headers.get("Retry-After", "1")
                try:
                    retry_seconds = int(retry_after)
                except ValueError:
                    retry_seconds = 1
                
                await asyncio.sleep(retry_seconds)
                
                resp = await client.get(
                    SPOTIFY_SEARCH_URL,
                    params={
                        "q": search_query,
                        "type": "track",
                        "limit": 1,
                    },
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                
                print(f"[SPOTIFY SEARCH] Retry Status: {resp.status_code}")
                
                if resp.status_code == 429:
                    print("[SPOTIFY SEARCH] Rate limit exceeded after retry.")
                    return None
            
            if resp.status_code == 401:
                print("[SPOTIFY SEARCH] Token expired (401), refreshing...")
                access_token = await _refresh_spotify_token(user, db)
                
                resp = await client.get(
                    SPOTIFY_SEARCH_URL,
                    params={
                        "q": search_query,
                        "type": "track",
                        "limit": 1,
                    },
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                
                print(f"[SPOTIFY SEARCH] Retry Status: {resp.status_code}")
            
            resp.raise_for_status()
            data = resp.json()
            
            if not data.get("tracks", {}).get("items"):
                print("[SPOTIFY SEARCH] No tracks found in response")
                return None
            
            track = data["tracks"]["items"][0]
            track_id = track["id"]
            track_name = track["name"]
            artist_name = track["artists"][0]["name"] if track.get("artists") else "Unknown"
            duration_ms = track.get("duration_ms", 0)
            
            # Extract release year from release_date
            release_date = track.get("album", {}).get("release_date", "")
            release_year = 0
            if release_date:
                try:
                    release_year = int(release_date.split("-")[0])
                except (ValueError, IndexError):
                    release_year = 0
            
            print(f"[SPOTIFY SEARCH] Track found: {track_id}")
            
            return {
                "id": track_id,
                "title": track_name,
                "artist": artist_name,
                "release_year": release_year,
                "duration_ms": duration_ms,
            }
        
        except Exception as e:
            print("SPOTIFY SEARCH FAILED:")
            print("Type:", type(e).__name__)
            print("Error:", str(e))
            return None


async def generate_or_fetch_recommendations(spotify_id: str, db: Session) -> list[dict]:
    """
    Generate or fetch AI recommendations for a user with Spotify track enrichment.
    
    Steps:
    1. Check for cached recommendations (< 24 hours old)
    2. If none found, fetch user's top tracks and previous recommendations
    3. Call Gemini API to generate 15 similar songs
    4. Enrich each recommendation with Spotify track ID
    5. Store results in database
    6. Return recommendations as JSON list
    
    Args:
        spotify_id: Spotify user ID
        db: Database session
        
    Returns:
        List of recommendation dicts with title, artist, and spotify_track_id
        
    Raises:
        HTTPException: If critical operations fail
    """
    
    # STEP A: Check for existing recommendations (< 24 hours old)
    cutoff_time = datetime.utcnow() - timedelta(hours=24)
    cached_recommendations = (
        db.query(UserRecommendation)
        .filter(
            UserRecommendation.spotify_id == spotify_id,
            UserRecommendation.generated_at >= cutoff_time,
        )
        .all()
    )
    
    if cached_recommendations and all(rec.spotify_track_id for rec in cached_recommendations):
        # Return enriched cached recommendations with full metadata
        enriched_results = []
        for rec in cached_recommendations:
            song_cache = db.query(SongCache).filter(
                SongCache.spotify_track_id == rec.spotify_track_id
            ).first()
            
            if song_cache:
                enriched_results.append({
                    "id": song_cache.spotify_track_id,
                    "title": song_cache.title,
                    "artist": song_cache.artist,
                    "release_year": song_cache.release_year,
                    "duration_ms": song_cache.duration_ms,
                })
            else:
                enriched_results.append({
                    "id": rec.spotify_track_id,
                    "title": rec.title,
                    "artist": rec.artist,
                    "release_year": 0,
                    "duration_ms": 0,
                })
        
        return enriched_results
    
    if cached_recommendations and not all(rec.spotify_track_id for rec in cached_recommendations):
        db.query(UserRecommendation).filter(
            UserRecommendation.spotify_id == spotify_id
        ).delete()
        db.commit()
    
    # STEP B: Fetch user's top tracks and previously recommended songs
    top_tracks = (
        db.query(SongCache.title, SongCache.artist)
        .join(UserTopTrack, UserTopTrack.spotify_track_id == SongCache.spotify_track_id)
        .filter(UserTopTrack.spotify_id == spotify_id)
        .all()
    )
    
    top_songs_list = [
        {"title": title, "artist": artist}
        for title, artist in top_tracks
    ]
    
    if not top_songs_list:
        raise HTTPException(
            status_code=400,
            detail="No top tracks found for user. Fetch top tracks first."
        )
    
    previous_recommendations = (
        db.query(UserRecommendation.title, UserRecommendation.artist)
        .filter(UserRecommendation.spotify_id == spotify_id)
        .all()
    )
    
    previous_songs_list = [
        {"title": rec.title, "artist": rec.artist}
        for rec in previous_recommendations
    ]
    
    # STEP C: Build prompt and call Gemini API
    prompt = f"""You are a music recommendation expert. Based on the user's top tracks and previous recommendations, suggest 15 similar songs.

User's top tracks:
{json.dumps(top_songs_list, indent=2)}

Previously recommended songs (do NOT repeat these):
{json.dumps(previous_songs_list, indent=2)}

Generate 15 new song recommendations similar to the top tracks, avoiding any previously recommended songs.
Return ONLY a valid JSON array with no explanations:
[
  {{"title": "Song Title", "artist": "Artist Name"}},
  ...
]
"""
    
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt,
    )
    
    print("RAW GEMINI RESPONSE:")
    print(response.text)
    
    # STEP D: Parse Gemini response safely with robust JSON cleaning
    try:
        response_text = response.text.strip()
        
        if not response_text:
            raise HTTPException(
                status_code=500,
                detail="Gemini API returned an empty response.",
            )
        
        # Remove markdown code blocks
        if "```" in response_text:
            parts = response_text.split("```")
            if len(parts) >= 2:
                response_text = parts[1]
            else:
                raise ValueError("Malformed markdown code block")
        
        # Remove "json" language identifier if present
        if response_text.startswith("json"):
            response_text = response_text[4:]
        
        response_text = response_text.strip()
        
        if not response_text:
            raise HTTPException(
                status_code=500,
                detail="Gemini API returned only code block markers with no content.",
            )
        
        recommendations = json.loads(response_text)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON response from Gemini API: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Malformed Gemini response: {str(e)}",
        )
    
    if not isinstance(recommendations, list):
        raise HTTPException(
            status_code=500,
            detail="Gemini API did not return a JSON array",
        )
    
    if len(recommendations) == 0:
        raise HTTPException(
            status_code=500,
            detail="Gemini API returned an empty recommendations list",
        )
    
    # STEP E: Fetch user from database for Spotify enrichment
    user: User | None = db.query(User).filter(User.spotify_id == spotify_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found in database.",
        )
    
    # STEP F: Enrich recommendations with Spotify metadata and store in database
    batch_id = str(uuid.uuid4())
    enriched_recommendations = []
    
    for rec in recommendations:
        title = rec.get("title", "")
        artist = rec.get("artist", "")
        
        enriched_track = await _enrich_recommendation_with_spotify(
            title, artist, user.access_token, user, db
        )
        
        if not enriched_track:
            continue
        
        # Store in SongCache if not already there
        existing_cache = db.query(SongCache).filter(
            SongCache.spotify_track_id == enriched_track["id"]
        ).first()
        
        if not existing_cache:
            song_cache = SongCache(
                spotify_track_id=enriched_track["id"],
                title=enriched_track["title"],
                artist=enriched_track["artist"],
                release_year=enriched_track["release_year"],
                duration_ms=enriched_track["duration_ms"],
            )
            db.add(song_cache)
        
        new_recommendation = UserRecommendation(
            spotify_id=spotify_id,
            batch_id=batch_id,
            title=enriched_track["title"],
            artist=enriched_track["artist"],
            spotify_track_id=enriched_track["id"],
        )
        db.add(new_recommendation)
        
        enriched_recommendations.append({
            "id": enriched_track["id"],
            "title": enriched_track["title"],
            "artist": enriched_track["artist"],
            "release_year": enriched_track["release_year"],
            "duration_ms": enriched_track["duration_ms"],
        })
    
    if not enriched_recommendations:
        raise HTTPException(
            status_code=500,
            detail="All Spotify enrichment attempts failed.",
        )

    db.commit()

    return enriched_recommendations
