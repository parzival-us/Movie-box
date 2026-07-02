from app.database import get_db  # noqa: F401

LOCAL_USER_ID = 1


def get_current_user_id() -> int:
    return LOCAL_USER_ID
