"""Routes for fetching and caching user's top tracks from Spotify."""

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.song_cache import SongCache
from app.models.user import User

router = APIRouter(prefix="/tracks", tags=["tracks"])

SPOTIFY_TOP_TRACKS_URL = "https://api.spotify.com/v1/me/top/tracks?limit=20"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"


async def _refresh_access_token(user: User, db: Session) -> None:
    """Refresh the Spotify access token using the stored refresh token."""
    if not user.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token for user.",
        )

    async with httpx.AsyncClient() as client:
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
        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to refresh Spotify access token.",
            )

        token_data: dict[str, Any] = resp.json()
        access_token: str = token_data["access_token"]
        # Some responses may or may not include a new refresh_token
        new_refresh_token: str | None = token_data.get("refresh_token")
        expires_in: int = int(token_data.get("expires_in", 0))

        user.access_token = access_token
        if new_refresh_token:
            user.refresh_token = new_refresh_token
        user.token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)

        db.add(user)
        db.commit()
        db.refresh(user)


@router.get("/top")
async def get_top_tracks(
    spotify_id: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Fetch the user's top tracks from Spotify, cache them, and return a simplified list."""
    # 1. Fetch user by spotify_id from database
    user: User | None = db.query(User).filter(User.spotify_id == spotify_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please authenticate first.",
        )

    # 2. Check if token is expired (or about to expire)
    now = datetime.utcnow()
    if user.token_expiry <= now:
        await _refresh_access_token(user, db)

    # 4. Call Spotify API for top tracks
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            SPOTIFY_TOP_TRACKS_URL,
            headers={"Authorization": f"Bearer {user.access_token}"},
        )
        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch top tracks from Spotify.",
            )

        data: dict[str, Any] = resp.json()
        items: list[dict[str, Any]] = data.get("items", [])

    # 5. For each track, upsert into SongCache
    simplified_tracks: list[dict[str, Any]] = []
    for track in items:
        spotify_track_id: str = track["id"]
        title: str = track["name"]
        artists = track.get("artists") or []
        artist_name: str = artists[0]["name"] if artists else ""
        album = (track.get("album") or {}).get("name")
        popularity = track.get("popularity")

        # Upsert in cache
        song = db.query(SongCache).filter(SongCache.spotify_track_id == spotify_track_id).first()
        if song is None:
            song = SongCache(
                spotify_track_id=spotify_track_id,
                title=title,
                artist=artist_name,
                album=album,
                popularity=popularity,
                # Placeholder values for audio features until they are fetched elsewhere
                danceability=0.0,
                energy=0.0,
                tempo=0.0,
                valence=0.0,
                acousticness=0.0,
                instrumentalness=0.0,
                loudness=0.0,
                speechiness=0.0,
            )
            db.add(song)
        else:
            song.title = title
            song.artist = artist_name
            song.album = album
            song.popularity = popularity

        simplified_tracks.append(
            {
                "id": spotify_track_id,
                "title": title,
                "artist": artist_name,
                "popularity": popularity,
            }
        )

    # 6. Commit changes
    db.commit()

    # 7. Return simplified JSON list of tracks
    return simplified_tracks

