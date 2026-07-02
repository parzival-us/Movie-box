import os
import tempfile
from collections.abc import Generator

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient

test_db_path = os.path.join(tempfile.gettempdir(), "movie_box_test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
os.environ.setdefault("FRONTEND_ORIGIN", "http://localhost:5173")

from app.api.routers import diary, favorites, lists, statistics, watchlist  # noqa: E402
from app.database import Base, SessionLocal, engine, get_db  # noqa: E402
from app.main import app, seed_local_user  # noqa: E402


class FakeTMDBClient:
    movies = {
        11: {
            "id": 11,
            "title": "Star Wars",
            "poster_path": "/star-wars.jpg",
            "backdrop_path": "/star-wars-backdrop.jpg",
            "release_date": "1977-05-25",
            "vote_average": 8.2,
            "runtime": 121,
            "genres": [{"id": 12, "name": "Adventure"}, {"id": 878, "name": "Science Fiction"}],
            "credits": {"crew": [{"id": 1, "name": "George Lucas", "job": "Director"}]},
        },
        13: {
            "id": 13,
            "title": "Forrest Gump",
            "poster_path": "/forrest-gump.jpg",
            "backdrop_path": "/forrest-backdrop.jpg",
            "release_date": "1994-07-06",
            "vote_average": 8.5,
            "runtime": 142,
            "genres": [{"id": 18, "name": "Drama"}],
            "credits": {"crew": [{"id": 2, "name": "Robert Zemeckis", "job": "Director"}]},
        },
        155: {
            "id": 155,
            "title": "The Dark Knight",
            "poster_path": "/dark-knight.jpg",
            "backdrop_path": "/dark-knight-backdrop.jpg",
            "release_date": "2008-07-18",
            "vote_average": 8.9,
            "runtime": 152,
            "genres": [{"id": 28, "name": "Action"}, {"id": 18, "name": "Drama"}],
            "credits": {"crew": [{"id": 3, "name": "Christopher Nolan", "job": "Director"}]},
        },
    }

    async def movie_summary(self, movie_id: int) -> dict:
        if movie_id not in self.movies:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found.")
        return self.movies[movie_id]

    async def movie_details(self, movie_id: int) -> dict:
        if movie_id not in self.movies:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found.")
        return self.movies[movie_id]


@pytest.fixture(autouse=True)
def clean_database() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_local_user()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    fake_tmdb = FakeTMDBClient()
    diary.tmdb_client = fake_tmdb
    favorites.tmdb_client = fake_tmdb
    lists.tmdb_client = fake_tmdb
    statistics.tmdb_client = fake_tmdb
    watchlist.tmdb_client = fake_tmdb

    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
