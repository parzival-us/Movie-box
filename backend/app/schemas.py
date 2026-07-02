from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MovieIdPayload(BaseModel):
    movie_id: int


class RatingCreate(BaseModel):
    movie_id: int
    rating: float = Field(ge=0.5, le=5)


class RatingOut(ORMModel):
    id: int
    movie_id: int
    rating: float
    created_at: datetime
    updated_at: datetime


class ReviewCreate(BaseModel):
    movie_id: int
    content: str = Field(min_length=1, max_length=8000)


class ReviewUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


class ReviewOut(ORMModel):
    id: int
    movie_id: int
    content: str
    created_at: datetime
    updated_at: datetime


class WatchlistSort(str, Enum):
    newest = "newest"
    oldest = "oldest"
    rating = "rating"
    release_year = "release_year"


class WatchlistOut(ORMModel):
    id: int
    movie_id: int
    added_at: datetime
    movie: dict[str, Any] | None = None


class FavoriteOut(ORMModel):
    id: int
    movie_id: int
    added_at: datetime
    movie: dict[str, Any] | None = None


class DiaryCreate(BaseModel):
    movie_id: int
    watch_date: date
    rating: float | None = Field(default=None, ge=0.5, le=5)
    notes: str | None = Field(default=None, max_length=8000)


class DiaryUpdate(BaseModel):
    watch_date: date | None = None
    rating: float | None = Field(default=None, ge=0.5, le=5)
    notes: str | None = Field(default=None, max_length=8000)


class DiaryOut(ORMModel):
    id: int
    movie_id: int
    watch_date: date
    rating: float | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    movie: dict[str, Any] | None = None


class MovieListCreate(BaseModel):
    name: str = Field(min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=2000)


class MovieListUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=140)
    description: str | None = Field(default=None, max_length=2000)


class ListMovieOut(ORMModel):
    id: int
    movie_id: int
    position: int
    added_at: datetime
    movie: dict[str, Any] | None = None


class MovieListOut(ORMModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    movies: list[ListMovieOut] = []


class ListReorderPayload(BaseModel):
    movie_ids: list[int] = Field(min_length=1)


class MoviePage(BaseModel):
    page: int
    results: list[dict[str, Any]]
    total_pages: int
    total_results: int


class StatusOut(BaseModel):
    exists: bool


class StatisticCard(BaseModel):
    label: str
    value: str | int | float


class StatisticsOut(BaseModel):
    total_movies_watched: int
    total_runtime: int
    average_rating: float | None
    favorite_genres: list[dict[str, Any]]
    favorite_directors: list[dict[str, Any]]
    monthly_watch_count: list[dict[str, Any]]
    recent_activity: list[dict[str, Any]]
