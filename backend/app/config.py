"""Application configuration loaded from environment variables."""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
# Load .env ONLY in development
if os.getenv("ENVIRONMENT", "development") == "development":
    load_dotenv(BASE_DIR / ".env")


class Settings:
    """Environment-based settings for the FastAPI backend."""

    DATABASE_URL: str
    SPOTIFY_CLIENT_ID: str
    SPOTIFY_CLIENT_SECRET: str
    SPOTIFY_REDIRECT_URI: str
    GEMINI_API_KEY: str
    ENVIRONMENT: str
    FRONTEND_URL: str

    def __init__(self) -> None:
        self.DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
        self.SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "").strip()
        self.SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "").strip()
        self.SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "").strip()
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
        self.ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip()
        self.FRONTEND_URL = os.getenv("FRONTEND_URL", "").strip()
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is required and must be set in the environment")
        if not self.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required and must be set in the environment")

    @property
    def is_development(self) -> bool:
        """Whether the application is running in development mode."""
        return self.ENVIRONMENT.lower() == "development"


settings = Settings()
