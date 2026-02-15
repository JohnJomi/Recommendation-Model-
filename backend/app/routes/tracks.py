"""Routes for fetching and caching user's top tracks from Spotify."""

from datetime import datetime, timedelta
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, get_db
from app.models.song_cache import SongCache
from app.models.user import User
from app.models.user_top_track import UserTopTrack

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
        # Store naive datetime; logic relies on Spotify 401 responses for refresh
        user.token_expiry = datetime.now() + timedelta(seconds=expires_in)

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

    # 2. Clear previous top tracks for this user
    db.query(UserTopTrack).filter(UserTopTrack.spotify_id == spotify_id).delete(
        synchronize_session=False
    )

    # 3. Call Spotify API for top tracks
    async with httpx.AsyncClient() as client:
        # Fetch top tracks with current access token
        resp = await client.get(
            SPOTIFY_TOP_TRACKS_URL,
            headers={"Authorization": f"Bearer {user.access_token}"},
        )
        print("----- TOP TRACKS DEBUG -----")
        print("Status Code:", resp.status_code)
        print("Response Text:", resp.text)
        print("Access Token Used:", user.access_token[:20], "...")
        print("--------------------------------")

        # If unauthorized, attempt a single token refresh and retry once
        if resp.status_code == 401:
            await _refresh_access_token(user, db)
            resp = await client.get(
                SPOTIFY_TOP_TRACKS_URL,
                headers={"Authorization": f"Bearer {user.access_token}"},
            )
            print("----- TOP TRACKS DEBUG (RETRY) -----")
            print("Status Code:", resp.status_code)
            print("Response Text:", resp.text)
            print("Access Token Used:", user.access_token[:20], "...")
            print("--------------------------------")

        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch top tracks from Spotify.",
            )

        data: dict[str, Any] = resp.json()
        items: list[dict[str, Any]] = data.get("items", [])

    # 4. For each track, upsert into SongCache and link in UserTopTrack
    simplified_tracks: list[dict[str, Any]] = []
    artist_genres_cache: dict[str, str] = {}

    for track in items:
        spotify_track_id: str = track["id"]
        title: str = track["name"]
        artists = track.get("artists") or []
        artist_name: str = artists[0]["name"] if artists else ""
        album_obj = track.get("album") or {}
        album = album_obj.get("name")
        popularity = track.get("popularity")

        # Duration in milliseconds
        duration_ms_raw = track.get("duration_ms")
        try:
            duration_ms = int(duration_ms_raw) if duration_ms_raw is not None else 0
        except (TypeError, ValueError):
            duration_ms = 0

        # Release year from album release_date (first 4 chars)
        release_year = 0
        release_date = album_obj.get("release_date") or ""
        if isinstance(release_date, str) and len(release_date) >= 4:
            year_str = release_date[:4]
            if year_str.isdigit():
                release_year = int(year_str)

        # Artist genres (cached per artist)
        genres_str = ""
        artist_id: str | None = None
        if artists:
            artist_id = artists[0].get("id")

        if artist_id:
            cached_genres = artist_genres_cache.get(artist_id)
            if cached_genres is not None:
                genres_str = cached_genres
            else:
                try:
                    async with httpx.AsyncClient() as artist_client:
                        artist_resp = await artist_client.get(
                            f"https://api.spotify.com/v1/artists/{artist_id}",
                            headers={"Authorization": f"Bearer {user.access_token}"},
                        )
                        artist_resp.raise_for_status()
                        artist_data = artist_resp.json()
                        raw_genres = artist_data.get("genres") or []
                        if isinstance(raw_genres, list):
                            genres_str = ", ".join(str(g) for g in raw_genres)
                except httpx.HTTPError:
                    genres_str = ""

                artist_genres_cache[artist_id] = genres_str

        # Upsert in song cache
        song = (
            db.query(SongCache)
            .filter(SongCache.spotify_track_id == spotify_track_id)
            .first()
        )
        if song is None:
            song = SongCache(
                spotify_track_id=spotify_track_id,
                title=title,
                artist=artist_name,
                album=album,
                popularity=popularity,
                duration_ms=duration_ms,
                release_year=release_year,
                genres=genres_str,
            )
            db.add(song)
        else:
            song.title = title
            song.artist = artist_name
            song.album = album
            song.popularity = popularity
            song.duration_ms = duration_ms
            song.release_year = release_year
            song.genres = genres_str

        # Link user to this top track
        user_top = UserTopTrack(
            spotify_id=spotify_id,
            spotify_track_id=spotify_track_id,
        )
        db.add(user_top)

        simplified_tracks.append(
            {
                "id": spotify_track_id,
                "title": title,
                "artist": artist_name,
                "popularity": popularity,
                "release_year": release_year,
                "duration_ms": duration_ms,
            }
        )

    # 6. Commit changes
    db.commit()

    # 7. Return simplified JSON list of tracks
    return simplified_tracks


def build_user_vector(spotify_id: str) -> dict[str, Any]:
    """Build a simple metadata-based preference vector for a user.

    Aggregate only over songs that appear in the user's top tracks.
    """
    db = SessionLocal()
    try:
        songs: list[SongCache] = (
            db.query(SongCache)
            .join(
                UserTopTrack,
                SongCache.spotify_track_id == UserTopTrack.spotify_track_id,
            )
            .filter(UserTopTrack.spotify_id == spotify_id)
            .all()
        )

        if not songs:
            return {
                "spotify_id": spotify_id,
                "avg_release_year": 0.0,
                "avg_duration_ms": 0.0,
                "genre_distribution": {},
            }

        # 2. Compute average release_year and duration_ms
        total_year = 0
        total_duration = 0
        count_year = 0
        count_duration = 0

        # 3–5. Build normalized genre frequency dictionary
        genre_counts: dict[str, int] = {}

        for song in songs:
            if song.release_year:
                total_year += song.release_year
                count_year += 1

            if song.duration_ms:
                total_duration += song.duration_ms
                count_duration += 1

            if song.genres:
                for raw_genre in song.genres.split(","):
                    genre = raw_genre.strip()
                    if not genre:
                        continue
                    genre_counts[genre] = genre_counts.get(genre, 0) + 1

        avg_release_year = (total_year / count_year) if count_year > 0 else 0.0
        avg_duration_ms = (total_duration / count_duration) if count_duration > 0 else 0.0

        total_genre_count = sum(genre_counts.values())
        if total_genre_count > 0:
            genre_distribution: dict[str, float] = {
                genre: count / total_genre_count for genre, count in genre_counts.items()
            }
        else:
            genre_distribution = {}

        user_vector: dict[str, Any] = {
            "spotify_id": spotify_id,
            "avg_release_year": avg_release_year,
            "avg_duration_ms": avg_duration_ms,
            "genre_distribution": genre_distribution,
        }
        return user_vector
    finally:
        db.close()


@router.get("/user-vector")
async def get_user_vector(spotify_id: str) -> dict[str, Any]:
    """Expose the metadata-based user preference vector."""
    return build_user_vector(spotify_id)

