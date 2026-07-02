from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models import DiaryEntry
from app.schemas import DiaryCreate, DiaryOut, DiaryUpdate
from app.services.enrichment import attach_movies, movie_map
from app.services.tmdb import tmdb_client

router = APIRouter(prefix="/diary", tags=["diary"])


@router.get("", response_model=list[DiaryOut])
async def list_diary(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> list[dict]:
    entries = list(db.scalars(select(DiaryEntry).where(DiaryEntry.user_id == user_id).order_by(desc(DiaryEntry.watch_date))).all())
    movies = await movie_map((entry.movie_id for entry in entries), tmdb_client)
    return attach_movies(entries, movies)


@router.post("", response_model=DiaryOut, status_code=status.HTTP_201_CREATED)
async def create_diary_entry(
    payload: DiaryCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    entry = DiaryEntry(
        user_id=user_id,
        movie_id=payload.movie_id,
        watch_date=payload.watch_date,
        rating=payload.rating,
        notes=payload.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    movies = await movie_map([entry.movie_id], tmdb_client)
    return attach_movies([entry], movies)[0]


@router.put("/{entry_id}", response_model=DiaryOut)
async def update_diary_entry(
    entry_id: int,
    payload: DiaryUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    entry = db.get(DiaryEntry, entry_id)
    if not entry or entry.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found.")
    if payload.watch_date is not None:
        entry.watch_date = payload.watch_date
    if payload.notes is not None:
        entry.notes = payload.notes
    if payload.has_rating_update():
        entry.rating = payload.resolved_rating()
    db.commit()
    db.refresh(entry)
    movies = await movie_map([entry.movie_id], tmdb_client)
    return attach_movies([entry], movies)[0]


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diary_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> None:
    entry = db.get(DiaryEntry, entry_id)
    if not entry or entry.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diary entry not found.")
    db.delete(entry)
    db.commit()
