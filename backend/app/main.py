from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routers import diary, favorites, lists, movies, ratings, reviews, statistics, watchlist
from app.core.config import clear_settings_cache, get_settings
from app.database import Base, SessionLocal, engine
from app.models import User
from app.services.tmdb import tmdb_client


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    clear_settings_cache()
    Base.metadata.create_all(bind=engine)
    seed_local_user()
    await tmdb_client.start()
    yield
    await tmdb_client.close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.frontend_origin,
            "http://127.0.0.1:5173",
            "http://localhost:5174",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    app.include_router(movies.router, prefix="/api")
    app.include_router(ratings.router, prefix="/api")
    app.include_router(reviews.router, prefix="/api")
    app.include_router(watchlist.router, prefix="/api")
    app.include_router(favorites.router, prefix="/api")
    app.include_router(diary.router, prefix="/api")
    app.include_router(lists.router, prefix="/api")
    app.include_router(statistics.router, prefix="/api")

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


def seed_local_user() -> None:
    db: Session = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.id == 1))
        if not user:
            db.add(User(id=1, username="local"))
            db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


app = create_app()
