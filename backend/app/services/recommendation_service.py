"""
Hybrid AI recommendation generator using Gemini API with database caching.
Handles fetching cached recommendations or generating new ones via Gemini.
"""

import json
import uuid
from datetime import datetime, timedelta

from google import genai
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user_recommendation import UserRecommendation
from app.models.user_top_track import UserTopTrack
from app.models.song_cache import SongCache


async def generate_or_fetch_recommendations(spotify_id: str, db: Session) -> list[dict]:
    """
    Generate or fetch AI recommendations for a user.
    
    Steps:
    1. Check for cached recommendations (< 24 hours old)
    2. If none found, fetch user's top tracks and previous recommendations
    3. Call Gemini API to generate 15 similar songs
    4. Store results in database
    5. Return recommendations as JSON list
    
    Args:
        spotify_id: Spotify user ID
        db: Database session
        
    Returns:
        List of recommendation dicts with title and artist
        
    Raises:
        HTTPException: If Gemini response is invalid JSON
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
    
    if cached_recommendations:
        return [
            {
                "title": rec.title,
                "artist": rec.artist,
            }
            for rec in cached_recommendations
        ]
    
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
    
    # STEP E: Store results in database
    batch_id = str(uuid.uuid4())
    
    for rec in recommendations:
        new_recommendation = UserRecommendation(
            spotify_id=spotify_id,
            batch_id=batch_id,
            title=rec.get("title", ""),
            artist=rec.get("artist", ""),
            spotify_track_id=None,
        )
        db.add(new_recommendation)
    
    db.commit()
    
    # Return new recommendations
    return [
        {
            "title": rec.get("title", ""),
            "artist": rec.get("artist", ""),
        }
        for rec in recommendations
    ]
