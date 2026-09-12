# ==============================================================================
# Layer: Database Connection & Session Management (app/db/session.py)
# ALLOWED:
#   - Instantiate the SQLAlchemy 2.0 Engine with connection pooling.
#   - Provide SessionLocal factory and transactional context managers.
# NOT ALLOWED:
#   - NEVER write business logic, table definitions, or route handlers here.
#   - Do not catch and swallow exceptions that hide database rollbacks.
# ==============================================================================

from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

# Engine setup with connection health checking (pool_pre_ping)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

# Standard sessionmaker for generating new database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session
)


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager providing an atomic database transaction.
    If an unhandled exception is raised within the block, the entire transaction
    rolls back (guaranteeing audit log and state change atomicity).
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
