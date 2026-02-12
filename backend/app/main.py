"""FastAPI application entry point."""

from fastapi import FastAPI

from app.database import Base, engine
from app.models import user, song_cache  # noqa: F401 - register models with Base
from app.routes import auth, tracks

app = FastAPI()

app.include_router(auth.router)
app.include_router(tracks.router)


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
