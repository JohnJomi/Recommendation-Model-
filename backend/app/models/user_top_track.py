"""SQLAlchemy model linking users to their top tracks."""

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class UserTopTrack(Base):
    __tablename__ = "user_top_tracks"

    id = Column(Integer, primary_key=True, index=True)
    spotify_id = Column(String, index=True, nullable=False)
    spotify_track_id = Column(String, index=True, nullable=False)

    created_at = Column(DateTime, server_default=func.now())

