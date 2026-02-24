"""Routes for fetching user's top artists from Spotify."""

from datetime import datetime, timedelta
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/artists", tags=["artists"])

SPOTIFY_TOP_ARTISTS_URL = "https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term"
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
        new_refresh_token: str | None = token_data.get("refresh_token")
        expires_in: int = int(token_data.get("expires_in", 0))

        user.access_token = access_token
        if new_refresh_token:
            user.refresh_token = new_refresh_token
        user.token_expiry = datetime.now() + timedelta(seconds=expires_in)

        db.add(user)
        db.commit()
        db.refresh(user)


@router.get("/top")
async def get_top_artists(
    spotify_id: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Fetch the user's top artists from Spotify and return structured data."""
    # 1. Fetch user by spotify_id from database
    user: User | None = db.query(User).filter(User.spotify_id == spotify_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please authenticate first.",
        )

    # 2. Call Spotify API for top artists
    async with httpx.AsyncClient() as client:
        # Fetch top artists with current access token
        resp = await client.get(
            SPOTIFY_TOP_ARTISTS_URL,
            headers={"Authorization": f"Bearer {user.access_token}"},
        )
        print("----- TOP ARTISTS DEBUG -----")
        print("Status Code:", resp.status_code)
        print("Response Text:", resp.text[:500])
        print("Access Token Used:", user.access_token[:20], "...")
        print("--------------------------------")

        # If unauthorized, attempt a single token refresh and retry once
        if resp.status_code == 401:
            await _refresh_access_token(user, db)
            resp = await client.get(
                SPOTIFY_TOP_ARTISTS_URL,
                headers={"Authorization": f"Bearer {user.access_token}"},
            )
            print("----- TOP ARTISTS DEBUG (RETRY) -----")
            print("Status Code:", resp.status_code)
            print("Response Text:", resp.text[:500])
            print("Access Token Used:", user.access_token[:20], "...")
            print("--------------------------------")

        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch top artists from Spotify.",
            )

        data: dict[str, Any] = resp.json()
        items: list[dict[str, Any]] = data.get("items", [])

    # 3. Format artists response
    simplified_artists: list[dict[str, Any]] = []

    for artist in items:
        artist_id: str = artist.get("id", "")
        name: str = artist.get("name", "")
        genres: list[str] = artist.get("genres", [])
        followers: int = artist.get("followers", {}).get("total", 0)
        
        # Get image (largest available)
        image_url: str | None = None
        images = artist.get("images", [])
        if images and len(images) > 0:
            image_url = images[0].get("url")
        
        # Get Spotify URL
        spotify_url: str | None = artist.get("external_urls", {}).get("spotify")

        simplified_artists.append({
            "id": artist_id,
            "name": name,
            "genres": genres,
            "image": image_url,
            "followers": followers,
            "spotify_url": spotify_url,
        })

    return simplified_artists
