from sqlalchemy import func, select

from app.database import SessionLocal
from app.models import DiaryEntry, Favorite, ListMovie, MovieList, Rating, Review, WatchlistItem
from app.seed import seed_demo_data


def test_health(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_rating_can_be_created_updated_and_deleted(client):
    created = client.post("/api/ratings", json={"movie_id": 11, "rating": 4.5})
    assert created.status_code == 201
    assert created.json()["rating"] == 4.5

    updated = client.post("/api/ratings", json={"movie_id": 11, "rating": 3.5})
    assert updated.status_code == 201
    assert updated.json()["rating"] == 3.5

    listed = client.get("/api/ratings")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    deleted = client.delete("/api/ratings/11")
    assert deleted.status_code == 204
    assert client.get("/api/ratings/11").json() is None


def test_reviews_support_crud(client):
    created = client.post("/api/reviews", json={"movie_id": 13, "content": "Warm and strange."})
    assert created.status_code == 201
    review_id = created.json()["id"]

    updated = client.put(f"/api/reviews/{review_id}", json={"content": "Still warm, still strange."})
    assert updated.status_code == 200
    assert updated.json()["content"] == "Still warm, still strange."

    by_movie = client.get("/api/reviews", params={"movie_id": 13})
    assert by_movie.status_code == 200
    assert by_movie.json()[0]["id"] == review_id

    deleted = client.delete(f"/api/reviews/{review_id}")
    assert deleted.status_code == 204
    assert client.get("/api/reviews", params={"movie_id": 13}).json() == []


def test_watchlist_and_favorites_are_idempotent(client):
    assert client.get("/api/watchlist/155").json() == {"exists": False}

    first_watchlist = client.post("/api/watchlist", json={"movie_id": 155})
    second_watchlist = client.post("/api/watchlist", json={"movie_id": 155})
    assert first_watchlist.status_code == 201
    assert second_watchlist.status_code == 201
    assert client.get("/api/watchlist/155").json() == {"exists": True}

    watchlist = client.get("/api/watchlist", params={"sort": "rating"}).json()
    assert len(watchlist) == 1
    assert watchlist[0]["movie"]["title"] == "The Dark Knight"

    favorite = client.post("/api/favorites", json={"movie_id": 155})
    assert favorite.status_code == 201
    assert client.get("/api/favorites/155").json() == {"exists": True}
    assert client.get("/api/favorites").json()[0]["movie"]["title"] == "The Dark Knight"

    assert client.delete("/api/watchlist/155").status_code == 204
    assert client.delete("/api/favorites/155").status_code == 204
    assert client.get("/api/watchlist/155").json() == {"exists": False}
    assert client.get("/api/favorites/155").json() == {"exists": False}


def test_diary_entries_drive_statistics(client):
    first = client.post(
        "/api/diary",
        json={"movie_id": 11, "watch_date": "2026-07-01", "rating": 4.0, "notes": "A bright rewatch."},
    )
    second = client.post(
        "/api/diary",
        json={"movie_id": 155, "watch_date": "2026-07-02", "rating": 5.0, "notes": "Huge."},
    )
    assert first.status_code == 201
    assert second.status_code == 201

    entries = client.get("/api/diary").json()
    assert [entry["movie"]["title"] for entry in entries] == ["The Dark Knight", "Star Wars"]

    updated = client.put(f"/api/diary/{first.json()['id']}", json={"rating": 4.5, "notes": "A brighter rewatch."})
    assert updated.status_code == 200
    assert updated.json()["rating"] == 4.5

    stats = client.get("/api/statistics")
    assert stats.status_code == 200
    body = stats.json()
    assert body["total_movies_watched"] == 2
    assert body["total_runtime"] == 273
    assert body["average_rating"] == 4.75
    assert {"name": "Drama", "count": 1} in body["favorite_genres"]
    assert {"name": "Christopher Nolan", "count": 1} in body["favorite_directors"]
    assert body["monthly_watch_count"] == [{"month": "2026-07", "count": 2}]

    assert client.delete(f"/api/diary/{second.json()['id']}").status_code == 204
    assert len(client.get("/api/diary").json()) == 1


def test_lists_support_movie_ordering_and_renaming(client):
    created = client.post("/api/lists", json={"name": "Weekend", "description": "Two big moods"})
    assert created.status_code == 201
    list_id = created.json()["id"]

    with_first = client.post(f"/api/lists/{list_id}/movies", json={"movie_id": 11})
    assert with_first.status_code == 201
    with_second = client.post(f"/api/lists/{list_id}/movies", json={"movie_id": 155})
    assert with_second.status_code == 201
    assert [item["movie_id"] for item in with_second.json()["movies"]] == [11, 155]

    reordered = client.put(f"/api/lists/{list_id}/reorder", json={"movie_ids": [155, 11]})
    assert reordered.status_code == 200
    assert [item["movie_id"] for item in reordered.json()["movies"]] == [155, 11]

    renamed = client.put(f"/api/lists/{list_id}", json={"name": "Weekend watch", "description": "Reordered"})
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Weekend watch"

    removed = client.delete(f"/api/lists/{list_id}/movies/155")
    assert removed.status_code == 200
    assert [item["movie_id"] for item in removed.json()["movies"]] == [11]

    bad_reorder = client.put(f"/api/lists/{list_id}/reorder", json={"movie_ids": [11, 13]})
    assert bad_reorder.status_code == 400

    assert client.delete(f"/api/lists/{list_id}").status_code == 204
    assert client.get(f"/api/lists/{list_id}").status_code == 404


def test_demo_seed_is_idempotent(client):
    seed_demo_data()
    seed_demo_data()

    db = SessionLocal()
    try:
        assert db.scalar(select(func.count()).select_from(Rating)) == 3
        assert db.scalar(select(func.count()).select_from(Review)) == 2
        assert db.scalar(select(func.count()).select_from(DiaryEntry)) == 3
        assert db.scalar(select(func.count()).select_from(WatchlistItem)) == 4
        assert db.scalar(select(func.count()).select_from(Favorite)) == 2
        assert db.scalar(select(func.count()).select_from(MovieList).where(MovieList.name == "Starter canon")) == 1
        assert db.scalar(select(func.count()).select_from(ListMovie)) == 3
    finally:
        db.close()
