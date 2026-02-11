"""Application configuration loaded from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    """Environment-based settings for the FastAPI backend."""

    DATABASE_URL: str
    SPOTIFY_CLIENT_ID: str
    SPOTIFY_CLIENT_SECRET: str
    SPOTIFY_REDIRECT_URI: str
    ENVIRONMENT: str

    def __init__(self) -> None:
        self.DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
        self.SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "").strip()
        self.SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "").strip()
        self.SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "").strip()
        self.ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip()
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is required and must be set in the environment")

    @property
    def is_development(self) -> bool:
        """Whether the application is running in development mode."""
        return self.ENVIRONMENT.lower() == "development"


settings = Settings()
