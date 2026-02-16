"""Routes for AI-generated song recommendations."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.recommendation_service import generate_or_fetch_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("")
async def get_recommendations(
    spotify_id: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Generate or fetch AI recommendations for a user based on their top tracks."""
    if not spotify_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="spotify_id query parameter is required.",
        )
    
    return await generate_or_fetch_recommendations(spotify_id, db)
