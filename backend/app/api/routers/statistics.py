from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.schemas import StatisticsOut
from app.services.statistics import build_statistics
from app.services.tmdb import tmdb_client

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("", response_model=StatisticsOut)
async def statistics(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    return await build_statistics(db, user_id, tmdb_client)
