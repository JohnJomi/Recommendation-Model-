import uuid

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    spotify_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    display_name = Column(String, nullable=True)

    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    token_expiry = Column(DateTime, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
