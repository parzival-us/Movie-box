from __future__ import annotations

import asyncio
from typing import Any, Iterable

from fastapi import HTTPException

from app.services.tmdb import TMDBClient


def compact_movie(movie: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": movie.get("id"),
        "title": movie.get("title"),
        "overview": movie.get("overview"),
        "poster_path": movie.get("poster_path"),
        "backdrop_path": movie.get("backdrop_path"),
        "release_date": movie.get("release_date"),
        "vote_average": movie.get("vote_average"),
        "runtime": movie.get("runtime"),
        "genres": movie.get("genres", []),
    }


async def movie_map(movie_ids: Iterable[int], tmdb: TMDBClient) -> dict[int, dict[str, Any]]:
    unique_ids = list(dict.fromkeys(movie_ids))
    if not unique_ids:
        return {}

    async def fetch(movie_id: int) -> tuple[int, dict[str, Any] | None]:
        try:
            return movie_id, compact_movie(await tmdb.movie_summary(movie_id))
        except HTTPException as exc:
            if exc.status_code == 503:
                return movie_id, None
            raise

    pairs = await asyncio.gather(*(fetch(movie_id) for movie_id in unique_ids))
    return {movie_id: movie for movie_id, movie in pairs if movie is not None}


def attach_movies(items: list[Any], movies: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    enriched = []
    for item in items:
        data = {
            column.name: getattr(item, column.name)
            for column in item.__table__.columns
            if column.name != "user_id" and column.name != "list_id"
        }
        data["movie"] = movies.get(item.movie_id)
        enriched.append(data)
    return enriched
