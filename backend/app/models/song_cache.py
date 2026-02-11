"""SQLAlchemy model for caching Spotify track data and audio features."""

from sqlalchemy import Column, DateTime, Float, Integer, String
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

    # Audio features (all Float, nullable=False for similarity computations)
    danceability = Column(Float, nullable=False)
    energy = Column(Float, nullable=False)
    tempo = Column(Float, nullable=False)
    valence = Column(Float, nullable=False)
    acousticness = Column(Float, nullable=False)
    instrumentalness = Column(Float, nullable=False)
    loudness = Column(Float, nullable=False)
    speechiness = Column(Float, nullable=False)

    # Cache metadata
    last_fetched_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        """Return string representation of SongCache."""
        return f"<SongCache(spotify_track_id='{self.spotify_track_id}', title='{self.title}')>"
