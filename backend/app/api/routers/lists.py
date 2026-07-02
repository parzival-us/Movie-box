from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models import ListMovie, MovieList
from app.schemas import ListReorderPayload, MovieIdPayload, MovieListCreate, MovieListOut, MovieListUpdate
from app.services.enrichment import attach_movies, movie_map
from app.services.tmdb import tmdb_client

router = APIRouter(prefix="/lists", tags=["lists"])


@router.get("", response_model=list[MovieListOut])
async def list_movie_lists(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> list[dict]:
    lists = list(
        db.scalars(
            select(MovieList)
            .where(MovieList.user_id == user_id)
            .options(selectinload(MovieList.movies))
            .order_by(MovieList.updated_at.desc())
        ).all()
    )
    return [await _serialize_list(movie_list) for movie_list in lists]


@router.post("", response_model=MovieListOut, status_code=status.HTTP_201_CREATED)
async def create_movie_list(
    payload: MovieListCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    movie_list = MovieList(user_id=user_id, name=payload.name, description=payload.description)
    db.add(movie_list)
    db.commit()
    db.refresh(movie_list)
    return await _serialize_list(movie_list)


@router.get("/{list_id}", response_model=MovieListOut)
async def get_movie_list(
    list_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    movie_list = _owned_list(db, list_id, user_id)
    return await _serialize_list(movie_list)


@router.put("/{list_id}", response_model=MovieListOut)
async def update_movie_list(
    list_id: int,
    payload: MovieListUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    movie_list = _owned_list(db, list_id, user_id)
    update = payload.model_dump(exclude_unset=True)
    for key, value in update.items():
        setattr(movie_list, key, value)
    db.commit()
    db.refresh(movie_list)
    return await _serialize_list(movie_list)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie_list(
    list_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> None:
    movie_list = _owned_list(db, list_id, user_id)
    db.delete(movie_list)
    db.commit()


@router.post("/{list_id}/movies", response_model=MovieListOut, status_code=status.HTTP_201_CREATED)
async def add_movie_to_list(
    list_id: int,
    payload: MovieIdPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    movie_list = _owned_list(db, list_id, user_id)
    existing = db.scalar(select(ListMovie).where(ListMovie.list_id == list_id, ListMovie.movie_id == payload.movie_id))
    if not existing:
        max_position = db.scalar(select(func.max(ListMovie.position)).where(ListMovie.list_id == list_id)) or 0
        db.add(ListMovie(list_id=list_id, movie_id=payload.movie_id, position=max_position + 1))
        db.commit()
        db.refresh(movie_list)
    return await _serialize_list(movie_list)


@router.delete("/{list_id}/movies/{movie_id}", response_model=MovieListOut)
async def remove_movie_from_list(
    list_id: int,
    movie_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    movie_list = _owned_list(db, list_id, user_id)
    item = db.scalar(select(ListMovie).where(ListMovie.list_id == list_id, ListMovie.movie_id == movie_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie is not in this list.")
    db.delete(item)
    db.commit()
    _normalize_positions(db, list_id)
    db.refresh(movie_list)
    return await _serialize_list(movie_list)


@router.put("/{list_id}/reorder", response_model=MovieListOut)
async def reorder_list(
    list_id: int,
    payload: ListReorderPayload,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict:
    movie_list = _owned_list(db, list_id, user_id)
    items = db.scalars(select(ListMovie).where(ListMovie.list_id == list_id)).all()
    by_movie_id = {item.movie_id: item for item in items}
    if set(payload.movie_ids) != set(by_movie_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reorder payload must include every movie once.")
    for position, movie_id in enumerate(payload.movie_ids, start=1):
        by_movie_id[movie_id].position = position
    db.commit()
    db.refresh(movie_list)
    return await _serialize_list(movie_list)


def _owned_list(db: Session, list_id: int, user_id: int) -> MovieList:
    movie_list = db.scalar(
        select(MovieList)
        .where(MovieList.id == list_id, MovieList.user_id == user_id)
        .options(selectinload(MovieList.movies))
    )
    if not movie_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="List not found.")
    return movie_list


def _normalize_positions(db: Session, list_id: int) -> None:
    items = list(db.scalars(select(ListMovie).where(ListMovie.list_id == list_id).order_by(ListMovie.position)).all())
    for position, item in enumerate(items, start=1):
        item.position = position
    db.commit()


async def _serialize_list(movie_list: MovieList) -> dict:
    movies = await movie_map((item.movie_id for item in movie_list.movies), tmdb_client)
    return {
        "id": movie_list.id,
        "name": movie_list.name,
        "description": movie_list.description,
        "created_at": movie_list.created_at,
        "updated_at": movie_list.updated_at,
        "movies": attach_movies(list(movie_list.movies), movies),
    }
