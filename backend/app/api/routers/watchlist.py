from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models import WatchlistItem
from app.schemas import MovieIdPayload, StatusOut, WatchlistOut, WatchlistSort
from app.services.enrichment import attach_movies, movie_map
from app.services.tmdb import tmdb_client

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchlistOut])
async def list_watchlist(
    sort: WatchlistSort = Query(default=WatchlistSort.newest),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> list[dict]:
    order = asc(WatchlistItem.added_at) if sort == WatchlistSort.oldest else desc(WatchlistItem.added_at)
    items = list(db.scalars(select(WatchlistItem).where(WatchlistItem.user_id == user_id).order_by(order)).all())
    movies = await movie_map((item.movie_id for item in items), tmdb_client)
    enriched = attach_movies(items, movies)
    if sort == WatchlistSort.rating:
        enriched.sort(key=lambda item: (item.get("movie") or {}).get("vote_average") or 0, reverse=True)
    elif sort == WatchlistSort.release_year:
        enriched.sort(key=lambda item: ((item.get("movie") or {}).get("release_date") or "")[:4], reverse=True)
    return enriched


@router.get("/{movie_id}", response_model=StatusOut)
def watchlist_status(
    movie_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> StatusOut:
    exists = db.scalar(select(WatchlistItem.id).where(WatchlistItem.user_id == user_id, WatchlistItem.movie_id == movie_id))
    return StatusOut(exists=bool(exists))


@router.post("", response_model=WatchlistOut, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    payload: MovieIdPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    item = db.scalar(select(WatchlistItem).where(WatchlistItem.user_id == user_id, WatchlistItem.movie_id == payload.movie_id))
    if not item:
        item = WatchlistItem(user_id=user_id, movie_id=payload.movie_id)
        db.add(item)
        db.commit()
        db.refresh(item)
    movies = await movie_map([item.movie_id], tmdb_client)
    return attach_movies([item], movies)[0]


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(
    movie_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> None:
    item = db.scalar(select(WatchlistItem).where(WatchlistItem.user_id == user_id, WatchlistItem.movie_id == movie_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Watchlist item not found.")
    db.delete(item)
    db.commit()
