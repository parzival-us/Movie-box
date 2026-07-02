from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models import Review
from app.schemas import ReviewCreate, ReviewOut, ReviewUpdate

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=list[ReviewOut])
def list_reviews(
    movie_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> list[Review]:
    query = select(Review).where(Review.user_id == user_id)
    if movie_id is not None:
        query = query.where(Review.movie_id == movie_id)
    return list(db.scalars(query.order_by(Review.created_at.desc())).all())


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Review:
    review = Review(user_id=user_id, movie_id=payload.movie_id, content=payload.content)
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.put("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: int,
    payload: ReviewUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Review:
    review = db.get(Review, review_id)
    if not review or review.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")
    review.content = payload.content
    db.commit()
    db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> None:
    review = db.get(Review, review_id)
    if not review or review.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")
    db.delete(review)
    db.commit()
