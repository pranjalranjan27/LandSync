# ==============================================================================
# Layer: API Package (app/api/__init__.py)
# ALLOWED:
#   - Expose API router registration and dependencies.
# NOT ALLOWED:
#   - Do not implement database queries or domain business logic directly here.
# ==============================================================================

from app.api.dependencies import get_current_user, require_role

__all__ = ["get_current_user", "require_role"]
