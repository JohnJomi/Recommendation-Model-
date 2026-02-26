"""FastAPI application entry point."""

import os
from fastapi import FastAPI
from app.database import Base, engine
from app.models import user, song_cache  # noqa: F401 - register models with Base
from app.routes import auth, tracks, recommendations, artists
from app.models import user_recommendation   
from fastapi.middleware.cors import CORSMiddleware
 
app = FastAPI()

# Load allowed origins from environment
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(tracks.router)
app.include_router(recommendations.router)
app.include_router(artists.router)


@app.on_event("startup")
async def startup_event() -> None:
    """Create database tables on application startup."""
    Base.metadata.create_all(bind=engine)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Music Recommender API Running"}


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
