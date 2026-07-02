from __future__ import annotations

import math
import time
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings

_CACHE: dict[str, tuple[float, Any]] = {}
_CACHE_TTL = 300  # seconds


def _cache_get(key: str) -> Any | None:
    entry = _CACHE.get(key)
    if entry and time.monotonic() - entry[0] < _CACHE_TTL:
        return entry[1]
    _CACHE.pop(key, None)
    return None


def _cache_set(key: str, value: Any) -> None:
    _CACHE[key] = (time.monotonic(), value)


VALID_COLLECTIONS = {"trending", "popular", "top_rated", "upcoming"}


class TMDBClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = self.settings.tmdb_base_url.rstrip("/")
        self._client: httpx.AsyncClient | None = None

    async def start(self) -> None:
        self._client = httpx.AsyncClient(timeout=20)

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def configured(self) -> bool:
        return bool(self.settings.tmdb_bearer_token or self.settings.tmdb_api_key)

    def _auth_params(self, params: dict[str, Any] | None) -> tuple[dict[str, str], dict[str, Any]]:
        request_params = dict(params or {})
        headers = {"accept": "application/json"}
        if self.settings.tmdb_bearer_token:
            headers["Authorization"] = f"Bearer {self.settings.tmdb_bearer_token}"
        elif self.settings.tmdb_api_key:
            request_params["api_key"] = self.settings.tmdb_api_key
        return headers, request_params

    async def request(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.configured:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="TMDB credentials are not configured. Add TMDB_BEARER_TOKEN or TMDB_API_KEY to backend/.env.",
            )

        cache_key = f"{path}:{params}"
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

        headers, request_params = self._auth_params(params)
        url = f"{self.base_url}/{path.lstrip('/')}"

        try:
            client = self._client or httpx.AsyncClient(timeout=20)
            response = await client.get(url, headers=headers, params=request_params)
        except (httpx.ConnectError, httpx.TimeoutException, httpx.ReadTimeout, httpx.ConnectTimeout) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not reach TMDB: {exc}",
            ) from exc

        if response.status_code == 401:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="TMDB credentials were rejected.")
        if response.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie resource was not found.")
        if response.is_error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"TMDB request failed with status {response.status_code}.",
            )

        data = response.json()
        _cache_set(cache_key, data)
        return data

    async def movie_collection(self, collection: str, page: int = 1) -> dict[str, Any]:
        if collection not in VALID_COLLECTIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown collection '{collection}'. Valid: {', '.join(sorted(VALID_COLLECTIONS))}.",
            )
        paths = {
            "trending": "trending/movie/week",
            "popular": "movie/popular",
            "top_rated": "movie/top_rated",
            "upcoming": "movie/upcoming",
        }
        return await self.request(paths[collection], {"language": "en-US", "page": page})

    async def genres(self) -> dict[str, Any]:
        return await self.request("genre/movie/list", {"language": "en-US"})

    async def search_movies(
        self,
        query: str | None,
        page: int,
        year: int | None = None,
        genre: str | None = None,
        min_rating: float | None = None,
        sort_by: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {
            "language": "en-US",
            "include_adult": "false",
            "page": page,
        }
        if query:
            params["query"] = query
            if year:
                params["year"] = year
            data = await self.request("search/movie", params)
            return self._filter_search_results(data, genre=genre, min_rating=min_rating, sort_by=sort_by)

        if year:
            params["primary_release_year"] = year
        if genre:
            params["with_genres"] = genre
        if min_rating:
            params["vote_average.gte"] = min_rating
            params["vote_count.gte"] = 50
        params["sort_by"] = sort_by or "popularity.desc"
        return await self.request("discover/movie", params)

    async def movie_details(self, movie_id: int) -> dict[str, Any]:
        return await self.request(
            f"movie/{movie_id}",
            {
                "language": "en-US",
                "append_to_response": "credits,videos,similar,recommendations",
            },
        )

    async def movie_summary(self, movie_id: int) -> dict[str, Any]:
        return await self.request(f"movie/{movie_id}", {"language": "en-US"})

    @staticmethod
    def _filter_search_results(
        data: dict[str, Any],
        genre: str | None,
        min_rating: float | None,
        sort_by: str | None,
    ) -> dict[str, Any]:
        results = list(data.get("results", []))
        if genre:
            genre_ids = {int(item) for item in genre.split(",") if item.isdigit()}
            results = [movie for movie in results if genre_ids.intersection(set(movie.get("genre_ids", [])))]
        if min_rating is not None:
            results = [movie for movie in results if float(movie.get("vote_average") or 0) >= min_rating]

        key_name = sort_by or ""
        if key_name == "vote_average.desc":
            results.sort(key=lambda item: item.get("vote_average") or 0, reverse=True)
        elif key_name == "primary_release_date.desc":
            results.sort(key=lambda item: item.get("release_date") or "", reverse=True)
        elif key_name == "primary_release_date.asc":
            results.sort(key=lambda item: item.get("release_date") or "")
        elif key_name == "title.asc":
            results.sort(key=lambda item: item.get("title") or "")

        page_size = max(len(data.get("results", [])), 1)
        data["results"] = results
        data["total_results"] = len(results)
        data["total_pages"] = math.ceil(len(results) / page_size) if results else 0
        return data


tmdb_client = TMDBClient()
