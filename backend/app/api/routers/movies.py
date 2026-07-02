from typing import Any

from fastapi import APIRouter, Query

from app.schemas import MoviePage
from app.services.tmdb import tmdb_client

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/trending", response_model=MoviePage)
async def trending_movies(page: int = Query(default=1, ge=1)) -> dict[str, Any]:
    return await tmdb_client.movie_collection("trending", page)


@router.get("/popular", response_model=MoviePage)
async def popular_movies(page: int = Query(default=1, ge=1)) -> dict[str, Any]:
    return await tmdb_client.movie_collection("popular", page)


@router.get("/top-rated", response_model=MoviePage)
async def top_rated_movies(page: int = Query(default=1, ge=1)) -> dict[str, Any]:
    return await tmdb_client.movie_collection("top_rated", page)


@router.get("/upcoming", response_model=MoviePage)
async def upcoming_movies(page: int = Query(default=1, ge=1)) -> dict[str, Any]:
    return await tmdb_client.movie_collection("upcoming", page)


@router.get("/search", response_model=MoviePage)
async def search_movies(
    query: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    year: int | None = Query(default=None, ge=1878),
    genre: str | None = Query(default=None),
    min_rating: float | None = Query(default=None, ge=0, le=10),
    sort_by: str | None = Query(default=None),
) -> dict[str, Any]:
    return await tmdb_client.search_movies(query, page, year, genre, min_rating, sort_by)


@router.get("/genres")
async def genres() -> dict[str, Any]:
    return await tmdb_client.genres()


@router.get("/{movie_id}")
async def movie_details(movie_id: int) -> dict[str, Any]:
    return await tmdb_client.movie_details(movie_id)


@router.get("/{movie_id}/similar", response_model=MoviePage)
async def similar_movies(movie_id: int, page: int = Query(default=1, ge=1)) -> dict[str, Any]:
    return await tmdb_client.request(f"movie/{movie_id}/similar", {"language": "en-US", "page": page})
