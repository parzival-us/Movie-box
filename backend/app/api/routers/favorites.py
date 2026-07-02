from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models import Favorite
from app.schemas import FavoriteOut, MovieIdPayload, StatusOut
from app.services.enrichment import attach_movies, movie_map
from app.services.tmdb import tmdb_client

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteOut])
async def list_favorites(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> list[dict]:
    items = list(db.scalars(select(Favorite).where(Favorite.user_id == user_id).order_by(desc(Favorite.added_at))).all())
    movies = await movie_map((item.movie_id for item in items), tmdb_client)
    return attach_movies(items, movies)


@router.get("/{movie_id}", response_model=StatusOut)
def favorite_status(
    movie_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> StatusOut:
    exists = db.scalar(select(Favorite.id).where(Favorite.user_id == user_id, Favorite.movie_id == movie_id))
    return StatusOut(exists=bool(exists))


@router.post("", response_model=FavoriteOut, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    payload: MovieIdPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    item = db.scalar(select(Favorite).where(Favorite.user_id == user_id, Favorite.movie_id == payload.movie_id))
    if not item:
        item = Favorite(user_id=user_id, movie_id=payload.movie_id)
        db.add(item)
        db.commit()
        db.refresh(item)
    movies = await movie_map([item.movie_id], tmdb_client)
    return attach_movies([item], movies)[0]


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    movie_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> None:
    item = db.scalar(select(Favorite).where(Favorite.user_id == user_id, Favorite.movie_id == movie_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found.")
    db.delete(item)
    db.commit()
