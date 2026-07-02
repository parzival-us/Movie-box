from __future__ import annotations

import asyncio
from collections import Counter, defaultdict
from typing import Any

from fastapi import HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import DiaryEntry, Favorite, Rating, Review, WatchlistItem
from app.services.tmdb import TMDBClient


async def _fetch_movie(tmdb: TMDBClient, movie_id: int) -> tuple[int, dict[str, Any] | None]:
    try:
        return movie_id, await tmdb.movie_details(movie_id)
    except HTTPException as exc:
        if exc.status_code == 503:
            return movie_id, None
        raise


async def build_statistics(db: Session, user_id: int, tmdb: TMDBClient) -> dict[str, Any]:
    diary_entries = db.scalars(
        select(DiaryEntry).where(DiaryEntry.user_id == user_id).order_by(desc(DiaryEntry.watch_date))
    ).all()
    ratings = db.scalars(select(Rating).where(Rating.user_id == user_id)).all()

    unique_ids = list(dict.fromkeys(entry.movie_id for entry in diary_entries))
    pairs = await asyncio.gather(*(_fetch_movie(tmdb, mid) for mid in unique_ids))
    movie_cache: dict[int, dict[str, Any]] = {mid: data for mid, data in pairs if data is not None}

    runtime_total = sum((movie_cache.get(entry.movie_id, {}).get("runtime") or 0) for entry in diary_entries)
    diary_ratings = [entry.rating for entry in diary_entries if entry.rating is not None]
    all_rating_values = diary_ratings or [rating.rating for rating in ratings]
    average_rating = round(sum(all_rating_values) / len(all_rating_values), 2) if all_rating_values else None

    genre_counter: Counter[str] = Counter()
    director_counter: Counter[str] = Counter()
    for movie in movie_cache.values():
        genre_counter.update(genre.get("name") for genre in movie.get("genres", []) if genre.get("name"))
        for crew_member in movie.get("credits", {}).get("crew", []):
            if crew_member.get("job") == "Director" and crew_member.get("name"):
                director_counter.update([crew_member["name"]])

    monthly_counter: dict[str, int] = defaultdict(int)
    for entry in diary_entries:
        monthly_counter[entry.watch_date.strftime("%Y-%m")] += 1

    recent_activity = await _recent_activity(db, user_id, tmdb)

    return {
        "total_watches": len(diary_entries),
        "total_runtime": runtime_total,
        "average_rating": average_rating,
        "favorite_genres": [{"name": name, "count": count} for name, count in genre_counter.most_common(6)],
        "favorite_directors": [{"name": name, "count": count} for name, count in director_counter.most_common(6)],
        "monthly_watch_count": [
            {"month": month, "count": count} for month, count in sorted(monthly_counter.items())[-12:]
        ],
        "recent_activity": recent_activity,
    }


async def _fetch_summary(tmdb: TMDBClient, movie_id: int) -> tuple[int, dict[str, Any] | None]:
    try:
        movie = await tmdb.movie_summary(movie_id)
        return movie_id, {"id": movie.get("id"), "title": movie.get("title"), "poster_path": movie.get("poster_path")}
    except HTTPException as exc:
        if exc.status_code == 503:
            return movie_id, None
        raise


async def _recent_activity(db: Session, user_id: int, tmdb: TMDBClient) -> list[dict[str, Any]]:
    activity: list[dict[str, Any]] = []
    queries = [
        ("watched", select(DiaryEntry).where(DiaryEntry.user_id == user_id).order_by(desc(DiaryEntry.created_at)).limit(5)),
        ("reviewed", select(Review).where(Review.user_id == user_id).order_by(desc(Review.created_at)).limit(5)),
        ("rated", select(Rating).where(Rating.user_id == user_id).order_by(desc(Rating.updated_at)).limit(5)),
        ("favorited", select(Favorite).where(Favorite.user_id == user_id).order_by(desc(Favorite.added_at)).limit(5)),
        (
            "watchlisted",
            select(WatchlistItem).where(WatchlistItem.user_id == user_id).order_by(desc(WatchlistItem.added_at)).limit(5),
        ),
    ]

    for kind, query in queries:
        for item in db.scalars(query).all():
            timestamp = getattr(item, "updated_at", None) or getattr(item, "created_at", None) or getattr(item, "added_at")
            activity.append({"type": kind, "movie_id": item.movie_id, "timestamp": timestamp, "movie": None})

    activity.sort(key=lambda item: item["timestamp"], reverse=True)
    activity = activity[:10]

    unique_ids = list(dict.fromkeys(item["movie_id"] for item in activity))
    pairs = await asyncio.gather(*(_fetch_summary(tmdb, mid) for mid in unique_ids))
    movie_lookup = {mid: data for mid, data in pairs if data is not None}
    for item in activity:
        item["movie"] = movie_lookup.get(item["movie_id"])

    return activity
