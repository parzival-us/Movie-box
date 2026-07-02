from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db

LOCAL_USER_ID = 1


def get_current_user_id() -> int:
    return LOCAL_USER_ID


DbSession = Generator[Session, None, None]
Database = Depends(get_db)
CurrentUserId = Depends(get_current_user_id)
