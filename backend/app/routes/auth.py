"""Spotify OAuth authentication routes."""

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_ME_URL = "https://api.spotify.com/v1/me"


@router.get("/login")
async def login() -> RedirectResponse:
    """Redirect user to Spotify authorization endpoint."""
    params = {
        "client_id": settings.SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
        "scope": "user-top-read user-read-email",
    }
    query = urlencode(params)
    url = f"{SPOTIFY_AUTHORIZE_URL}?{query}"
    return RedirectResponse(url=url)


@router.get("/callback")
async def callback(code: str, db: Session = Depends(get_db)) -> RedirectResponse:
    """Handle Spotify OAuth callback, persist user, and redirect to frontend."""
    async with httpx.AsyncClient() as client:
        # Exchange authorization code for tokens
        token_response = await client.post(
            SPOTIFY_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.SPOTIFY_REDIRECT_URI,
            },
            auth=httpx.BasicAuth(
                settings.SPOTIFY_CLIENT_ID,
                settings.SPOTIFY_CLIENT_SECRET,
            ),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_response.raise_for_status()
        token_data = token_response.json()

        access_token: str = token_data["access_token"]
        refresh_token: str = token_data.get("refresh_token", "")
        expires_in: int = int(token_data.get("expires_in", 0))

        # Fetch Spotify user profile
        me_response = await client.get(
            SPOTIFY_ME_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        me_response.raise_for_status()
        profile = me_response.json()

        spotify_id: str = profile["id"]
        email: str | None = profile.get("email")
        display_name: str | None = profile.get("display_name")

        # Compute token expiry in UTC
        token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

        # Upsert user in database
        user = db.query(User).filter(User.spotify_id == spotify_id).first()
        if user is None:
            user = User(
                spotify_id=spotify_id,
                email=email,
                display_name=display_name,
                access_token=access_token,
                refresh_token=refresh_token,
                token_expiry=token_expiry,
            )
            db.add(user)
        else:
            user.access_token = access_token
            user.refresh_token = refresh_token
            user.token_expiry = token_expiry

        db.commit()
        db.refresh(user)

    frontend_url = f"{settings.FRONTEND_URL}/dashboard?spotify_id={spotify_id}"
    return RedirectResponse(url=frontend_url)
