"""FastAPI application entry point."""

from fastapi import FastAPI
from app.database import Base, engine
from app.models import user, song_cache  # noqa: F401 - register models with Base
from app.routes import auth, tracks, recommendations
from app.models import user_recommendation   
from fastapi.middleware.cors import CORSMiddleware
 
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tracks.router)
app.include_router(recommendations.router)


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
