from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.main import seed_local_user
from app.models import DiaryEntry, Favorite, ListMovie, MovieList, Rating, Review, WatchlistItem


LOCAL_USER_ID = 1

STARTER_MOVIES = [
    {"movie_id": 11, "rating": 4.5, "watch_date": date(2026, 7, 1), "notes": "A bright, mythic rewatch."},
    {"movie_id": 13, "rating": 4.0, "watch_date": date(2026, 7, 2), "notes": "Tender, odd, and very rewatchable."},
    {"movie_id": 155, "rating": 5.0, "watch_date": date(2026, 7, 3), "notes": "Still enormous."},
]

WATCHLIST_MOVIES = [550, 680, 27205, 603]
FAVORITE_MOVIES = [11, 155]


def seed_demo_data() -> None:
    Base.metadata.create_all(bind=engine)
    seed_local_user()
    db = SessionLocal()
    try:
        _seed_ratings(db)
        _seed_reviews(db)
        _seed_diary(db)
        _seed_watchlist(db)
        _seed_favorites(db)
        _seed_list(db)
        db.commit()
    finally:
        db.close()


def _seed_ratings(db: Session) -> None:
    for movie in STARTER_MOVIES:
        existing = db.scalar(
            select(Rating).where(Rating.user_id == LOCAL_USER_ID, Rating.movie_id == movie["movie_id"])
        )
        if existing:
            existing.rating = movie["rating"]
        else:
            db.add(Rating(user_id=LOCAL_USER_ID, movie_id=movie["movie_id"], rating=movie["rating"]))


def _seed_reviews(db: Session) -> None:
    review_copy = {
        11: "Big-hearted adventure filmmaking with every edge still glowing.",
        155: "A pressure cooker with impossible momentum.",
    }
    for movie_id, content in review_copy.items():
        exists = db.scalar(select(Review.id).where(Review.user_id == LOCAL_USER_ID, Review.movie_id == movie_id))
        if not exists:
            db.add(Review(user_id=LOCAL_USER_ID, movie_id=movie_id, content=content))


def _seed_diary(db: Session) -> None:
    for movie in STARTER_MOVIES:
        exists = db.scalar(
            select(DiaryEntry.id).where(
                DiaryEntry.user_id == LOCAL_USER_ID,
                DiaryEntry.movie_id == movie["movie_id"],
                DiaryEntry.watch_date == movie["watch_date"],
            )
        )
        if not exists:
            db.add(
                DiaryEntry(
                    user_id=LOCAL_USER_ID,
                    movie_id=movie["movie_id"],
                    watch_date=movie["watch_date"],
                    rating=movie["rating"],
                    notes=movie["notes"],
                )
            )


def _seed_watchlist(db: Session) -> None:
    for movie_id in WATCHLIST_MOVIES:
        exists = db.scalar(select(WatchlistItem.id).where(WatchlistItem.user_id == LOCAL_USER_ID, WatchlistItem.movie_id == movie_id))
        if not exists:
            db.add(WatchlistItem(user_id=LOCAL_USER_ID, movie_id=movie_id))


def _seed_favorites(db: Session) -> None:
    for movie_id in FAVORITE_MOVIES:
        exists = db.scalar(select(Favorite.id).where(Favorite.user_id == LOCAL_USER_ID, Favorite.movie_id == movie_id))
        if not exists:
            db.add(Favorite(user_id=LOCAL_USER_ID, movie_id=movie_id))


def _seed_list(db: Session) -> None:
    movie_list = db.scalar(select(MovieList).where(MovieList.user_id == LOCAL_USER_ID, MovieList.name == "Starter canon"))
    if not movie_list:
        movie_list = MovieList(user_id=LOCAL_USER_ID, name="Starter canon", description="A compact first shelf.")
        db.add(movie_list)
        db.flush()

    for movie_id in [155, 11, 13]:
        exists = db.scalar(select(ListMovie.id).where(ListMovie.list_id == movie_list.id, ListMovie.movie_id == movie_id))
        if exists:
            continue
        max_position = db.scalar(select(func.max(ListMovie.position)).where(ListMovie.list_id == movie_list.id)) or 0
        db.add(ListMovie(list_id=movie_list.id, movie_id=movie_id, position=max_position + 1))


if __name__ == "__main__":
    seed_demo_data()
    print("Added starter movies for local user 1.")
