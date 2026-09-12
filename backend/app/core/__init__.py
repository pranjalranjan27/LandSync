# ==============================================================================
# Layer: Core Package (app/core/__init__.py)
# ALLOWED:
#   - Expose cross-cutting configuration, security utilities, and foundational constants.
# NOT ALLOWED:
#   - Never import from models/, schemas/, repositories/, services/, or api/ routes.
#   - Core must remain completely independent of domain business logic.
# ==============================================================================

from app.core.config import settings

__all__ = ["settings"]
