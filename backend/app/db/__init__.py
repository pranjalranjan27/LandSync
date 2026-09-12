# ==============================================================================
# Layer: Database Package (app/db/__init__.py)
# ALLOWED:
#   - Expose the Declarative Base, database engine, and session makers.
# NOT ALLOWED:
#   - Never import business logic, services, or API routers here.
# ==============================================================================

from app.db.base import Base
from app.db.session import engine, SessionLocal

__all__ = ["Base", "engine", "SessionLocal"]
