# ==============================================================================
# Layer: Core Dependencies (app/core/deps.py)
# ALLOWED:
#   - Expose fundamental dependencies (such as DB session acquisition) that routers and
#     API dependencies rely upon.
# NOT ALLOWED:
#   - Do not implement route-specific business workflows or permissions here.
# ==============================================================================

from typing import Generator
from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a thread-local database session.
    Automatically closes the session when the request lifecycle ends.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
