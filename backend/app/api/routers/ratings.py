from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models import Rating
from app.schemas import RatingCreate, RatingOut

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.get("", response_model=list[RatingOut])
def list_ratings(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> list[Rating]:
    return list(db.scalars(select(Rating).where(Rating.user_id == user_id).order_by(Rating.updated_at.desc())).all())


@router.get("/{movie_id}", response_model=RatingOut | None)
def get_rating(
    movie_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Rating | None:
    return db.scalar(select(Rating).where(Rating.user_id == user_id, Rating.movie_id == movie_id))


@router.post("", response_model=RatingOut)
def upsert_rating(
    payload: RatingCreate,
    response: Response,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Rating:
    rating = db.scalar(select(Rating).where(Rating.user_id == user_id, Rating.movie_id == payload.movie_id))
    if rating:
        rating.rating = payload.rating
        response.status_code = status.HTTP_200_OK
    else:
        rating = Rating(user_id=user_id, movie_id=payload.movie_id, rating=payload.rating)
        db.add(rating)
        response.status_code = status.HTTP_201_CREATED
    db.commit()
    db.refresh(rating)
    return rating


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(
    movie_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> None:
    rating = db.scalar(select(Rating).where(Rating.user_id == user_id, Rating.movie_id == movie_id))
    if not rating:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found.")
    db.delete(rating)
    db.commit()
