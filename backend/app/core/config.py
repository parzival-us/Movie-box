from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Movie Box"
    database_url: str = "sqlite:///./movie_box.db"
    frontend_origin: str = "http://localhost:5173"
    tmdb_bearer_token: str | None = None
    tmdb_api_key: str | None = None
    tmdb_base_url: str = "https://api.themoviedb.org/3"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


def clear_settings_cache() -> None:
    """Call on startup to pick up .env changes after a reload."""
    get_settings.cache_clear()
