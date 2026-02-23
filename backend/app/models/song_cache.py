"""SQLAlchemy model for caching Spotify track data and audio features."""

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class SongCache(Base):
    """Cache for Spotify track information and audio features."""

    __tablename__ = "song_cache"

    # Primary key
    spotify_track_id = Column(String, primary_key=True)
    

    # Track metadata
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    album = Column(String, nullable=True)
    popularity = Column(Integer, nullable=True)
    duration_ms = Column(Integer, nullable=False, default=0)
    release_year = Column(Integer, nullable=False, default=0)
    genres = Column(Text, nullable=True)
    
    # Spotify enrichment
    album_image = Column(String, nullable=True)
    spotify_url = Column(String, nullable=True)

    # Audio features (all Float, nullable=False for similarity computations)
    danceability = Column(Float, nullable=True)
    energy = Column(Float, nullable=True)
    tempo = Column(Float, nullable=True)
    valence = Column(Float, nullable=True)
    acousticness = Column(Float, nullable=True)
    instrumentalness = Column(Float, nullable=True)
    loudness = Column(Float, nullable=True)
    speechiness = Column(Float, nullable=True)

    # Cache metadata
    last_fetched_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        """Return string representation of SongCache."""
        return f"<SongCache(spotify_track_id='{self.spotify_track_id}', title='{self.title}')>"
